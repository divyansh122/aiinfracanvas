// Application Load Balancer custom node component
'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './base-node';
import { getResourceTypeById } from '@/lib/resource-types';

function ALBNode(props: NodeProps) {
  const config = getResourceTypeById('alb');
  const data = props.data as unknown as BaseNodeData;
  
  return (
    <BaseNode
      id={props.id}
      data={data}
      selected={props.selected}
      iconUrl={config.iconUrl}
      color="bg-gradient-to-br from-purple-400 to-purple-500"
      category={config.label}
    />
  );
}

export default memo(ALBNode);
