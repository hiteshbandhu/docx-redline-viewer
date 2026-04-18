import { Component, type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import { parseDocx } from '../parser'
import type { DocxAST, NumberingMap } from '../parser/types'
import { renderAST } from '../renderer'

export type DocxViewerProps = {
  src: string | ArrayBuffer | File
  showRedlines?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
  className?: string
  style?: CSSProperties
  insertClassName?: string
  deleteClassName?: string
}

type ViewerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; ast: DocxAST; numbering: NumberingMap }
  | { status: 'error'; error: Error }

function DocxViewerInner({
  src,
  showRedlines = false,
  onLoad,
  onError,
  className,
  style,
  insertClassName,
  deleteClassName,
}: DocxViewerProps) {
  const [state, setState] = useState<ViewerState>({ status: 'idle' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    parseDocx(src)
      .then(({ ast, numbering }) => {
        if (cancelled) return
        setState({ status: 'success', ast, numbering })
        onLoad?.()
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const error = err instanceof Error ? err : new Error(String(err))
        setState({ status: 'error', error })
        onError?.(error)
      })

    return () => {
      cancelled = true
    }
  }, [src])

  const rootStyle: CSSProperties = {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '16px',
    lineHeight: 1.6,
    color: '#1a1a1a',
    ...style,
  }

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div className={className} style={{ ...rootStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px', color: '#6b7280' }}>
        <span>Loading document…</span>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={className} style={{ ...rootStyle, padding: '1rem', color: '#dc2626', background: '#fef2f2', borderRadius: '6px' }}>
        <strong>Failed to load document:</strong> {state.error.message}
      </div>
    )
  }

  const nodes = renderAST(state.ast.body, {
    showRedlines,
    numbering: state.numbering,
    insertClassName,
    deleteClassName,
  })

  return (
    <div className={className} style={rootStyle}>
      {nodes}
    </div>
  )
}

type ErrorBoundaryState = { hasError: boolean; error?: Error }

class ErrorBoundary extends Component<{ children: ReactNode; onError?: (e: Error) => void }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem', color: '#dc2626', background: '#fef2f2', borderRadius: '6px' }}>
          <strong>Render error:</strong> {this.state.error?.message}
        </div>
      )
    }
    return this.props.children
  }
}

export function DocxViewer(props: DocxViewerProps) {
  return (
    <ErrorBoundary onError={props.onError}>
      <DocxViewerInner {...props} />
    </ErrorBoundary>
  )
}
