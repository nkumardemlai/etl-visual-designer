import React, { useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow'
import 'reactflow/dist/style.css'
import SourceNode from './nodes/SourceNode.jsx'
import TransformNode from './nodes/TransformNode.jsx'
import SinkNode from './nodes/SinkNode.jsx'

const nodeTypes = {
  sourceNode: SourceNode,
  transformNode: TransformNode,
  sinkNode: SinkNode,
}

function getFlowNodeType(category) {
  if (category === 'source') return 'sourceNode'
  if (category === 'transform') return 'transformNode'
  return 'sinkNode'
}

let idCounter = 1

export default function Canvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  nodeTypeConfigs,
}) {
  const reactFlowWrapper = useRef(null)
  const reactFlowInstance = useRef(null)

  const handleNodesChange = useCallback(
    (changes) => onNodesChange(applyNodeChanges(changes, nodes)),
    [nodes, onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes) => onEdgesChange(applyEdgeChanges(changes, edges)),
    [edges, onEdgesChange]
  )

  const handleConnect = useCallback(
    (params) => onEdgesChange(addEdge({ ...params, animated: true }, edges)),
    [edges, onEdgesChange]
  )

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault()
      const nodeType = event.dataTransfer.getData('nodeType')
      if (!nodeType || !nodeTypeConfigs[nodeType]) return

      const cfg = nodeTypeConfigs[nodeType]
      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const newNode = {
        id: `node_${idCounter++}`,
        type: getFlowNodeType(cfg.category),
        position,
        data: {
          nodeType,
          label: cfg.label,
          icon: cfg.icon,
          category: cfg.category,
          properties: { ...cfg.properties },
        },
      }
      onNodesChange([...nodes, newNode])
    },
    [nodes, onNodesChange, nodeTypeConfigs]
  )

  const handleDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleNodeClick = useCallback(
    (_, node) => onNodeSelect(node),
    [onNodeSelect]
  )

  return (
    <div className="canvas-wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        onInit={(instance) => { reactFlowInstance.current = instance }}
        fitView
        deleteKeyCode="Delete"
      >
        <Background variant="dots" gap={18} size={1} color="#c8c8c8" />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  )
}
