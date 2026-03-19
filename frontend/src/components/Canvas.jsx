import React, { useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
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

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#6c63ff', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#6c63ff',
    width: 20,
    height: 20,
  },
}

function getFlowNodeType(category) {
  if (category === 'source') return 'sourceNode'
  if (category === 'transform') return 'transformNode'
  return 'sinkNode'
}

/**
 * Auto-layout nodes left-to-right using topological sort.
 * Sources on the left, transforms in the middle, sinks on the right.
 */
function autoLayoutNodes(nodes, edges) {
  if (nodes.length === 0) return nodes

  // Build adjacency maps
  const childrenMap = {}
  const inDegree = {}
  nodes.forEach(n => {
    childrenMap[n.id] = []
    inDegree[n.id] = 0
  })
  edges.forEach(e => {
    if (childrenMap[e.source]) childrenMap[e.source].push(e.target)
    if (inDegree[e.target] !== undefined) inDegree[e.target]++
  })

  // Topological sort by levels (BFS)
  const levels = []
  const queue = []
  const visited = new Set()
  nodes.forEach(n => {
    if (inDegree[n.id] === 0) queue.push(n.id)
  })

  while (queue.length > 0) {
    const levelSize = queue.length
    const level = []
    for (let i = 0; i < levelSize; i++) {
      const nodeId = queue.shift()
      if (visited.has(nodeId)) continue
      visited.add(nodeId)
      level.push(nodeId)
      for (const child of (childrenMap[nodeId] || [])) {
        inDegree[child]--
        if (inDegree[child] === 0) queue.push(child)
      }
    }
    if (level.length > 0) levels.push(level)
  }

  // Add any unvisited nodes (disconnected) as their own level
  const disconnected = nodes.filter(n => !visited.has(n.id)).map(n => n.id)
  if (disconnected.length > 0) levels.push(disconnected)

  // Position nodes: left-to-right by level
  const HORIZONTAL_SPACING = 280
  const VERTICAL_SPACING = 120
  const START_X = 50
  const START_Y = 50

  const positionMap = {}
  levels.forEach((level, colIndex) => {
    const totalHeight = (level.length - 1) * VERTICAL_SPACING
    const startY = START_Y + Math.max(0, (300 - totalHeight) / 2)
    level.forEach((nodeId, rowIndex) => {
      positionMap[nodeId] = {
        x: START_X + colIndex * HORIZONTAL_SPACING,
        y: startY + rowIndex * VERTICAL_SPACING,
      }
    })
  })

  return nodes.map(n => ({
    ...n,
    position: positionMap[n.id] || n.position,
  }))
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
    (params) => onEdgesChange(addEdge({ ...params, ...defaultEdgeOptions }, edges)),
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

  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = autoLayoutNodes(nodes, edges)
    onNodesChange(layoutedNodes)
    // Fit view after layout with a small delay to allow re-render
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.2 })
      }
    }, 50)
  }, [nodes, edges, onNodesChange])

  return (
    <div className="canvas-wrapper" ref={reactFlowWrapper}>
      <div className="canvas-toolbar">
        <button className="auto-layout-btn" onClick={handleAutoLayout} title="Arrange nodes left to right">
          ↔️ Auto Layout
        </button>
      </div>
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
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType="smoothstep"
        connectionLineStyle={{ stroke: '#6c63ff', strokeWidth: 2 }}
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
