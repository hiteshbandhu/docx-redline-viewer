export type DocxAST = {
  body: ASTNode[]
}

export type ASTNode = ParagraphNode | TableNode | ImageNode

export type ParagraphNode = {
  type: 'paragraph'
  style?: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  runs: RunNode[]
  listInfo?: { level: number; numId: string }
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
}

export type NumberingMap = Record<string, Record<number, NumberingLevel>>

export type NumberingLevel = {
  format: 'bullet' | 'decimal' | 'lowerLetter' | 'upperLetter' | 'lowerRoman' | 'upperRoman'
  text?: string
  indent?: number
}

export type RelationshipMap = Record<string, string>
