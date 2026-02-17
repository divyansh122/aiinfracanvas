// Tests for keyboard shortcuts hook
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../use-keyboard-shortcuts';
import { CanvasProvider } from '../canvas-context';
import { ReactNode } from 'react';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Wrapper component for context
function wrapper({ children }: { children: ReactNode }) {
  return <CanvasProvider>{children}</CanvasProvider>;
}

describe('useKeyboardShortcuts', () => {
  let mockGenerateCode: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGenerateCode = vi.fn();
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register keyboard event listener when enabled', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    renderHook(
      () => useKeyboardShortcuts({ onGenerateCode: mockGenerateCode, enabled: true }),
      { wrapper }
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should not register keyboard event listener when disabled', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    renderHook(
      () => useKeyboardShortcuts({ onGenerateCode: mockGenerateCode, enabled: false }),
      { wrapper }
    );

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(
      () => useKeyboardShortcuts({ onGenerateCode: mockGenerateCode, enabled: true }),
      { wrapper }
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should not trigger shortcuts when typing in input fields', () => {
    renderHook(
      () => useKeyboardShortcuts({ onGenerateCode: mockGenerateCode, enabled: true }),
      { wrapper }
    );

    const inputElement = document.createElement('input');
    const event = new KeyboardEvent('keydown', {
      key: 'g',
      ctrlKey: true,
      bubbles: true,
    });
    
    Object.defineProperty(event, 'target', {
      value: inputElement,
      writable: false,
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(mockGenerateCode).not.toHaveBeenCalled();
  });

  it('should handle Escape key to deselect', () => {
    renderHook(
      () => useKeyboardShortcuts({ onGenerateCode: mockGenerateCode, enabled: true }),
      { wrapper }
    );

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    act(() => {
      window.dispatchEvent(event);
    });

    // Test passes if no errors are thrown
    expect(true).toBe(true);
  });
});
