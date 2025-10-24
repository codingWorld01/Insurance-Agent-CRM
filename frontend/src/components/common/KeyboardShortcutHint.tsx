'use client';

import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

export function KeyboardShortcutHint() {
  const handleClick = () => {
    alert('Keyboard Shortcuts:\n\n• Ctrl + Shift + L: Quick logout\n• Shift + ?: Show help (coming soon)');
  };

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
      aria-label="Show keyboard shortcuts"
      title="Keyboard shortcuts"
    >
      <Keyboard className="h-4 w-4" />
    </Button>
  );
}