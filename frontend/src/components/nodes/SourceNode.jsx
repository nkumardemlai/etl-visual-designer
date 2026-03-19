import React from 'react'
import { Handle, Position } from 'reactflow'

export default function SourceNode({ data, selected }) {
  return (
    <div className={`source-node${selected ? ' selected' : ''}`} style={{ outline: selected ? '2px solid #27ae60' : 'none' }}>
      <div className="node-header">
        <span className="node-icon">{data.icon}</span>
        <span>{data.label}</span>
      </div>
      <div className="node-body">
        <div className="node-type-label">{data.nodeType}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
