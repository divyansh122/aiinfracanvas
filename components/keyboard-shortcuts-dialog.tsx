// Keyboard shortcuts help dialog
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      category: 'Node Operations',
      items: [
        { keys: ['Delete', 'Backspace'], description: 'Delete selected node' },
        { keys: [modKey, 'C'], description: 'Copy selected node' },
        { keys: [modKey, 'V'], description: 'Paste node' },
        { keys: [modKey, 'D'], description: 'Duplicate selected node' },
        { keys: ['Esc'], description: 'Deselect node' },
      ],
    },
    {
      category: 'Canvas Actions',
      items: [
        { keys: [modKey, 'G'], description: 'Generate Terraform code' },
        { keys: [modKey, 'A'], description: 'Select node' },
      ],
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['Mouse Drag'], description: 'Pan canvas' },
        { keys: ['Scroll'], description: 'Zoom in/out' },
        { keys: ['Double Click'], description: 'Zoom to fit' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to work faster with InfraCanvas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold mb-3 text-foreground">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Keyboard shortcuts are disabled when typing in input fields.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
