'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import type { Node, Edge } from '@/types';

interface SecurityIntercept {
  detected: boolean;
  message: string;
  fix_action: string;
}

interface SimulationResponse {
  steps: string[];
  security_intercept: SecurityIntercept;
}

interface DeploymentTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
}

export function DeploymentTerminal({
  isOpen,
  onClose,
  nodes,
  edges,
}: DeploymentTerminalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [securityIntercept, setSecurityIntercept] = useState<SecurityIntercept | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLogs([]);
      setIsRunning(false);
      setIsPaused(false);
      setSecurityIntercept(null);
      setCurrentStep(0);
      setError(null);
      startSimulation();
    }
  }, [isOpen]);

  const startSimulation = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start simulation');
      }

      const data: SimulationResponse = await response.json();
      await animateLogs(data.steps, data.security_intercept);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setIsRunning(false);
    }
  };

  const animateLogs = async (steps: string[], intercept: SecurityIntercept) => {
    const pausePoint = Math.floor(steps.length / 2);

    for (let i = 0; i < steps.length; i++) {
      // Wait 600ms before adding each log
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setLogs(prev => [...prev, steps[i]]);
      setCurrentStep(i + 1);

      // Pause at 50% if security issue detected
      if (intercept.detected && i === pausePoint) {
        setIsPaused(true);
        setSecurityIntercept(intercept);
        setIsRunning(false);
        return; // Stop animation here
      }
    }

    // Simulation complete
    setIsRunning(false);
  };

  const handleAutoFix = async () => {
    if (!securityIntercept) return;

    // Add fix logs
    setLogs(prev => [...prev, '🤖 Applying AI Fix...']);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setLogs(prev => [...prev, securityIntercept.fix_action]);
    await new Promise(resolve => setTimeout(resolve, 600));

    // Resume animation
    setIsPaused(false);
    setIsRunning(true);

    // Continue with remaining steps
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error('Failed to resume simulation');
      }

      const data: SimulationResponse = await response.json();
      const remainingSteps = data.steps.slice(Math.floor(data.steps.length / 2) + 1);

      for (const step of remainingSteps) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setLogs(prev => [...prev, step]);
        setCurrentStep(prev => prev + 1);
      }

      setIsRunning(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume simulation';
      setError(errorMessage);
      setIsRunning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="font-mono text-lg">
            Deployment Simulation
          </DialogTitle>
        </DialogHeader>

        {/* Terminal Window */}
        <div className="flex-1 min-h-0 bg-black text-green-400 font-mono text-sm p-6 overflow-y-auto">
          {error ? (
            <div className="text-red-500">
              <p>Error: {error}</p>
            </div>
          ) : (
            <>
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}

              {isRunning && (
                <div className="animate-pulse">▊</div>
              )}

              {/* Security Warning */}
              {isPaused && securityIntercept && (
                <div className="mt-4 p-4 border-2 border-red-500 bg-red-950/30 rounded">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-red-500">
                      <p className="font-bold mb-2">⚠️ SECURITY ALERT</p>
                      <p>{securityIntercept.message}</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleAutoFix}
                    className="bg-green-600 hover:bg-green-700 text-white font-mono"
                    size="sm"
                  >
                    🤖 AI Auto-Fix
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
