import type { ASTNode, NumberingMap } from '../parser/types'
import { Paragraph } from './Paragraph'
import { Table } from './Table'

type RenderOptions = {
  showRedlines: boolean
  numbering: NumberingMap
  insertClassName?: string
  deleteClassName?: string
}

export function renderAST(nodes: ASTNode[], options: RenderOptions): React.ReactNode[] {
  const counters = new Map<string, number[]>()

  return nodes.map((node, i) => {
    if (node.type === 'paragraph') {
      return (
        <Paragraph
          key={i}
          node={node}
          showRedlines={options.showRedlines}
          numbering={options.numbering}
          insertClassName={options.insertClassName}
          deleteClassName={options.deleteClassName}
          counters={counters}
        />
      )
    }

    if (node.type === 'table') {
      return (
        <Table
          key={i}
          node={node}
          showRedlines={options.showRedlines}
          numbering={options.numbering}
          insertClassName={options.insertClassName}
          deleteClassName={options.deleteClassName}
          counters={counters}
        />
      )
    }

    if (node.type === 'image') {
      return (
        <img
          key={i}
          src={node.src}
          alt={node.alt ?? ''}
          style={{ maxWidth: '100%', display: 'block', margin: '0.5em 0' }}
        />
      )
    }

    return null
  })
}
