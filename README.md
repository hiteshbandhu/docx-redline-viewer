# @yas/docx-redline-viewer

React component for rendering `.docx` files in the browser with tracked changes (redlines) support. Built for legal tech at [yas.chat](https://yas.chat).

- Word-style paper layout with zoom controls
- Show/hide tracked changes (insertions + deletions)
- Tailwind CSS friendly
- Works in Next.js via `'use client'`
- No WASM, no server, pure browser

## Install

```bash
npm install @yas/docx-redline-viewer
# or
pnpm add @yas/docx-redline-viewer
```

## Usage

```tsx
import { DocxViewer } from '@yas/docx-redline-viewer'

// From URL
<DocxViewer src="https://example.com/contract.docx" showRedlines={true} />

// From File input
<DocxViewer src={file} showRedlines={false} />

// From ArrayBuffer
<DocxViewer src={arrayBuffer} showRedlines={true} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string \| ArrayBuffer \| File` | required | DOCX source |
| `showRedlines` | `boolean` | `false` | Show/hide tracked changes |
| `insertClassName` | `string` | — | Class for inserted text (Tailwind-friendly) |
| `deleteClassName` | `string` | — | Class for deleted text (Tailwind-friendly) |
| `onLoad` | `() => void` | — | Fired when doc renders |
| `onError` | `(error: Error) => void` | — | Fired on parse/render error |
| `className` | `string` | — | CSS class on root element |
| `style` | `CSSProperties` | — | Inline styles on root element |

## Tailwind CSS

```tsx
<DocxViewer
  src={url}
  showRedlines={true}
  insertClassName="text-green-600 underline"
  deleteClassName="text-red-600 line-through"
/>
```

## Next.js

Add `'use client'` to any file that uses the component:

```tsx
'use client'

import { DocxViewer } from '@yas/docx-redline-viewer'

export default function Page() {
  return (
    <DocxViewer
      src="https://example.com/contract.docx"
      showRedlines={true}
      style={{ height: '100vh' }}
    />
  )
}
```

## What it renders

- Paragraphs, headings (h1–h6), bold, italic, underline, strikethrough
- Text color and font size from run properties
- Hyperlinks
- Tables with borders
- Images (base64 embedded)
- Ordered and unordered lists
- Tracked changes: green underline for insertions, red strikethrough for deletions

## License

MIT — built by [yas.chat](https://yas.chat)
