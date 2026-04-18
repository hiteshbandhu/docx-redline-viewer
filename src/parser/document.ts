import type {
  ASTNode,
  DocxStyles,
  ImageNode,
  NumberingMap,
  ParagraphNode,
  RelationshipMap,
  RunNode,
  TableCell,
  TableNode,
  TableRow,
} from './types'
import type { UnzippedDocx } from './unzip'
import { getBytes } from './unzip'

type ParseContext = {
  styles: DocxStyles
  numbering: NumberingMap
  rels: RelationshipMap
  files: UnzippedDocx
}

export function parseDocument(xml: string, ctx: ParseContext): ASTNode[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const body = doc.querySelector('w\\:body, body')
  if (!body) return []

  const nodes: ASTNode[] = []
  for (const child of body.children) {
    const localName = localTag(child)
    if (localName === 'p') {
      nodes.push(parseParagraph(child, ctx))
    } else if (localName === 'tbl') {
      nodes.push(parseTable(child, ctx))
    }
  }
  return nodes
}

function parseParagraph(el: Element, ctx: ParseContext): ParagraphNode {
  const pPr = el.querySelector('w\\:pPr, pPr')
  const styleId = pPr?.querySelector('w\\:pStyle, pStyle')?.getAttribute('w:val') ?? undefined

  const alignVal = pPr?.querySelector('w\\:jc, jc')?.getAttribute('w:val')
  const alignment = normalizeAlignment(alignVal)

  let listInfo: ParagraphNode['listInfo'] | undefined
  const numPr = pPr?.querySelector('w\\:numPr, numPr')
  if (numPr) {
    const ilvl = numPr.querySelector('w\\:ilvl, ilvl')?.getAttribute('w:val') ?? '0'
    const numId = numPr.querySelector('w\\:numId, numId')?.getAttribute('w:val')
    if (numId) listInfo = { level: Number.parseInt(ilvl, 10), numId }
  }

  const runs: RunNode[] = []

  for (const child of el.children) {
    const tag = localTag(child)

    if (tag === 'r') {
      // w:drawing is nested inside w:r in real Word documents
      const drawingEl = findChild(child, 'drawing')
      if (drawingEl) {
        const imageRun = parseDrawing(drawingEl, ctx)
        if (imageRun) {
          runs.push({ type: 'run', text: '', _image: imageRun } as RunNode & { _image: ImageNode })
        }
      } else {
        const run = parseRun(child, ctx)
        if (run) runs.push(run)
      }
    } else if (tag === 'hyperlink') {
      const rId = child.getAttribute('r:id')
      const url = rId ? ctx.rels[rId] : undefined
      for (const rEl of child.querySelectorAll('w\\:r, r')) {
        const run = parseRun(rEl, ctx)
        if (run) runs.push({ ...run, url })
      }
    } else if (tag === 'ins') {
      for (const rEl of child.querySelectorAll('w\\:r, r')) {
        const run = parseRun(rEl, ctx)
        if (run) runs.push({ ...run, redline: 'insert' })
      }
    } else if (tag === 'del') {
      for (const rEl of child.querySelectorAll('w\\:r, r')) {
        const run = parseDelRun(rEl, ctx)
        if (run) runs.push({ ...run, redline: 'delete' })
      }
    } else if (tag === 'drawing') {
      const imageRun = parseDrawing(child, ctx)
      if (imageRun) {
        // embed image as a synthetic run with special marker
        runs.push({ type: 'run', text: '', _image: imageRun } as RunNode & { _image: ImageNode })
      }
    }
  }

  return { type: 'paragraph', style: styleId, alignment, runs, listInfo }
}

function parseRun(el: Element, _ctx: ParseContext): RunNode | null {
  const rPr = el.querySelector('w\\:rPr, rPr')
  const tEl = el.querySelector('w\\:t, t')
  const brEl = el.querySelector('w\\:br, br')

  const text = tEl?.textContent ?? (brEl ? '\n' : '')

  const bold = !!rPr?.querySelector('w\\:b, b')
  const italic = !!rPr?.querySelector('w\\:i, i')
  const underline = !!rPr?.querySelector('w\\:u, u')
  const strike = !!rPr?.querySelector('w\\:strike, strike')

  const szEl = rPr?.querySelector('w\\:sz, sz')
  const fontSize = szEl
    ? Math.round(Number.parseInt(szEl.getAttribute('w:val') ?? '0', 10) / 2)
    : undefined

  const colorEl = rPr?.querySelector('w\\:color, color')
  const colorVal = colorEl?.getAttribute('w:val')
  const color = colorVal && colorVal !== 'auto' ? `#${colorVal}` : undefined

  return {
    type: 'run',
    text,
    bold: bold || undefined,
    italic: italic || undefined,
    underline: underline || undefined,
    strike: strike || undefined,
    fontSize: fontSize || undefined,
    color,
  }
}

function parseDelRun(el: Element, _ctx: ParseContext): RunNode | null {
  const rPr = el.querySelector('w\\:rPr, rPr')
  const tEl = el.querySelector('w\\:delText, delText')
  const text = tEl?.textContent ?? ''

  const bold = !!rPr?.querySelector('w\\:b, b')
  const italic = !!rPr?.querySelector('w\\:i, i')
  const szEl = rPr?.querySelector('w\\:sz, sz')
  const fontSize = szEl
    ? Math.round(Number.parseInt(szEl.getAttribute('w:val') ?? '0', 10) / 2)
    : undefined
  const colorEl = rPr?.querySelector('w\\:color, color')
  const colorVal = colorEl?.getAttribute('w:val')
  const color = colorVal && colorVal !== 'auto' ? `#${colorVal}` : undefined

  return {
    type: 'run',
    text,
    bold: bold || undefined,
    italic: italic || undefined,
    fontSize: fontSize || undefined,
    color,
  }
}

function parseTable(el: Element, ctx: ParseContext): TableNode {
  const rows: TableRow[] = []
  for (const trEl of el.querySelectorAll('w\\:tr, tr')) {
    const cells: TableCell[] = []
    for (const tcEl of trEl.querySelectorAll('w\\:tc, tc')) {
      const tcPr = tcEl.querySelector('w\\:tcPr, tcPr')
      const gridSpan = tcPr?.querySelector('w\\:gridSpan, gridSpan')?.getAttribute('w:val')
      const vMerge = tcPr?.querySelector('w\\:vMerge, vMerge')

      const content: ParagraphNode[] = []
      for (const pEl of tcEl.querySelectorAll('w\\:p, p')) {
        content.push(parseParagraph(pEl, ctx))
      }

      cells.push({
        content,
        colSpan: gridSpan ? Number.parseInt(gridSpan, 10) : undefined,
        rowSpan: vMerge ? 1 : undefined,
      })
    }
    rows.push({ cells })
  }
  return { type: 'table', rows }
}

function parseDrawing(el: Element, ctx: ParseContext): ImageNode | null {
  // Walk all descendants to find blip — namespace prefixes vary across Word versions
  const blip = findDescendantByLocalName(el, 'blip')
  const rEmbed = blip?.getAttributeNS(
    'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'embed',
  ) ?? blip?.getAttribute('r:embed')
  if (!rEmbed) return null

  const target = ctx.rels[rEmbed]
  if (!target) return null

  const mediaPath = target.startsWith('media/') ? `word/${target}` : target
  const bytes = getBytes(ctx.files, mediaPath)
  if (!bytes) return null

  const ext = mediaPath.split('.').pop()?.toLowerCase() ?? 'png'
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
  }
  const mime = mimeMap[ext] ?? 'image/png'
  const base64 = bytesToBase64(bytes)

  return { type: 'image', src: `data:${mime};base64,${base64}` }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function localTag(el: Element): string {
  return el.localName.replace(/^w:/, '')
}

function findChild(el: Element, localName: string): Element | null {
  for (const child of el.children) {
    if (child.localName === localName || child.localName === `w:${localName}`) return child
  }
  return null
}

function findDescendantByLocalName(el: Element, localName: string): Element | null {
  for (const child of el.children) {
    if (child.localName === localName) return child
    const found = findDescendantByLocalName(child, localName)
    if (found) return found
  }
  return null
}

function normalizeAlignment(val: string | undefined | null): ParagraphNode['alignment'] {
  if (val === 'center') return 'center'
  if (val === 'right') return 'right'
  if (val === 'both' || val === 'distribute') return 'justify'
  return undefined
}
