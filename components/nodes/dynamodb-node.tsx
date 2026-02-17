// DynamoDB custom node component
'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './base-node';
import { getResourceTypeById } from '@/lib/resource-types';

function DynamoDBNode(props: NodeProps) {
  const config = getResourceTypeById('dynamodb');
  const data = props.data as unknown as BaseNodeData;
  
  return (
    <BaseNode
      id={props.id}
      data={data}
      selected={props.selected}
      iconUrl={config.iconUrl}
      color="bg-gradient-to-br from-blue-400 to-blue-500"
      category={config.label}
    />
  );
}

export default memo(DynamoDBNode);
