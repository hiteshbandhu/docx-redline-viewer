import type { ImageNode, NumberingMap, RunNode, TableNode } from '../parser/types'
import { Paragraph } from './Paragraph'

type TableProps = {
  node: TableNode
  showRedlines: boolean
  numbering: NumberingMap
  insertClassName?: string
  deleteClassName?: string
  counters: Map<string, number[]>
}

export function Table({
  node,
  showRedlines,
  numbering,
  insertClassName,
  deleteClassName,
  counters,
}: TableProps) {
  return (
    <table
      style={{
        borderCollapse: 'collapse',
        width: '100%',
        margin: '1em 0',
        fontSize: 'inherit',
      }}
    >
      <tbody>
        {node.rows.map((row, ri) => (
          <tr key={ri}>
            {row.cells.map((cell, ci) => (
              <td
                key={ci}
                colSpan={cell.colSpan}
                rowSpan={cell.rowSpan}
                style={{
                  border: '1px solid #d1d5db',
                  padding: '0.5em 0.75em',
                  verticalAlign: 'top',
                }}
              >
                {cell.content.map((p, pi) => (
                  <Paragraph
                    key={pi}
                    node={p}
                    showRedlines={showRedlines}
                    numbering={numbering}
                    insertClassName={insertClassName}
                    deleteClassName={deleteClassName}
                    counters={counters}
                  />
                ))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
