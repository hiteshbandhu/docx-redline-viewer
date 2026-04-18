import { useState } from 'react'
import { DocxViewer } from 'react-docx-viewer'

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [showRedlines, setShowRedlines] = useState(false)

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>react-docx-viewer playground</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input
          type="file"
          accept=".docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          onLoad={() => console.log('loaded')}
          onError={(err) => console.error(err)}
          style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '2rem' }}
        />
      )}
    </div>
  )
}
