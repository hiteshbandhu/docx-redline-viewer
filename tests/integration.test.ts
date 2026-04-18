import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { parseDocx } from '../src/parser'
import type { ParagraphNode, TableNode } from '../src/parser'

function loadFixture(name: string): ArrayBuffer {
  const buf = readFileSync(resolve(__dirname, '../fixtures', name))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

describe('basic.docx', () => {
  it('parses into a valid AST', async () => {
    const { ast } = await parseDocx(loadFixture('basic.docx'))
    expect(ast.body.length).toBeGreaterThan(0)
  })

  it('first node is a heading paragraph', async () => {
    const { ast } = await parseDocx(loadFixture('basic.docx'))
    const first = ast.body[0] as ParagraphNode
    expect(first.type).toBe('paragraph')
    expect(first.style).toBe('Heading1')
    expect(first.runs[0].text).toBe('Hello World')
  })

  it('parses bold and italic runs', async () => {
    const { ast } = await parseDocx(loadFixture('basic.docx'))
    const second = ast.body[1] as ParagraphNode
    const boldRun = second.runs.find((r) => r.bold)
    const italicRun = second.runs.find((r) => r.italic)
    expect(boldRun?.text).toBe('bold')
    expect(italicRun?.text).toBe('italic')
  })

  it('parses centered alignment', async () => {
    const { ast } = await parseDocx(loadFixture('basic.docx'))
    const centered = ast.body[2] as ParagraphNode
    expect(centered.alignment).toBe('center')
  })
})

describe('with-redlines.docx', () => {
  it('parses inserted runs with redline insert', async () => {
    const { ast } = await parseDocx(loadFixture('with-redlines.docx'))
    const p = ast.body[0] as ParagraphNode
    const inserted = p.runs.find((r) => r.redline === 'insert')
    expect(inserted).toBeDefined()
    expect(inserted?.text).toBe('inserted text')
  })

  it('parses deleted runs with redline delete', async () => {
    const { ast } = await parseDocx(loadFixture('with-redlines.docx'))
    const p = ast.body[0] as ParagraphNode
    const deleted = p.runs.find((r) => r.redline === 'delete')
    expect(deleted).toBeDefined()
    expect(deleted?.text).toBe('deleted text')
  })

  it('deleted runs are present in AST regardless of showRedlines', async () => {
    const { ast } = await parseDocx(loadFixture('with-redlines.docx'))
    const p = ast.body[0] as ParagraphNode
    // AST always contains all runs — showRedlines only controls rendering
    const deleted = p.runs.filter((r) => r.redline === 'delete')
    expect(deleted.length).toBeGreaterThan(0)
  })
})

describe('with-tables.docx', () => {
  it('parses table node', async () => {
    const { ast } = await parseDocx(loadFixture('with-tables.docx'))
    const table = ast.body.find((n) => n.type === 'table') as TableNode
    expect(table).toBeDefined()
  })

  it('table has correct row and cell count', async () => {
    const { ast } = await parseDocx(loadFixture('with-tables.docx'))
    const table = ast.body.find((n) => n.type === 'table') as TableNode
    expect(table.rows).toHaveLength(2)
    expect(table.rows[0].cells).toHaveLength(2)
    expect(table.rows[1].cells).toHaveLength(2)
  })

  it('table cells contain correct text', async () => {
    const { ast } = await parseDocx(loadFixture('with-tables.docx'))
    const table = ast.body.find((n) => n.type === 'table') as TableNode
    expect(table.rows[0].cells[0].content[0].runs[0].text).toBe('Cell A1')
    expect(table.rows[0].cells[1].content[0].runs[0].text).toBe('Cell B1')
    expect(table.rows[1].cells[0].content[0].runs[0].text).toBe('Cell A2')
  })
})
