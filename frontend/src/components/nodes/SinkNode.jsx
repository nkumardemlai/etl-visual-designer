import React from 'react'
import { Handle, Position } from 'reactflow'

export default function SinkNode({ data, selected }) {
  return (
    <div className={`sink-node${selected ? ' selected' : ''}`} style={{ outline: selected ? '2px solid #e67e22' : 'none' }}>
      <div className="node-header">
        <span className="node-icon">{data.icon}</span>
        <span>{data.label}</span>
      </div>
      <div className="node-body">
        <div className="node-type-label">{data.nodeType}</div>
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  )
}
