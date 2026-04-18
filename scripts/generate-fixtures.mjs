import { writeFileSync, mkdirSync } from 'fs'
import { zipSync, strToU8 } from 'fflate'

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`

const NS = `xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"`

function makeDocx(bodyXml) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${NS}>
  <w:body>
${bodyXml}
    <w:sectPr/>
  </w:body>
</w:document>`
}

function makeZip(documentXml) {
  return zipSync({
    '[Content_Types].xml': strToU8(CONTENT_TYPES),
    '_rels/.rels': strToU8(RELS),
    'word/document.xml': strToU8(documentXml),
    'word/_rels/document.xml.rels': strToU8(DOC_RELS),
  })
}

// --- basic.docx ---
const basicBody = `
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>Hello World</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">This is a </w:t></w:r>
      <w:r><w:rPr><w:b/></w:rPr><w:t>bold</w:t></w:r>
      <w:r><w:t xml:space="preserve"> and </w:t></w:r>
      <w:r><w:rPr><w:i/></w:rPr><w:t>italic</w:t></w:r>
      <w:r><w:t xml:space="preserve"> paragraph.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>Centered text</w:t></w:r>
    </w:p>`

// --- with-redlines.docx ---
const redlinesBody = `
    <w:p>
      <w:r><w:t xml:space="preserve">Original text </w:t></w:r>
      <w:ins w:id="1" w:author="Alice" w:date="2024-01-01T00:00:00Z">
        <w:r><w:t>inserted text</w:t></w:r>
      </w:ins>
      <w:r><w:t xml:space="preserve"> and </w:t></w:r>
      <w:del w:id="2" w:author="Alice" w:date="2024-01-01T00:00:00Z">
        <w:r><w:delText>deleted text</w:delText></w:r>
      </w:del>
    </w:p>`

// --- with-tables.docx ---
const tablesBody = `
    <w:p>
      <w:r><w:t>Before table</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Cell A1</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Cell B1</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Cell A2</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Cell B2</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>`

mkdirSync('fixtures', { recursive: true })

writeFileSync('fixtures/basic.docx', makeZip(makeDocx(basicBody)))
writeFileSync('fixtures/with-redlines.docx', makeZip(makeDocx(redlinesBody)))
writeFileSync('fixtures/with-tables.docx', makeZip(makeDocx(tablesBody)))

console.log('✓ fixtures/basic.docx')
console.log('✓ fixtures/with-redlines.docx')
console.log('✓ fixtures/with-tables.docx')
