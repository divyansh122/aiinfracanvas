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
import { toast } from 'sonner';
import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { Loader2, Sparkles, DollarSign, Lightbulb } from 'lucide-react';

// Memoized field renderer component to prevent unnecessary re-renders
const PropertyFieldRenderer = memo(({ 
  field, 
  currentValue, 
  validationError,
  onPropertyChange 
}: { 
  field: PropertyField;
  currentValue: any;
  validationError?: string;
  onPropertyChange: (fieldName: string, value: any) => void;
}) => {
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
            onChange={(e) => onPropertyChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="text-sm"
          />
          {field.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">{field.description}</p>
          )}
          {validationError && (
            <p className="text-xs text-destructive">{validationError}</p>
          )}
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
            onChange={(e) => onPropertyChange(field.name, Number(e.target.value))}
            placeholder={field.placeholder}
            className="text-sm"
          />
          {field.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">{field.description}</p>
          )}
          {validationError && (
            <p className="text-xs text-destructive">{validationError}</p>
          )}
        </div>
      );

    case 'boolean':
      return (
        <div key={field.name} className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={currentValue ?? false}
              onCheckedChange={(checked) => onPropertyChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="cursor-pointer text-xs sm:text-sm">
              {field.label}
            </Label>
          </div>
          {field.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground ml-6">{field.description}</p>
          )}
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
            onValueChange={(value) => onPropertyChange(field.name, value)}
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
          {field.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">{field.description}</p>
          )}
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
              onPropertyChange(field.name, arrayValue);
            }}
            placeholder={field.placeholder}
            className="text-sm"
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Comma-separated values
          </p>
          {field.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );

    default:
      return null;
  }
});

PropertyFieldRenderer.displayName = 'PropertyFieldRenderer';

// AI Analysis interfaces
interface NodeAnalysisResponse {
  analysis: string;
  suggestions: string[];
  cost_est: string;
}

export default function PropertiesPanel() {
  const { getSelectedNode, updateNode, setError } = useCanvas();
  const selectedNode = getSelectedNode();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [aiAnalysis, setAiAnalysis] = useState<NodeAnalysisResponse | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Fetch AI analysis when node is selected
  useEffect(() => {
    if (!selectedNode) {
      setAiAnalysis(null);
      setAnalysisError(null);
      return;
    }

    const fetchAnalysis = async () => {
      setIsLoadingAnalysis(true);
      setAnalysisError(null);
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'node',
            nodeData: {
              id: selectedNode.id,
              type: selectedNode.type,
              data: selectedNode.data,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch analysis');
        }

        const data: NodeAnalysisResponse = await response.json();
        setAiAnalysis(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch AI analysis';
        setAnalysisError(errorMessage);
        console.error('AI analysis error:', error);
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
  }, [selectedNode?.id, selectedNode?.type]);

  // Memoize property change handler
  const handlePropertyChange = useCallback((fieldName: string, value: any) => {
    if (!selectedNode) return;
    
    try {
      // Clear validation error for this field
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });

      const updatedProperties = {
        ...selectedNode.data.properties,
        [fieldName]: value,
      };
      
      updateNode(selectedNode.id, {
        label: selectedNode.data.label,
        properties: updatedProperties,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update property';
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: errorMessage,
      }));
      toast.error('Property update failed', {
        description: errorMessage,
      });
      console.error('Property update error:', error);
    }
  }, [selectedNode, updateNode, setError]);

  // Memoize resource type and schema to prevent recalculation
  const resourceInfo = useMemo(() => {
    if (!selectedNode) return null;
    
    const resourceType = getResourceTypeById(selectedNode.type);
    const schema = resourceSchemas[selectedNode.type];
    
    return { resourceType, schema };
  }, [selectedNode?.type]);

  // Empty state when no node is selected
  if (!selectedNode || !resourceInfo) {
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

  const { resourceType, schema } = resourceInfo;

  return (
    <div className="w-72 sm:w-80 lg:w-80 border-l bg-background">
      <ScrollArea className="h-screen">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Properties Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <img 
                  src={resourceType.iconUrl} 
                  alt={resourceType.label}
                  className="h-4 w-4 sm:h-5 sm:w-5 object-contain"
                />
                <CardTitle className="text-base sm:text-lg">{resourceType.label}</CardTitle>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {selectedNode.data.label}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {schema.fields.map((field) => {
                  const properties = selectedNode.data.properties as Record<string, any>;
                  const currentValue = properties[field.name] ?? field.defaultValue;
                  
                  return (
                    <PropertyFieldRenderer
                      key={field.name}
                      field={field}
                      currentValue={currentValue}
                      validationError={validationErrors[field.name]}
                      onPropertyChange={handlePropertyChange}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base sm:text-lg">AI Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAnalysis && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {analysisError && (
                <div className="text-xs sm:text-sm text-destructive">
                  {analysisError}
                </div>
              )}

              {aiAnalysis && !isLoadingAnalysis && !analysisError && (
                <div className="space-y-4">
                  {/* Analysis Summary */}
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {aiAnalysis.analysis}
                    </p>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <h4 className="text-xs sm:text-sm font-semibold">Suggestions</h4>
                    </div>
                    <ul className="space-y-2">
                      {aiAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cost Estimate */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <h4 className="text-xs sm:text-sm font-semibold">Cost Estimate</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {aiAnalysis.cost_est}
                    </p>
                  </div>
                </div>
              )}

              {!aiAnalysis && !isLoadingAnalysis && !analysisError && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  AI analysis will appear here
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
