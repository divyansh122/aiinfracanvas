// Export all custom node components and node type mapping
'use client';

import EC2Node from './ec2-node';
import S3Node from './s3-node';
import RDSNode from './rds-node';

// Node types mapping for React Flow
export const nodeTypes = {
  ec2: EC2Node,
  s3: S3Node,
  rds: RDSNode,
};

export { EC2Node, S3Node, RDSNode };
export { default as BaseNode } from './base-node';
