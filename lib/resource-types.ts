// Resource type configurations for AWS resources
import { Server, Database, HardDrive, LucideIcon } from 'lucide-react';
import { ResourceTypeId, ResourceCategory } from '@/types';

export interface ResourceTypeConfig {
  id: ResourceTypeId;
  label: string;
  icon: LucideIcon;
  category: ResourceCategory;
  description: string;
}

export const resourceTypeConfigs: Record<ResourceTypeId, ResourceTypeConfig> = {
  ec2: {
    id: 'ec2',
    label: 'EC2 Instance',
    icon: Server,
    category: 'compute',
    description: 'Amazon Elastic Compute Cloud virtual server',
  },
  s3: {
    id: 's3',
    label: 'S3 Bucket',
    icon: HardDrive,
    category: 'storage',
    description: 'Amazon Simple Storage Service object storage',
  },
  rds: {
    id: 'rds',
    label: 'RDS Database',
    icon: Database,
    category: 'database',
    description: 'Amazon Relational Database Service',
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
