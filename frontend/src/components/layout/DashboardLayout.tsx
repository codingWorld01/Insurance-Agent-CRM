'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProtectedRoute } from './ProtectedRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SkipNavigation } from '@/components/common/SkipNavigation';
import { DashboardProvider } from '@/context/DashboardContext';
import { useAuth } from '@/context/AuthContext';
import { useKeyboardShortcuts, createLogoutShortcut } from '@/hooks/useKeyboardShortcuts';
import { useState } from 'react';
import { LogoutConfirmation } from '@/components/common/LogoutConfirmation';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const pathname = usePathname();
  
  // Determine page title based on pathname if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/dashboard/leads')) return 'Leads';
    if (pathname.startsWith('/dashboard/clients')) return 'Clients';
    if (pathname.startsWith('/dashboard/policy-templates')) return 'Policy Templates';
    
    // Fallback to capitalizing the last segment of the path
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) : 'Dashboard';
  };
  
  const pageTitle = getPageTitle();
  const { user, logout } = useAuth();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const handleLogoutShortcut = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirmation(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts([
    createLogoutShortcut(handleLogoutShortcut)
  ]);

  return (
    <ProtectedRoute>
      <DashboardProvider>
        <SkipNavigation />
        <div className="flex h-screen bg-background">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            {/* Header */}
            <Header title={pageTitle} />
            
            {/* Page content */}
            <main 
              id="main-content" 
              className="flex-1 overflow-y-auto custom-scrollbar safe-area-inset-bottom"
              role="main"
              aria-label={`${pageTitle} page content`}
            >
              <div className="p-4 sm:p-6 max-w-7xl mx-auto">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>

        {/* Global Logout Confirmation Dialog */}
        <LogoutConfirmation
          isOpen={showLogoutConfirmation}
          onClose={handleLogoutCancel}
          onConfirm={handleLogoutConfirm}
          userName={user?.name}
        />
      </DashboardProvider>
    </ProtectedRoute>
  );
}