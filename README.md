# react-docx-viewer

React component for rendering `.docx` files in the browser with tracked changes (redlines) support.

## Install

```bash
npm install react-docx-viewer
# or
pnpm add react-docx-viewer
```

## Usage

```tsx
import { DocxViewer } from 'react-docx-viewer'

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

import { DocxViewer } from 'react-docx-viewer'
```

## License

MIT
