// Canvas component - React Flow infinite canvas
'use client';

import { useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCanvas } from '@/lib/canvas-context';
import { resourceSchemas } from '@/lib/resource-schemas';
import { ResourceTypeId } from '@/types';
import { getResourceTypeById } from '@/lib/resource-types';
import { nodeTypes } from '@/components/nodes';

function CanvasContent() {
  const { state, setNodes, setEdges, addNode, selectNode } = useCanvas();
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Handle node changes (position, selection, etc.)
  const onNodesChange: OnNodesChange<ReactFlowNode> = useCallback(
    (changes) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes as ReactFlowNode[]);
      setNodes(updatedNodes as any);
    },
    [state.nodes, setNodes]
  );

  // Handle edge changes (selection, deletion, etc.)
  const onEdgesChange: OnEdgesChange<ReactFlowEdge> = useCallback(
    (changes) => {
      const updatedEdges = applyEdgeChanges(changes, state.edges as ReactFlowEdge[]);
      setEdges(updatedEdges as any);
    },
    [state.edges, setEdges]
  );

  // Handle edge connection (when user connects two nodes)
  const onConnect: OnConnect = useCallback(
    (connection) => {
      const newEdge: ReactFlowEdge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        type: 'default',
      };
      
      const updatedEdges = addEdge(newEdge, state.edges as ReactFlowEdge[]);
      setEdges(updatedEdges as any);
    },
    [state.edges, setEdges]
  );

  // Handle node click for selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: ReactFlowNode) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Handle drag over event (required for drop to work)
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop event to add new nodes
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      // Get the resource type from drag data
      const resourceType = event.dataTransfer.getData('application/reactflow') as ResourceTypeId;
      
      if (!resourceType || !reactFlowWrapper.current) {
        return;
      }

      // Get the resource configuration
      const resourceConfig = getResourceTypeById(resourceType);
      if (!resourceConfig) {
        return;
      }

      // Calculate the position in canvas coordinates
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Generate a unique ID for the new node
      const nodeId = `${resourceType}-${Date.now()}`;

      // Get default properties from schema
      const schema = resourceSchemas[resourceType];
      const defaultProperties = schema?.defaultProperties || {};

      // Create the new node
      const newNode = {
        id: nodeId,
        type: resourceType,
        position,
        data: {
          label: resourceConfig.label,
          properties: defaultProperties,
        },
      };

      // Add the node to canvas state
      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full relative">
      <ReactFlow
        nodes={state.nodes as ReactFlowNode[]}
        edges={state.edges as ReactFlowEdge[]}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50 dark:bg-gray-900"
        panOnScroll
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1}
          className="bg-gray-50 dark:bg-gray-900"
          color="currentColor"
        />
        <Controls 
          showZoom
          showFitView
          showInteractive
          position="bottom-right"
          className="shadow-lg"
        />
        <MiniMap 
          pannable
          zoomable
          position="bottom-left"
          className="shadow-lg"
          nodeColor={(node) => {
            if (node.selected) return 'hsl(var(--primary))';
            return 'hsl(var(--muted))';
          }}
          maskColor="hsl(var(--accent) / 0.3)"
        />
      </ReactFlow>
    </div>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}
