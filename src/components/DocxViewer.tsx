import {
  type CSSProperties,
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { parseDocx } from '../parser'
import type { DocxAST, DocxStyles, NumberingMap } from '../parser/types'
import { renderAST } from '../renderer'
import { splitIntoPages } from '../utils'

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
  | { status: 'success'; ast: DocxAST; numbering: NumberingMap; styles: DocxStyles }
  | { status: 'error'; error: Error }

const PAGE_WIDTH_PX = 816 // ~8.5in at 96dpi
const PAGE_PADDING_PX = 96 // ~1in margins
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1

function ZoomBar({ zoom, onZoom }: { zoom: number; onZoom: (z: number) => void }) {
  const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 10) / 10))

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: '#3a3a3a',
        borderBottom: '1px solid #222',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={() => onZoom(clamp(zoom - ZOOM_STEP))}
        disabled={zoom <= MIN_ZOOM}
        style={btnStyle(zoom <= MIN_ZOOM)}
        aria-label="Zoom out"
      >
        −
      </button>
      <div style={{ width: '120px' }}>
        <input
          type="range"
          min={MIN_ZOOM * 100}
          max={MAX_ZOOM * 100}
          step={ZOOM_STEP * 100}
          value={Math.round(zoom * 100)}
          onChange={(e) => onZoom(Number(e.target.value) / 100)}
          style={{ width: '100%', accentColor: '#60a5fa', cursor: 'pointer' }}
          aria-label="Zoom level"
        />
      </div>
      <button
        type="button"
        onClick={() => onZoom(clamp(zoom + ZOOM_STEP))}
        disabled={zoom >= MAX_ZOOM}
        style={btnStyle(zoom >= MAX_ZOOM)}
        aria-label="Zoom in"
      >
        +
      </button>
      <span style={{ color: '#9ca3af', fontSize: '13px', minWidth: '38px', textAlign: 'right' }}>
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={() => onZoom(1)}
        style={{ ...btnStyle(zoom === 1), fontSize: '11px', padding: '3px 8px' }}
      >
        Reset
      </button>
    </div>
  )
}

function btnStyle(disabled: boolean): CSSProperties {
  return {
    background: disabled ? '#2a2a2a' : '#4b5563',
    color: disabled ? '#555' : '#e5e7eb',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    lineHeight: 1,
  }
}

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
  const [zoom, setZoom] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  const stableOnLoad = useCallback(() => onLoad?.(), [onLoad])
  const stableOnError = useCallback((e: Error) => onError?.(e), [onError])

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    parseDocx(src)
      .then(({ ast, numbering, styles }) => {
        if (cancelled) return
        setState({ status: 'success', ast, numbering, styles })
        stableOnLoad()
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const error = err instanceof Error ? err : new Error(String(err))
        setState({ status: 'error', error })
        stableOnError(error)
      })

    return () => {
      cancelled = true
    }
  }, [src, stableOnLoad, stableOnError])

  // Ctrl/Cmd + scroll to zoom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom((z) => {
        const next = z - e.deltaY * 0.001
        return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next * 10) / 10))
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const outerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '400px',
    background: '#525659',
    overflow: 'hidden',
    borderRadius: '6px',
    ...style,
  }

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div
        className={className}
        style={{ ...outerStyle, alignItems: 'center', justifyContent: 'center' }}
      >
        <Spinner />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div
        className={className}
        style={{
          ...outerStyle,
          background: '#fef2f2',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ color: '#dc2626', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <strong>Failed to load document</strong>
          <div style={{ marginTop: '0.5rem', fontSize: '14px', color: '#ef4444' }}>
            {state.error.message}
          </div>
        </div>
      </div>
    )
  }

  const pages = splitIntoPages(state.ast.body)
  const renderOptions = {
    showRedlines,
    numbering: state.numbering,
    styles: state.styles,
    insertClassName,
    deleteClassName,
  }

  const scaledPageWidth = PAGE_WIDTH_PX * zoom
  const PAGE_HEIGHT_PX = 1056 // ~11in at 96dpi

  return (
    <div className={className} style={outerStyle}>
      <ZoomBar zoom={zoom} onZoom={setZoom} />
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: `${40 * zoom}px ${Math.max(24, (scaledPageWidth - PAGE_WIDTH_PX) / 2 + 40)}px`,
        }}
      >
        {pages.map((pageNodes, pageIndex) => {
          const pageContent = renderAST(pageNodes, renderOptions)
          return (
            <div
              key={pageIndex}
              style={{
                width: `${PAGE_WIDTH_PX}px`,
                minHeight: `${PAGE_HEIGHT_PX}px`,
                margin: '0 auto',
                background: '#ffffff',
                boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
                padding: `${PAGE_PADDING_PX}px`,
                paddingBottom: `${PAGE_PADDING_PX - 24}px`,
                transformOrigin: 'top center',
                transform: `scale(${zoom})`,
                marginBottom: `${PAGE_HEIGHT_PX * zoom - PAGE_HEIGHT_PX + (pageIndex < pages.length - 1 ? 24 * zoom : 40)}px`,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '16px',
                lineHeight: 1.6,
                color: '#1a1a1a',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ flex: 1 }}>{pageContent}</div>
              <div
                style={{
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb',
                  marginTop: '16px',
                  flexShrink: 0,
                }}
              >
                — {pageIndex + 1} —
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        color: '#9ca3af',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid #4b5563',
          borderTopColor: '#60a5fa',
          borderRadius: '50%',
          animation: 'docx-spin 0.8s linear infinite',
        }}
      />
      <style>{'@keyframes docx-spin { to { transform: rotate(360deg); } }'}</style>
      <span style={{ fontSize: '14px' }}>Loading document…</span>
    </div>
  )
}

type ErrorBoundaryState = { hasError: boolean; error?: Error }

class ErrorBoundary extends Component<
  { children: ReactNode; onError?: (e: Error) => void },
  ErrorBoundaryState
> {
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
        <div
          style={{ padding: '1rem', color: '#dc2626', background: '#fef2f2', borderRadius: '6px' }}
        >
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
