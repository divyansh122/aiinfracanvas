// Terraform code generator utility
import { Node, Edge, EC2Properties, S3Properties, RDSProperties } from '@/types';

/**
 * Generates Terraform HCL code from canvas nodes and edges
 * @param nodes - Array of nodes representing AWS resources
 * @param edges - Array of edges representing dependencies between resources
 * @returns Formatted Terraform HCL code as a string
 */
export function generateTerraform(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) {
    return '# No resources to generate';
  }

  const resourceBlocks: string[] = [];

  // Generate resource blocks for each node
  for (const node of nodes) {
    const block = generateResourceBlock(node, edges, nodes);
    if (block) {
      resourceBlocks.push(block);
    }
  }

  // Combine all blocks with proper spacing
  return resourceBlocks.join('\n\n');
}

/**
 * Generates a single Terraform resource block for a node
 * @param node - The node to generate a resource block for
 * @param edges - All edges to determine dependencies
 * @param nodes - All nodes to resolve dependency names
 * @returns Terraform resource block as a string
 */
function generateResourceBlock(node: Node, edges: Edge[], nodes: Node[]): string {
  const resourceName = sanitizeResourceName(node.data.label || node.id);
  
  switch (node.type) {
    case 'ec2':
      return generateEC2Block(node, resourceName, edges, nodes);
    case 's3':
      return generateS3Block(node, resourceName, edges, nodes);
    case 'rds':
      return generateRDSBlock(node, resourceName, edges, nodes);
    default:
      return '';
  }
}

/**
 * Sanitizes a resource name to be valid in Terraform
 * @param name - The original name
 * @returns Sanitized name (alphanumeric and underscores only)
 */
function sanitizeResourceName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]/, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  // If sanitization results in empty string, return a placeholder
  return sanitized || 'resource';
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
 * @param nodeId - The node ID to find dependencies for
 * @param edges - All edges in the canvas
 * @returns Array of node IDs that this node depends on
 */
function findDependencies(nodeId: string, edges: Edge[]): string[] {
  return edges
    .filter(edge => edge.target === nodeId)
    .map(edge => edge.source);
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
                        : depNode.type === 's3' ? 'aws_s3_bucket'
                        : 'aws_db_instance';
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
