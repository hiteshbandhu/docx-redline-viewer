import type { CSSProperties } from 'react'
import type {
  DocxStyles,
  ImageNode,
  NumberingMap,
  ParagraphNode,
  RunNode,
  StyleDefinition,
} from '../parser/types'
import { Run } from './Run'

type ParagraphProps = {
  node: ParagraphNode
  showRedlines: boolean
  numbering: NumberingMap
  styles: DocxStyles
  insertClassName?: string
  deleteClassName?: string
  counters: Map<string, number[]>
}

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

const HEADING_BASE_STYLES: Record<string, CSSProperties> = {
  h1: { fontSize: '2em', fontWeight: 'bold', margin: '0.67em 0' },
  h2: { fontSize: '1.5em', fontWeight: 'bold', margin: '0.75em 0' },
  h3: { fontSize: '1.17em', fontWeight: 'bold', margin: '0.83em 0' },
  h4: { fontSize: '1em', fontWeight: 'bold', margin: '1.12em 0' },
  h5: { fontSize: '0.83em', fontWeight: 'bold', margin: '1.5em 0' },
  h6: { fontSize: '0.75em', fontWeight: 'bold', margin: '1.67em 0' },
}

// Resolve a style definition following the basedOn chain
function resolveStyle(
  styleId: string,
  styles: DocxStyles,
  visited = new Set<string>(),
): StyleDefinition {
  if (visited.has(styleId)) return {}
  visited.add(styleId)
  const def = styles[styleId]
  if (!def) return {}
  if (def.basedOn) {
    const base = resolveStyle(def.basedOn, styles, visited)
    return { ...base, ...def }
  }
  return def
}

export function Paragraph({
  node,
  showRedlines,
  numbering,
  styles,
  insertClassName,
  deleteClassName,
  counters,
}: ParagraphProps) {
  const paragraphStyle: CSSProperties = {}
  if (node.alignment) paragraphStyle.textAlign = node.alignment

  // Resolve style-level properties to use as defaults for runs
  const resolvedStyle = node.style ? resolveStyle(node.style, styles) : {}

  const runs = node.runs as (RunNode & { _image?: ImageNode })[]
  const content = runs.map((run, i) => (
    <Run
      key={i}
      run={run}
      styleDefaults={resolvedStyle}
      showRedlines={showRedlines}
      insertClassName={insertClassName}
      deleteClassName={deleteClassName}
    />
  ))

  if (node.listInfo) {
    return renderListItem(node, content, numbering, counters, paragraphStyle)
  }

  const tag = node.style ? HEADING_TAG_MAP[node.style] : undefined
  if (tag) {
    // Start from browser heading defaults, then apply Word style (color, fontSize override)
    const headingStyle: CSSProperties = { ...HEADING_BASE_STYLES[tag] }
    if (resolvedStyle.color) headingStyle.color = resolvedStyle.color
    if (resolvedStyle.fontSize) headingStyle.fontSize = `${resolvedStyle.fontSize}pt`
    return <tag style={{ ...headingStyle, ...paragraphStyle }}>{content}</tag>
  }

  return <p style={{ margin: '0.5em 0', lineHeight: 1.5, ...paragraphStyle }}>{content}</p>
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
