import type { ASTNode } from './parser/types'

export function splitIntoPages(nodes: ASTNode[]): ASTNode[][] {
  const pages: ASTNode[][] = []
  let current: ASTNode[] = []
  for (const node of nodes) {
    if (node.type === 'page-break') {
      pages.push(current)
      current = []
    } else {
      current.push(node)
    }
  }
  pages.push(current)
  return pages.filter((p) => p.length > 0)
}
