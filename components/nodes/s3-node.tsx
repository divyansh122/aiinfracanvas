// S3 Bucket custom node component
'use client';

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import BaseNode, { BaseNodeData } from './base-node';
import { getResourceTypeById } from '@/lib/resource-types';

function S3Node(props: NodeProps) {
  const config = getResourceTypeById('s3');
  const data = props.data as unknown as BaseNodeData;
  
  return (
    <BaseNode
      id={props.id}
      data={data}
      selected={props.selected}
      icon={config.icon}
      color="bg-gradient-to-br from-green-500 to-green-600"
      category={config.label}
    />
  );
}

export default memo(S3Node);
