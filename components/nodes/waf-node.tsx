// WAF / Firewall custom node component
'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './base-node';
import { getResourceTypeById } from '@/lib/resource-types';

function WAFNode(props: NodeProps) {
  const config = getResourceTypeById('waf');
  const data = props.data as unknown as BaseNodeData;
  
  return (
    <BaseNode
      id={props.id}
      data={data}
      selected={props.selected}
      iconUrl={config.iconUrl}
      color="bg-gradient-to-br from-red-500 to-red-600"
      category={config.label}
    />
  );
}

export default memo(WAFNode);
