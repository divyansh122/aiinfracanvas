/**
 * Property-Based Test: Code Generation Completeness (Property 5)
 * 
 * **Validates: Requirements 5.5, 5.6**
 * 
 * Property: All nodes and edges on canvas must be represented in generated code
 * 
 * This test verifies that the Terraform generator produces complete code that
 * includes all resources and their relationships from the canvas:
 * - Every node appears as a resource block in the generated code
 * - Every edge is represented as a dependency relationship
 * - No nodes or edges are silently dropped during generation
 * - Resource names are correctly derived from node labels/IDs
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
      // Use full UUID to ensure unique labels
      label: `${base.type}-resource-${base.id}`,
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
    }).filter(edge => edge.source !== edge.target), // Prevent self-loops
    { minLength: 0, maxLength: Math.min(nodes.length * 2, 20) }
  );
}

// Helper functions for completeness checking

/**
 * Sanitizes a resource name to match Terraform generator logic
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
 * Extracts all resource names from generated Terraform code
 */
function extractResourceNames(code: string): Set<string> {
  const resourcePattern = /resource\s+"([^"]+)"\s+"([^"]+)"/g;
  const names = new Set<string>();
  
  let match;
  while ((match = resourcePattern.exec(code)) !== null) {
    names.add(match[2]); // Resource name is the second capture group
  }
  
  return names;
}

/**
 * Extracts all resource types from generated Terraform code
 */
function extractResourceTypes(code: string): Map<string, string> {
  const resourcePattern = /resource\s+"([^"]+)"\s+"([^"]+)"/g;
  const typeMap = new Map<string, string>();
  
  let match;
  while ((match = resourcePattern.exec(code)) !== null) {
    typeMap.set(match[2], match[1]); // Map resource name to type
  }
  
  return typeMap;
}

/**
 * Extracts all depends_on references from generated Terraform code
 */
function extractDependencies(code: string): Map<string, string[]> {
  const depsMap = new Map<string, string[]>();
  
  // Split code into lines and process
  const lines = code.split('\n');
  let currentResource: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Match resource declaration
    const resourceMatch = trimmed.match(/^resource\s+"[^"]+"\s+"([^"]+)"/);
    if (resourceMatch) {
      currentResource = resourceMatch[1];
      continue;
    }
    
    // Match depends_on line (can be at any indentation level)
    if (currentResource && trimmed.startsWith('depends_on')) {
      // Extract the dependencies from this line and potentially next lines
      let depsString = trimmed;
      let j = i;
      
      // Keep reading lines until we find the closing bracket
      while (j < lines.length && !depsString.includes(']')) {
        j++;
        if (j < lines.length) {
          depsString += ' ' + lines[j].trim();
        }
      }
      
      // Extract content between [ and ]
      const match = depsString.match(/depends_on\s*=\s*\[([^\]]*)\]/);
      if (match) {
        const deps = match[1]
          .split(',')
          .map(dep => dep.trim())
          .filter(dep => dep.length > 0)
          .map(dep => {
            // Extract resource name from reference like "aws_instance.my_ec2"
            const parts = dep.split('.');
            return parts.length > 1 ? parts[1] : dep;
          });
        
        if (deps.length > 0) {
          depsMap.set(currentResource, deps);
        }
      }
      
      currentResource = null; // Reset after processing depends_on
    }
    
    // Reset current resource when we hit a closing brace at the start of a line
    if (trimmed === '}') {
      currentResource = null;
    }
  }
  
  return depsMap;
}

/**
 * Checks if all nodes are represented in the generated code
 */
function allNodesRepresented(nodes: Node[], code: string): boolean {
  if (nodes.length === 0) {
    return true; // Empty canvas is valid
  }
  
  const resourceNames = extractResourceNames(code);
  const resourceTypes = extractResourceTypes(code);
  
  for (const node of nodes) {
    const expectedName = sanitizeResourceName(node.data.label || node.id);
    
    // Check if resource name exists
    if (!resourceNames.has(expectedName)) {
      return false;
    }
    
    // Check if resource type matches
    const expectedType = `aws_${node.type === 'ec2' ? 'instance' : node.type === 's3' ? 's3_bucket' : 'db_instance'}`;
    const actualType = resourceTypes.get(expectedName);
    
    if (actualType !== expectedType) {
      return false;
    }
  }
  
  return true;
}

/**
 * Checks if all edges are represented as dependencies in the generated code
 */
function allEdgesRepresented(nodes: Node[], edges: Edge[], code: string): boolean {
  if (edges.length === 0) {
    return true; // No edges to represent
  }
  
  const dependencies = extractDependencies(code);
  
  // Build a map of node ID to sanitized resource name
  const nodeIdToName = new Map<string, string>();
  for (const node of nodes) {
    const name = sanitizeResourceName(node.data.label || node.id);
    nodeIdToName.set(node.id, name);
  }
  
  // Check each edge
  for (const edge of edges) {
    const targetName = nodeIdToName.get(edge.target);
    const sourceName = nodeIdToName.get(edge.source);
    
    if (!targetName || !sourceName) {
      continue; // Skip edges with invalid node references
    }
    
    // Check if the target resource has the source in its depends_on
    const targetDeps = dependencies.get(targetName) || [];
    
    if (!targetDeps.includes(sourceName)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Counts the number of resource blocks in the generated code
 */
function countResourceBlocks(code: string): number {
  const resourcePattern = /resource\s+"[^"]+"\s+"[^"]+"\s*\{/g;
  const matches = code.match(resourcePattern);
  return matches ? matches.length : 0;
}

describe('Property 5: Code Generation Completeness', () => {
  it('should include all nodes in generated Terraform code', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(1, 20),
        (nodes) => {
          // Given: A canvas with various nodes
          const edges: Edge[] = [];
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, edges);
          
          // Then: All nodes must be represented in the generated code
          expect(allNodesRepresented(nodes, terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include all edges as dependencies in generated code', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(2, 15).chain(nodes => 
          edgesFromNodesArb(nodes).map(edges => ({ nodes, edges }))
        ),
        ({ nodes, edges }) => {
          // Given: A canvas with nodes and edges
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, edges);
          
          // Then: All edges must be represented as dependencies
          expect(allEdgesRepresented(nodes, edges, terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate at least one resource block per node', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(1, 20),
        (nodes) => {
          // Given: A canvas with nodes
          const edges: Edge[] = [];
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, edges);
          
          // Then: The number of resource blocks should be at least the number of nodes
          // (S3 nodes with versioning/encryption may generate additional blocks)
          const resourceCount = countResourceBlocks(terraformCode);
          expect(resourceCount).toBeGreaterThanOrEqual(nodes.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not drop any nodes during generation', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(1, 20),
        (nodes) => {
          // Given: A canvas with nodes
          const edges: Edge[] = [];
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, edges);
          
          // Then: Every node must appear in the code
          const resourceNames = extractResourceNames(terraformCode);
          
          for (const node of nodes) {
            const expectedName = sanitizeResourceName(node.data.label || node.id);
            expect(resourceNames.has(expectedName)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not drop any edges during generation', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(2, 15).chain(nodes => 
          edgesFromNodesArb(nodes).map(edges => ({ nodes, edges }))
        ),
        ({ nodes, edges }) => {
          // Given: A canvas with nodes and edges
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, edges);
          
          // Then: Every edge must be represented
          expect(allEdgesRepresented(nodes, edges, terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty canvas correctly', () => {
    // Given: An empty canvas
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // When: We generate Terraform code
    const terraformCode = generateTerraform(nodes, edges);
    
    // Then: Code should be valid (comment) and completeness check should pass
    expect(allNodesRepresented(nodes, terraformCode)).toBe(true);
    expect(allEdgesRepresented(nodes, edges, terraformCode)).toBe(true);
  });

  it('should represent all EC2 nodes in generated code', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.record({
            id: fc.uuid(),
            type: fc.constant('ec2' as ResourceTypeId),
            position: positionArb,
          }).chain(base => 
            ec2PropertiesArb.map(properties => ({
              ...base,
              data: {
                label: `ec2-${base.id}`,
                properties,
              },
            }))
          ),
          { minLength: 1, maxLength: 10, selector: (node) => node.id }
        ),
        (nodes) => {
          // Given: A canvas with only EC2 nodes
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes as Node[], []);
          
          // Then: All EC2 nodes must be represented
          expect(allNodesRepresented(nodes as Node[], terraformCode)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should represent all S3 nodes in generated code', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.record({
            id: fc.uuid(),
            type: fc.constant('s3' as ResourceTypeId),
            position: positionArb,
          }).chain(base => 
            s3PropertiesArb.map(properties => ({
              ...base,
              data: {
                label: `s3-${base.id}`,
                properties,
              },
            }))
          ),
          { minLength: 1, maxLength: 10, selector: (node) => node.id }
        ),
        (nodes) => {
          // Given: A canvas with only S3 nodes
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes as Node[], []);
          
          // Then: All S3 nodes must be represented
          expect(allNodesRepresented(nodes as Node[], terraformCode)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should represent all RDS nodes in generated code', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.record({
            id: fc.uuid(),
            type: fc.constant('rds' as ResourceTypeId),
            position: positionArb,
          }).chain(base => 
            rdsPropertiesArb.map(properties => ({
              ...base,
              data: {
                label: `rds-${base.id}`,
                properties,
              },
            }))
          ),
          { minLength: 1, maxLength: 10, selector: (node) => node.id }
        ),
        (nodes) => {
          // Given: A canvas with only RDS nodes
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes as Node[], []);
          
          // Then: All RDS nodes must be represented
          expect(allNodesRepresented(nodes as Node[], terraformCode)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should represent mixed resource types in generated code', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(3, 15),
        (nodes) => {
          // Given: A canvas with mixed resource types
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, []);
          
          // Then: All nodes regardless of type must be represented
          expect(allNodesRepresented(nodes, terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should represent complex dependency graphs completely', () => {
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
          
          // Then: All nodes and edges must be represented
          expect(allNodesRepresented(nodes, terraformCode)).toBe(true);
          expect(allEdgesRepresented(nodes, edges, terraformCode)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle nodes with special characters in labels', () => {
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
          
          // Then: All nodes must still be represented (with sanitized names)
          expect(allNodesRepresented(nodes as Node[], terraformCode)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should represent S3 nodes with versioning and encryption completely', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.record({
            id: fc.uuid(),
            type: fc.constant('s3' as ResourceTypeId),
            position: positionArb,
          }).chain(base => 
            fc.record({
              bucketName: fc.option(fc.stringMatching(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/), { nil: undefined }),
              versioning: fc.boolean(),
              encryption: fc.boolean(),
            }).map(properties => ({
              ...base,
              data: {
                label: `s3-${base.id}`,
                properties,
              },
            }))
          ),
          { minLength: 1, maxLength: 5, selector: (node) => node.id }
        ),
        (nodes) => {
          // Given: S3 nodes with versioning and encryption enabled
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes as Node[], []);
          
          // Then: All S3 nodes must be represented (including additional resources)
          expect(allNodesRepresented(nodes as Node[], terraformCode)).toBe(true);
          
          // And: Additional resources for versioning/encryption should be present
          const resourceCount = countResourceBlocks(terraformCode);
          const s3Nodes = nodes as Node[];
          const expectedMinResources = s3Nodes.reduce((count, node) => {
            const props = node.data.properties as S3Properties;
            let additional = 1; // Base S3 bucket
            if (props.versioning) additional++;
            if (props.encryption) additional++;
            return count + additional;
          }, 0);
          
          expect(resourceCount).toBeGreaterThanOrEqual(expectedMinResources);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain completeness with multiple edges to same target', () => {
    fc.assert(
      fc.property(
        uniqueNodesArb(3, 10),
        (nodes) => {
          if (nodes.length < 3) return true;
          
          // Given: Multiple edges pointing to the same target
          const targetNode = nodes[nodes.length - 1];
          const edges: Edge[] = nodes.slice(0, -1).map((node, idx) => ({
            id: `edge-${idx}`,
            source: node.id,
            target: targetNode.id,
          }));
          
          // When: We generate Terraform code
          const terraformCode = generateTerraform(nodes, edges);
          
          // Then: All nodes and edges must be represented
          expect(allNodesRepresented(nodes, terraformCode)).toBe(true);
          expect(allEdgesRepresented(nodes, edges, terraformCode)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
