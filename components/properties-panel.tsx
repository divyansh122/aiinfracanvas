'use client';

import { useCanvas } from '@/lib/canvas-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getResourceTypeById } from '@/lib/resource-types';
import { resourceSchemas, PropertyField } from '@/lib/resource-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PropertiesPanel() {
  const { getSelectedNode, updateNode } = useCanvas();
  const selectedNode = getSelectedNode();

  // Empty state when no node is selected
  if (!selectedNode) {
    return (
      <div className="w-72 sm:w-80 lg:w-80 border-l bg-background p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select a node to view and edit its properties
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get resource type configuration and schema
  const resourceType = getResourceTypeById(selectedNode.type);
  const Icon = resourceType.icon;
  const schema = resourceSchemas[selectedNode.type];

  // Handle property value changes
  const handlePropertyChange = (fieldName: string, value: any) => {
    const updatedProperties = {
      ...selectedNode.data.properties,
      [fieldName]: value,
    };
    
    updateNode(selectedNode.id, {
      label: selectedNode.data.label,
      properties: updatedProperties,
    });
  };

  // Render form field based on field type
  const renderField = (field: PropertyField) => {
    const properties = selectedNode.data.properties as Record<string, any>;
    const currentValue = properties[field.name] ?? field.defaultValue;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-1.5 sm:space-y-2">
            <Label htmlFor={field.name} className="text-xs sm:text-sm">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="text"
              value={currentValue || ''}
              onChange={(e) => handlePropertyChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="text-sm"
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-1.5 sm:space-y-2">
            <Label htmlFor={field.name} className="text-xs sm:text-sm">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={currentValue ?? ''}
              onChange={(e) => handlePropertyChange(field.name, Number(e.target.value))}
              placeholder={field.placeholder}
              className="text-sm"
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={currentValue ?? false}
              onCheckedChange={(checked) => handlePropertyChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="cursor-pointer text-xs sm:text-sm">
              {field.label}
            </Label>
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-1.5 sm:space-y-2">
            <Label htmlFor={field.name} className="text-xs sm:text-sm">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={currentValue || ''}
              onValueChange={(value) => handlePropertyChange(field.name, value)}
            >
              <SelectTrigger id={field.name} className="text-sm">
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option} className="text-sm">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'array':
        return (
          <div key={field.name} className="space-y-1.5 sm:space-y-2">
            <Label htmlFor={field.name} className="text-xs sm:text-sm">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="text"
              value={Array.isArray(currentValue) ? currentValue.join(', ') : ''}
              onChange={(e) => {
                const arrayValue = e.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter((item) => item !== '');
                handlePropertyChange(field.name, arrayValue);
              }}
              placeholder={field.placeholder}
              className="text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Comma-separated values
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-72 sm:w-80 lg:w-80 border-l bg-background">
      <ScrollArea className="h-screen">
        <div className="p-3 sm:p-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <CardTitle className="text-base sm:text-lg">{resourceType.label}</CardTitle>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {selectedNode.data.label}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {schema.fields.map((field) => renderField(field))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
