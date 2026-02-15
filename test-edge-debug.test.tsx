import { describe, it } from 'vitest';
import { generateTerraform } from './lib/terraform-generator';

describe('Debug edge generation', () => {
  it('should show generated code with edges', () => {
    const nodes = [
      {
        id: '00000000-0000-1000-8000-000000000000',
        type: 'ec2' as const,
        position: { x: 0, y: 0 },
        data: {
          label: 'ec2-resource-00000000-0000-1000-8000-000000000000',
          properties: {}
        }
      },
      {
        id: '00000000-0000-1000-8000-000000000001',
        type: 'ec2' as const,
        position: { x: 0, y: 0 },
        data: {
          label: 'ec2-resource-00000000-0000-1000-8000-000000000001',
          properties: {}
        }
      }
    ];

    const edges = [
      {
        id: '00000000-0000-1000-8000-000000000000',
        source: '00000000-0000-1000-8000-000000000001',
        target: '00000000-0000-1000-8000-000000000000'
      }
    ];

    const code = generateTerraform(nodes, edges);
    console.log('=== Generated Code ===');
    console.log(code);
    console.log('=== End ===');
    
    console.log('\n=== Checking for depends_on ===');
    console.log('Contains "depends_on":', code.includes('depends_on'));
  });
});
