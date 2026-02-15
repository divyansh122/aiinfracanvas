/**
 * Property-Based Test: Terraform Syntax Validity (Property 3)
 * 
 * **Validates: Requirements 5.2, 5.5**
 * 
 * Property: Generated Terraform code must be syntactically valid HCL
 * 
 * This test verifies that the Terraform generator produces syntactically
 * valid HashiCorp Configuration Language (HCL) code across various scenarios:
 * - Different resource types (EC2, S3, RDS)
 * - Various property configurations
 * - Different edge/dependency configurations
 * - Empty and complex graphs
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Node, Edge, ResourceTypeId, EC2Properties, S3Properties, RDSProperties } from '@/types/index';
import { generateTerraform } from '@/lib/terraform-generator';

// Arbitraries for generating test data
const resourceTypeArb = fc.constantFrom<ResourceTypeId>('ec2', 's3', 'rds');

const positionArb = fc.record({
  x: fc.integer({ min: -1000, max: 1000 }),
  y: fc.integer({ min: -1000, max: 1000 }),
});

// Generate valid EC2 properties
const ec2PropertiesArb = fc.record({
  instanceType: fc.option(fc.constantFrom('t2.micro', 't2.small', 't3.medium', 'm5.large'), { nil: undefined }),
  ami: fc.option(fc.stringMatching(/^ami-[a-f0-9]{17}$/), { nil: undefined }),
  keyName: fc.option(fc.stringMatching(/^[a-zA-Z0-9_-]{1,255}$/), { nil: undefined }),
  securityGroups: fc.option(fc.array(fc.stringMatching(/^sg-[a-f0-9]{8,17}$/), { minLength: 0, maxLength: 5 }), { nil: undefined }),
}) as fc.Arbitrary<EC2Properties>;

// Generate valid S3 properties
const s3PropertiesArb = fc.record({
  bucketName: fc.option(fc.stringMatching(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/), { nil: undefined }),
  versioning: fc.option(fc.boolean(), { nil: undefined }),
  encryption: fc.option(fc.boolean(), { nil: undefined }),
}) as fc.Arbitrary<S3Properties>;

// Generate valid RDS properties
const rdsPropertiesArb = fc.record({
  engine: fc.option(fc.constantFrom('mysql', 'postgres', 'mariadb', 'oracle-ee', 'sqlserver-ex'), { nil: undefined }),
  instanceClass: fc.option(fc.constantFrom('db.t3.micro', 'db.t3.small', 'db.m5.large'), { nil: undefined }),
  allocatedStorage: fc.option(fc.integer({ min: 20, max: 1000 }), { nil: undefined }),
  dbName: fc.option(fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]{0,62}$/), { nil: undefined }),
}) as fc.Arbitrary<RDSProperties>;

// Generate node with appropriate properties based on type
const nodeArb = fc.record({
  id: fc.uuid(),
  type: resourceTypeArb,
  position: positionArb,
}).chain(base => {
  let propertiesArb;
  switch (base.type) {
    case 'ec2':
      propertiesArb = ec2PropertiesArb;
      break;
    case 's3':
      propertiesArb = s3PropertiesArb;
      break;
    case 'rds':
      propertiesArb = rdsPropertiesArb;
      break;
    default:
      propertiesArb = fc.constant({});
  }
  
  return propertiesArb.map(properties => ({
    ...base,
    data: {
      label: `${base.type}-resource-${base.id.substring(0, 8)}`,
      properties,
    },
  }));
}) as fc.Arbitrary<Node>;

// Generate array of nodes with unique IDs
const uniqueNodesArb = (minLength: number, maxLength: number) =>
  fc.uniqueArray(nodeArb, {
    minLength,
    maxLength,
    selector: (node) => node.id,
  });

// Generate edges between existing nodes
function edgesFromNodesArb(nodes: Node[]): fc.Arbitrary<Edge[]> {
  if (nodes.length < 2) {
    return fc.constant([]);
  }
  
  return fc.array(
    fc.record({
      id: fc.uuid(),
      source: fc.constantFrom(...nodes.map(n => n.id)),
      target: fc.constantFrom(...nodes.map(n => n.id)),
    }),
    { minLength: 0, maxLength: Math.min(nodes.length * 2, 20) }
  );
}

// HCL syntax validation helpers

/**
 * Checks if the generated code has balanced braces
 */
function hasBalancedBraces(code: string): boolean {
  let count = 0;
  for (const char of code) {
    if (char === '{') count++;
    if (char === '}') count--;
    if (count < 0) return false;
  }
  return count === 0;
}

/**
 * Checks if resource blocks follow the correct syntax pattern
 */
function hasValidResourceBlocks(code: string): boolean {
  // Skip empty or comment-only code
  if (code.trim() === '' || code.trim().startsWith('#')) {
    return true;
  }
  
  // Resource blocks should match: resource "type" "name" {
  const resourcePattern = /resource\s+"[a-z_]+"\s+"[a-z0-9_]+"\s+\{/g;
  const matches = code.match(resourcePattern);
  
  // If there are no resource blocks, code should be a comment
  if (!matches) {
    return code.trim().startsWith('#');
  }
  
  return matches.length > 0;
}

/**
 * Checks if strings are properly quoted
 */
function hasProperlyQuotedStrings(code: string): boolean {
  // Remove comments
  const codeWithoutComments = code.replace(/#[^\n]*/g, '');
  
  // Check for unescaped quotes in string values
  // This is a simplified check - looks for patterns like = "value"
  const stringValuePattern = /=\s*"([^"\\]*(\\.[^"\\]*)*)"/g;
  const matches = codeWithoutComments.match(stringValuePattern);
  
  if (!matches) {
    // No string values is valid (could be all numeric or boolean)
    return true;
  }
  
  // Check that each match has balanced quotes
  return matches.every(match => {
    const quoteCount = (match.match(/"/g) || []).length;
    return quoteCount === 2; // Should have exactly 2 quotes (opening and closing)
  });
}

/**
 * Checks if the code has valid HCL attribute syntax
 */
function hasValidAttributeSyntax(code: string): boolean {
  // Split into lines but keep all lines for context
  const lines = code.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }
    
    // Skip lines that are just braces or resource declarations
    if (trimmed === '{' || trimmed === '}' || trimmed.startsWith('resource ')) {
      continue;
    }
    
    // Attributes should have format: key = value or key {
    // Also allow closing brackets ] for arrays/lists
    if (!trimmed.match(/^[a-z_][a-z0-9_]*\s*(=|{)/) && !trimmed.match(/^\[/) && !trimmed.match(/^}/) && trimmed !== ']') {
      return false;
    }
  }
  
  return true;
}

/**
 * Checks if resource names are valid (alphanumeric and underscores)
 */
function hasValidResourceNames(code: string): boolean {
  const resourcePattern = /resource\s+"[a-z_]+"\s+"([a-z0-9_]+)"/g;
  const matches = [...code.matchAll(resourcePattern)];
  
  return matches.every(match => {
    const name = match[1];
    // Resource names should be alphanumeric with underscores, not starting with a digit
    return /^[a-z_][a-z0-9_]*$/.test(name);
  });
}

/**
 * Checks if depends_on syntax is valid
 */
function hasValidDependsOn(code: string): boolean {
  const dependsOnPattern = /depends_on\s*=\s*\[(.*?)\]/gs;
  const matches = [...code.matchAll(dependsOnPattern)];
  
  for (const match of matches) {
    const content = match[1];
    // Each dependency should be in format: aws_type.name
    const deps = content.split(',').map(d => d.trim()).filter(d => d !== '');
    
    for (const dep of deps) {
      if (!dep.match(/^aws_[a-z_]+\.[a-z0-9_]+$/)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Comprehensive HCL syntax validation
 */
function isValidHCL(code: string): boolean {
  return (
    hasBalancedBraces(code) &&
    hasValidResourceBlocks(code) &&
    hasProperlyQuotedStrings(code) &&
    hasValidAttributeSyntax(code) &&
    hasValidResourceNames(code) &&
    hasValidDependsOn(code)
  );
}

describe('Property 3: Terraform Syntax Validity', () => {
  it('should generate syntactically valid HCL for any combination of nodes', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(0, 20),
        (nodes) => {
          // Given: A canvas with various nodes
          const edges: Edge[] = [];
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, edges);
          
          // Then: The generated code must be syntactically valid HCL
          expect(isValidHCL(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid HCL with edges and dependencies', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(2, 15).chain(nodes => 
          edgesFromNodesArb(nodes).map(edges => ({ nodes, edges }))
        ),
        ({ nodes, edges }) => {
          // Given: A canvas with nodes and edges
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, edges);
          
          // Then: The generated code must be syntactically valid HCL
          expect(isValidHCL(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid HCL for empty canvas', () => {
    // Given: An empty canvas
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // When: We generate Terraform code
    const terraformCode = generateTerraform(nodes, edges);
    
    // Then: The generated code should be valid (even if just a comment)
    expect(isValidHCL(terraformCode)).toBe(true);
  });

  it('should generate valid HCL for single node of each type', () => {
    fc.assert(
      fc.property(
        resourceTypeArb,
        (resourceType) => {
          // Given: A single node of a specific type
          const node: Node = {
            id: 'test-node-1',
            type: resourceType,
            position: { x: 0, y: 0 },
            data: {
              label: `test-${resourceType}`,
              properties: {},
            },
          };
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform([node], []);
          
          // Then: The generated code must be syntactically valid HCL
          expect(isValidHCL(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain balanced braces in all generated code', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(1, 20),
        (nodes) => {
          // Given: A canvas with nodes
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, []);
          
          // Then: All braces must be balanced
          expect(hasBalancedBraces(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid resource block syntax', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(1, 15),
        (nodes) => {
          // Given: A canvas with nodes
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, []);
          
          // Then: All resource blocks must follow correct syntax
          expect(hasValidResourceBlocks(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should properly quote all string values', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(1, 15),
        (nodes) => {
          // Given: A canvas with nodes
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, []);
          
          // Then: All string values must be properly quoted
          expect(hasProperlyQuotedStrings(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid resource names', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(1, 15),
        (nodes) => {
          // Given: A canvas with nodes
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, []);
          
          // Then: All resource names must be valid
          expect(hasValidResourceNames(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid depends_on syntax when edges exist', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(2, 10).chain(nodes => 
          edgesFromNodesArb(nodes).map(edges => ({ nodes, edges }))
        ),
        ({ nodes, edges }) => {
          // Given: A canvas with nodes and edges
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, edges);
          
          // Then: All depends_on blocks must have valid syntax
          expect(hasValidDependsOn(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle special characters in labels correctly', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.record({
            id: fc.uuid(),
            type: resourceTypeArb,
            position: positionArb,
            data: fc.record({
              label: fc.string({ minLength: 1, maxLength: 50 }),
              properties: fc.constant({}),
            }),
          }),
          { minLength: 1, maxLength: 10, selector: (node) => node.id }
        ),
        (nodes) => {
          // Given: Nodes with labels containing special characters
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes as Node[], []);
          
          // Then: The generated code must still be syntactically valid
          expect(isValidHCL(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid HCL for complex dependency graphs', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(5, 15),
        (nodes) => {
          // Given: A complex graph with multiple dependencies
          const edges: Edge[] = [];
          
          // Create a chain of dependencies
          for (let i = 0; i < nodes.length - 1; i++) {
            edges.push({
              id: `edge-${i}`,
              source: nodes[i].id,
              target: nodes[i + 1].id,
            });
          }
          
          // Add some cross-dependencies
          if (nodes.length > 3) {
            edges.push({
              id: 'edge-cross-1',
              source: nodes[0].id,
              target: nodes[nodes.length - 1].id,
            });
          }
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, edges);
          
          // Then: The generated code must be syntactically valid HCL
          expect(isValidHCL(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should generate valid HCL for S3 buckets with versioning and encryption', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (versioning, encryption) => {
          // Given: An S3 node with versioning and encryption options
          const node: Node = {
            id: 'test-s3',
            type: 's3',
            position: { x: 0, y: 0 },
            data: {
              label: 'test-bucket',
              properties: {
                bucketName: 'my-test-bucket',
                versioning,
                encryption,
              },
            },
          };
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform([node], []);
          
          // Then: The generated code must be syntactically valid HCL
          expect(isValidHCL(terraformCode)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
