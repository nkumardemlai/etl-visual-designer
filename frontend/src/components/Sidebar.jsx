import React from 'react'

const CATEGORY_ORDER = [
  { key: 'source',    label: 'Sources' },
  { key: 'transform', label: 'Transforms' },
  { key: 'sink',      label: 'Sinks' },
]

export default function Sidebar({ nodeTypeConfigs }) {
  const grouped = CATEGORY_ORDER.map(({ key, label }) => ({
    key,
    label,
    items: Object.entries(nodeTypeConfigs)
      .filter(([, cfg]) => cfg.category === key)
      .map(([type, cfg]) => ({ type, ...cfg }))
  }))

  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData('nodeType', nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="sidebar">
      <div className="sidebar-title">Node Palette</div>
      {grouped.map(({ key, label, items }) => (
        <div key={key} className="sidebar-category">
          <div className={`category-label ${key}`}>{label}</div>
          {items.map(({ type, icon, label: nodeLabel, category }) => (
            <div
              key={type}
              className="node-palette-item"
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
            >
              <span className="palette-icon">{icon}</span>
              <span>{nodeLabel}</span>
              <span className={`category-badge ${category}`}>{category}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
