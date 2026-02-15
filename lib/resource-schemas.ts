// Resource property schemas for AWS resources
import { ResourceTypeId } from '@/types';

export interface PropertyField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'array';
  defaultValue?: any;
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export interface ResourceSchema {
  fields: PropertyField[];
  defaultProperties: Record<string, any>;
}

export const resourceSchemas: Record<ResourceTypeId, ResourceSchema> = {
  ec2: {
    fields: [
      {
        name: 'instanceType',
        label: 'Instance Type',
        type: 'select',
        defaultValue: 't2.micro',
        options: ['t2.micro', 't2.small', 't2.medium', 't3.micro', 't3.small', 't3.medium'],
        required: true,
      },
      {
        name: 'ami',
        label: 'AMI ID',
        type: 'text',
        defaultValue: 'ami-0c55b159cbfafe1f0',
        placeholder: 'ami-xxxxxxxxxxxxxxxxx',
        required: true,
      },
      {
        name: 'keyName',
        label: 'Key Pair Name',
        type: 'text',
        defaultValue: '',
        placeholder: 'my-key-pair',
        required: false,
      },
      {
        name: 'securityGroups',
        label: 'Security Groups',
        type: 'array',
        defaultValue: [],
        placeholder: 'sg-xxxxxxxxxxxxxxxxx',
        required: false,
      },
    ],
    defaultProperties: {
      instanceType: 't2.micro',
      ami: 'ami-0c55b159cbfafe1f0',
      keyName: '',
      securityGroups: [],
    },
  },
  s3: {
    fields: [
      {
        name: 'bucketName',
        label: 'Bucket Name',
        type: 'text',
        defaultValue: '',
        placeholder: 'my-unique-bucket-name',
        required: true,
      },
      {
        name: 'versioning',
        label: 'Enable Versioning',
        type: 'boolean',
        defaultValue: false,
        required: false,
      },
      {
        name: 'encryption',
        label: 'Enable Encryption',
        type: 'boolean',
        defaultValue: true,
        required: false,
      },
    ],
    defaultProperties: {
      bucketName: '',
      versioning: false,
      encryption: true,
    },
  },
  rds: {
    fields: [
      {
        name: 'engine',
        label: 'Database Engine',
        type: 'select',
        defaultValue: 'postgres',
        options: ['postgres', 'mysql', 'mariadb', 'oracle-se2', 'sqlserver-ex'],
        required: true,
      },
      {
        name: 'instanceClass',
        label: 'Instance Class',
        type: 'select',
        defaultValue: 'db.t3.micro',
        options: ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.m5.large', 'db.m5.xlarge'],
        required: true,
      },
      {
        name: 'allocatedStorage',
        label: 'Allocated Storage (GB)',
        type: 'number',
        defaultValue: 20,
        placeholder: '20',
        required: true,
      },
      {
        name: 'dbName',
        label: 'Database Name',
        type: 'text',
        defaultValue: '',
        placeholder: 'mydb',
        required: true,
      },
    ],
    defaultProperties: {
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: '',
    },
  },
};
