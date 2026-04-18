import type { CSSProperties } from 'react'
import type { ImageNode, ParagraphNode } from '../parser/types'
import type { RunNode } from '../parser/types'
import type { NumberingMap } from '../parser/types'
import { Run } from './Run'

type ParagraphProps = {
  node: ParagraphNode
  showRedlines: boolean
  numbering: NumberingMap
  insertClassName?: string
  deleteClassName?: string
  counters: Map<string, number[]>
}

const HEADING_STYLES = new Set([
  'Heading1',
  'Heading2',
  'Heading3',
  'Heading4',
  'Heading5',
  'Heading6',
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'heading5',
  'heading6',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
])

const HEADING_TAG_MAP: Record<string, keyof JSX.IntrinsicElements> = {
  Heading1: 'h1',
  heading1: 'h1',
  Heading2: 'h2',
  heading2: 'h2',
  Heading3: 'h3',
  heading3: 'h3',
  Heading4: 'h4',
  heading4: 'h4',
  Heading5: 'h5',
  heading5: 'h5',
  Heading6: 'h6',
  heading6: 'h6',
}

const HEADING_STYLES_MAP: Record<string, CSSProperties> = {
  h1: { fontSize: '2em', fontWeight: 'bold', margin: '0.67em 0' },
  h2: { fontSize: '1.5em', fontWeight: 'bold', margin: '0.75em 0' },
  h3: { fontSize: '1.17em', fontWeight: 'bold', margin: '0.83em 0' },
  h4: { fontSize: '1em', fontWeight: 'bold', margin: '1.12em 0' },
  h5: { fontSize: '0.83em', fontWeight: 'bold', margin: '1.5em 0' },
  h6: { fontSize: '0.75em', fontWeight: 'bold', margin: '1.67em 0' },
}

export function Paragraph({
  node,
  showRedlines,
  numbering,
  insertClassName,
  deleteClassName,
  counters,
}: ParagraphProps) {
  const style: CSSProperties = {}
  if (node.alignment) style.textAlign = node.alignment

  const runs = node.runs as (RunNode & { _image?: ImageNode })[]
  const content = runs.map((run, i) => (
    <Run
      key={i}
      run={run}
      showRedlines={showRedlines}
      insertClassName={insertClassName}
      deleteClassName={deleteClassName}
    />
  ))

  if (node.listInfo) {
    return renderListItem(node, content, numbering, counters, style)
  }

  const tag = node.style ? HEADING_TAG_MAP[node.style] : undefined
  if (tag) {
    const headingStyle = { ...HEADING_STYLES_MAP[tag], ...style }
    const Tag = tag
    return <Tag style={headingStyle}>{content}</Tag>
  }

  return <p style={{ margin: '0.5em 0', lineHeight: 1.5, ...style }}>{content}</p>
}

function renderListItem(
  node: ParagraphNode,
  content: React.ReactNode[],
  numbering: NumberingMap,
  counters: Map<string, number[]>,
  style: CSSProperties,
) {
  const { level, numId } = node.listInfo!
  const levelDef = numbering[numId]?.[level]
  const isBullet = !levelDef || levelDef.format === 'bullet'

  const indent = (level + 1) * 1.5

  if (isBullet) {
    return (
      <div
        style={{
          display: 'flex',
          gap: '0.5em',
          paddingLeft: `${indent}em`,
          margin: '0.25em 0',
          ...style,
        }}
      >
        <span style={{ minWidth: '1em' }}>•</span>
        <span style={{ flex: 1 }}>{content}</span>
      </div>
    )
  }

  // Track counter per numId+level
  const key = `${numId}-${level}`
  const current = counters.get(key) ?? 0
  counters.set(key, current + 1)
  const num = current + 1

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5em',
        paddingLeft: `${indent}em`,
        margin: '0.25em 0',
        ...style,
      }}
    >
      <span style={{ minWidth: '1.5em' }}>{num}.</span>
      <span style={{ flex: 1 }}>{content}</span>
    </div>
  )
}
