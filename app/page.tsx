'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import Canvas from '@/components/canvas';
import PropertiesPanel from '@/components/properties-panel';
import { CodeDisplayModal } from '@/components/code-display-modal';
import { CanvasProvider, useCanvas } from '@/lib/canvas-context';
import { generateTerraform } from '@/lib/terraform-generator';
import { Button } from '@/components/ui/button';
import { Code, Menu, X, Settings } from 'lucide-react';

function HomeContent() {
  const { state } = useCanvas();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  const handleGenerateCode = () => {
    const code = generateTerraform(state.nodes, state.edges);
    setGeneratedCode(code);
    setIsModalOpen(true);
  };

  const hasNodes = state.nodes.length > 0;

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
            {/* Mobile toggle for properties panel */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
              aria-label="Toggle properties"
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={handleGenerateCode} 
              size="default" 
              disabled={!hasNodes}
              className="gap-2"
            >
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Generate Code</span>
            </Button>
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
    </>
  );
}

export default function Home() {
  return (
    <CanvasProvider>
      <HomeContent />
    </CanvasProvider>
  );
}
