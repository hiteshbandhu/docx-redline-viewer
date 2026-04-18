# AGENTS.md — @yas.chat/docx-redline-viewer

This file helps AI agents understand the repo structure, architecture, and how to safely extend the package.

## What This Is

A React component library that renders `.docx` files in the browser with support for toggling tracked changes (redlines). Pure TypeScript, no WASM, no server required. Built for legal tech at yas.chat.

**npm:** `@yas.chat/docx-redline-viewer`  
**Entry:** `src/index.ts`  
**Output:** `dist/` (ESM + CJS + `.d.ts`)

---

## Architecture

```
DOCX file (binary)
  → unzip (fflate)         src/parser/unzip.ts
  → parse XML              src/parser/document.ts
  → typed AST              src/parser/types.ts
  → render to JSX          src/renderer/
  → DocxViewer component   src/components/DocxViewer.tsx
```

### Two-phase pipeline

1. **Parser** (`src/parser/`) — takes a `string | ArrayBuffer | File`, unzips the DOCX, parses the XML into a typed `DocxAST`. Pure functions, no React.
2. **Renderer** (`src/renderer/`) — takes a `DocxAST` and renders it to JSX. All inline styles, no CSS files.

---

## Key Files

| File | Role |
|------|------|
| `src/parser/types.ts` | All AST types (`DocxAST`, `ParagraphNode`, `RunNode`, `TableNode`, `ImageNode`) |
| `src/parser/unzip.ts` | Unzips `.docx` using fflate, exposes `getText()` and `getBytes()` |
| `src/parser/document.ts` | Parses `word/document.xml` → `ASTNode[]`. Handles paragraphs, tables, images, hyperlinks, redlines |
| `src/parser/styles.ts` | Parses `word/styles.xml` → `DocxStyles` map |
| `src/parser/numbering.ts` | Parses `word/numbering.xml` → `NumberingMap` for list rendering |
| `src/parser/relationships.ts` | Parses `.rels` files → `RelationshipMap` (used for image and hyperlink lookup) |
| `src/renderer/index.tsx` | `renderAST(nodes, options)` — top-level render function |
| `src/renderer/Paragraph.tsx` | Renders paragraphs, headings (h1–h6), and list items |
| `src/renderer/Run.tsx` | Renders text runs with inline styles, redline highlights, hyperlinks, images |
| `src/renderer/Table.tsx` | Renders tables with borders |
| `src/components/DocxViewer.tsx` | Main exported component. Handles loading, error boundary, zoom, paper layout |

---

## Public API

```tsx
import { DocxViewer } from '@yas.chat/docx-redline-viewer'

<DocxViewer
  src={string | ArrayBuffer | File}   // required
  showRedlines={boolean}              // default: false
  insertClassName={string}            // Tailwind class for inserted text
  deleteClassName={string}            // Tailwind class for deleted text
  onLoad={() => void}
  onError={(error: Error) => void}
  className={string}
  style={CSSProperties}
/>
```

The component is self-contained — gray background, white paper, zoom bar included. Give it a height via `style={{ height: '100vh' }}`.

---

## AST Shape

```ts
DocxAST = { body: ASTNode[] }

ASTNode = ParagraphNode | TableNode | ImageNode

ParagraphNode = {
  type: 'paragraph'
  style?: string          // 'Heading1', 'Heading2', 'Normal', etc.
  alignment?: 'left' | 'center' | 'right' | 'justify'
  runs: RunNode[]
  listInfo?: { level: number; numId: string }
}

RunNode = {
  type: 'run'
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  fontSize?: number       // in pt
  color?: string          // hex e.g. '#1F3864'
  redline?: 'insert' | 'delete'
  url?: string
}
```

---

## Tracked Changes (Redlines)

- `w:ins` elements → `RunNode` with `redline: 'insert'`
- `w:del` elements → `RunNode` with `redline: 'delete'` (text from `w:delText`)
- When `showRedlines={false}`, deleted runs return `null` in `Run.tsx` (hidden)
- When `showRedlines={true}`, inserts are green+underline, deletes are red+strikethrough
- `insertClassName` / `deleteClassName` override the default inline styles (Tailwind support)

---

## How to Extend

### Add a new OOXML element

1. Add a new node type to `src/parser/types.ts`
2. Parse it in `src/parser/document.ts` inside `parseParagraph()` or `parseDocument()`
3. Add a renderer in `src/renderer/`
4. Wire it into `src/renderer/index.tsx`

### Add a new prop

1. Add to `DocxViewerProps` in `src/components/DocxViewer.tsx`
2. Thread it through `DocxViewerInner` → `renderAST()` → relevant renderer

---

## Dev Commands

```bash
pnpm build          # compile to dist/
pnpm dev            # watch mode
pnpm test           # vitest run
pnpm lint           # biome check src
pnpm format         # biome format --write src
pnpm playground     # start Vite playground at localhost:5173
```

## Testing

- `tests/parser.test.ts` — unit tests for styles, relationships, numbering parsers
- `tests/integration.test.ts` — end-to-end tests using fixture `.docx` files in `fixtures/`
- `scripts/generate-fixtures.mjs` — regenerates fixture files if needed (`node scripts/generate-fixtures.mjs`)

---

## Non-Goals (v1)

No editing, PDF export, comments, footnotes, headers/footers, pagination, or dark mode theming.
