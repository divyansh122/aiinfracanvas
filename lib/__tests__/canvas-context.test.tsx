import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CanvasProvider, useCanvas } from '../canvas-context';
import { Node } from '@/types';

describe('Canvas Context - Property Update Handlers', () => {
  it('should update node properties correctly', () => {
    const { result } = renderHook(() => useCanvas(), {
      wrapper: CanvasProvider,
    });

    // Add a test node
    const testNode: Node = {
      id: 'test-ec2-1',
      type: 'ec2',
      position: { x: 100, y: 100 },
      data: {
        label: 'EC2 Instance',
        properties: {
          instanceType: 't2.micro',
          ami: 'ami-123456',
          keyName: '',
          securityGroups: [],
        },
      },
    };

    act(() => {
      result.current.addNode(testNode);
    });

    // Verify node was added
    expect(result.current.state.nodes).toHaveLength(1);
    expect(result.current.state.nodes[0].data.properties).toEqual({
      instanceType: 't2.micro',
      ami: 'ami-123456',
      keyName: '',
      securityGroups: [],
    });

    // Update a single property
    act(() => {
      result.current.updateNode('test-ec2-1', {
        label: 'EC2 Instance',
        properties: {
          instanceType: 't2.small',
          ami: 'ami-123456',
          keyName: 'my-key',
          securityGroups: ['sg-123'],
        },
      });
    });

    // Verify property was updated
    const updatedNode = result.current.state.nodes[0];
    expect(updatedNode.data.properties).toEqual({
      instanceType: 't2.small',
      ami: 'ami-123456',
      keyName: 'my-key',
      securityGroups: ['sg-123'],
    });
  });

  it('should preserve label when updating properties', () => {
    const { result } = renderHook(() => useCanvas(), {
      wrapper: CanvasProvider,
    });

    const testNode: Node = {
      id: 'test-s3-1',
      type: 's3',
      position: { x: 200, y: 200 },
      data: {
        label: 'S3 Bucket',
        properties: {
          bucketName: 'my-bucket',
          versioning: false,
          encryption: true,
        },
      },
    };

    act(() => {
      result.current.addNode(testNode);
    });

    // Update properties
    act(() => {
      result.current.updateNode('test-s3-1', {
        label: 'S3 Bucket',
        properties: {
          bucketName: 'my-updated-bucket',
          versioning: true,
          encryption: true,
        },
      });
    });

    const updatedNode = result.current.state.nodes[0];
    expect(updatedNode.data.label).toBe('S3 Bucket');
    expect(updatedNode.data.properties).toEqual({
      bucketName: 'my-updated-bucket',
      versioning: true,
      encryption: true,
    });
  });

  it('should handle multiple property updates', () => {
    const { result } = renderHook(() => useCanvas(), {
      wrapper: CanvasProvider,
    });

    const testNode: Node = {
      id: 'test-rds-1',
      type: 'rds',
      position: { x: 300, y: 300 },
      data: {
        label: 'RDS Database',
        properties: {
          engine: 'postgres',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          dbName: 'mydb',
        },
      },
    };

    act(() => {
      result.current.addNode(testNode);
    });

    // First update
    act(() => {
      result.current.updateNode('test-rds-1', {
        label: 'RDS Database',
        properties: {
          engine: 'mysql',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          dbName: 'mydb',
        },
      });
    });

    // Second update
    act(() => {
      result.current.updateNode('test-rds-1', {
        label: 'RDS Database',
        properties: {
          engine: 'mysql',
          instanceClass: 'db.t3.small',
          allocatedStorage: 50,
          dbName: 'production-db',
        },
      });
    });

    const updatedNode = result.current.state.nodes[0];
    expect(updatedNode.data.properties).toEqual({
      engine: 'mysql',
      instanceClass: 'db.t3.small',
      allocatedStorage: 50,
      dbName: 'production-db',
    });
  });
});
