import React from 'react'

const PROPERTY_LABELS = {
  filePath: 'File Path',
  delimiter: 'Delimiter',
  url: 'JDBC URL',
  table: 'Table',
  user: 'User',
  password: 'Password',
  bootstrapServers: 'Bootstrap Servers',
  topic: 'Topic',
  condition: 'Condition',
  columns: 'Columns (comma-separated)',
  joinKey: 'Join Key',
  joinType: 'Join Type (inner/left/right)',
  groupByColumns: 'Group By Columns',
  aggregation: 'Aggregation (e.g. count("*").alias("cnt"))',
  oldName: 'Old Column Name',
  newName: 'New Column Name',
  outputPath: 'Output Path',
  writeMode: 'Write Mode (overwrite/append)',
}

export default function PropertiesPanel({
  selectedNode,
  onPropertyChange,
  onLabelChange,
  onClearSelection,
}) {
  if (!selectedNode) {
    return (
      <div className="properties-panel">
        <div className="no-selection">
          <p>🖱️ Click a node to edit its properties</p>
        </div>
      </div>
    )
  }

  const { id, data } = selectedNode
  const properties = data.properties || {}

  return (
    <div className="properties-panel">
      <h3>⚙️ Node Properties</h3>

      <div className="prop-field">
        <label>Label</label>
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => onLabelChange(id, e.target.value)}
        />
      </div>

      <div className="prop-field">
        <label style={{ color: '#aaa', fontStyle: 'italic' }}>Type: {data.nodeType}</label>
      </div>

      {Object.entries(properties).map(([key, value]) => (
        <div key={key} className="prop-field">
          <label>{PROPERTY_LABELS[key] || key}</label>
          <input
            type={key === 'password' ? 'password' : 'text'}
            value={value || ''}
            onChange={(e) => onPropertyChange(id, key, e.target.value)}
            placeholder={PROPERTY_LABELS[key] || key}
          />
        </div>
      ))}

      <button className="clear-btn" onClick={onClearSelection}>
        ✕ Clear Selection
      </button>
    </div>
  )
}
