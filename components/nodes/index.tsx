// Export all custom node components and node type mapping
'use client';

import EC2Node from './ec2-node';
import LambdaNode from './lambda-node';
import VPCNode from './vpc-node';
import ALBNode from './alb-node';
import APIGatewayNode from './apigateway-node';
import S3Node from './s3-node';
import RDSNode from './rds-node';
import DynamoDBNode from './dynamodb-node';
import WAFNode from './waf-node';

// Node types mapping for React Flow
export const nodeTypes = {
  ec2: EC2Node,
  lambda: LambdaNode,
  vpc: VPCNode,
  alb: ALBNode,
  apigateway: APIGatewayNode,
  s3: S3Node,
  rds: RDSNode,
  dynamodb: DynamoDBNode,
  waf: WAFNode,
};

export { 
  EC2Node, 
  LambdaNode,
  VPCNode,
  ALBNode,
  APIGatewayNode,
  S3Node, 
  RDSNode,
  DynamoDBNode,
  WAFNode,
};
export { default as BaseNode } from './base-node';
