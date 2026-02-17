'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getResourceTypes, getResourceTypesByCategory } from '@/lib/resource-types';
import { ResourceCategory } from '@/types';

const categoryLabels: Record<ResourceCategory, string> = {
  compute: 'Compute',
  network: 'Network',
  database: 'Database',
  storage: 'Storage',
  security: 'Security',
};

export function Sidebar() {
  const categories: ResourceCategory[] = ['compute', 'network', 'database', 'storage', 'security'];
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    resourceType: string
  ) => {
    event.dataTransfer.setData('application/reactflow', resourceType);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingId(resourceType);
    
    // Create a custom drag image for better visual feedback
    const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(-2deg)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 50, 25);
    
    // Clean up the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const onDragEnd = () => {
    setDraggingId(null);
  };

  return (
    <aside className="w-64 border-r bg-sidebar shadow-sm flex flex-col h-screen">
      {/* Header */}
      <div className="p-3 border-b bg-sidebar flex-shrink-0">
        <h2 className="text-sm font-semibold text-sidebar-foreground">
          Resources
        </h2>
      </div>

      {/* Resource List - Scrollable */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          {categories.map((category) => {
            const resources = getResourceTypesByCategory(category);
            if (resources.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                {/* Category Label */}
                <h3 className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-1">
                  {categoryLabels[category]}
                </h3>

                {/* Resource Icons Grid - Horizontal Layout */}
                <div className="flex flex-wrap gap-2">
                  {resources.map((resource) => {
                    return (
                      <Tooltip key={resource.id}>
                        <TooltipTrigger asChild>
                          <div
                            draggable
                            onDragStart={(event) => onDragStart(event, resource.id)}
                            onDragEnd={onDragEnd}
                            className={`w-12 h-12 rounded-lg bg-sidebar-primary/10 flex items-center justify-center cursor-grab hover:bg-sidebar-primary/20 hover:shadow-md transition-all duration-200 active:cursor-grabbing border border-sidebar-border ${
                              draggingId === resource.id 
                                ? 'opacity-40 scale-95' 
                                : 'hover:scale-110'
                            }`}
                          >
                            <img 
                              src={resource.iconUrl} 
                              alt={resource.label}
                              className="h-7 w-7 object-contain pointer-events-none"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="font-medium">{resource.label}</p>
                          <p className="text-xs opacity-90 mt-1">{resource.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
