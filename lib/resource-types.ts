// Resource type configurations for AWS resources
import { ResourceTypeId, ResourceCategory } from '@/types';

export interface ResourceTypeConfig {
  id: ResourceTypeId;
  label: string;
  iconUrl: string;
  category: ResourceCategory;
  description: string;
}

export const resourceTypeConfigs: Record<ResourceTypeId, ResourceTypeConfig> = {
  // COMPUTE
  ec2: {
    id: 'ec2',
    label: 'EC2 Instance',
    iconUrl: 'https://icon.icepanel.io/AWS/svg/Compute/EC2.svg',
    category: 'compute',
    description: 'Amazon Elastic Compute Cloud virtual server',
  },
  lambda: {
    id: 'lambda',
    label: 'Lambda Function',
    iconUrl: 'https://icon.icepanel.io/AWS/svg/Compute/Lambda.svg',
    category: 'compute',
    description: 'AWS Lambda serverless compute service',
  },
  
  // NETWORK
  vpc: {
    id: 'vpc',
    label: 'VPC',
    iconUrl: 'https://icon.icepanel.io/AWS/svg/Networking-Content-Delivery/Virtual-Private-Cloud.svg',
    category: 'network',
    description: 'Amazon Virtual Private Cloud',
  },
  alb: {
    id: 'alb',
    label: 'Application Load Balancer',
    iconUrl: 'https://icon.icepanel.io/AWS/svg/Networking-Content-Delivery/Elastic-Load-Balancing.svg',
    category: 'network',
    description: 'Elastic Load Balancing for applications',
  },
  apigateway: {
    id: 'apigateway',
    label: 'API Gateway',
    iconUrl: 'https://icon.icepanel.io/AWS/svg/App-Integration/API-Gateway.svg',
    category: 'network',
    description: 'Amazon API Gateway for REST and WebSocket APIs',
  },
  
  // DATABASE
  rds: {
    id: 'rds',
    label: 'RDS Database',
    iconUrl: 'https://icon.icepanel.io/AWS/svg/Database/RDS.svg',
    category: 'database',
    description: 'Amazon Relational Database Service',
  },
  dynamodb: {
    id: 'dynamodb',
    label: 'DynamoDB',
    iconUrl: 'https://icon.icepanel.io/AWS/svg/Database/DynamoDB.svg',
    category: 'database',
    description: 'Amazon DynamoDB NoSQL database',
  },
  
  // STORAGE
  s3: {
    id: 's3',
    label: 'S3 Bucket',
    iconUrl: 'https://icon.icepanel.io/AWS/svg/Storage/Simple-Storage-Service.svg',
    category: 'storage',
    description: 'Amazon Simple Storage Service object storage',
  },
  
  // SECURITY
  waf: {
    id: 'waf',
    label: 'WAF / Firewall',
    iconUrl: 'https://icon.icepanel.io/AWS/svg/Security-Identity-Compliance/Firewall-Manager.svg',
    category: 'security',
    description: 'AWS Web Application Firewall',
  },
};

// Helper function to get all resource types as an array
export const getResourceTypes = (): ResourceTypeConfig[] => {
  return Object.values(resourceTypeConfigs);
};

// Helper function to get resource type by id
export const getResourceTypeById = (id: ResourceTypeId): ResourceTypeConfig => {
  return resourceTypeConfigs[id];
};

// Helper function to get resource types by category
export const getResourceTypesByCategory = (
  category: ResourceCategory
): ResourceTypeConfig[] => {
  return Object.values(resourceTypeConfigs).filter(
    (config) => config.category === category
  );
};
