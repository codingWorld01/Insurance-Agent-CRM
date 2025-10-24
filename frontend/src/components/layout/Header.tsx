'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutConfirmation } from '@/components/common/LogoutConfirmation';
import { KeyboardShortcutHint } from '@/components/common/KeyboardShortcutHint';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirmation(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };

  return (
    <header className="bg-background border-b border-border px-4 sm:px-6 py-4" role="banner">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div className="flex items-center min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground ml-12 lg:ml-0 truncate">
            {title}
          </h1>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Keyboard Shortcuts Help */}
          <KeyboardShortcutHint />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`User menu for ${user?.name || user?.email}`}
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline-block max-w-32 truncate">
                  {user?.name || user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                <div className="font-medium truncate text-foreground">{user?.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogoutClick} 
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmation
        isOpen={showLogoutConfirmation}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        userName={user?.name}
      />
    </header>
  );
}