// Base custom node component for React Flow
'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { LucideIcon, X } from 'lucide-react';
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
  icon: LucideIcon;
  color: string;
  category: string;
}

function BaseNode({ id, data, selected, icon: Icon, color, category }: BaseNodeProps) {
  const { deleteNode } = useCanvas();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[180px] transition-all duration-200 relative group',
        selected ? 'border-blue-500 shadow-xl ring-2 ring-blue-200' : 'border-gray-300',
        'hover:shadow-xl hover:scale-105 cursor-pointer'
      )}
    >
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
      
      {/* Node content */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2.5 rounded-lg shadow-sm',
            color
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">
            {category}
          </div>
          <div className="font-semibold text-gray-900 truncate text-sm">
            {data.label}
          </div>
        </div>
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
