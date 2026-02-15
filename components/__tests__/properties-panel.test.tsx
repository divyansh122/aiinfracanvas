import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertiesPanel from '../properties-panel';
import { CanvasProvider, useCanvas } from '@/lib/canvas-context';
import { Node } from '@/types';

// Mock the canvas context for specific test scenarios
vi.mock('@/lib/canvas-context', async () => {
  const actual = await vi.importActual('@/lib/canvas-context');
  return {
    ...actual,
    useCanvas: vi.fn(),
  };
});

describe('Properties Panel - Empty State', () => {
  it('should display empty state when no node is selected', () => {
    const mockGetSelectedNode = vi.fn(() => null);
    const mockUpdateNode = vi.fn();

    (useCanvas as any).mockReturnValue({
      getSelectedNode: mockGetSelectedNode,
      updateNode: mockUpdateNode,
    });

    render(<PropertiesPanel />);

    // Verify empty state message is displayed
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Select a node to view and edit its properties')).toBeInTheDocument();
    
    // Verify no form fields are rendered
    expect(screen.queryByLabelText(/Instance Type/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/AMI ID/i)).not.toBeInTheDocument();
  });
});

describe('Properties Panel - Update Handlers', () => {
  it('should call updateNode when text input changes', () => {
    const mockUpdateNode = vi.fn();
    const mockGetSelectedNode = vi.fn(() => ({
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
    } as Node));

    (useCanvas as any).mockReturnValue({
      getSelectedNode: mockGetSelectedNode,
      updateNode: mockUpdateNode,
    });

    render(<PropertiesPanel />);

    // Find the AMI input field
    const amiInput = screen.getByLabelText(/AMI ID/i);
    
    // Change the value
    fireEvent.change(amiInput, { target: { value: 'ami-new-value' } });

    // Verify updateNode was called with correct parameters
    expect(mockUpdateNode).toHaveBeenCalledWith('test-ec2-1', {
      label: 'EC2 Instance',
      properties: {
        instanceType: 't2.micro',
        ami: 'ami-new-value',
        keyName: '',
        securityGroups: [],
      },
    });
  });

  it('should call updateNode when select input changes', async () => {
    const mockUpdateNode = vi.fn();
    const mockGetSelectedNode = vi.fn(() => ({
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
    } as Node));

    (useCanvas as any).mockReturnValue({
      getSelectedNode: mockGetSelectedNode,
      updateNode: mockUpdateNode,
    });

    const { container } = render(<PropertiesPanel />);

    // Find the select trigger button
    const selectTrigger = screen.getByRole('combobox', { name: /Instance Type/i });
    
    // Click to open the select
    fireEvent.click(selectTrigger);

    // Find and click the option
    const option = await screen.findByRole('option', { name: 't2.small' });
    fireEvent.click(option);

    // Verify updateNode was called
    expect(mockUpdateNode).toHaveBeenCalledWith('test-ec2-1', {
      label: 'EC2 Instance',
      properties: {
        instanceType: 't2.small',
        ami: 'ami-123456',
        keyName: '',
        securityGroups: [],
      },
    });
  });

  it('should call updateNode when boolean input changes', () => {
    const mockUpdateNode = vi.fn();
    const mockGetSelectedNode = vi.fn(() => ({
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
    } as Node));

    (useCanvas as any).mockReturnValue({
      getSelectedNode: mockGetSelectedNode,
      updateNode: mockUpdateNode,
    });

    render(<PropertiesPanel />);

    // Find the versioning checkbox
    const versioningCheckbox = screen.getByLabelText(/Enable Versioning/i);
    
    // Click the checkbox
    fireEvent.click(versioningCheckbox);

    // Verify updateNode was called
    expect(mockUpdateNode).toHaveBeenCalledWith('test-s3-1', {
      label: 'S3 Bucket',
      properties: {
        bucketName: 'my-bucket',
        versioning: true,
        encryption: true,
      },
    });
  });

  it('should call updateNode when number input changes', () => {
    const mockUpdateNode = vi.fn();
    const mockGetSelectedNode = vi.fn(() => ({
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
    } as Node));

    (useCanvas as any).mockReturnValue({
      getSelectedNode: mockGetSelectedNode,
      updateNode: mockUpdateNode,
    });

    render(<PropertiesPanel />);

    // Find the allocated storage input
    const storageInput = screen.getByLabelText(/Allocated Storage/i);
    
    // Change the value
    fireEvent.change(storageInput, { target: { value: '50' } });

    // Verify updateNode was called
    expect(mockUpdateNode).toHaveBeenCalledWith('test-rds-1', {
      label: 'RDS Database',
      properties: {
        engine: 'postgres',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 50,
        dbName: 'mydb',
      },
    });
  });

  it('should call updateNode when array input changes', () => {
    const mockUpdateNode = vi.fn();
    const mockGetSelectedNode = vi.fn(() => ({
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
    } as Node));

    (useCanvas as any).mockReturnValue({
      getSelectedNode: mockGetSelectedNode,
      updateNode: mockUpdateNode,
    });

    render(<PropertiesPanel />);

    // Find the security groups input
    const securityGroupsInput = screen.getByLabelText(/Security Groups/i);
    
    // Change the value
    fireEvent.change(securityGroupsInput, { target: { value: 'sg-123, sg-456' } });

    // Verify updateNode was called with array
    expect(mockUpdateNode).toHaveBeenCalledWith('test-ec2-1', {
      label: 'EC2 Instance',
      properties: {
        instanceType: 't2.micro',
        ami: 'ami-123456',
        keyName: '',
        securityGroups: ['sg-123', 'sg-456'],
      },
    });
  });
});
