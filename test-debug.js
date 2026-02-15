// Debug script to test terraform generation
import { generateTerraform } from './lib/terraform-generator.ts';

const nodes = [
  {
    id: '00000000-0000-1000-8000-000000000000',
    type: 'ec2',
    position: { x: 0, y: 0 },
    data: {
      label: 'ec2-resource-00000000-0000-1000-8000-000000000000',
      properties: {}
    }
  },
  {
    id: '00000000-0000-1000-8000-000000000001',
    type: 'ec2',
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
    source: '00000000-0000-1000-8000-000000000000',
    target: '00000000-0000-1000-8000-000000000001'
  }
];

console.log('=== Generated Terraform Code ===');
console.log(generateTerraform(nodes, edges));
console.log('\n=== End ===');
