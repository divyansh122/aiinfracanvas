// Canvas state management with React Context
'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { CanvasState, CanvasAction, Node, Edge, NodeData } from '@/types';

// Initial state
const initialState: CanvasState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
};

// Reducer function
function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'ADD_NODE':
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
      };

    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === action.payload.id
            ? { ...node, data: { ...node.data, ...action.payload.data } }
            : node
        ),
      };

    case 'DELETE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter((node) => node.id !== action.payload),
        edges: state.edges.filter(
          (edge) => edge.source !== action.payload && edge.target !== action.payload
        ),
        selectedNodeId: state.selectedNodeId === action.payload ? null : state.selectedNodeId,
      };

    case 'ADD_EDGE':
      return {
        ...state,
        edges: [...state.edges, action.payload],
      };

    case 'DELETE_EDGE':
      return {
        ...state,
        edges: state.edges.filter((edge) => edge.id !== action.payload),
      };

    case 'SET_NODES':
      return {
        ...state,
        nodes: action.payload,
      };

    case 'SET_EDGES':
      return {
        ...state,
        edges: action.payload,
      };

    case 'SELECT_NODE':
      return {
        ...state,
        selectedNodeId: action.payload,
      };

    case 'UPDATE_NODE_POSITION':
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === action.payload.id
            ? { ...node, position: action.payload.position }
            : node
        ),
      };

    default:
      return state;
  }
}

// Context type
interface CanvasContextType {
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectNode: (id: string | null) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  getSelectedNode: () => Node | null;
}

// Create context
export const CanvasContext = createContext<CanvasContextType | null>(null);

// Provider component
export function CanvasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  // Helper functions
  const addNode = (node: Node) => {
    dispatch({ type: 'ADD_NODE', payload: node });
  };

  const updateNode = (id: string, data: Partial<NodeData>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, data } });
  };

  const deleteNode = (id: string) => {
    dispatch({ type: 'DELETE_NODE', payload: id });
  };

  const addEdge = (edge: Edge) => {
    dispatch({ type: 'ADD_EDGE', payload: edge });
  };

  const deleteEdge = (id: string) => {
    dispatch({ type: 'DELETE_EDGE', payload: id });
  };

  const setNodes = (nodes: Node[]) => {
    dispatch({ type: 'SET_NODES', payload: nodes });
  };

  const setEdges = (edges: Edge[]) => {
    dispatch({ type: 'SET_EDGES', payload: edges });
  };

  const selectNode = (id: string | null) => {
    dispatch({ type: 'SELECT_NODE', payload: id });
  };

  const updateNodePosition = (id: string, position: { x: number; y: number }) => {
    dispatch({ type: 'UPDATE_NODE_POSITION', payload: { id, position } });
  };

  const getSelectedNode = (): Node | null => {
    if (!state.selectedNodeId) return null;
    return state.nodes.find((node) => node.id === state.selectedNodeId) || null;
  };

  const value: CanvasContextType = {
    state,
    dispatch,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    setNodes,
    setEdges,
    selectNode,
    updateNodePosition,
    getSelectedNode,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

// Custom hook for using canvas context
export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}
