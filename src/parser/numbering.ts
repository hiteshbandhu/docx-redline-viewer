import type { NumberingLevel, NumberingMap } from './types'

export function parseNumbering(xml: string): NumberingMap {
  const map: NumberingMap = {}
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

  // abstractNum definitions: ilvl → level config
  const abstractNums: Record<string, Record<number, NumberingLevel>> = {}
  for (const abstractNum of doc.querySelectorAll('w\\:abstractNum, abstractNum')) {
    const abstractNumId = abstractNum.getAttribute('w:abstractNumId')
    if (!abstractNumId) continue
    const levels: Record<number, NumberingLevel> = {}

    for (const lvl of abstractNum.querySelectorAll('w\\:lvl, lvl')) {
      const ilvl = Number.parseInt(lvl.getAttribute('w:ilvl') ?? '0', 10)
      const fmtEl = lvl.querySelector('w\\:numFmt, numFmt')
      const txtEl = lvl.querySelector('w\\:lvlText, lvlText')
      const indEl = lvl.querySelector('w\\:ind, ind')

      const fmt = fmtEl?.getAttribute('w:val') ?? 'bullet'
      levels[ilvl] = {
        format: normalizeFormat(fmt),
        text: txtEl?.getAttribute('w:val') ?? undefined,
        indent: indEl ? Number.parseInt(indEl.getAttribute('w:left') ?? '0', 10) : undefined,
      }
    }

    abstractNums[abstractNumId] = levels
  }

  // num instances: numId → abstractNumId
  for (const num of doc.querySelectorAll('w\\:num, num')) {
    const numId = num.getAttribute('w:numId')
    if (!numId) continue
    const ref = num.querySelector('w\\:abstractNumId, abstractNumId')
    const abstractNumId = ref?.getAttribute('w:val')
    if (abstractNumId && abstractNums[abstractNumId]) {
      map[numId] = abstractNums[abstractNumId]
    }
  }

  return map
}

function normalizeFormat(fmt: string): NumberingLevel['format'] {
  const map: Record<string, NumberingLevel['format']> = {
    bullet: 'bullet',
    decimal: 'decimal',
    lowerLetter: 'lowerLetter',
    upperLetter: 'upperLetter',
    lowerRoman: 'lowerRoman',
    upperRoman: 'upperRoman',
  }
  return map[fmt] ?? 'bullet'
}
