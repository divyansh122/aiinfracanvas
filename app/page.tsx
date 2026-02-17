'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import Canvas from '@/components/canvas';
import PropertiesPanel from '@/components/properties-panel';
import { CodeDisplayModal } from '@/components/code-display-modal';
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog';
import { ErrorBoundary } from '@/components/error-boundary';
import { DeploymentTerminal } from '@/components/deployment-terminal';
import { CanvasProvider, useCanvas } from '@/lib/canvas-context';
import { generateTerraform } from '@/lib/terraform-generator';
import { useKeyboardShortcuts } from '@/lib/use-keyboard-shortcuts';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Code, Menu, X, Settings, Loader2, Keyboard, Play } from 'lucide-react';
import { Toaster, toast } from 'sonner';

function HomeContent() {
  const { state, setError } = useCanvas();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const code = generateTerraform(state.nodes, state.edges);
      setGeneratedCode(code);
      setIsModalOpen(true);
      
      toast.success('Terraform code generated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate code';
      setError(errorMessage);
      toast.error('Code generation failed', {
        description: errorMessage,
      });
      console.error('Code generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasNodes = state.nodes.length > 0;

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onGenerateCode: handleGenerateCode,
    enabled: true,
  });

  return (
    <>
      <div className="flex flex-col h-screen">
        {/* Header with Generate Code button */}
        <header className="border-b bg-background px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile menu toggle for sidebar */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold truncate">InfraCanvas</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Visual Infrastructure Builder</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Keyboard shortcuts help button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShortcuts(true)}
                  aria-label="Keyboard shortcuts"
                >
                  <Keyboard className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Keyboard shortcuts (Ctrl+/)</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Mobile toggle for properties panel */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
                  aria-label="Toggle properties"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle properties panel</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Simulate Deployment button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowSimulator(true)}
                  variant="outline"
                  size="default"
                  disabled={!hasNodes}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Simulate Deployment</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Simulate deployment process</p>
                {!hasNodes && <p className="text-xs opacity-75 mt-1">Add resources to canvas first</p>}
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleGenerateCode} 
                  size="default" 
                  disabled={!hasNodes || isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Code className="h-4 w-4" />
                      <span className="hidden sm:inline">Generate Code</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate Terraform code (Ctrl+G)</p>
                {!hasNodes && <p className="text-xs opacity-75 mt-1">Add resources to canvas first</p>}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main layout: Sidebar | Canvas | Properties Panel */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar - hidden on mobile by default, toggleable */}
          <div className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:relative
            z-30 lg:z-auto
            transition-transform duration-300 ease-in-out
            h-[calc(100vh-73px)] lg:h-auto
          `}>
            <Sidebar />
          </div>
          
          {/* Overlay for mobile sidebar */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          
          {/* Canvas - takes full width on mobile */}
          <div className="flex-1 min-w-0">
            <Canvas />
          </div>
          
          {/* Properties Panel - hidden on mobile by default, toggleable */}
          <div className={`
            ${isPropertiesOpen ? 'translate-x-0' : 'translate-x-full'}
            lg:translate-x-0
            fixed lg:relative
            right-0
            z-30 lg:z-auto
            transition-transform duration-300 ease-in-out
            h-[calc(100vh-73px)] lg:h-auto
          `}>
            <PropertiesPanel />
          </div>
          
          {/* Overlay for mobile properties panel */}
          {isPropertiesOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
              onClick={() => setIsPropertiesOpen(false)}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      <CodeDisplayModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        code={generatedCode}
      />
      
      <DeploymentTerminal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
        nodes={state.nodes}
        edges={state.edges}
      />
      
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />
      
      <Toaster position="bottom-right" richColors />
    </>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <CanvasProvider>
        <HomeContent />
      </CanvasProvider>
    </ErrorBoundary>
  );
}
