// Canvas component - React Flow infinite canvas
'use client';

import { useCallback, useRef, DragEvent, useState, useMemo } from 'react';
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
import { toast } from 'sonner';
import { ConnectionIntelligenceModal } from '@/components/connection-intelligence-modal';

function CanvasContent() {
  const { state, setNodes, setEdges, addNode, selectNode, setError } = useCanvas();
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [connectionIntelligence, setConnectionIntelligence] = useState<{
    isOpen: boolean;
    sourceNode: { id: string; type: string; data: any } | null;
    targetNode: { id: string; type: string; data: any } | null;
  }>({
    isOpen: false,
    sourceNode: null,
    targetNode: null,
  });

  // Handle node changes (position, selection, etc.)
  const onNodesChange: OnNodesChange<ReactFlowNode> = useCallback(
    (changes) => {
      try {
        const updatedNodes = applyNodeChanges(changes, state.nodes as ReactFlowNode[]);
        setNodes(updatedNodes as any);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update nodes';
        setError(errorMessage);
        toast.error('Node update failed', {
          description: errorMessage,
        });
        console.error('Node change error:', error);
      }
    },
    [state.nodes, setNodes, setError]
  );

  // Handle edge changes (selection, deletion, etc.)
  const onEdgesChange: OnEdgesChange<ReactFlowEdge> = useCallback(
    (changes) => {
      try {
        const updatedEdges = applyEdgeChanges(changes, state.edges as ReactFlowEdge[]);
        setEdges(updatedEdges as any);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update edges';
        setError(errorMessage);
        toast.error('Edge update failed', {
          description: errorMessage,
        });
        console.error('Edge change error:', error);
      }
    },
    [state.edges, setEdges, setError]
  );

  // Handle edge connection (when user connects two nodes)
  const onConnect: OnConnect = useCallback(
    (connection) => {
      try {
        const newEdge: ReactFlowEdge = {
          id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
          source: connection.source!,
          target: connection.target!,
          type: 'default',
        };
        
        const updatedEdges = addEdge(newEdge, state.edges as ReactFlowEdge[]);
        setEdges(updatedEdges as any);
        toast.success('Connection created');

        // Find source and target nodes for connection intelligence
        const sourceNode = state.nodes.find(n => n.id === connection.source);
        const targetNode = state.nodes.find(n => n.id === connection.target);

        if (sourceNode && targetNode) {
          setConnectionIntelligence({
            isOpen: true,
            sourceNode: {
              id: sourceNode.id,
              type: sourceNode.type,
              data: sourceNode.data,
            },
            targetNode: {
              id: targetNode.id,
              type: targetNode.type,
              data: targetNode.data,
            },
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create connection';
        setError(errorMessage);
        toast.error('Connection failed', {
          description: errorMessage,
        });
        console.error('Connection error:', error);
      }
    },
    [state.edges, state.nodes, setEdges, setError]
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
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent) => {
    // Only set to false if we're leaving the canvas wrapper itself
    if (event.currentTarget === event.target) {
      setIsDraggingOver(false);
    }
  }, []);

  // Handle drop event to add new nodes
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      setIsDraggingOver(false);

      try {
        // Get the resource type from drag data
        const resourceType = event.dataTransfer.getData('application/reactflow') as ResourceTypeId;
        
        if (!resourceType || !reactFlowWrapper.current) {
          return;
        }

        // Get the resource configuration
        const resourceConfig = getResourceTypeById(resourceType);
        if (!resourceConfig) {
          throw new Error(`Unknown resource type: ${resourceType}`);
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
        toast.success(`${resourceConfig.label} added to canvas`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add node';
        setError(errorMessage);
        toast.error('Failed to add resource', {
          description: errorMessage,
        });
        console.error('Drop error:', error);
      }
    },
    [reactFlowInstance, addNode, setError]
  );

  // Memoize node color function for MiniMap to prevent recreation on every render
  const nodeColor = useCallback((node: ReactFlowNode) => {
    if (node.selected) return 'hsl(var(--primary))';
    return 'hsl(var(--muted))';
  }, []);

  return (
    <div 
      ref={reactFlowWrapper} 
      className={`flex-1 h-full relative transition-all duration-200 ${
        isDraggingOver 
          ? 'ring-4 ring-primary/30 ring-inset bg-primary/5' 
          : ''
      }`}
      onDragLeave={onDragLeave}
    >
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
        // Performance optimizations for larger graphs
        elevateNodesOnSelect={false}
        selectNodesOnDrag={false}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
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
          nodeColor={nodeColor}
          maskColor="hsl(var(--accent) / 0.3)"
        />
      </ReactFlow>
      
      {/* Drop zone indicator */}
      {isDraggingOver && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="bg-primary/10 border-2 border-dashed border-primary rounded-lg px-8 py-4 backdrop-blur-sm">
            <p className="text-lg font-medium text-primary">Drop here to add resource</p>
          </div>
        </div>
      )}
      
      {/* Empty state guidance */}
      {state.nodes.length === 0 && !isDraggingOver && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="text-center max-w-md px-4">
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              Get Started
            </h3>
            <p className="text-sm text-muted-foreground/80 mb-4">
              Drag AWS resources from the sidebar to start designing your infrastructure
            </p>
            <div className="space-y-2 text-xs text-muted-foreground/70">
              <p>• Drag resources onto the canvas</p>
              <p>• Connect nodes by dragging from one to another</p>
              <p>• Click nodes to edit their properties</p>
              <p>• Generate Terraform code when ready</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Intelligence Modal */}
      <ConnectionIntelligenceModal
        isOpen={connectionIntelligence.isOpen}
        onClose={() => setConnectionIntelligence({ isOpen: false, sourceNode: null, targetNode: null })}
        sourceNode={connectionIntelligence.sourceNode}
        targetNode={connectionIntelligence.targetNode}
      />
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
