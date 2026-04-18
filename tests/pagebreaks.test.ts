import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { parseDocx } from '../src/parser'
import type { PageBreakNode, ParagraphNode } from '../src/parser/types'
import { splitIntoPages } from '../src/utils'

function loadFixture(name: string): ArrayBuffer {
  const buf = readFileSync(resolve(__dirname, '../fixtures', name))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

// ─── splitIntoPages unit tests ────────────────────────────────────────────────

describe('splitIntoPages()', () => {
  const p = (text: string): ParagraphNode => ({
    type: 'paragraph',
    runs: [{ type: 'run', text }],
  })
  const br: PageBreakNode = { type: 'page-break' }

  it('returns a single page when there are no breaks', () => {
    const pages = splitIntoPages([p('a'), p('b')])
    expect(pages).toHaveLength(1)
    expect(pages[0]).toHaveLength(2)
  })

  it('splits into two pages at one break', () => {
    const pages = splitIntoPages([p('a'), br, p('b')])
    expect(pages).toHaveLength(2)
    expect((pages[0][0] as ParagraphNode).runs[0].text).toBe('a')
    expect((pages[1][0] as ParagraphNode).runs[0].text).toBe('b')
  })

  it('splits into three pages at two breaks', () => {
    const pages = splitIntoPages([p('a'), br, p('b'), br, p('c')])
    expect(pages).toHaveLength(3)
  })

  it('filters out empty pages from consecutive breaks', () => {
    const pages = splitIntoPages([p('a'), br, br, p('b')])
    // two consecutive breaks produce an empty middle slice — filtered out
    expect(pages).toHaveLength(2)
    expect((pages[0][0] as ParagraphNode).runs[0].text).toBe('a')
    expect((pages[1][0] as ParagraphNode).runs[0].text).toBe('b')
  })

  it('filters trailing empty page when break is the last node', () => {
    const pages = splitIntoPages([p('a'), br])
    expect(pages).toHaveLength(1)
  })

  it('filters leading empty page when break is the first node', () => {
    const pages = splitIntoPages([br, p('a')])
    expect(pages).toHaveLength(1)
    expect((pages[0][0] as ParagraphNode).runs[0].text).toBe('a')
  })

  it('returns empty array for empty input', () => {
    expect(splitIntoPages([])).toHaveLength(0)
  })

  it('returns empty array for only breaks', () => {
    expect(splitIntoPages([br, br, br])).toHaveLength(0)
  })

  it('page break node itself never appears in a page', () => {
    const pages = splitIntoPages([p('a'), br, p('b'), br, p('c')])
    for (const page of pages) {
      expect(page.every((n) => n.type !== 'page-break')).toBe(true)
    }
  })
})

// ─── Parser: w:br w:type="page" ───────────────────────────────────────────────

describe('with-explicit-pagebreak.docx', () => {
  it('contains exactly one page-break node in the AST', async () => {
    const { ast } = await parseDocx(loadFixture('with-explicit-pagebreak.docx'))
    const breaks = ast.body.filter((n) => n.type === 'page-break')
    expect(breaks).toHaveLength(1)
  })

  it('page-break node is positioned between the two content paragraphs', async () => {
    const { ast } = await parseDocx(loadFixture('with-explicit-pagebreak.docx'))
    const breakIdx = ast.body.findIndex((n) => n.type === 'page-break')
    expect(breakIdx).toBeGreaterThan(0)
    expect(breakIdx).toBeLessThan(ast.body.length - 1)
  })

  it('splits into exactly two pages', async () => {
    const { ast } = await parseDocx(loadFixture('with-explicit-pagebreak.docx'))
    const pages = splitIntoPages(ast.body)
    expect(pages).toHaveLength(2)
  })

  it('correct text on each page', async () => {
    const { ast } = await parseDocx(loadFixture('with-explicit-pagebreak.docx'))
    const pages = splitIntoPages(ast.body)
    const textOf = (page: typeof pages[0]) =>
      (page.find((n) => n.type === 'paragraph') as ParagraphNode | undefined)?.runs[0].text
    expect(textOf(pages[0])).toBe('Page 1 content')
    expect(textOf(pages[1])).toBe('Page 2 content')
  })
})

// ─── Parser: w:pageBreakBefore ────────────────────────────────────────────────

describe('with-pagebreakbefore.docx', () => {
  it('contains exactly one page-break node', async () => {
    const { ast } = await parseDocx(loadFixture('with-pagebreakbefore.docx'))
    const breaks = ast.body.filter((n) => n.type === 'page-break')
    expect(breaks).toHaveLength(1)
  })

  it('second paragraph has pageBreakBefore flag set', async () => {
    const { ast } = await parseDocx(loadFixture('with-pagebreakbefore.docx'))
    const para = ast.body.find(
      (n) => n.type === 'paragraph' && (n as ParagraphNode).runs[0]?.text === 'Page 2 content',
    ) as ParagraphNode | undefined
    expect(para?.pageBreakBefore).toBe(true)
  })

  it('page 1 has one paragraph, page 2 has two', async () => {
    const { ast } = await parseDocx(loadFixture('with-pagebreakbefore.docx'))
    const pages = splitIntoPages(ast.body)
    expect(pages).toHaveLength(2)
    expect(pages[0].filter((n) => n.type === 'paragraph')).toHaveLength(1)
    expect(pages[1].filter((n) => n.type === 'paragraph')).toHaveLength(2)
  })
})

// ─── Parser: multiple page breaks ─────────────────────────────────────────────

describe('with-multiple-pagebreaks.docx', () => {
  it('contains exactly two page-break nodes', async () => {
    const { ast } = await parseDocx(loadFixture('with-multiple-pagebreaks.docx'))
    const breaks = ast.body.filter((n) => n.type === 'page-break')
    expect(breaks).toHaveLength(2)
  })

  it('splits into exactly three pages', async () => {
    const { ast } = await parseDocx(loadFixture('with-multiple-pagebreaks.docx'))
    const pages = splitIntoPages(ast.body)
    expect(pages).toHaveLength(3)
  })

  it('each page has the correct text', async () => {
    const { ast } = await parseDocx(loadFixture('with-multiple-pagebreaks.docx'))
    const pages = splitIntoPages(ast.body)
    const firstText = (page: typeof pages[0]) =>
      (page.find((n) => n.type === 'paragraph') as ParagraphNode | undefined)?.runs[0].text
    expect(firstText(pages[0])).toBe('Page 1')
    expect(firstText(pages[1])).toBe('Page 2')
    expect(firstText(pages[2])).toBe('Page 3')
  })
})

// ─── Edge case: consecutive page breaks ───────────────────────────────────────

describe('with-consecutive-pagebreaks.docx', () => {
  it('two back-to-back breaks produce two page-break nodes in AST', async () => {
    const { ast } = await parseDocx(loadFixture('with-consecutive-pagebreaks.docx'))
    const breaks = ast.body.filter((n) => n.type === 'page-break')
    expect(breaks).toHaveLength(2)
  })

  it('empty middle page is filtered → only two pages', async () => {
    const { ast } = await parseDocx(loadFixture('with-consecutive-pagebreaks.docx'))
    const pages = splitIntoPages(ast.body)
    expect(pages).toHaveLength(2)
  })
})

// ─── Edge case: page break at start ───────────────────────────────────────────

describe('with-pagebreak-at-start.docx', () => {
  it('pageBreakBefore on first paragraph emits a page-break node', async () => {
    const { ast } = await parseDocx(loadFixture('with-pagebreak-at-start.docx'))
    const breaks = ast.body.filter((n) => n.type === 'page-break')
    expect(breaks).toHaveLength(1)
  })

  it('leading empty page is filtered → only one page with content', async () => {
    const { ast } = await parseDocx(loadFixture('with-pagebreak-at-start.docx'))
    const pages = splitIntoPages(ast.body)
    expect(pages).toHaveLength(1)
    expect((pages[0][0] as ParagraphNode).runs[0].text).toBe('Only page')
  })
})

// ─── Edge case: page break at end ─────────────────────────────────────────────

describe('with-pagebreak-at-end.docx', () => {
  it('trailing page break emits a page-break node', async () => {
    const { ast } = await parseDocx(loadFixture('with-pagebreak-at-end.docx'))
    const breaks = ast.body.filter((n) => n.type === 'page-break')
    expect(breaks).toHaveLength(1)
  })

  it('trailing empty page is filtered → only one page', async () => {
    const { ast } = await parseDocx(loadFixture('with-pagebreak-at-end.docx'))
    const pages = splitIntoPages(ast.body)
    expect(pages).toHaveLength(1)
  })
})

// ─── Edge case: inline break mid-paragraph ────────────────────────────────────

describe('with-mixed-inline-pagebreak.docx', () => {
  it('in-run page break emits a page-break node after the paragraph', async () => {
    const { ast } = await parseDocx(loadFixture('with-mixed-inline-pagebreak.docx'))
    const breaks = ast.body.filter((n) => n.type === 'page-break')
    expect(breaks).toHaveLength(1)
  })

  it('content before break is in the paragraph on page 1', async () => {
    const { ast } = await parseDocx(loadFixture('with-mixed-inline-pagebreak.docx'))
    const pages = splitIntoPages(ast.body)
    // The paragraph containing "Before break" lands on page 1
    const page1Para = pages[0]?.find((n) => n.type === 'paragraph') as ParagraphNode | undefined
    const texts = page1Para?.runs.map((r) => r.text) ?? []
    expect(texts.some((t) => t.includes('Before break'))).toBe(true)
  })
})

// ─── No breaks: basic.docx unchanged ──────────────────────────────────────────

describe('basic.docx — no page breaks', () => {
  it('contains zero page-break nodes', async () => {
    const { ast } = await parseDocx(loadFixture('basic.docx'))
    const breaks = ast.body.filter((n) => n.type === 'page-break')
    expect(breaks).toHaveLength(0)
  })

  it('splitIntoPages returns a single page with all content', async () => {
    const { ast } = await parseDocx(loadFixture('basic.docx'))
    const pages = splitIntoPages(ast.body)
    expect(pages).toHaveLength(1)
    expect(pages[0]).toHaveLength(ast.body.length)
  })
})
