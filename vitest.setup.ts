import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill for scrollIntoView (required by Radix UI components like Select)
Element.prototype.scrollIntoView = vi.fn();

// Polyfill for hasPointerCapture (required by Radix UI)
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();

