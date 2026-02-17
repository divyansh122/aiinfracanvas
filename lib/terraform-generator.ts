// Terraform code generator utility
import { Node, Edge, EC2Properties, S3Properties, RDSProperties } from '@/types';

// Define property types for new resources
interface LambdaProperties {
  functionName?: string;
  runtime?: string;
  handler?: string;
  memory?: number;
}

interface VPCProperties {
  cidrBlock?: string;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
}

interface ALBProperties {
  name?: string;
  scheme?: string;
  ipAddressType?: string;
}

interface APIGatewayProperties {
  name?: string;
  protocolType?: string;
  corsEnabled?: boolean;
}

interface DynamoDBProperties {
  tableName?: string;
  billingMode?: string;
  hashKey?: string;
}

interface WAFProperties {
  name?: string;
  scope?: string;
  defaultAction?: string;
}

// Cache for sanitized resource names to avoid repeated computation
const sanitizedNameCache = new Map<string, string>();

// Cache for dependency lookups
const dependencyCache = new Map<string, string[]>();

/**
 * Clears all caches (useful for testing or when memory optimization is needed)
 */
export function clearGeneratorCaches(): void {
  sanitizedNameCache.clear();
  dependencyCache.clear();
}

/**
 * Generates the Terraform configuration block with required providers
 * @returns Terraform block as a string
 */
function generateTerraformBlock(): string {
  const lines: string[] = [];
  
  lines.push('terraform {');
  lines.push('  required_version = ">= 1.5.0"');
  lines.push('');
  lines.push('  required_providers {');
  lines.push('    aws = {');
  lines.push('      source  = "hashicorp/aws"');
  lines.push('      version = "~> 5.0"');
  lines.push('    }');
  lines.push('  }');
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Generates Terraform HCL code from canvas nodes and edges
 * @param nodes - Array of nodes representing AWS resources
 * @param edges - Array of edges representing dependencies between resources
 * @returns Formatted Terraform HCL code as a string
 * @throws Error if code generation fails critically
 */
export function generateTerraform(nodes: Node[], edges: Edge[]): string {
  try {
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      throw new Error('Invalid input: nodes and edges must be arrays');
    }

    if (nodes.length === 0) {
      return '# No resources to generate';
    }

    // Clear caches for fresh generation
    dependencyCache.clear();

    const blocks: string[] = [];
    
    // Add Terraform configuration block
    blocks.push(generateTerraformBlock());
    blocks.push('');

    const resourceBlocks: string[] = [];

    // Generate resource blocks for each node
    for (const node of nodes) {
      if (!node || !node.id || !node.type) {
        console.warn('Skipping invalid node:', node);
        continue;
      }

      try {
        const block = generateResourceBlock(node, edges, nodes);
        if (block) {
          resourceBlocks.push(block);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to generate block for node ${node.id}:`, errorMessage);
        // Continue with other nodes instead of failing completely
      }
    }

    if (resourceBlocks.length === 0) {
      return '# No valid resources to generate';
    }

    // Combine terraform block with resource blocks
    blocks.push(...resourceBlocks);

    // Combine all blocks with proper spacing
    return blocks.join('\n\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Terraform generation failed: ${errorMessage}`);
  }
}

/**
 * Generates a single Terraform resource block for a node
 * @param node - The node to generate a resource block for
 * @param edges - All edges to determine dependencies
 * @param nodes - All nodes to resolve dependency names
 * @returns Terraform resource block as a string or empty string for unsupported types
 * @throws Error if node data is invalid
 */
function generateResourceBlock(node: Node, edges: Edge[], nodes: Node[]): string {
  if (!node.data || !node.data.label) {
    throw new Error(`Node ${node.id} is missing required data`);
  }

  const resourceName = sanitizeResourceName(node.data.label || node.id);
  
  switch (node.type) {
    case 'ec2':
      return generateEC2Block(node, resourceName, edges, nodes);
    case 'lambda':
      return generateLambdaBlock(node, resourceName, edges, nodes);
    case 'vpc':
      return generateVPCBlock(node, resourceName, edges, nodes);
    case 'alb':
      return generateALBBlock(node, resourceName, edges, nodes);
    case 'apigateway':
      return generateAPIGatewayBlock(node, resourceName, edges, nodes);
    case 's3':
      return generateS3Block(node, resourceName, edges, nodes);
    case 'rds':
      return generateRDSBlock(node, resourceName, edges, nodes);
    case 'dynamodb':
      return generateDynamoDBBlock(node, resourceName, edges, nodes);
    case 'waf':
      return generateWAFBlock(node, resourceName, edges, nodes);
    default:
      // Return empty string for unknown types to maintain backward compatibility
      return '';
  }
}

/**
 * Sanitizes a resource name to be valid in Terraform
 * Uses caching to avoid repeated computation for the same names
 * @param name - The original name
 * @returns Sanitized name (alphanumeric and underscores only)
 */
function sanitizeResourceName(name: string): string {
  // Check cache first
  const cached = sanitizedNameCache.get(name);
  if (cached !== undefined) {
    return cached;
  }

  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]/, '_')
    .replace(/_+/g, '_');

  // If sanitization results in empty string, return a placeholder
  const result = sanitized || 'resource';
  
  // Cache the result
  sanitizedNameCache.set(name, result);
  
  return result;
}

/**
 * Escapes special characters in HCL strings
 * @param str - The string to escape
 * @returns Escaped string safe for HCL
 */
function escapeHCLString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t');   // Escape tabs
}

/**
 * Finds dependencies for a given node based on edges
 * Uses caching to avoid repeated lookups
 * @param nodeId - The node ID to find dependencies for
 * @param edges - All edges in the canvas
 * @returns Array of node IDs that this node depends on
 */
function findDependencies(nodeId: string, edges: Edge[]): string[] {
  // Check cache first
  const cached = dependencyCache.get(nodeId);
  if (cached !== undefined) {
    return cached;
  }

  const dependencies = edges
    .filter(edge => edge.target === nodeId)
    .map(edge => edge.source);
  
  // Cache the result
  dependencyCache.set(nodeId, dependencies);
  
  return dependencies;
}

/**
 * Generates depends_on block if there are dependencies
 * @param nodeId - The node ID
 * @param edges - All edges
 * @param nodes - All nodes to get resource names
 * @returns depends_on block string or empty string
 */
function generateDependsOn(nodeId: string, edges: Edge[], nodes: Node[]): string {
  const dependencies = findDependencies(nodeId, edges);
  
  if (dependencies.length === 0) {
    return '';
  }

  const dependencyRefs = dependencies.map(depId => {
    const depNode = nodes.find(n => n.id === depId);
    if (!depNode) return null;
    
    const depResourceName = sanitizeResourceName(depNode.data.label || depNode.id);
    // Map node type to actual Terraform resource type
    const terraformType = depNode.type === 'ec2' ? 'aws_instance' 
                        : depNode.type === 'lambda' ? 'aws_lambda_function'
                        : depNode.type === 'vpc' ? 'aws_vpc'
                        : depNode.type === 'alb' ? 'aws_lb'
                        : depNode.type === 'apigateway' ? 'aws_apigatewayv2_api'
                        : depNode.type === 's3' ? 'aws_s3_bucket'
                        : depNode.type === 'rds' ? 'aws_db_instance'
                        : depNode.type === 'dynamodb' ? 'aws_dynamodb_table'
                        : depNode.type === 'waf' ? 'aws_wafv2_web_acl'
                        : 'aws_resource';
    return `${terraformType}.${depResourceName}`;
  }).filter(Boolean);

  if (dependencyRefs.length === 0) {
    return '';
  }

  return `  depends_on = [${dependencyRefs.join(', ')}]\n`;
}

/**
 * Generates Terraform block for EC2 instance
 */
function generateEC2Block(node: Node, resourceName: string, edges: Edge[], nodes: Node[]): string {
  const props = node.data.properties as EC2Properties;
  
  const lines: string[] = [];
  lines.push(`resource "aws_instance" "${resourceName}" {`);
  
  // Add properties with proper alignment
  if (props.ami) {
    lines.push(`  ami           = "${escapeHCLString(props.ami)}"`);
  }
  
  if (props.instanceType) {
    lines.push(`  instance_type = "${escapeHCLString(props.instanceType)}"`);
  }
  
  if (props.keyName) {
    lines.push(`  key_name      = "${escapeHCLString(props.keyName)}"`);
  }
  
  if (props.securityGroups && Array.isArray(props.securityGroups) && props.securityGroups.length > 0) {
    const sgList = props.securityGroups.map((sg: string) => `"${escapeHCLString(sg)}"`).join(', ');
    lines.push(`  security_groups = [${sgList}]`);
  }
  
  // Add tags block
  lines.push('');
  lines.push('  tags = {');
  lines.push(`    Name = "${escapeHCLString(node.data.label || resourceName)}"`);
  lines.push('  }');
  
  // Add depends_on if there are dependencies
  const dependsOn = generateDependsOn(node.id, edges, nodes);
  if (dependsOn) {
    lines.push('');
    lines.push(dependsOn.trim());
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Generates Terraform block for S3 bucket
 */
function generateS3Block(node: Node, resourceName: string, edges: Edge[], nodes: Node[]): string {
  const props = node.data.properties as S3Properties;
  
  const lines: string[] = [];
  lines.push(`resource "aws_s3_bucket" "${resourceName}" {`);
  
  if (props.bucketName) {
    lines.push(`  bucket = "${escapeHCLString(props.bucketName)}"`);
  }
  
  // Add tags block
  lines.push('');
  lines.push('  tags = {');
  lines.push(`    Name = "${escapeHCLString(node.data.label || resourceName)}"`);
  lines.push('  }');
  
  // Add depends_on if there are dependencies
  const dependsOn = generateDependsOn(node.id, edges, nodes);
  if (dependsOn) {
    lines.push('');
    lines.push(dependsOn.trim());
  }
  
  lines.push('}');
  
  let block = lines.join('\n');
  
  // Add versioning configuration if enabled
  if (props.versioning) {
    const versioningLines: string[] = [];
    versioningLines.push('');
    versioningLines.push('');
    versioningLines.push(`resource "aws_s3_bucket_versioning" "${resourceName}_versioning" {`);
    versioningLines.push(`  bucket = aws_s3_bucket.${resourceName}.id`);
    versioningLines.push('');
    versioningLines.push('  versioning_configuration {');
    versioningLines.push('    status = "Enabled"');
    versioningLines.push('  }');
    versioningLines.push('}');
    block += versioningLines.join('\n');
  }
  
  // Add encryption configuration if enabled
  if (props.encryption) {
    const encryptionLines: string[] = [];
    encryptionLines.push('');
    encryptionLines.push('');
    encryptionLines.push(`resource "aws_s3_bucket_server_side_encryption_configuration" "${resourceName}_encryption" {`);
    encryptionLines.push(`  bucket = aws_s3_bucket.${resourceName}.id`);
    encryptionLines.push('');
    encryptionLines.push('  rule {');
    encryptionLines.push('    apply_server_side_encryption_by_default {');
    encryptionLines.push('      sse_algorithm = "AES256"');
    encryptionLines.push('    }');
    encryptionLines.push('  }');
    encryptionLines.push('}');
    block += encryptionLines.join('\n');
  }
  
  return block;
}

/**
 * Generates Terraform block for RDS database
 */
function generateRDSBlock(node: Node, resourceName: string, edges: Edge[], nodes: Node[]): string {
  const props = node.data.properties as RDSProperties;
  
  const lines: string[] = [];
  lines.push(`resource "aws_db_instance" "${resourceName}" {`);
  
  // Add properties with proper alignment
  if (props.allocatedStorage) {
    lines.push(`  allocated_storage    = ${props.allocatedStorage}`);
  }
  
  if (props.engine) {
    lines.push(`  engine               = "${escapeHCLString(props.engine)}"`);
  }
  
  if (props.instanceClass) {
    lines.push(`  instance_class       = "${escapeHCLString(props.instanceClass)}"`);
  }
  
  if (props.dbName) {
    lines.push(`  db_name              = "${escapeHCLString(props.dbName)}"`);
  }
  
  lines.push('  username             = "admin"');
  lines.push('  password             = "changeme123"');
  lines.push('  skip_final_snapshot  = true');
  
  // Add tags block
  lines.push('');
  lines.push('  tags = {');
  lines.push(`    Name = "${escapeHCLString(node.data.label || resourceName)}"`);
  lines.push('  }');
  
  // Add depends_on if there are dependencies
  const dependsOn = generateDependsOn(node.id, edges, nodes);
  if (dependsOn) {
    lines.push('');
    lines.push(dependsOn.trim());
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Generates Terraform block for Lambda function
 */
function generateLambdaBlock(node: Node, resourceName: string, edges: Edge[], nodes: Node[]): string {
  const props = node.data.properties as LambdaProperties;
  
  const lines: string[] = [];
  lines.push(`resource "aws_lambda_function" "${resourceName}" {`);
  
  if (props.functionName) {
    lines.push(`  function_name = "${escapeHCLString(props.functionName)}"`);
  }
  
  if (props.runtime) {
    lines.push(`  runtime       = "${escapeHCLString(props.runtime)}"`);
  }
  
  if (props.handler) {
    lines.push(`  handler       = "${escapeHCLString(props.handler)}"`);
  }
  
  lines.push('  role          = aws_iam_role.lambda_role.arn');
  lines.push('  filename      = "lambda_function.zip"');
  
  if (props.memory) {
    lines.push(`  memory_size   = ${props.memory}`);
  }
  
  lines.push('');
  lines.push('  tags = {');
  lines.push(`    Name = "${escapeHCLString(node.data.label || resourceName)}"`);
  lines.push('  }');
  
  const dependsOn = generateDependsOn(node.id, edges, nodes);
  if (dependsOn) {
    lines.push('');
    lines.push(dependsOn.trim());
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Generates Terraform block for VPC
 */
function generateVPCBlock(node: Node, resourceName: string, edges: Edge[], nodes: Node[]): string {
  const props = node.data.properties as VPCProperties;
  
  const lines: string[] = [];
  lines.push(`resource "aws_vpc" "${resourceName}" {`);
  
  if (props.cidrBlock) {
    lines.push(`  cidr_block           = "${escapeHCLString(props.cidrBlock)}"`);
  }
  
  if (props.enableDnsHostnames !== undefined) {
    lines.push(`  enable_dns_hostnames = ${props.enableDnsHostnames}`);
  }
  
  if (props.enableDnsSupport !== undefined) {
    lines.push(`  enable_dns_support   = ${props.enableDnsSupport}`);
  }
  
  lines.push('');
  lines.push('  tags = {');
  lines.push(`    Name = "${escapeHCLString(node.data.label || resourceName)}"`);
  lines.push('  }');
  
  const dependsOn = generateDependsOn(node.id, edges, nodes);
  if (dependsOn) {
    lines.push('');
    lines.push(dependsOn.trim());
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Generates Terraform block for Application Load Balancer
 */
function generateALBBlock(node: Node, resourceName: string, edges: Edge[], nodes: Node[]): string {
  const props = node.data.properties as ALBProperties;
  
  const lines: string[] = [];
  lines.push(`resource "aws_lb" "${resourceName}" {`);
  
  if (props.name) {
    lines.push(`  name               = "${escapeHCLString(props.name)}"`);
  }
  
  lines.push('  load_balancer_type = "application"');
  
  if (props.scheme) {
    lines.push(`  internal           = ${props.scheme === 'internal'}`);
  }
  
  if (props.ipAddressType) {
    lines.push(`  ip_address_type    = "${escapeHCLString(props.ipAddressType)}"`);
  }
  
  lines.push('  subnets            = []  # Add subnet IDs');
  
  lines.push('');
  lines.push('  tags = {');
  lines.push(`    Name = "${escapeHCLString(node.data.label || resourceName)}"`);
  lines.push('  }');
  
  const dependsOn = generateDependsOn(node.id, edges, nodes);
  if (dependsOn) {
    lines.push('');
    lines.push(dependsOn.trim());
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Generates Terraform block for API Gateway
 */
function generateAPIGatewayBlock(node: Node, resourceName: string, edges: Edge[], nodes: Node[]): string {
  const props = node.data.properties as APIGatewayProperties;
  
  const lines: string[] = [];
  lines.push(`resource "aws_apigatewayv2_api" "${resourceName}" {`);
  
  if (props.name) {
    lines.push(`  name          = "${escapeHCLString(props.name)}"`);
  }
  
  if (props.protocolType) {
    lines.push(`  protocol_type = "${escapeHCLString(props.protocolType)}"`);
  }
  
  if (props.corsEnabled) {
    lines.push('');
    lines.push('  cors_configuration {');
    lines.push('    allow_origins = ["*"]');
    lines.push('    allow_methods = ["*"]');
    lines.push('    allow_headers = ["*"]');
    lines.push('  }');
  }
  
  lines.push('');
  lines.push('  tags = {');
  lines.push(`    Name = "${escapeHCLString(node.data.label || resourceName)}"`);
  lines.push('  }');
  
  const dependsOn = generateDependsOn(node.id, edges, nodes);
  if (dependsOn) {
    lines.push('');
    lines.push(dependsOn.trim());
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Generates Terraform block for DynamoDB table
 */
function generateDynamoDBBlock(node: Node, resourceName: string, edges: Edge[], nodes: Node[]): string {
  const props = node.data.properties as DynamoDBProperties;
  
  const lines: string[] = [];
  lines.push(`resource "aws_dynamodb_table" "${resourceName}" {`);
  
  if (props.tableName) {
    lines.push(`  name         = "${escapeHCLString(props.tableName)}"`);
  }
  
  if (props.billingMode) {
    lines.push(`  billing_mode = "${escapeHCLString(props.billingMode)}"`);
  }
  
  if (props.hashKey) {
    lines.push(`  hash_key     = "${escapeHCLString(props.hashKey)}"`);
  }
  
  lines.push('');
  lines.push('  attribute {');
  lines.push(`    name = "${escapeHCLString(props.hashKey || 'id')}"`);
  lines.push('    type = "S"');
  lines.push('  }');
  
  lines.push('');
  lines.push('  tags = {');
  lines.push(`    Name = "${escapeHCLString(node.data.label || resourceName)}"`);
  lines.push('  }');
  
  const dependsOn = generateDependsOn(node.id, edges, nodes);
  if (dependsOn) {
    lines.push('');
    lines.push(dependsOn.trim());
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Generates Terraform block for WAF
 */
function generateWAFBlock(node: Node, resourceName: string, edges: Edge[], nodes: Node[]): string {
  const props = node.data.properties as WAFProperties;
  
  const lines: string[] = [];
  lines.push(`resource "aws_wafv2_web_acl" "${resourceName}" {`);
  
  if (props.name) {
    lines.push(`  name  = "${escapeHCLString(props.name)}"`);
  }
  
  if (props.scope) {
    lines.push(`  scope = "${escapeHCLString(props.scope)}"`);
  }
  
  lines.push('');
  lines.push('  default_action {');
  if (props.defaultAction === 'BLOCK') {
    lines.push('    block {}');
  } else {
    lines.push('    allow {}');
  }
  lines.push('  }');
  
  lines.push('');
  lines.push('  visibility_config {');
  lines.push('    cloudwatch_metrics_enabled = true');
  lines.push('    metric_name                = "waf-metric"');
  lines.push('    sampled_requests_enabled   = true');
  lines.push('  }');
  
  lines.push('');
  lines.push('  tags = {');
  lines.push(`    Name = "${escapeHCLString(node.data.label || resourceName)}"`);
  lines.push('  }');
  
  const dependsOn = generateDependsOn(node.id, edges, nodes);
  if (dependsOn) {
    lines.push('');
    lines.push(dependsOn.trim());
  }
  
  lines.push('}');
  
  return lines.join('\n');
}
