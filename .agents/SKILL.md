# SKILL: @yas/docx-redline-viewer

Use this skill when an agent needs to render a `.docx` file in a React application, display tracked changes (redlines), or integrate Word document viewing into a legal tech UI.

---

## Install

```bash
pnpm add @yas/docx-redline-viewer
# or
npm install @yas/docx-redline-viewer
```

---

## Basic Usage

```tsx
import { DocxViewer } from '@yas/docx-redline-viewer'

<DocxViewer src="https://example.com/contract.docx" showRedlines={true} />
```

Accepts `src` as a URL string, `ArrayBuffer`, or `File` object.

---

## Full Props

```tsx
<DocxViewer
  src={string | ArrayBuffer | File}   // required
  showRedlines={boolean}              // default false — show/hide tracked changes
  insertClassName={string}            // CSS class for inserted text (e.g. Tailwind)
  deleteClassName={string}            // CSS class for deleted text (e.g. Tailwind)
  onLoad={() => void}                 // fires when document finishes rendering
  onError={(error: Error) => void}    // fires on parse or render failure
  className={string}                  // class on the root wrapper div
  style={CSSProperties}               // inline styles on root wrapper div
/>
```

---

## Sizing

The component fills its container. Always give it an explicit height:

```tsx
<DocxViewer src={src} style={{ height: '100vh' }} />
<DocxViewer src={src} style={{ height: '800px' }} />
```

---

## Next.js

Must be used in a Client Component:

```tsx
'use client'

import { DocxViewer } from '@yas/docx-redline-viewer'

export default function ContractPage({ url }: { url: string }) {
  return (
    <DocxViewer
      src={url}
      showRedlines={true}
      style={{ height: '100vh' }}
    />
  )
}
```

---

## Tailwind CSS — Redline Styling

Override default red/green inline styles with Tailwind classes:

```tsx
<DocxViewer
  src={src}
  showRedlines={true}
  insertClassName="text-green-600 underline font-medium"
  deleteClassName="text-red-500 line-through opacity-70"
/>
```

---

## File Input Pattern

```tsx
'use client'

import { useState } from 'react'
import { DocxViewer } from '@yas/docx-redline-viewer'

export function DocxUploadViewer() {
  const [file, setFile] = useState<File | null>(null)
  const [showRedlines, setShowRedlines] = useState(false)

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-4 p-4 border-b">
        <input
          type="file"
          accept=".docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showRedlines}
            onChange={(e) => setShowRedlines(e.target.checked)}
          />
          Show redlines
        </label>
      </div>
      {file && (
        <DocxViewer
          src={file}
          showRedlines={showRedlines}
          style={{ flex: 1 }}
        />
      )}
    </div>
  )
}
```

---

## What Gets Rendered

| Element | Support |
|---------|---------|
| Paragraphs | ✅ |
| Headings (h1–h6) | ✅ via `pStyle` |
| Bold / italic / underline / strikethrough | ✅ |
| Text color, font size | ✅ |
| Hyperlinks | ✅ opens in new tab |
| Tables | ✅ with borders |
| Images | ✅ base64 embedded |
| Ordered lists | ✅ |
| Unordered lists | ✅ |
| Tracked insertions (`w:ins`) | ✅ green underline |
| Tracked deletions (`w:del`) | ✅ red strikethrough |
| Comments, footnotes, headers/footers | ❌ v2 |

---

## Error Handling

The component has a built-in error boundary. For custom handling:

```tsx
<DocxViewer
  src={src}
  onError={(err) => {
    console.error('DocxViewer failed:', err.message)
    toast.error('Failed to load document')
  }}
/>
```

---

## Zoom

Built-in zoom bar (50%–200%) with `+` / `−` buttons, slider, and reset.  
`Ctrl + scroll` (or `Cmd + scroll` on Mac) also zooms.  
No prop needed — it's always present when the document is loaded.

---

## Programmatic Parsing (advanced)

If you need the raw AST without rendering:

```tsx
import { parseDocx } from '@yas/docx-redline-viewer'

const { ast, numbering } = await parseDocx(file)
// ast.body is ASTNode[]
```
