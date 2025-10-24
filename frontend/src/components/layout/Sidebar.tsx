"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  ClipboardList,
  Settings,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogoutConfirmation } from "@/components/common/LogoutConfirmation";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Leads",
    href: "/dashboard/leads",
    icon: UserPlus,
  },
  {
    name: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    name: "Policy Templates",
    href: "/dashboard/policy-templates",
    icon: ClipboardList,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { user, logout } = useAuth();

  // Handle escape key to close mobile menu and keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      // Navigation shortcuts (Alt + number)
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        const keyNumber = parseInt(event.key);
        if (keyNumber >= 1 && keyNumber <= navigation.length) {
          event.preventDefault();
          const targetHref = navigation[keyNumber - 1].href;
          window.location.href = targetHref;
          return;
        }
      }

      // Enhanced keyboard navigation for sidebar
      if (isMobileMenuOpen || window.innerWidth >= 1024) {
        const focusableElements = Array.from(
          sidebarRef.current?.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) || []
        ) as HTMLElement[];

        const currentIndex = focusableElements.indexOf(
          document.activeElement as HTMLElement
        );

        if (
          event.key === "ArrowDown" &&
          currentIndex < focusableElements.length - 1
        ) {
          event.preventDefault();
          focusableElements[currentIndex + 1]?.focus();
        } else if (event.key === "ArrowUp" && currentIndex > 0) {
          event.preventDefault();
          focusableElements[currentIndex - 1]?.focus();
        } else if (event.key === "Home" && focusableElements.length > 0) {
          event.preventDefault();
          focusableElements[0]?.focus();
        } else if (event.key === "End" && focusableElements.length > 0) {
          event.preventDefault();
          focusableElements[focusableElements.length - 1]?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Focus management for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen && sidebarRef.current) {
      const firstFocusableElement = sidebarRef.current.querySelector(
        'a, button, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusableElement?.focus();
    }
  }, [isMobileMenuOpen]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirmation(false);
    logout();
    closeMobileMenu();
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          ref={menuButtonRef}
          variant="outline"
          size="sm"
          onClick={handleMobileMenuToggle}
          className="bg-background shadow-md"
          aria-label={
            isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-sidebar"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Menu className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="mobile-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          className
        )}
        aria-label="Main navigation sidebar"
        role="complementary"
      >
        <div className="flex flex-col h-full">
          {/* Skip to main content link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Skip to main content
          </a>

          {/* Logo/Brand */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-border">
            <h1 className="text-xl font-bold text-foreground" role="banner">
              Insurance CRM
            </h1>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 px-4 py-6 space-y-2"
            role="navigation"
            aria-label="Primary navigation"
          >
            {navigation.map((item, index) => {
              const isActive = pathname === item.href;
              const shortcutKey = (index + 1).toString();

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group",
                    isActive
                      ? "bg-accent text-accent-foreground border-r-2 border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  aria-describedby={`nav-shortcut-${index}`}
                  title={`Navigate to ${item.name} (Alt+${shortcutKey})`}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive
                        ? "text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.name}</span>
                  <span
                    id={`nav-shortcut-${index}`}
                    className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Keyboard shortcut: Alt+${shortcutKey}`}
                  >
                    Alt+{shortcutKey}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-border space-y-3">
            {/* User Info */}
            <div className="flex items-center space-x-3 px-2 py-2 bg-muted rounded-md">
              <div className="flex-shrink-0">
                <User
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogoutClick}
              variant="outline"
              size="sm"
              className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 focus:ring-2 focus:ring-destructive focus:ring-offset-2"
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Log out
            </Button>

            {/* App Version */}
            <p
              className="text-xs text-muted-foreground text-center"
              role="contentinfo"
            >
              Insurance CRM v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmation
        isOpen={showLogoutConfirmation}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        userName={user?.name}
      />
    </>
  );
}
