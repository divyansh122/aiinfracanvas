// Canvas state management with React Context
'use client';

import { createContext, useContext, useReducer, ReactNode, useMemo, useCallback } from 'react';
import { CanvasState, CanvasAction, Node, Edge, NodeData } from '@/types';

// Initial state
const initialState: CanvasState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isLoading: false,
  error: null,
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

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
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
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create context
export const CanvasContext = createContext<CanvasContextType | null>(null);

// Provider component
export function CanvasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  // Memoize helper functions to prevent unnecessary re-renders
  const addNode = useCallback((node: Node) => {
    dispatch({ type: 'ADD_NODE', payload: node });
  }, []);

  const updateNode = useCallback((id: string, data: Partial<NodeData>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, data } });
  }, []);

  const deleteNode = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NODE', payload: id });
  }, []);

  const addEdge = useCallback((edge: Edge) => {
    dispatch({ type: 'ADD_EDGE', payload: edge });
  }, []);

  const deleteEdge = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EDGE', payload: id });
  }, []);

  const setNodes = useCallback((nodes: Node[]) => {
    dispatch({ type: 'SET_NODES', payload: nodes });
  }, []);

  const setEdges = useCallback((edges: Edge[]) => {
    dispatch({ type: 'SET_EDGES', payload: edges });
  }, []);

  const selectNode = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_NODE', payload: id });
  }, []);

  const updateNodePosition = useCallback((id: string, position: { x: number; y: number }) => {
    dispatch({ type: 'UPDATE_NODE_POSITION', payload: { id, position } });
  }, []);

  // Memoize selected node lookup to avoid recalculation on every render
  const getSelectedNode = useCallback((): Node | null => {
    if (!state.selectedNodeId) return null;
    return state.nodes.find((node) => node.id === state.selectedNodeId) || null;
  }, [state.selectedNodeId, state.nodes]);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value: CanvasContextType = useMemo(() => ({
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
    setLoading,
    setError,
  }), [
    state,
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
    setLoading,
    setError,
  ]);

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
