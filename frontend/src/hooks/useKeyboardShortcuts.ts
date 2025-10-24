'use client';

import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Guard against undefined event.key
      if (!event.key) return;
      
      for (const shortcut of shortcuts) {
        // Guard against undefined shortcut.key
        if (!shortcut.key) continue;
        
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
        const altMatches = !!shortcut.altKey === event.altKey;
        const metaMatches = !!shortcut.metaKey === event.metaKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common keyboard shortcuts
export const createLogoutShortcut = (onLogout: () => void): KeyboardShortcut => ({
  key: 'l',
  ctrlKey: true,
  shiftKey: true,
  callback: onLogout,
  description: 'Ctrl+Shift+L: Logout'
});

export const createSearchShortcut = (onSearch: () => void): KeyboardShortcut => ({
  key: 'k',
  ctrlKey: true,
  callback: onSearch,
  description: 'Ctrl+K: Search'
});

export const createHelpShortcut = (onHelp: () => void): KeyboardShortcut => ({
  key: '?',
  shiftKey: true,
  callback: onHelp,
  description: 'Shift+?: Show help'
});