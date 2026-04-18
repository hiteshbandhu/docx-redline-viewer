import { useState } from 'react'
import { DocxViewer } from '@yas.chat/docx-redline-viewer'

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [showRedlines, setShowRedlines] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif', background: '#1e1e1e' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 20px', background: '#2d2d2d', borderBottom: '1px solid #444', flexShrink: 0 }}>
        <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: '14px' }}>react-docx-viewer</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>Open file</span>
          <input
            type="file"
            accept=".docx"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement).click()}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 14px', cursor: 'pointer', fontSize: '13px' }}
          >
            Choose .docx
          </button>
        </label>
        {file && <span style={{ color: '#6b7280', fontSize: '13px' }}>{file.name}</span>}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showRedlines}
            onChange={(e) => setShowRedlines(e.target.checked)}
            style={{ accentColor: '#3b82f6' }}
          />
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>Show redlines</span>
        </label>
      </div>

      {/* Viewer area */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0' }}>
        {file ? (
          <DocxViewer
            src={file}
            showRedlines={showRedlines}
            onLoad={() => console.log('loaded')}
            onError={(err) => console.error(err)}
            style={{ height: '100%', borderRadius: 0 }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px', color: '#4b5563' }}>
            <div style={{ fontSize: '48px' }}>📄</div>
            <span style={{ fontSize: '16px' }}>Open a .docx file to preview it</span>
          </div>
        )}
      </div>
    </div>
  )
}
