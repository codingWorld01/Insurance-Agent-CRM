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

// Utility function to create common breadcrumb patterns
export const createBreadcrumbs = {
  dashboard: (): BreadcrumbItem => ({
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home
  }),
  
  clients: (): BreadcrumbItem => ({
    label: 'Clients',
    href: '/dashboard/clients'
  }),
  
  client: (name: string, id?: string): BreadcrumbItem => ({
    label: name,
    href: id ? `/dashboard/clients/${id}` : undefined
  }),
  
  policies: (): BreadcrumbItem => ({
    label: 'Policies',
    href: '/dashboard/policies'
  }),
  
  policyTemplates: (): BreadcrumbItem => ({
    label: 'Policy Templates',
    href: '/dashboard/policy-templates'
  }),
  
  policyTemplate: (policyNumber: string, id?: string): BreadcrumbItem => ({
    label: policyNumber,
    href: id ? `/dashboard/policy-templates/${id}` : undefined
  }),
  
  leads: (): BreadcrumbItem => ({
    label: 'Leads',
    href: '/dashboard/leads'
  }),
  
  settings: (): BreadcrumbItem => ({
    label: 'Settings',
    href: '/dashboard/settings'
  })
};