import type { CSSProperties } from 'react'

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

export function DocxViewer(_props: DocxViewerProps) {
  return null
}
