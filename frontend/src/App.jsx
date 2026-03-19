import React, { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Canvas from './components/Canvas.jsx'
import PropertiesPanel from './components/PropertiesPanel.jsx'
import CodeModal from './components/CodeModal.jsx'
import { generateSparkCode } from './services/api.js'

const NODE_TYPE_CONFIGS = {
  csv_source:   { label: 'CSV Source',    category: 'source',    icon: '📄', properties: { filePath: '', delimiter: ',' } },
  jdbc_source:  { label: 'JDBC Source',   category: 'source',    icon: '🗄️', properties: { url: '', table: '', user: '', password: '' } },
  kafka_source: { label: 'Kafka Source',  category: 'source',    icon: '📨', properties: { bootstrapServers: '', topic: '' } },
  filter:       { label: 'Filter',        category: 'transform', icon: '🔍', properties: { condition: '' } },
  select:       { label: 'Select',        category: 'transform', icon: '✅', properties: { columns: '' } },
  join:         { label: 'Join',          category: 'transform', icon: '🔗', properties: { joinKey: '', joinType: 'inner' } },
  group_by:     { label: 'Group By',      category: 'transform', icon: '📊', properties: { groupByColumns: '', aggregation: '' } },
  rename:       { label: 'Rename',        category: 'transform', icon: '✏️', properties: { oldName: '', newName: '' } },
  csv_sink:     { label: 'CSV Sink',      category: 'sink',      icon: '💾', properties: { outputPath: '', writeMode: 'overwrite' } },
  parquet_sink: { label: 'Parquet Sink',  category: 'sink',      icon: '🗜️', properties: { outputPath: '', writeMode: 'overwrite' } },
  jdbc_sink:    { label: 'JDBC Sink',     category: 'sink',      icon: '🏦', properties: { url: '', table: '', user: '', password: '', writeMode: 'overwrite' } },
}

export default function App() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [generatedCode, setGeneratedCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node)
  }, [])

  const handleNodesChange = useCallback((updatedNodes) => {
    setNodes(updatedNodes)
    if (selectedNode) {
      const updated = updatedNodes.find(n => n.id === selectedNode.id)
      if (updated) setSelectedNode(updated)
    }
  }, [selectedNode])

  const handleEdgesChange = useCallback((updatedEdges) => {
    setEdges(updatedEdges)
  }, [])

  const handlePropertyChange = useCallback((nodeId, key, value) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n
      const updated = {
        ...n,
        data: {
          ...n.data,
          properties: {
            ...n.data.properties,
            [key]: value
          }
        }
      }
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(updated)
      }
      return updated
    }))
  }, [selectedNode])

  const handleLabelChange = useCallback((nodeId, newLabel) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n
      const updated = { ...n, data: { ...n.data, label: newLabel } }
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(updated)
      }
      return updated
    }))
  }, [selectedNode])

  const handleGenerateCode = async () => {
    if (nodes.length === 0) {
      setError('Please add at least one node to the canvas.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const apiNodes = nodes.map(n => ({
        id: n.id,
        type: n.data.nodeType,
        label: n.data.label,
        properties: n.data.properties || {}
      }))
      const apiEdges = edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
      const code = await generateSparkCode(apiNodes, apiEdges)
      setGeneratedCode(code)
    } catch (err) {
      setError('Failed to generate code. Make sure the backend is running on http://localhost:8080.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="top-bar">
        <span className="app-title">⚡ ETL Visual Designer</span>
        <button
          className="generate-btn"
          onClick={handleGenerateCode}
          disabled={loading}
        >
          {loading ? 'Generating...' : '🚀 Generate Spark Code'}
        </button>
        {error && <span className="error-msg">{error}</span>}
      </div>
      <div className="main-layout">
        <Sidebar nodeTypeConfigs={NODE_TYPE_CONFIGS} />
        <Canvas
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeSelect={handleNodeSelect}
          nodeTypeConfigs={NODE_TYPE_CONFIGS}
        />
        <PropertiesPanel
          selectedNode={selectedNode}
          onPropertyChange={handlePropertyChange}
          onLabelChange={handleLabelChange}
          onClearSelection={() => setSelectedNode(null)}
          nodeTypeConfigs={NODE_TYPE_CONFIGS}
        />
      </div>
      {generatedCode !== null && (
        <CodeModal
          code={generatedCode}
          onClose={() => setGeneratedCode(null)}
        />
      )}
    </div>
  )
}
