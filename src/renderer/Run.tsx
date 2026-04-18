import type { CSSProperties, ReactNode } from 'react'
import type { ImageNode, RunNode, StyleDefinition } from '../parser/types'

type RunProps = {
  run: RunNode & { _image?: ImageNode }
  styleDefaults: StyleDefinition
  showRedlines: boolean
  insertClassName?: string
  deleteClassName?: string
}

export function Run({
  run,
  styleDefaults,
  showRedlines,
  insertClassName,
  deleteClassName,
}: RunProps) {
  if (run._image) {
    return (
      <img
        src={run._image.src}
        alt={run._image.alt ?? ''}
        style={{ maxWidth: '100%', display: 'inline-block' }}
      />
    )
  }

  if (run.redline === 'delete' && !showRedlines) return null

  const style: CSSProperties = {}

  // Style-level defaults, overridden by run-level props
  const bold = run.bold ?? styleDefaults.bold
  const italic = run.italic ?? styleDefaults.italic
  const fontSize = run.fontSize ?? styleDefaults.fontSize
  const color = run.color ?? styleDefaults.color
  const fontFamily = run.fontFamily ?? styleDefaults.fontFamily
  const allCaps = run.allCaps ?? styleDefaults.allCaps
  const smallCaps = run.smallCaps ?? styleDefaults.smallCaps

  if (bold) style.fontWeight = 'bold'
  if (italic) style.fontStyle = 'italic'
  if (fontSize) style.fontSize = `${fontSize}pt`
  if (color) style.color = color
  if (fontFamily) style.fontFamily = `"${fontFamily}", serif`
  if (allCaps) style.textTransform = 'uppercase'
  else if (smallCaps) style.fontVariant = 'small-caps'
  if (run.highlight) style.backgroundColor = run.highlight

  const decorations: string[] = []
  if (run.underline) decorations.push('underline')
  if (run.strike) decorations.push('line-through')
  if (decorations.length) style.textDecoration = decorations.join(' ')

  if (run.redline === 'insert') {
    if (insertClassName) {
      return (
        <span className={insertClassName} style={style}>
          {run.text}
        </span>
      )
    }
    style.color = '#16a34a'
    style.textDecoration = [style.textDecoration, 'underline'].filter(Boolean).join(' ')
  }

  if (run.redline === 'delete') {
    if (deleteClassName) {
      return (
        <span className={deleteClassName} style={style}>
          {run.text}
        </span>
      )
    }
    style.color = '#dc2626'
    style.textDecoration = [style.textDecoration, 'line-through'].filter(Boolean).join(' ')
  }

  const text = run.text

  let content: ReactNode = text
  if (run.vertAlign === 'superscript') content = <sup>{text}</sup>
  else if (run.vertAlign === 'subscript') content = <sub>{text}</sub>

  if (run.url) {
    return (
      <a
        href={run.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...style, color: run.color ?? styleDefaults.color ?? '#2563eb' }}
      >
        {content}
      </a>
    )
  }

  const hasStyle = Object.keys(style).length > 0
  if (!hasStyle && content === text) return <>{text}</>

  return <span style={style}>{content}</span>
}
