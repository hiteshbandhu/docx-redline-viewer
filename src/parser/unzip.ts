import { unzipSync } from 'fflate'

export type UnzippedDocx = Record<string, Uint8Array>

export async function unzipDocx(src: string | ArrayBuffer | File): Promise<UnzippedDocx> {
  let buffer: ArrayBuffer

  if (typeof src === 'string') {
    const res = await fetch(src)
    if (!res.ok) throw new Error(`Failed to fetch DOCX: ${res.status} ${res.statusText}`)
    buffer = await res.arrayBuffer()
  } else if (src instanceof File) {
    buffer = await src.arrayBuffer()
  } else {
    buffer = src
  }

  const data = new Uint8Array(buffer)
  const files = unzipSync(data)
  return files
}

export function getText(files: UnzippedDocx, path: string): string | null {
  const file = files[path]
  if (!file) return null
  return new TextDecoder().decode(file)
}

export function getBytes(files: UnzippedDocx, path: string): Uint8Array | null {
  return files[path] ?? null
}
