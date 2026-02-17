'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, AlertCircle, MessageSquare, Code as CodeIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ChatRefiner } from '@/components/chat-refiner';

interface CodeDisplayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  title?: string;
}

export function CodeDisplayModal({
  open,
  onOpenChange,
  code,
  title = 'Generated Terraform Code',
}: CodeDisplayModalProps) {
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState(code);
  const isEmpty = code.trim() === '# No resources to generate';

  // Update currentCode when code prop changes
  useEffect(() => {
    setCurrentCode(code);
  }, [code]);

  const handleCodeUpdate = (newCode: string) => {
    setCurrentCode(newCode);
    toast.success('Code updated by AI');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      toast.error('Failed to copy code', {
        description: 'Please try selecting and copying manually',
      });
    }
  };

  const renderCodeBlock = () => {
    try {
      return (
        <SyntaxHighlighter
          language="hcl"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            maxWidth: '100%',
          }}
          showLineNumbers
          wrapLongLines={false}
        >
          {currentCode}
        </SyntaxHighlighter>
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to render code';
      setRenderError(errorMessage);
      return (
        <div className="p-4 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">
            Failed to render syntax highlighting
          </p>
          <pre className="text-xs text-left bg-muted p-4 rounded overflow-auto">
            {currentCode}
          </pre>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            {!isEmpty && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="ml-4"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEmpty 
              ? 'Add resources to the canvas to generate Terraform code'
              : 'Review and refine the generated Terraform configuration using the chat interface, or copy it to a .tf file.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="code" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code" className="gap-2">
              <CodeIcon className="h-4 w-4" />
              Code View
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Refiner
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="flex-1 min-h-0 mt-4">
            <div className="h-full w-full rounded-md border overflow-auto">
              {renderCodeBlock()}
            </div>
          </TabsContent>
          
          <TabsContent value="chat" className="flex-1 min-h-0 mt-4">
            <div className="h-full">
              <ChatRefiner
                currentCode={currentCode}
                onCodeUpdate={handleCodeUpdate}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
