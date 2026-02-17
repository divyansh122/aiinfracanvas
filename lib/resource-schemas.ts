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
  description?: string; // Help text for the field
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
        description: 'The type of EC2 instance to launch. T2/T3 instances are burstable and cost-effective.',
      },
      {
        name: 'ami',
        label: 'AMI ID',
        type: 'text',
        defaultValue: 'ami-0c55b159cbfafe1f0',
        placeholder: 'ami-xxxxxxxxxxxxxxxxx',
        required: true,
        description: 'Amazon Machine Image ID that defines the operating system and software configuration.',
      },
      {
        name: 'keyName',
        label: 'Key Pair Name',
        type: 'text',
        defaultValue: '',
        placeholder: 'my-key-pair',
        required: false,
        description: 'SSH key pair name for secure access to the instance.',
      },
      {
        name: 'securityGroups',
        label: 'Security Groups',
        type: 'array',
        defaultValue: [],
        placeholder: 'sg-xxxxxxxxxxxxxxxxx',
        required: false,
        description: 'Security group IDs that control inbound and outbound traffic.',
      },
    ],
    defaultProperties: {
      instanceType: 't2.micro',
      ami: 'ami-0c55b159cbfafe1f0',
      keyName: '',
      securityGroups: [],
    },
  },
  lambda: {
    fields: [
      {
        name: 'functionName',
        label: 'Function Name',
        type: 'text',
        defaultValue: '',
        placeholder: 'my-function',
        required: true,
        description: 'The name of the Lambda function.',
      },
      {
        name: 'runtime',
        label: 'Runtime',
        type: 'select',
        defaultValue: 'nodejs20.x',
        options: ['nodejs20.x', 'python3.12', 'java21', 'dotnet8', 'go1.x'],
        required: true,
        description: 'The runtime environment for the Lambda function.',
      },
      {
        name: 'handler',
        label: 'Handler',
        type: 'text',
        defaultValue: 'index.handler',
        placeholder: 'index.handler',
        required: true,
        description: 'The function entry point in your code.',
      },
      {
        name: 'memory',
        label: 'Memory (MB)',
        type: 'number',
        defaultValue: 128,
        placeholder: '128',
        required: false,
        description: 'The amount of memory available to the function at runtime.',
      },
    ],
    defaultProperties: {
      functionName: '',
      runtime: 'nodejs20.x',
      handler: 'index.handler',
      memory: 128,
    },
  },
  vpc: {
    fields: [
      {
        name: 'cidrBlock',
        label: 'CIDR Block',
        type: 'text',
        defaultValue: '10.0.0.0/16',
        placeholder: '10.0.0.0/16',
        required: true,
        description: 'The IPv4 CIDR block for the VPC.',
      },
      {
        name: 'enableDnsHostnames',
        label: 'Enable DNS Hostnames',
        type: 'boolean',
        defaultValue: true,
        required: false,
        description: 'Enable DNS hostnames in the VPC.',
      },
      {
        name: 'enableDnsSupport',
        label: 'Enable DNS Support',
        type: 'boolean',
        defaultValue: true,
        required: false,
        description: 'Enable DNS resolution in the VPC.',
      },
    ],
    defaultProperties: {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
    },
  },
  alb: {
    fields: [
      {
        name: 'name',
        label: 'Load Balancer Name',
        type: 'text',
        defaultValue: '',
        placeholder: 'my-load-balancer',
        required: true,
        description: 'The name of the Application Load Balancer.',
      },
      {
        name: 'scheme',
        label: 'Scheme',
        type: 'select',
        defaultValue: 'internet-facing',
        options: ['internet-facing', 'internal'],
        required: true,
        description: 'Whether the load balancer is internet-facing or internal.',
      },
      {
        name: 'ipAddressType',
        label: 'IP Address Type',
        type: 'select',
        defaultValue: 'ipv4',
        options: ['ipv4', 'dualstack'],
        required: false,
        description: 'The type of IP addresses used by the subnets.',
      },
    ],
    defaultProperties: {
      name: '',
      scheme: 'internet-facing',
      ipAddressType: 'ipv4',
    },
  },
  apigateway: {
    fields: [
      {
        name: 'name',
        label: 'API Name',
        type: 'text',
        defaultValue: '',
        placeholder: 'my-api',
        required: true,
        description: 'The name of the API Gateway.',
      },
      {
        name: 'protocolType',
        label: 'Protocol Type',
        type: 'select',
        defaultValue: 'HTTP',
        options: ['HTTP', 'WEBSOCKET', 'REST'],
        required: true,
        description: 'The API protocol type.',
      },
      {
        name: 'corsEnabled',
        label: 'Enable CORS',
        type: 'boolean',
        defaultValue: true,
        required: false,
        description: 'Enable Cross-Origin Resource Sharing.',
      },
    ],
    defaultProperties: {
      name: '',
      protocolType: 'HTTP',
      corsEnabled: true,
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
        description: 'Globally unique name for the S3 bucket. Must be lowercase and DNS-compliant.',
      },
      {
        name: 'versioning',
        label: 'Enable Versioning',
        type: 'boolean',
        defaultValue: false,
        required: false,
        description: 'Keep multiple versions of objects for backup and recovery.',
      },
      {
        name: 'encryption',
        label: 'Enable Encryption',
        type: 'boolean',
        defaultValue: true,
        required: false,
        description: 'Encrypt objects at rest using server-side encryption.',
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
        description: 'The database engine to use (PostgreSQL, MySQL, etc.).',
      },
      {
        name: 'instanceClass',
        label: 'Instance Class',
        type: 'select',
        defaultValue: 'db.t3.micro',
        options: ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.m5.large', 'db.m5.xlarge'],
        required: true,
        description: 'The compute and memory capacity of the database instance.',
      },
      {
        name: 'allocatedStorage',
        label: 'Allocated Storage (GB)',
        type: 'number',
        defaultValue: 20,
        placeholder: '20',
        required: true,
        description: 'The amount of storage in gigabytes to allocate for the database.',
      },
      {
        name: 'dbName',
        label: 'Database Name',
        type: 'text',
        defaultValue: '',
        placeholder: 'mydb',
        required: true,
        description: 'The name of the initial database to create.',
      },
    ],
    defaultProperties: {
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: '',
    },
  },
  dynamodb: {
    fields: [
      {
        name: 'tableName',
        label: 'Table Name',
        type: 'text',
        defaultValue: '',
        placeholder: 'my-table',
        required: true,
        description: 'The name of the DynamoDB table.',
      },
      {
        name: 'billingMode',
        label: 'Billing Mode',
        type: 'select',
        defaultValue: 'PAY_PER_REQUEST',
        options: ['PAY_PER_REQUEST', 'PROVISIONED'],
        required: true,
        description: 'How you are charged for read and write throughput.',
      },
      {
        name: 'hashKey',
        label: 'Partition Key',
        type: 'text',
        defaultValue: 'id',
        placeholder: 'id',
        required: true,
        description: 'The attribute to use as the partition key.',
      },
    ],
    defaultProperties: {
      tableName: '',
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'id',
    },
  },
  waf: {
    fields: [
      {
        name: 'name',
        label: 'WAF Name',
        type: 'text',
        defaultValue: '',
        placeholder: 'my-waf',
        required: true,
        description: 'The name of the Web Application Firewall.',
      },
      {
        name: 'scope',
        label: 'Scope',
        type: 'select',
        defaultValue: 'REGIONAL',
        options: ['REGIONAL', 'CLOUDFRONT'],
        required: true,
        description: 'Whether this is for CloudFront or regional resources.',
      },
      {
        name: 'defaultAction',
        label: 'Default Action',
        type: 'select',
        defaultValue: 'ALLOW',
        options: ['ALLOW', 'BLOCK'],
        required: true,
        description: 'The action to perform if none of the rules match.',
      },
    ],
    defaultProperties: {
      name: '',
      scope: 'REGIONAL',
      defaultAction: 'ALLOW',
    },
  },
};
