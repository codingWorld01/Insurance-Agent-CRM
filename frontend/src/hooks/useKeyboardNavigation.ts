'use client';

import { useEffect, useRef, useCallback } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  loop?: boolean;
  selector?: string;
  onEscape?: () => void;
  onEnter?: (element: HTMLElement) => void;
  onArrowKey?: (direction: 'up' | 'down' | 'left' | 'right', element: HTMLElement) => void;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    enabled = true,
    loop = true,
    selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    onEscape,
    onEnter,
    onArrowKey,
  } = options;

  const containerRef = useRef<HTMLElement>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const elements = Array.from(
      containerRef.current.querySelectorAll(selector)
    ) as HTMLElement[];
    
    return elements.filter(
      (element) =>
        !element.hasAttribute('disabled') &&
        !element.getAttribute('aria-hidden') &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0
    );
  }, [selector]);

  const focusElement = useCallback((element: HTMLElement) => {
    element.focus();
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      );

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onEscape?.();
          break;

        case 'Enter':
        case ' ':
          if (document.activeElement && onEnter) {
            event.preventDefault();
            onEnter(document.activeElement as HTMLElement);
          }
          break;

        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          if (onArrowKey) {
            onArrowKey(
              event.key === 'ArrowDown' ? 'down' : 'right',
              document.activeElement as HTMLElement
            );
          } else {
            const nextIndex = currentIndex + 1;
            const targetIndex = loop && nextIndex >= focusableElements.length ? 0 : nextIndex;
            if (targetIndex < focusableElements.length) {
              focusElement(focusableElements[targetIndex]);
            }
          }
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          if (onArrowKey) {
            onArrowKey(
              event.key === 'ArrowUp' ? 'up' : 'left',
              document.activeElement as HTMLElement
            );
          } else {
            const prevIndex = currentIndex - 1;
            const targetIndex = loop && prevIndex < 0 ? focusableElements.length - 1 : prevIndex;
            if (targetIndex >= 0) {
              focusElement(focusableElements[targetIndex]);
            }
          }
          break;

        case 'Home':
          event.preventDefault();
          if (focusableElements.length > 0) {
            focusElement(focusableElements[0]);
          }
          break;

        case 'End':
          event.preventDefault();
          if (focusableElements.length > 0) {
            focusElement(focusableElements[focusableElements.length - 1]);
          }
          break;
      }
    },
    [enabled, getFocusableElements, focusElement, loop, onEscape, onEnter, onArrowKey]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusElement(focusableElements[0]);
    }
  }, [getFocusableElements, focusElement]);

  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusElement(focusableElements[focusableElements.length - 1]);
    }
  }, [getFocusableElements, focusElement]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    getFocusableElements,
  };
}

// Hook for managing focus trap (useful for modals)
export function useFocusTrap(isActive: boolean = true) {
  const { containerRef, focusFirst } = useKeyboardNavigation({
    enabled: isActive,
    loop: true,
  });

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Focus first element when trap becomes active
    const timer = setTimeout(() => {
      focusFirst();
    }, 0);

    // Store the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    return () => {
      clearTimeout(timer);
      // Restore focus to previously focused element
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  }, [isActive, focusFirst, containerRef]);

  return containerRef;
}

// Hook for roving tabindex pattern (useful for toolbars, menus)
export function useRovingTabindex(orientation: 'horizontal' | 'vertical' = 'horizontal') {
  const containerRef = useRef<HTMLElement>(null);

  const updateTabindex = useCallback((activeElement: HTMLElement) => {
    if (!containerRef.current) return;

    const focusableElements = Array.from(
      containerRef.current.querySelectorAll('[role="tab"], [role="menuitem"], [role="option"]')
    ) as HTMLElement[];

    focusableElements.forEach((element) => {
      element.setAttribute('tabindex', element === activeElement ? '0' : '-1');
    });
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll('[tabindex="0"]')
      ) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const currentElement = document.activeElement as HTMLElement;
      const currentIndex = focusableElements.indexOf(currentElement);

      let nextElement: HTMLElement | null = null;

      switch (event.key) {
        case orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown':
          event.preventDefault();
          nextElement = focusableElements[currentIndex + 1] || focusableElements[0];
          break;

        case orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp':
          event.preventDefault();
          nextElement = focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
          break;

        case 'Home':
          event.preventDefault();
          nextElement = focusableElements[0];
          break;

        case 'End':
          event.preventDefault();
          nextElement = focusableElements[focusableElements.length - 1];
          break;
      }

      if (nextElement) {
        updateTabindex(nextElement);
        nextElement.focus();
      }
    },
    [orientation, updateTabindex]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]); // containerRef is intentionally omitted as it's a ref

  return { containerRef, updateTabindex };
}