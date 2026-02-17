// Keyboard shortcuts hook for common canvas actions
'use client';

import { useEffect, useCallback } from 'react';
import { useCanvas } from './canvas-context';
import { Node } from '@/types';
import { toast } from 'sonner';

interface KeyboardShortcutsOptions {
  onGenerateCode?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const { onGenerateCode, enabled = true } = options;
  const { state, deleteNode, selectNode, addNode, setNodes } = useCanvas();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Delete selected node (Delete or Backspace)
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        state.selectedNodeId &&
        !modKey
      ) {
        event.preventDefault();
        const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId);
        if (selectedNode) {
          deleteNode(state.selectedNodeId);
          toast.success(`${selectedNode.data.label} deleted`);
        }
        return;
      }

      // Deselect node (Escape)
      if (event.key === 'Escape' && state.selectedNodeId) {
        event.preventDefault();
        selectNode(null);
        return;
      }

      // Generate code (Ctrl/Cmd + G)
      if (modKey && event.key === 'g') {
        event.preventDefault();
        if (state.nodes.length > 0 && onGenerateCode) {
          onGenerateCode();
        } else if (state.nodes.length === 0) {
          toast.error('No nodes to generate code from');
        }
        return;
      }

      // Select all nodes (Ctrl/Cmd + A)
      if (modKey && event.key === 'a') {
        event.preventDefault();
        if (state.nodes.length > 0) {
          // Select the first node (React Flow handles multi-select differently)
          selectNode(state.nodes[0].id);
          toast.info('Node selected');
        }
        return;
      }

      // Copy selected node (Ctrl/Cmd + C)
      if (modKey && event.key === 'c' && state.selectedNodeId) {
        event.preventDefault();
        const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId);
        if (selectedNode) {
          // Store in sessionStorage for paste operation
          sessionStorage.setItem('copiedNode', JSON.stringify(selectedNode));
          toast.success('Node copied');
        }
        return;
      }

      // Paste node (Ctrl/Cmd + V)
      if (modKey && event.key === 'v') {
        event.preventDefault();
        const copiedNodeStr = sessionStorage.getItem('copiedNode');
        if (copiedNodeStr) {
          try {
            const copiedNode = JSON.parse(copiedNodeStr) as Node;
            // Create a new node with offset position
            const newNode: Node = {
              ...copiedNode,
              id: `${copiedNode.type}-${Date.now()}`,
              position: {
                x: copiedNode.position.x + 50,
                y: copiedNode.position.y + 50,
              },
            };
            addNode(newNode);
            selectNode(newNode.id);
            toast.success('Node pasted');
          } catch (error) {
            toast.error('Failed to paste node');
          }
        }
        return;
      }

      // Duplicate selected node (Ctrl/Cmd + D)
      if (modKey && event.key === 'd' && state.selectedNodeId) {
        event.preventDefault();
        const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId);
        if (selectedNode) {
          const newNode: Node = {
            ...selectedNode,
            id: `${selectedNode.type}-${Date.now()}`,
            position: {
              x: selectedNode.position.x + 50,
              y: selectedNode.position.y + 50,
            },
          };
          addNode(newNode);
          selectNode(newNode.id);
          toast.success('Node duplicated');
        }
        return;
      }
    },
    [
      enabled,
      state.selectedNodeId,
      state.nodes,
      deleteNode,
      selectNode,
      addNode,
      onGenerateCode,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return null;
}
