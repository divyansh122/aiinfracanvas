// TypeScript type definitions for InfraCanvas

// Resource types supported by the application
export type ResourceTypeId = 'ec2' | 'lambda' | 'vpc' | 'alb' | 'apigateway' | 'rds' | 'dynamodb' | 's3' | 'waf';
export type ResourceCategory = 'compute' | 'network' | 'database' | 'storage' | 'security';

// Node types for React Flow
export interface Node {
  id: string;
  type: ResourceTypeId;
  position: { x: number; y: number };
  data: NodeData;
}

export interface NodeData {
  label: string;
  properties: ResourceProperties;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

// Resource-specific property types
export interface EC2Properties {
  instanceType?: string;
  ami?: string;
  keyName?: string;
  securityGroups?: string[];
}

export interface S3Properties {
  bucketName?: string;
  versioning?: boolean;
  encryption?: boolean;
}

export interface RDSProperties {
  engine?: string;
  instanceClass?: string;
  allocatedStorage?: number;
  dbName?: string;
}

export type ResourceProperties = EC2Properties | S3Properties | RDSProperties | Record<string, any>;

// Edge types for React Flow
export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

// Canvas state
export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isLoading?: boolean;
  error?: string | null;
}

// Resource type configuration for sidebar
export interface ResourceType {
  id: ResourceTypeId;
  label: string;
  icon: React.ReactNode;
  category: ResourceCategory;
}

// Actions for state management
export type CanvasAction =
  | { type: 'ADD_NODE'; payload: Node }
  | { type: 'UPDATE_NODE'; payload: { id: string; data: Partial<NodeData> } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'ADD_EDGE'; payload: Edge }
  | { type: 'DELETE_EDGE'; payload: string }
  | { type: 'SET_NODES'; payload: Node[] }
  | { type: 'SET_EDGES'; payload: Edge[] }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'UPDATE_NODE_POSITION'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };
