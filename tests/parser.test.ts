import { describe, expect, it } from 'vitest'
import { parseStyles } from '../src/parser/styles'
import { parseRelationships } from '../src/parser/relationships'
import { parseNumbering } from '../src/parser/numbering'

describe('parseStyles', () => {
  it('parses style id and name', () => {
    const xml = `<?xml version="1.0"?>
      <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:style w:styleId="Heading1">
          <w:name w:val="heading 1"/>
          <w:rPr>
            <w:b/>
            <w:sz w:val="32"/>
            <w:color w:val="1F3864"/>
          </w:rPr>
        </w:style>
      </w:styles>`
    const styles = parseStyles(xml)
    expect(styles['Heading1']).toBeDefined()
    expect(styles['Heading1'].name).toBe('heading 1')
    expect(styles['Heading1'].bold).toBe(true)
    expect(styles['Heading1'].fontSize).toBe(16)
    expect(styles['Heading1'].color).toBe('#1F3864')
  })

  it('returns empty object for empty styles xml', () => {
    const xml = `<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>`
    expect(parseStyles(xml)).toEqual({})
  })
})

describe('parseRelationships', () => {
  it('maps relationship ids to targets', () => {
    const xml = `<?xml version="1.0"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://...hyperlink" Target="https://example.com" TargetMode="External"/>
        <Relationship Id="rId2" Type="http://...image" Target="media/image1.png"/>
      </Relationships>`
    const rels = parseRelationships(xml)
    expect(rels['rId1']).toBe('https://example.com')
    expect(rels['rId2']).toBe('media/image1.png')
  })
})

describe('parseNumbering', () => {
  it('maps numId to level definitions', () => {
    const xml = `<?xml version="1.0"?>
      <w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0">
            <w:numFmt w:val="bullet"/>
            <w:lvlText w:val="•"/>
          </w:lvl>
          <w:lvl w:ilvl="1">
            <w:numFmt w:val="decimal"/>
            <w:lvlText w:val="%2."/>
          </w:lvl>
        </w:abstractNum>
        <w:num w:numId="1">
          <w:abstractNumId w:val="0"/>
        </w:num>
      </w:numbering>`
    const numbering = parseNumbering(xml)
    expect(numbering['1']).toBeDefined()
    expect(numbering['1'][0].format).toBe('bullet')
    expect(numbering['1'][1].format).toBe('decimal')
  })
})
