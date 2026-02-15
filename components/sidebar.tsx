'use client';

import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getResourceTypes, getResourceTypesByCategory } from '@/lib/resource-types';
import { ResourceCategory } from '@/types';

const categoryLabels: Record<ResourceCategory, string> = {
  compute: 'Compute',
  storage: 'Storage',
  database: 'Database',
};

export function Sidebar() {
  const categories: ResourceCategory[] = ['compute', 'storage', 'database'];

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    resourceType: string
  ) => {
    event.dataTransfer.setData('application/reactflow', resourceType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 sm:w-80 lg:w-72 border-r bg-sidebar shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b bg-sidebar">
        <h2 className="text-base sm:text-lg font-semibold text-sidebar-foreground">
          Resources
        </h2>
        <p className="text-xs sm:text-sm text-sidebar-foreground/60 mt-1">
          Drag resources to canvas
        </p>
      </div>

      {/* Resource List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {categories.map((category) => {
            const resources = getResourceTypesByCategory(category);
            if (resources.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                {/* Category Label */}
                <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-1">
                  {categoryLabels[category]}
                </h3>

                {/* Resource Cards */}
                <div className="space-y-2">
                  {resources.map((resource) => {
                    const Icon = resource.icon;
                    return (
                      <Card
                        key={resource.id}
                        draggable
                        onDragStart={(event) => onDragStart(event, resource.id)}
                        className="p-3 cursor-grab hover:bg-sidebar-accent hover:shadow-md transition-all duration-200 active:cursor-grabbing active:scale-95 border-sidebar-border group"
                      >
                        <div className="flex items-center gap-3">
                          {/* Icon Container */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-sidebar-primary/10 flex items-center justify-center group-hover:bg-sidebar-primary/20 transition-colors">
                            <Icon className="h-5 w-5 text-sidebar-primary" />
                          </div>

                          {/* Text Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground">
                              {resource.label}
                            </p>
                            <p className="text-xs text-sidebar-foreground/60 leading-relaxed mt-0.5">
                              {resource.description}
                            </p>
                          </div>
                        </div>
                      </Card>
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
