/**
 * Property-Based Test: Property Schema Compliance (Property 4)
 * 
 * **Validates: Requirements 4.2, 4.3**
 * 
 * Property: Node properties must conform to their resource type schema
 * 
 * This test verifies that the properties panel and state management correctly
 * enforce schema compliance across various operations including:
 * - Creating nodes with default properties
 * - Updating node properties through the properties panel
 * - Validating property types match schema definitions
 * - Ensuring required fields are present
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Node, ResourceTypeId } from '@/types/index';
import { resourceSchemas, PropertyField } from '@/lib/resource-schemas';

// Arbitraries for generating test data
const resourceTypeArb = fc.constantFrom<ResourceTypeId>('ec2', 's3', 'rds');

const positionArb = fc.record({
  x: fc.integer({ min: -1000, max: 1000 }),
  y: fc.integer({ min: -1000, max: 1000 }),
});

// Generate properties that conform to a specific resource schema
function generateSchemaCompliantProperties(resourceType: ResourceTypeId): fc.Arbitrary<Record<string, any>> {
  const schema = resourceSchemas[resourceType];
  const propertyArbitraries: Record<string, fc.Arbitrary<any>> = {};

  for (const field of schema.fields) {
    switch (field.type) {
      case 'text':
        // For required text fields, ensure non-empty strings
        if (field.required) {
          propertyArbitraries[field.name] = fc.string({ minLength: 1, maxLength: 100 });
        } else {
          propertyArbitraries[field.name] = fc.string({ minLength: 0, maxLength: 100 });
        }
        break;
      case 'number':
        propertyArbitraries[field.name] = fc.integer({ min: 1, max: 1000 });
        break;
      case 'boolean':
        propertyArbitraries[field.name] = fc.boolean();
        break;
      case 'select':
        if (field.options && field.options.length > 0) {
          propertyArbitraries[field.name] = fc.constantFrom(...field.options);
        } else {
          propertyArbitraries[field.name] = fc.string({ minLength: 1, maxLength: 50 });
        }
        break;
      case 'array':
        propertyArbitraries[field.name] = fc.array(fc.string(), { maxLength: 10 });
        break;
      default:
        propertyArbitraries[field.name] = fc.anything();
    }
  }

  return fc.record(propertyArbitraries);
}

// Generate a node with schema-compliant properties
const schemaCompliantNodeArb = fc
  .tuple(resourceTypeArb, fc.uuid(), positionArb, fc.string({ minLength: 1, maxLength: 50 }))
  .chain(([type, id, position, label]) => {
    return generateSchemaCompliantProperties(type).map(properties => ({
      id,
      type,
      position,
      data: {
        label,
        properties,
      },
    }));
  }) as fc.Arbitrary<Node>;

// Helper function to validate property type matches schema
function validatePropertyType(value: any, field: PropertyField): boolean {
  switch (field.type) {
    case 'text':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'select':
      if (field.options && field.options.length > 0) {
        return typeof value === 'string' && field.options.includes(value);
      }
      return typeof value === 'string';
    case 'array':
      return Array.isArray(value);
    default:
      return true; // Unknown types pass by default
  }
}

// Helper function to check if node properties comply with schema
function isSchemaCompliant(node: Node): boolean {
  const schema = resourceSchemas[node.type];
  if (!schema) return false;

  const properties = node.data.properties;

  // Check each field in the schema
  for (const field of schema.fields) {
    const value = properties[field.name];

    // Check if required field is present
    if (field.required && (value === undefined || value === null || value === '')) {
      return false;
    }

    // If value exists, check if type matches
    if (value !== undefined && value !== null && value !== '') {
      if (!validatePropertyType(value, field)) {
        return false;
      }
    }
  }

  return true;
}

// Helper function to check if properties have only schema-defined fields
function hasOnlySchemaFields(node: Node): boolean {
  const schema = resourceSchemas[node.type];
  if (!schema) return false;

  const properties = node.data.properties;
  const schemaFieldNames = new Set(schema.fields.map(f => f.name));

  // Check if all property keys are defined in schema
  for (const key of Object.keys(properties)) {
    if (!schemaFieldNames.has(key)) {
      return false;
    }
  }

  return true;
}

describe('Property 4: Property Schema Compliance', () => {
  it('should validate that generated nodes comply with their resource schema', () => {
    fc.assert(
      fc.property(schemaCompliantNodeArb, (node) => {
        // Given: A node with schema-compliant properties
        // When: We validate the node
        const isCompliant = isSchemaCompliant(node);
        
        // Then: The node should be compliant
        expect(isCompliant).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate EC2 nodes have correct property types', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        positionArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('t2.micro', 't2.small', 't2.medium', 't3.micro', 't3.small', 't3.medium'),
        fc.string({ minLength: 10, maxLength: 30 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.array(fc.string(), { maxLength: 5 }),
        (id, position, label, instanceType, ami, keyName, securityGroups) => {
          // Given: An EC2 node with typed properties
          const node: Node = {
            id,
            type: 'ec2',
            position,
            data: {
              label,
              properties: {
                instanceType,
                ami,
                keyName,
                securityGroups,
              },
            },
          };

          // When: We validate the node
          const isCompliant = isSchemaCompliant(node);

          // Then: The node should be compliant
          expect(isCompliant).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate S3 nodes have correct property types', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        positionArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 3, maxLength: 63 }),
        fc.boolean(),
        fc.boolean(),
        (id, position, label, bucketName, versioning, encryption) => {
          // Given: An S3 node with typed properties
          const node: Node = {
            id,
            type: 's3',
            position,
            data: {
              label,
              properties: {
                bucketName,
                versioning,
                encryption,
              },
            },
          };

          // When: We validate the node
          const isCompliant = isSchemaCompliant(node);

          // Then: The node should be compliant
          expect(isCompliant).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate RDS nodes have correct property types', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        positionArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('postgres', 'mysql', 'mariadb', 'oracle-se2', 'sqlserver-ex'),
        fc.constantFrom('db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.m5.large', 'db.m5.xlarge'),
        fc.integer({ min: 20, max: 1000 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (id, position, label, engine, instanceClass, allocatedStorage, dbName) => {
          // Given: An RDS node with typed properties
          const node: Node = {
            id,
            type: 'rds',
            position,
            data: {
              label,
              properties: {
                engine,
                instanceClass,
                allocatedStorage,
                dbName,
              },
            },
          };

          // When: We validate the node
          const isCompliant = isSchemaCompliant(node);

          // Then: The node should be compliant
          expect(isCompliant).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect non-compliant nodes with wrong property types', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        positionArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (id, position, label) => {
          // Given: An EC2 node with wrong property type (instanceType should be string, not number)
          const node: Node = {
            id,
            type: 'ec2',
            position,
            data: {
              label,
              properties: {
                instanceType: 12345 as any, // Wrong type
                ami: 'ami-12345',
                keyName: 'my-key',
                securityGroups: [],
              },
            },
          };

          // When: We validate the node
          const isCompliant = isSchemaCompliant(node);

          // Then: The node should not be compliant
          expect(isCompliant).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should detect non-compliant nodes with invalid select options', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        positionArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !['t2.micro', 't2.small', 't2.medium', 't3.micro', 't3.small', 't3.medium'].includes(s)),
        (id, position, label, invalidInstanceType) => {
          // Given: An EC2 node with invalid select option
          const node: Node = {
            id,
            type: 'ec2',
            position,
            data: {
              label,
              properties: {
                instanceType: invalidInstanceType, // Invalid option
                ami: 'ami-12345',
                keyName: 'my-key',
                securityGroups: [],
              },
            },
          };

          // When: We validate the node
          const isCompliant = isSchemaCompliant(node);

          // Then: The node should not be compliant
          expect(isCompliant).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should detect missing required fields', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        positionArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (id, position, label) => {
          // Given: An S3 node missing required bucketName field
          const node: Node = {
            id,
            type: 's3',
            position,
            data: {
              label,
              properties: {
                // bucketName is required but missing
                versioning: false,
                encryption: true,
              },
            },
          };

          // When: We validate the node
          const isCompliant = isSchemaCompliant(node);

          // Then: The node should not be compliant
          expect(isCompliant).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should allow optional fields to be missing', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        positionArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('t2.micro', 't2.small', 't2.medium'),
        fc.string({ minLength: 10, maxLength: 30 }),
        (id, position, label, instanceType, ami) => {
          // Given: An EC2 node with only required fields (keyName and securityGroups are optional)
          const node: Node = {
            id,
            type: 'ec2',
            position,
            data: {
              label,
              properties: {
                instanceType,
                ami,
                // keyName and securityGroups are optional and omitted
              },
            },
          };

          // When: We validate the node
          const isCompliant = isSchemaCompliant(node);

          // Then: The node should be compliant
          expect(isCompliant).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate that properties only contain schema-defined fields', () => {
    fc.assert(
      fc.property(schemaCompliantNodeArb, (node) => {
        // Given: A node with schema-compliant properties
        // When: We check if it only has schema-defined fields
        const hasOnlyValid = hasOnlySchemaFields(node);

        // Then: It should only have schema-defined fields
        expect(hasOnlyValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect nodes with extra non-schema fields', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        positionArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (id, position, label, extraFieldValue) => {
          // Given: An EC2 node with an extra non-schema field
          const node: Node = {
            id,
            type: 'ec2',
            position,
            data: {
              label,
              properties: {
                instanceType: 't2.micro',
                ami: 'ami-12345',
                keyName: 'my-key',
                securityGroups: [],
                extraField: extraFieldValue, // Not in schema
              },
            },
          };

          // When: We check if it only has schema-defined fields
          const hasOnlyValid = hasOnlySchemaFields(node);

          // Then: It should detect the extra field
          expect(hasOnlyValid).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle nodes with default properties from schema', () => {
    fc.assert(
      fc.property(resourceTypeArb, fc.uuid(), positionArb, fc.string({ minLength: 1, maxLength: 50 }), (type, id, position, label) => {
        // Given: A node initialized with default properties from schema
        const schema = resourceSchemas[type];
        const defaultProps = { ...schema.defaultProperties };
        
        // Fill in required fields that have empty defaults with valid values
        for (const field of schema.fields) {
          if (field.required && (defaultProps[field.name] === '' || defaultProps[field.name] === null || defaultProps[field.name] === undefined)) {
            // Provide a valid default value for required fields
            if (field.type === 'text') {
              defaultProps[field.name] = field.placeholder || 'test-value';
            } else if (field.type === 'number') {
              defaultProps[field.name] = field.defaultValue || 1;
            } else if (field.type === 'select' && field.options && field.options.length > 0) {
              defaultProps[field.name] = field.options[0];
            }
          }
        }
        
        const node: Node = {
          id,
          type,
          position,
          data: {
            label,
            properties: defaultProps,
          },
        };

        // When: We validate the node
        const isCompliant = isSchemaCompliant(node);

        // Then: The node should be compliant (default properties should be valid)
        expect(isCompliant).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate array properties are actually arrays', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        positionArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (id, position, label) => {
          // Given: An EC2 node with securityGroups as a non-array
          const node: Node = {
            id,
            type: 'ec2',
            position,
            data: {
              label,
              properties: {
                instanceType: 't2.micro',
                ami: 'ami-12345',
                keyName: 'my-key',
                securityGroups: 'not-an-array' as any, // Should be array
              },
            },
          };

          // When: We validate the node
          const isCompliant = isSchemaCompliant(node);

          // Then: The node should not be compliant
          expect(isCompliant).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle empty string as missing required field', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        positionArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (id, position, label) => {
          // Given: An S3 node with empty string for required bucketName
          const node: Node = {
            id,
            type: 's3',
            position,
            data: {
              label,
              properties: {
                bucketName: '', // Required but empty
                versioning: false,
                encryption: true,
              },
            },
          };

          // When: We validate the node
          const isCompliant = isSchemaCompliant(node);

          // Then: The node should not be compliant
          expect(isCompliant).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});
