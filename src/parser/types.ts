export type DocxAST = {
  body: ASTNode[]
}

export type PageBreakNode = { type: 'page-break' }

export type ASTNode = ParagraphNode | TableNode | ImageNode | PageBreakNode

export type ParagraphNode = {
  type: 'paragraph'
  style?: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  runs: RunNode[]
  listInfo?: { level: number; numId: string }
  spacingBefore?: number // pt
  spacingAfter?: number // pt
  lineSpacing?: number // multiplier e.g. 1, 1.5, 2
  pageBreakBefore?: boolean
}

export type RunNode = {
  type: 'run'
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  fontSize?: number
  color?: string
  highlight?: string
  fontFamily?: string
  vertAlign?: 'superscript' | 'subscript'
  allCaps?: boolean
  smallCaps?: boolean
  redline?: 'insert' | 'delete'
  url?: string
}

export type TableNode = {
  type: 'table'
  rows: TableRow[]
}

export type TableRow = {
  cells: TableCell[]
}

export type TableCell = {
  content: ParagraphNode[]
  colSpan?: number
  rowSpan?: number
}

export type ImageNode = {
  type: 'image'
  src: string
  alt?: string
}

export type DocxStyles = Record<string, StyleDefinition>

export type StyleDefinition = {
  name?: string
  basedOn?: string
  bold?: boolean
  italic?: boolean
  fontSize?: number
  color?: string
  fontFamily?: string
  allCaps?: boolean
  smallCaps?: boolean
}

export type NumberingMap = Record<string, Record<number, NumberingLevel>>

export type NumberingLevel = {
  format: 'bullet' | 'decimal' | 'lowerLetter' | 'upperLetter' | 'lowerRoman' | 'upperRoman'
  text?: string
  indent?: number
}

export type RelationshipMap = Record<string, string>
