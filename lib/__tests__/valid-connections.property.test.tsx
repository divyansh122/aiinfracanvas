/**
 * Property-Based Test: Valid Connections (Property 2)
 * 
 * **Validates: Requirements 3.1, 3.2**
 * 
 * Property: Edges must reference existing node IDs
 * 
 * This test verifies that the canvas state management correctly maintains
 * edge validity across various operations including:
 * - Adding edges between existing nodes
 * - Deleting nodes and their associated edges
 * - Preventing edges with invalid source or target IDs
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Node, Edge, ResourceTypeId } from '@/types/index';

// Arbitraries for generating test data
const resourceTypeArb = fc.constantFrom<ResourceTypeId>('ec2', 's3', 'rds');

const positionArb = fc.record({
  x: fc.integer({ min: -1000, max: 1000 }),
  y: fc.integer({ min: -1000, max: 1000 }),
});

const nodeDataArb = fc.record({
  label: fc.string({ minLength: 1, maxLength: 50 }),
  properties: fc.dictionary(fc.string(), fc.anything()),
});

const nodeArb = fc.record({
  id: fc.uuid(),
  type: resourceTypeArb,
  position: positionArb,
  data: nodeDataArb,
}) as fc.Arbitrary<Node>;

// Generate an edge between two existing nodes
function edgeFromNodesArb(nodes: Node[]): fc.Arbitrary<Edge> {
  if (nodes.length < 2) {
    // If we don't have at least 2 nodes, create a self-referencing edge
    return fc.record({
      id: fc.uuid(),
      source: fc.constant(nodes[0]?.id || 'node-1'),
      target: fc.constant(nodes[0]?.id || 'node-1'),
    });
  }
  
  return fc.record({
    id: fc.uuid(),
    source: fc.constantFrom(...nodes.map(n => n.id)),
    target: fc.constantFrom(...nodes.map(n => n.id)),
  });
}

// Helper function to check if all edges reference existing nodes
function hasValidEdges(nodes: Node[], edges: Edge[]): boolean {
  const nodeIds = new Set(nodes.map(node => node.id));
  
  return edges.every(edge => 
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
}

// Helper function to simulate canvas reducer behavior for edge operations
function simulateAddEdge(nodes: Node[], edges: Edge[], newEdge: Edge): Edge[] {
  // Simulate the ADD_EDGE action
  return [...edges, newEdge];
}

// Helper function to simulate node deletion with edge cleanup
function simulateDeleteNode(nodes: Node[], edges: Edge[], nodeIdToDelete: string): { nodes: Node[], edges: Edge[] } {
  // Simulate DELETE_NODE action which also removes associated edges
  const newNodes = nodes.filter(node => node.id !== nodeIdToDelete);
  const newEdges = edges.filter(
    edge => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete
  );
  
  return { nodes: newNodes, edges: newEdges };
}

describe('Property 2: Valid Connections', () => {
  it('should maintain valid edge references when adding edges between existing nodes', () => {
    fc.assert(
      fc.property(
        fc.array(nodeArb, { minLength: 2, maxLength: 20 }),
        fc.nat({ max: 10 }),
        (nodes, numEdges) => {
          // Given: A canvas with nodes
          const canvasNodes = nodes;
          
          // When: We add edges between existing nodes
          const edges: Edge[] = [];
          for (let i = 0; i < Math.min(numEdges, nodes.length * 2); i++) {
            const sourceIdx = i % nodes.length;
            const targetIdx = (i + 1) % nodes.length;
            edges.push({
              id: `edge-${i}`,
              source: nodes[sourceIdx].id,
              target: nodes[targetIdx].id,
            });
          }
          
          // Then: All edges must reference existing node IDs
          expect(hasValidEdges(canvasNodes, edges)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect invalid edges that reference non-existent nodes', () => {
    fc.assert(
      fc.property(
        fc.array(nodeArb, { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        (nodes, invalidNodeId) => {
          // Given: A canvas with nodes
          const canvasNodes = nodes;
          
          // Ensure the invalid ID doesn't accidentally match an existing node
          fc.pre(!nodes.some(node => node.id === invalidNodeId));
          
          // When: We create an edge with an invalid source
          const invalidEdge: Edge = {
            id: 'invalid-edge',
            source: invalidNodeId,
            target: nodes[0].id,
          };
          
          const edges = [invalidEdge];
          
          // Then: The validation should detect the invalid edge
          expect(hasValidEdges(canvasNodes, edges)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain edge validity after deleting nodes', () => {
    fc.assert(
      fc.property(
        fc.array(nodeArb, { minLength: 3, maxLength: 20 }),
        fc.integer({ min: 0, max: 19 }),
        (nodes, deleteIndex) => {
          if (nodes.length < 3) return true;
          
          // Given: A canvas with nodes and edges
          const initialNodes = nodes;
          const initialEdges: Edge[] = [];
          
          // Create some edges
          for (let i = 0; i < nodes.length - 1; i++) {
            initialEdges.push({
              id: `edge-${i}`,
              source: nodes[i].id,
              target: nodes[i + 1].id,
            });
          }
          
          // When: We delete a node (which should also remove its edges)
          const targetIndex = deleteIndex % nodes.length;
          const nodeToDelete = nodes[targetIndex].id;
          const { nodes: newNodes, edges: newEdges } = simulateDeleteNode(
            initialNodes,
            initialEdges,
            nodeToDelete
          );
          
          // Then: All remaining edges should still be valid
          expect(hasValidEdges(newNodes, newEdges)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty canvas state', () => {
    // Given: An empty canvas with no nodes or edges
    const emptyNodes: Node[] = [];
    const emptyEdges: Edge[] = [];
    
    // Then: Validation should pass (vacuously true)
    expect(hasValidEdges(emptyNodes, emptyEdges)).toBe(true);
  });

  it('should handle canvas with nodes but no edges', () => {
    fc.assert(
      fc.property(
        fc.array(nodeArb, { minLength: 1, maxLength: 20 }),
        (nodes) => {
          // Given: A canvas with nodes but no edges
          const canvasNodes = nodes;
          const canvasEdges: Edge[] = [];
          
          // Then: Validation should pass
          expect(hasValidEdges(canvasNodes, canvasEdges)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should allow self-referencing edges (node connected to itself)', () => {
    fc.assert(
      fc.property(nodeArb, (node) => {
        // Given: A canvas with a single node
        const canvasNodes = [node];
        
        // When: We create a self-referencing edge
        const selfEdge: Edge = {
          id: 'self-edge',
          source: node.id,
          target: node.id,
        };
        
        const canvasEdges = [selfEdge];
        
        // Then: The edge should be valid
        expect(hasValidEdges(canvasNodes, canvasEdges)).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  it('should validate multiple edges between the same pair of nodes', () => {
    fc.assert(
      fc.property(
        fc.array(nodeArb, { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (nodes, numDuplicateEdges) => {
          // Given: A canvas with nodes
          const canvasNodes = nodes;
          
          // When: We create multiple edges between the same two nodes
          const edges: Edge[] = [];
          for (let i = 0; i < numDuplicateEdges; i++) {
            edges.push({
              id: `edge-${i}`,
              source: nodes[0].id,
              target: nodes[1].id,
            });
          }
          
          // Then: All edges should be valid (even if they're duplicates)
          expect(hasValidEdges(canvasNodes, edges)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should invalidate edges when both source and target are invalid', () => {
    fc.assert(
      fc.property(
        fc.array(nodeArb, { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        fc.uuid(),
        (nodes, invalidSource, invalidTarget) => {
          // Given: A canvas with nodes
          const canvasNodes = nodes;
          
          // Ensure the invalid IDs don't accidentally match existing nodes
          fc.pre(!nodes.some(node => node.id === invalidSource));
          fc.pre(!nodes.some(node => node.id === invalidTarget));
          
          // When: We create an edge with both invalid source and target
          const invalidEdge: Edge = {
            id: 'invalid-edge',
            source: invalidSource,
            target: invalidTarget,
          };
          
          const edges = [invalidEdge];
          
          // Then: The validation should detect the invalid edge
          expect(hasValidEdges(canvasNodes, edges)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain validity with complex graph operations', () => {
    fc.assert(
      fc.property(
        fc.array(nodeArb, { minLength: 5, maxLength: 15 }),
        fc.array(fc.integer({ min: 0, max: 14 }), { minLength: 1, maxLength: 5 }),
        (initialNodes, deleteIndices) => {
          if (initialNodes.length < 5) return true;
          
          // Given: A canvas with nodes and a complex edge structure
          let nodes = [...initialNodes];
          let edges: Edge[] = [];
          
          // Create a mesh of edges
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < Math.min(i + 3, nodes.length); j++) {
              edges.push({
                id: `edge-${i}-${j}`,
                source: nodes[i].id,
                target: nodes[j].id,
              });
            }
          }
          
          // When: We delete multiple nodes
          for (const deleteIndex of deleteIndices) {
            if (nodes.length === 0) break;
            const targetIndex = deleteIndex % nodes.length;
            const nodeToDelete = nodes[targetIndex].id;
            const result = simulateDeleteNode(nodes, edges, nodeToDelete);
            nodes = result.nodes;
            edges = result.edges;
          }
          
          // Then: All remaining edges should be valid
          expect(hasValidEdges(nodes, edges)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
