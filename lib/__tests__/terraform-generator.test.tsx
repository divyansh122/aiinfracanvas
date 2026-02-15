import { describe, it, expect } from 'vitest';
import { generateTerraform } from '../terraform-generator';
import { Node, Edge } from '@/types';

describe('generateTerraform', () => {
  describe('EC2 resource block generation', () => {
    it('should generate basic EC2 instance block with required properties', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Web Server',
            properties: {
              ami: 'ami-0c55b159cbfafe1f0',
              instanceType: 't2.micro',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_instance" "web_server"');
      expect(result).toContain('ami           = "ami-0c55b159cbfafe1f0"');
      expect(result).toContain('instance_type = "t2.micro"');
      expect(result).toContain('Name = "Web Server"');
    });

    it('should generate EC2 block with all properties including key name', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'App Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't3.medium',
              keyName: 'my-key-pair',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('key_name      = "my-key-pair"');
    });

    it('should generate EC2 block with security groups', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Secure Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.small',
              securityGroups: ['sg-123456', 'sg-789012'],
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('security_groups = ["sg-123456", "sg-789012"]');
    });

    it('should sanitize resource names with special characters', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'My-Web Server 2024!',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      // Special characters are replaced with underscores
      expect(result).toContain('resource "aws_instance" "my_web_server_2024_"');
    });

    it('should handle empty security groups array', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
              securityGroups: [],
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).not.toContain('security_groups');
    });
  });

  describe('S3 resource block generation', () => {
    it('should generate basic S3 bucket block with bucket name', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 's3',
          position: { x: 0, y: 0 },
          data: {
            label: 'Data Bucket',
            properties: {
              bucketName: 'my-data-bucket',
              versioning: false,
              encryption: false,
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_s3_bucket" "data_bucket"');
      expect(result).toContain('bucket = "my-data-bucket"');
      expect(result).toContain('Name = "Data Bucket"');
    });

    it('should generate S3 bucket with versioning enabled', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 's3',
          position: { x: 0, y: 0 },
          data: {
            label: 'Versioned Bucket',
            properties: {
              bucketName: 'versioned-bucket',
              versioning: true,
              encryption: false,
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_s3_bucket_versioning" "versioned_bucket_versioning"');
      expect(result).toContain('bucket = aws_s3_bucket.versioned_bucket.id');
      expect(result).toContain('status = "Enabled"');
    });

    it('should generate S3 bucket with encryption enabled', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 's3',
          position: { x: 0, y: 0 },
          data: {
            label: 'Encrypted Bucket',
            properties: {
              bucketName: 'encrypted-bucket',
              versioning: false,
              encryption: true,
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "encrypted_bucket_encryption"');
      expect(result).toContain('bucket = aws_s3_bucket.encrypted_bucket.id');
      expect(result).toContain('sse_algorithm = "AES256"');
    });

    it('should generate S3 bucket with both versioning and encryption', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 's3',
          position: { x: 0, y: 0 },
          data: {
            label: 'Secure Bucket',
            properties: {
              bucketName: 'secure-bucket',
              versioning: true,
              encryption: true,
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_s3_bucket" "secure_bucket"');
      expect(result).toContain('resource "aws_s3_bucket_versioning" "secure_bucket_versioning"');
      expect(result).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket_encryption"');
    });

    it('should handle S3 bucket without bucket name property', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 's3',
          position: { x: 0, y: 0 },
          data: {
            label: 'Default Bucket',
            properties: {
              versioning: false,
              encryption: false,
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_s3_bucket" "default_bucket"');
      expect(result).not.toContain('bucket = ');
      expect(result).toContain('Name = "Default Bucket"');
    });
  });

  describe('RDS resource block generation', () => {
    it('should generate basic RDS instance block with required properties', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'rds',
          position: { x: 0, y: 0 },
          data: {
            label: 'Production DB',
            properties: {
              engine: 'postgres',
              instanceClass: 'db.t3.micro',
              allocatedStorage: 20,
              dbName: 'mydb',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_db_instance" "production_db"');
      expect(result).toContain('allocated_storage    = 20');
      expect(result).toContain('engine               = "postgres"');
      expect(result).toContain('instance_class       = "db.t3.micro"');
      expect(result).toContain('db_name              = "mydb"');
      expect(result).toContain('Name = "Production DB"');
    });

    it('should generate RDS block with MySQL engine', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'rds',
          position: { x: 0, y: 0 },
          data: {
            label: 'MySQL Database',
            properties: {
              engine: 'mysql',
              instanceClass: 'db.t3.small',
              allocatedStorage: 50,
              dbName: 'appdb',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('engine               = "mysql"');
      expect(result).toContain('allocated_storage    = 50');
      expect(result).toContain('instance_class       = "db.t3.small"');
    });

    it('should include default credentials and skip_final_snapshot', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'rds',
          position: { x: 0, y: 0 },
          data: {
            label: 'Test DB',
            properties: {
              engine: 'postgres',
              instanceClass: 'db.t3.micro',
              allocatedStorage: 20,
              dbName: 'testdb',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('username             = "admin"');
      expect(result).toContain('password             = "changeme123"');
      expect(result).toContain('skip_final_snapshot  = true');
    });

    it('should handle RDS instance with minimal properties', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'rds',
          position: { x: 0, y: 0 },
          data: {
            label: 'Minimal DB',
            properties: {
              engine: 'postgres',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_db_instance" "minimal_db"');
      expect(result).toContain('engine               = "postgres"');
      expect(result).toContain('username             = "admin"');
    });

    it('should sanitize RDS resource names with special characters', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'rds',
          position: { x: 0, y: 0 },
          data: {
            label: 'My-Database 2024!',
            properties: {
              engine: 'mysql',
              instanceClass: 'db.t3.micro',
              allocatedStorage: 20,
              dbName: 'mydb',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_db_instance" "my_database_2024_"');
    });
  });

  describe('HCL string escaping', () => {
    it('should escape special characters in EC2 properties', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Server with "quotes"',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
              keyName: 'key\\with\\backslashes',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('Name = "Server with \\"quotes\\""');
      expect(result).toContain('key_name      = "key\\\\with\\\\backslashes"');
    });

    it('should escape newlines and tabs in S3 bucket names', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 's3',
          position: { x: 0, y: 0 },
          data: {
            label: 'Bucket\nWith\tSpecial',
            properties: {
              bucketName: 'bucket-name',
              versioning: false,
              encryption: false,
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('Name = "Bucket\\nWith\\tSpecial"');
    });

    it('should escape carriage returns in RDS properties', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'rds',
          position: { x: 0, y: 0 },
          data: {
            label: 'Database\rName',
            properties: {
              engine: 'postgres',
              instanceClass: 'db.t3.micro',
              allocatedStorage: 20,
              dbName: 'mydb',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('Name = "Database\\rName"');
    });
  });

  describe('Resource name sanitization', () => {
    it('should handle resource names starting with numbers', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: '123-server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      // Names starting with numbers should be prefixed
      expect(result).toContain('resource "aws_instance" "_123_server"');
    });

    it('should handle resource names with consecutive special characters', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 's3',
          position: { x: 0, y: 0 },
          data: {
            label: 'my---bucket!!!',
            properties: {
              bucketName: 'my-bucket',
              versioning: false,
              encryption: false,
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      // Multiple consecutive underscores should be collapsed
      expect(result).toContain('resource "aws_s3_bucket" "my_bucket_"');
    });

    it('should handle empty or whitespace-only labels', () => {
      const nodes: Node[] = [
        {
          id: 'node-123',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: '   ',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      // Should fall back to node ID when label is empty
      expect(result).toContain('resource "aws_instance"');
    });

    it('should convert uppercase to lowercase in resource names', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'rds',
          position: { x: 0, y: 0 },
          data: {
            label: 'MyDATABASE',
            properties: {
              engine: 'mysql',
              instanceClass: 'db.t3.micro',
              allocatedStorage: 20,
              dbName: 'mydb',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_db_instance" "mydatabase"');
    });
  });

  describe('Edge-to-dependency conversion', () => {
    it('should generate depends_on for EC2 instance with dependencies', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 's3',
          position: { x: 0, y: 0 },
          data: {
            label: 'Data Bucket',
            properties: {
              bucketName: 'my-bucket',
              versioning: false,
              encryption: false,
            },
          },
        },
        {
          id: 'node-2',
          type: 'ec2',
          position: { x: 100, y: 100 },
          data: {
            label: 'Web Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
      ];
      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
        },
      ];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_instance" "web_server"');
      expect(result).toContain('depends_on = [aws_s3.data_bucket]');
    });

    it('should generate depends_on for RDS instance with dependencies', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'App Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
        {
          id: 'node-2',
          type: 'rds',
          position: { x: 100, y: 100 },
          data: {
            label: 'Database',
            properties: {
              engine: 'postgres',
              instanceClass: 'db.t3.micro',
              allocatedStorage: 20,
              dbName: 'mydb',
            },
          },
        },
      ];
      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
        },
      ];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_db_instance" "database"');
      expect(result).toContain('depends_on = [aws_ec2.app_server]');
    });

    it('should generate depends_on with multiple dependencies', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 's3',
          position: { x: 0, y: 0 },
          data: {
            label: 'Bucket A',
            properties: {
              bucketName: 'bucket-a',
              versioning: false,
              encryption: false,
            },
          },
        },
        {
          id: 'node-2',
          type: 'rds',
          position: { x: 50, y: 50 },
          data: {
            label: 'Database',
            properties: {
              engine: 'mysql',
              instanceClass: 'db.t3.micro',
              allocatedStorage: 20,
              dbName: 'mydb',
            },
          },
        },
        {
          id: 'node-3',
          type: 'ec2',
          position: { x: 100, y: 100 },
          data: {
            label: 'Web Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
      ];
      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-3',
        },
        {
          id: 'edge-2',
          source: 'node-2',
          target: 'node-3',
        },
      ];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_instance" "web_server"');
      expect(result).toContain('depends_on = [aws_s3.bucket_a, aws_rds.database]');
    });

    it('should not generate depends_on when there are no dependencies', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Standalone Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_instance" "standalone_server"');
      expect(result).not.toContain('depends_on');
    });

    it('should handle edges pointing to non-existent nodes', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
      ];
      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'non-existent-node',
          target: 'node-1',
        },
      ];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_instance" "server"');
      expect(result).not.toContain('depends_on');
    });

    it('should generate depends_on for S3 bucket with dependencies', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
        {
          id: 'node-2',
          type: 's3',
          position: { x: 100, y: 100 },
          data: {
            label: 'Backup Bucket',
            properties: {
              bucketName: 'backup-bucket',
              versioning: true,
              encryption: true,
            },
          },
        },
      ];
      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
        },
      ];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_s3_bucket" "backup_bucket"');
      expect(result).toContain('depends_on = [aws_ec2.server]');
    });
  });

  describe('Empty and edge cases', () => {
    it('should return comment when no nodes are provided', () => {
      const nodes: Node[] = [];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toBe('# No resources to generate');
    });

    it('should handle unknown node types gracefully', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'unknown' as any,
          position: { x: 0, y: 0 },
          data: {
            label: 'Unknown Resource',
            properties: {},
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      // Unknown types should be skipped, resulting in empty string
      expect(result).toBe('');
    });

    it('should generate multiple resources with proper spacing', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Server 1',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
        {
          id: 'node-2',
          type: 's3',
          position: { x: 100, y: 100 },
          data: {
            label: 'Bucket 1',
            properties: {
              bucketName: 'bucket-1',
              versioning: false,
              encryption: false,
            },
          },
        },
        {
          id: 'node-3',
          type: 'rds',
          position: { x: 200, y: 200 },
          data: {
            label: 'Database 1',
            properties: {
              engine: 'postgres',
              instanceClass: 'db.t3.micro',
              allocatedStorage: 20,
              dbName: 'mydb',
            },
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      // Should contain all three resources
      expect(result).toContain('resource "aws_instance" "server_1"');
      expect(result).toContain('resource "aws_s3_bucket" "bucket_1"');
      expect(result).toContain('resource "aws_db_instance" "database_1"');

      // Should have proper spacing between resources (double newline)
      const resourceBlocks = result.split('\n\n');
      expect(resourceBlocks.length).toBeGreaterThan(1);
    });

    it('should handle nodes with missing or undefined properties', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Minimal Server',
            properties: {},
          },
        },
      ];
      const edges: Edge[] = [];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_instance" "minimal_server"');
      expect(result).toContain('Name = "Minimal Server"');
      // Should not contain property lines for undefined properties
      expect(result).not.toContain('ami           =');
      expect(result).not.toContain('instance_type =');
    });

    it('should handle circular dependencies in edges', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Server A',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
        {
          id: 'node-2',
          type: 'ec2',
          position: { x: 100, y: 100 },
          data: {
            label: 'Server B',
            properties: {
              ami: 'ami-87654321',
              instanceType: 't2.micro',
            },
          },
        },
      ];
      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
        },
        {
          id: 'edge-2',
          source: 'node-2',
          target: 'node-1',
        },
      ];

      const result = generateTerraform(nodes, edges);

      // Both resources should be generated with their respective dependencies
      expect(result).toContain('resource "aws_instance" "server_a"');
      expect(result).toContain('resource "aws_instance" "server_b"');
      // Server A depends on Server B
      expect(result).toContain('depends_on = [aws_ec2.server_b]');
      // Server B depends on Server A
      expect(result).toContain('depends_on = [aws_ec2.server_a]');
    });

    it('should handle self-referencing edges', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'ec2',
          position: { x: 0, y: 0 },
          data: {
            label: 'Self Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't2.micro',
            },
          },
        },
      ];
      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-1',
        },
      ];

      const result = generateTerraform(nodes, edges);

      expect(result).toContain('resource "aws_instance" "self_server"');
      // Self-referencing dependency should be included
      expect(result).toContain('depends_on = [aws_ec2.self_server]');
    });
  });

  describe('Complex scenarios', () => {
    it('should generate complete infrastructure with all resource types and dependencies', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 's3',
          position: { x: 0, y: 0 },
          data: {
            label: 'Storage',
            properties: {
              bucketName: 'app-storage',
              versioning: true,
              encryption: true,
            },
          },
        },
        {
          id: 'node-2',
          type: 'rds',
          position: { x: 100, y: 100 },
          data: {
            label: 'Database',
            properties: {
              engine: 'postgres',
              instanceClass: 'db.t3.small',
              allocatedStorage: 100,
              dbName: 'appdb',
            },
          },
        },
        {
          id: 'node-3',
          type: 'ec2',
          position: { x: 200, y: 200 },
          data: {
            label: 'App Server',
            properties: {
              ami: 'ami-12345678',
              instanceType: 't3.medium',
              keyName: 'app-key',
              securityGroups: ['sg-web', 'sg-app'],
            },
          },
        },
      ];
      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-3',
        },
        {
          id: 'edge-2',
          source: 'node-2',
          target: 'node-3',
        },
      ];

      const result = generateTerraform(nodes, edges);

      // All resources should be present
      expect(result).toContain('resource "aws_s3_bucket" "storage"');
      expect(result).toContain('resource "aws_db_instance" "database"');
      expect(result).toContain('resource "aws_instance" "app_server"');

      // S3 versioning and encryption
      expect(result).toContain('resource "aws_s3_bucket_versioning" "storage_versioning"');
      expect(result).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "storage_encryption"');

      // EC2 should depend on both S3 and RDS
      expect(result).toContain('depends_on = [aws_s3.storage, aws_rds.database]');

      // All properties should be present
      expect(result).toContain('bucket = "app-storage"');
      expect(result).toContain('engine               = "postgres"');
      expect(result).toContain('allocated_storage    = 100');
      expect(result).toContain('instance_type = "t3.medium"');
      expect(result).toContain('security_groups = ["sg-web", "sg-app"]');
    });
  });
});
