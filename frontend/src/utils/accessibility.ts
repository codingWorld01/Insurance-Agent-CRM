/**
 * Accessibility utilities for the Insurance CRM application
 */

// ARIA live region announcer
let liveRegion: HTMLElement | null = null;

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined') return;

  // Create live region if it doesn't exist
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
  }

  // Update the live region with the message
  liveRegion.textContent = message;

  // Clear the message after a short delay to allow for repeated announcements
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = '';
    }
  }, 1000);
}

// Generate unique IDs for form elements
let idCounter = 0;
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${++idCounter}`;
}

// Check if an element is focusable
export function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];

  return focusableSelectors.some(selector => element.matches(selector));
}

// Get all focusable elements within a container
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  
  return elements.filter(element => {
    // Check if element is visible
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  });
}

// Trap focus within a container (useful for modals)
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  
  if (focusableElements.length === 0) {
    return () => {};
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Focus the first element
  firstElement.focus();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

// Create ARIA describedby relationships
export function createAriaDescribedBy(elementId: string, descriptionIds: string[]): string {
  return descriptionIds.filter(id => id).join(' ');
}

// Format text for screen readers
export function formatForScreenReader(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces between camelCase
    .replace(/([0-9])([a-zA-Z])/g, '$1 $2') // Add spaces between numbers and letters
    .replace(/([a-zA-Z])([0-9])/g, '$1 $2') // Add spaces between letters and numbers
    .toLowerCase();
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Check if user prefers high contrast
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Validate color contrast ratio (simplified check)
export function hasGoodContrast(foreground: string, background: string): boolean {
  // This is a simplified implementation
  // In a real application, you might want to use a library like 'color' or 'chroma-js'
  // for more accurate contrast ratio calculations
  
  // For now, we'll do a basic check
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);
  
  const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
  
  // WCAG AA standard requires a contrast ratio of at least 4.5:1 for normal text
  return contrast >= 4.5;
}

// Calculate relative luminance (simplified)
function getLuminance(color: string): number {
  // This is a very simplified implementation
  // Convert hex to RGB and calculate luminance
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Simplified luminance calculation
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Keyboard event helpers
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  TAB: 'Tab',
} as const;

export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === KeyboardKeys.ENTER || event.key === KeyboardKeys.SPACE;
}

// ARIA roles and properties helpers
export const AriaRoles = {
  BUTTON: 'button',
  LINK: 'link',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  REGION: 'region',
  BANNER: 'banner',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
} as const;

export const AriaProperties = {
  EXPANDED: 'aria-expanded',
  SELECTED: 'aria-selected',
  CHECKED: 'aria-checked',
  DISABLED: 'aria-disabled',
  HIDDEN: 'aria-hidden',
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  CURRENT: 'aria-current',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
} as const;

// Screen reader text helpers
export function createScreenReaderText(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'sr-only';
  span.textContent = text;
  return span;
}

// Focus management
export function restoreFocus(element: HTMLElement | null) {
  if (element && typeof element.focus === 'function') {
    // Use setTimeout to ensure the element is ready to receive focus
    setTimeout(() => {
      element.focus();
    }, 0);
  }
}

// Announce page changes for single-page applications
export function announcePageChange(pageTitle: string) {
  announceToScreenReader(`Navigated to ${pageTitle}`, 'assertive');
  
  // Also update the document title
  if (typeof document !== 'undefined') {
    document.title = `${pageTitle} - Insurance CRM`;
  }
}

// Form validation announcements
export function announceFormError(fieldName: string, errorMessage: string) {
  announceToScreenReader(`Error in ${fieldName}: ${errorMessage}`, 'assertive');
}

export function announceFormSuccess(message: string) {
  announceToScreenReader(message, 'polite');
}

// Loading state announcements
export function announceLoadingStart(context: string) {
  announceToScreenReader(`Loading ${context}`, 'polite');
}

export function announceLoadingComplete(context: string) {
  announceToScreenReader(`${context} loaded`, 'polite');
}