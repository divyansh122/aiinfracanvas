'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectionAnalysisResponse {
  message: string;
  terraform_snippet: string;
}

interface ConnectionIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceNode: { id: string; type: string; data: any } | null;
  targetNode: { id: string; type: string; data: any } | null;
}

export function ConnectionIntelligenceModal({
  isOpen,
  onClose,
  sourceNode,
  targetNode,
}: ConnectionIntelligenceModalProps) {
  const [analysis, setAnalysis] = useState<ConnectionAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !sourceNode || !targetNode) {
      setAnalysis(null);
      setError(null);
      return;
    }

    const fetchConnectionAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'connection',
            source: {
              id: sourceNode.id,
              type: sourceNode.type,
              data: sourceNode.data,
            },
            target: {
              id: targetNode.id,
              type: targetNode.type,
              data: targetNode.data,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch connection analysis');
        }

        const data: ConnectionAnalysisResponse = await response.json();
        setAnalysis(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch connection intelligence';
        setError(errorMessage);
        console.error('Connection analysis error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnectionAnalysis();
  }, [isOpen, sourceNode, targetNode]);

  const handleCopyCode = async () => {
    if (!analysis?.terraform_snippet) return;

    try {
      await navigator.clipboard.writeText(analysis.terraform_snippet);
      setCopied(true);
      toast.success('Terraform code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
      console.error('Copy error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <DialogTitle>Connection Intelligence</DialogTitle>
          </div>
          {sourceNode && targetNode && (
            <DialogDescription>
              Connection from {sourceNode.type} to {targetNode.type}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg">
              {error}
            </div>
          )}

          {analysis && !isLoading && !error && (
            <>
              {/* Connection Explanation */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Connection Details</h3>
                <p className="text-sm text-muted-foreground">{analysis.message}</p>
              </div>

              {/* Terraform Code Snippet */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Terraform Code</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{analysis.terraform_snippet}</code>
                </pre>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
