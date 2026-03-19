import React, { useState } from 'react'

export default function CodeModal({ code, onClose }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>⚡ Generated Spark SQL Code</h2>
          <div className="modal-actions">
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button className="close-btn" onClick={onClose}>✕ Close</button>
          </div>
        </div>
        <div className="modal-body">
          <pre><code>{code}</code></pre>
        </div>
      </div>
    </div>
  )
}
