// EC2 Instance custom node component
'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './base-node';
import { getResourceTypeById } from '@/lib/resource-types';

function EC2Node(props: NodeProps) {
  const config = getResourceTypeById('ec2');
  const data = props.data as unknown as BaseNodeData;
  
  return (
    <BaseNode
      id={props.id}
      data={data}
      selected={props.selected}
      icon={config.icon}
      color="bg-gradient-to-br from-orange-500 to-orange-600"
      category={config.label}
    />
  );
}

export default memo(EC2Node);
