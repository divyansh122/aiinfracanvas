// Base custom node component for React Flow
'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvas } from '@/lib/canvas-context';

export interface BaseNodeData {
  label: string;
  properties: Record<string, any>;
}

export interface BaseNodeProps {
  id: string;
  data: BaseNodeData;
  selected?: boolean;
  iconUrl: string;
  color: string;
  category: string;
}

function BaseNode({ id, data, selected, iconUrl, color, category }: BaseNodeProps) {
  const { deleteNode } = useCanvas();

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  }, [id, deleteNode]);

  return (
    <div className="relative group">
      {/* Delete button - shows on hover */}
      <button
        onClick={handleDelete}
        className={cn(
          'absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white',
          'flex items-center justify-center shadow-md',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'hover:bg-red-600 hover:scale-110 z-10'
        )}
        aria-label="Delete node"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          'w-3 h-3 !bg-gray-400 border-2 border-white transition-all',
          selected && '!bg-blue-500'
        )}
      />
      
      {/* Icon only - no background, no border, no text */}
      <div className={cn(
        'w-16 h-16 flex items-center justify-center cursor-pointer transition-transform',
        selected && 'scale-110'
      )}>
        <img 
          src={iconUrl} 
          alt={category}
          className="w-full h-full object-contain"
        />
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          'w-3 h-3 !bg-gray-400 border-2 border-white transition-all',
          selected && '!bg-blue-500'
        )}
      />
    </div>
  );
}

export default memo(BaseNode);
