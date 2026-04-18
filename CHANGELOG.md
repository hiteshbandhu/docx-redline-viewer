# Changelog

## 0.1.0 (unreleased)

### Features

- `DocxViewer` component with `src`, `showRedlines`, `onLoad`, `onError`, `className`, `style` props
- `insertClassName` and `deleteClassName` props for Tailwind CSS integration
- Renders paragraphs, headings (h1–h6), bold/italic/underline/strikethrough text
- Renders tables with borders
- Renders images as base64 inline embeds
- Renders ordered and unordered lists
- Tracked changes: inserted text (green underline) and deleted text (red strikethrough)
- `showRedlines={false}` hides deleted text entirely
- Built-in React error boundary
- Works in Next.js via `'use client'` directive
- Full TypeScript types exported
- ESM + CJS dual build
