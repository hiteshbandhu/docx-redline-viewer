import { parseDocument } from './document'
import { parseNumbering } from './numbering'
import { parseRelationships } from './relationships'
import { parseStyles } from './styles'
import type { DocxAST, NumberingMap } from './types'
import { getText, unzipDocx } from './unzip'

export type { DocxAST } from './types'
export type {
  ASTNode,
  ImageNode,
  NumberingMap,
  ParagraphNode,
  RelationshipMap,
  RunNode,
  TableCell,
  TableNode,
  TableRow,
} from './types'

export type ParseResult = {
  ast: DocxAST
  numbering: NumberingMap
}

export async function parseDocx(src: string | ArrayBuffer | File): Promise<ParseResult> {
  const files = await unzipDocx(src)

  const documentXml = getText(files, 'word/document.xml')
  if (!documentXml) throw new Error('Invalid DOCX: missing word/document.xml')

  const stylesXml = getText(files, 'word/styles.xml')
  const numberingXml = getText(files, 'word/numbering.xml')
  const relsXml = getText(files, 'word/_rels/document.xml.rels')

  const styles = stylesXml ? parseStyles(stylesXml) : {}
  const numbering = numberingXml ? parseNumbering(numberingXml) : {}
  const rels = relsXml ? parseRelationships(relsXml) : {}

  const body = parseDocument(documentXml, { styles, numbering, rels, files })

  return { ast: { body }, numbering }
}
