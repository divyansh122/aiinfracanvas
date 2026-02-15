'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

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
  const isEmpty = code.trim() === '# No resources to generate';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
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
              : 'Review the generated Terraform configuration below'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 w-full rounded-md border overflow-auto">
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
            {code}
          </SyntaxHighlighter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
