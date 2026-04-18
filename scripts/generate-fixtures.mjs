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

// --- with-explicit-pagebreak.docx ---
// Page break via w:br w:type="page" inside a run
const explicitPageBreakBody = `
    <w:p>
      <w:r><w:t>Page 1 content</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Page 2 content</w:t></w:r>
    </w:p>`

// --- with-pagebreakbefore.docx ---
// Page break via w:pageBreakBefore on a paragraph
const pageBreakBeforeBody = `
    <w:p>
      <w:r><w:t>Page 1 content</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pageBreakBefore/></w:pPr>
      <w:r><w:t>Page 2 content</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Still page 2</w:t></w:r>
    </w:p>`

// --- with-multiple-pagebreaks.docx ---
// Three pages via two explicit page breaks
const multiplePageBreaksBody = `
    <w:p>
      <w:r><w:t>Page 1</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Page 2</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pageBreakBefore/></w:pPr>
      <w:r><w:t>Page 3</w:t></w:r>
    </w:p>`

// --- with-consecutive-pagebreaks.docx ---
// Edge case: two back-to-back page breaks (empty middle page should be filtered)
const consecutivePageBreaksBody = `
    <w:p>
      <w:r><w:t>Page 1</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Page 2</w:t></w:r>
    </w:p>`

// --- with-pagebreak-at-start.docx ---
// Edge case: first paragraph has pageBreakBefore — should not create empty first page
const pageBreakAtStartBody = `
    <w:p>
      <w:pPr><w:pageBreakBefore/></w:pPr>
      <w:r><w:t>Only page</w:t></w:r>
    </w:p>`

// --- with-pagebreak-at-end.docx ---
// Edge case: last element is a page break — trailing empty page is dropped
const pageBreakAtEndBody = `
    <w:p>
      <w:r><w:t>Only page</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:br w:type="page"/></w:r>
    </w:p>`

// --- with-mixed-inline-pagebreak.docx ---
// Edge case: page break mid-paragraph (content before and after break in same paragraph)
const mixedInlinePageBreakBody = `
    <w:p>
      <w:r><w:t xml:space="preserve">Before break </w:t></w:r>
      <w:r><w:br w:type="page"/></w:r>
      <w:r><w:t>After break</w:t></w:r>
    </w:p>`

mkdirSync('fixtures', { recursive: true })

writeFileSync('fixtures/basic.docx', makeZip(makeDocx(basicBody)))
writeFileSync('fixtures/with-redlines.docx', makeZip(makeDocx(redlinesBody)))
writeFileSync('fixtures/with-tables.docx', makeZip(makeDocx(tablesBody)))
writeFileSync('fixtures/with-explicit-pagebreak.docx', makeZip(makeDocx(explicitPageBreakBody)))
writeFileSync('fixtures/with-pagebreakbefore.docx', makeZip(makeDocx(pageBreakBeforeBody)))
writeFileSync('fixtures/with-multiple-pagebreaks.docx', makeZip(makeDocx(multiplePageBreaksBody)))
writeFileSync(
  'fixtures/with-consecutive-pagebreaks.docx',
  makeZip(makeDocx(consecutivePageBreaksBody)),
)
writeFileSync('fixtures/with-pagebreak-at-start.docx', makeZip(makeDocx(pageBreakAtStartBody)))
writeFileSync('fixtures/with-pagebreak-at-end.docx', makeZip(makeDocx(pageBreakAtEndBody)))
writeFileSync(
  'fixtures/with-mixed-inline-pagebreak.docx',
  makeZip(makeDocx(mixedInlinePageBreakBody)),
)

console.log('✓ fixtures/basic.docx')
console.log('✓ fixtures/with-redlines.docx')
console.log('✓ fixtures/with-tables.docx')
console.log('✓ fixtures/with-explicit-pagebreak.docx')
console.log('✓ fixtures/with-pagebreakbefore.docx')
console.log('✓ fixtures/with-multiple-pagebreaks.docx')
console.log('✓ fixtures/with-consecutive-pagebreaks.docx')
console.log('✓ fixtures/with-pagebreak-at-start.docx')
console.log('✓ fixtures/with-pagebreak-at-end.docx')
console.log('✓ fixtures/with-mixed-inline-pagebreak.docx')
