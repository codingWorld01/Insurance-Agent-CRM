'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-1 text-sm text-gray-500", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;
        
        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" aria-hidden="true" />
            )}
            
            {item.href && !isLast ? (
              <Link 
                href={item.href}
                className="hover:text-gray-700 transition-colors flex items-center gap-1 truncate"
                aria-label={`Go to ${item.label}`}
              >
                {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </Link>
            ) : (
              <span 
                className={cn(
                  "flex items-center gap-1 truncate",
                  isLast ? "text-gray-900 font-medium" : "text-gray-500"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Simple breadcrumb items
export const breadcrumbItems = {
  dashboard: {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  policyTemplates: {
    label: 'Policy Templates',
    href: '/dashboard/policy-templates'
  },
  clients: {
    label: 'Clients',
    href: '/dashboard/clients'
  },
  // Add more items as needed
};