import type { DocxStyles, StyleDefinition } from './types'

export function parseStyles(xml: string): DocxStyles {
  const styles: DocxStyles = {}
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

  for (const styleEl of doc.querySelectorAll('w\\:style, style')) {
    const styleId = styleEl.getAttribute('w:styleId')
    if (!styleId) continue

    const def: StyleDefinition = {}

    const nameEl = styleEl.querySelector('w\\:name, name')
    if (nameEl) def.name = nameEl.getAttribute('w:val') ?? undefined

    const basedOnEl = styleEl.querySelector('w\\:basedOn, basedOn')
    if (basedOnEl) def.basedOn = basedOnEl.getAttribute('w:val') ?? undefined

    const rPr = styleEl.querySelector('w\\:rPr, rPr')
    if (rPr) {
      if (rPr.querySelector('w\\:b, b')) def.bold = true
      if (rPr.querySelector('w\\:i, i')) def.italic = true

      const sz = rPr.querySelector('w\\:sz, sz')
      if (sz) {
        const val = sz.getAttribute('w:val')
        if (val) def.fontSize = Math.round(Number.parseInt(val, 10) / 2)
      }

      const color = rPr.querySelector('w\\:color, color')
      if (color) {
        const val = color.getAttribute('w:val')
        if (val && val !== 'auto') def.color = `#${val}`
      }
    }

    styles[styleId] = def
  }

  return styles
}
