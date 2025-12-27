"use client";

import { memo, useMemo, useCallback } from 'react';
import { PolicyTemplateWithStats, PolicyTemplateSort, InsuranceType } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MoreHorizontal,
  Eye,
  Shield,
  Heart,
  Car,
  Home,
  Building2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Pagination } from '@/components/common/Pagination';

interface PolicyTemplatesTableProps {
  templates: PolicyTemplateWithStats[];
  loading: boolean;
  sort?: PolicyTemplateSort;
  onSort: (field: PolicyTemplateSort['field']) => void;
  onEdit: (template: PolicyTemplateWithStats) => void;
  onDelete: (template: PolicyTemplateWithStats) => void;
  onViewDetails: (template: PolicyTemplateWithStats) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

const PolicyTypeIcon = memo(({ type }: { type: InsuranceType }) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (type) {
    case 'Life':
      return <Heart {...iconProps} />;
    case 'Health':
      return <Shield {...iconProps} />;
    case 'Auto':
      return <Car {...iconProps} />;
    case 'Home':
      return <Home {...iconProps} />;
    case 'Business':
      return <Building2 {...iconProps} />;
    default:
      return <Shield {...iconProps} />;
  }
});

PolicyTypeIcon.displayName = 'PolicyTypeIcon';

export const PolicyTemplatesTable = memo(function PolicyTemplatesTable({
  templates,
  loading,
  sort,
  onSort,
  onEdit,
  onDelete,
  onViewDetails,
  pagination,
  onPageChange,
}: PolicyTemplatesTableProps) {
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const getSortIcon = useCallback((field: PolicyTemplateSort['field']) => {
    if (!sort || sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sort.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  }, [sort]);

  const SortableHeader = memo(({ 
    field, 
    children, 
    className = "" 
  }: { 
    field: PolicyTemplateSort['field']; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium hover:bg-transparent"
        onClick={() => onSort(field)}
      >
        <span className="flex items-center gap-1">
          {children}
          {getSortIcon(field)}
        </span>
      </Button>
    </TableHead>
  ));

  SortableHeader.displayName = 'SortableHeader';

  const PolicyTemplateRow = memo(({ 
    template, 
    onViewDetails, 
    onEdit, 
    onDelete, 
    formatDate 
  }: {
    template: PolicyTemplateWithStats;
    onViewDetails: (template: PolicyTemplateWithStats) => void;
    onEdit: (template: PolicyTemplateWithStats) => void;
    onDelete: (template: PolicyTemplateWithStats) => void;
    formatDate: (dateString: string) => string;
  }) => (
    <TableRow 
      className="transition-colors hover:bg-accent/50 cursor-pointer"
      onClick={() => onViewDetails(template)}
    >
      <TableCell className="font-medium">
        <button
          onClick={() => onViewDetails(template)}
          className="truncate max-w-32 hover:text-primary text-left font-medium"
        >
          {template.policyNumber}
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <PolicyTypeIcon type={template.policyType} />
          <span className="truncate max-w-24">{template.policyType}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="truncate max-w-32">{template.provider}</div>
      </TableCell>
      <TableCell>
        <div className="truncate max-w-48" title={template.description || 'No description'}>
          {template.description || (
            <span className="text-muted-foreground italic">No description</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {template.instanceCount}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={template.activeInstanceCount > 0 ? "default" : "secondary"}>
          {template.activeInstanceCount}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(template.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Actions for policy template ${template.policyNumber}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(template)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(template)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Template
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(template)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  ));

  PolicyTemplateRow.displayName = 'PolicyTemplateRow';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          {/* Mobile skeleton */}
          <div className="block lg:hidden">
            <div className="space-y-4 p-4" role="status" aria-label="Loading policy templates">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="flex gap-1">
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading policy templates...</span>
            </div>
          </div>

          {/* Desktop skeleton */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Pagination skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-64" />
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="text-center py-12 bg-muted/30" role="status">
          <div className="text-muted-foreground text-lg mb-2">No policy templates found</div>
          <div className="text-muted-foreground/70">Try adjusting your filters or add a new policy template</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        {/* Mobile card view for small screens */}
        <div className="block lg:hidden">
          <div className="space-y-4 p-4">
            {templates.map((template) => (
              <div 
                key={template.id} 
                className="bg-card border rounded-lg p-4 shadow-sm transition-colors hover:bg-accent/50 cursor-pointer"
                onClick={() => onViewDetails(template)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <PolicyTypeIcon type={template.policyType} />
                      <button
                        onClick={() => onViewDetails(template)}
                        className="font-medium text-foreground hover:text-primary truncate text-left"
                      >
                        {template.policyNumber}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {template.policyType} • {template.provider}
                    </p>
                    {template.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {template.instanceCount} clients
                      </Badge>
                      <Badge variant={template.activeInstanceCount > 0 ? "default" : "secondary"}>
                        {template.activeInstanceCount} active
                      </Badge>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Template
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(template)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Template
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop table view */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="policyNumber">Policy Number</SortableHeader>
                <SortableHeader field="policyType">Type</SortableHeader>
                <SortableHeader field="provider">Provider</SortableHeader>
                <TableHead>Description</TableHead>
                <SortableHeader field="instanceCount">Clients</SortableHeader>
                <SortableHeader field="activeInstanceCount">Active</SortableHeader>
                <SortableHeader field="createdAt">Created</SortableHeader>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <PolicyTemplateRow
                  key={template.id}
                  template={template}
                  onViewDetails={onViewDetails}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  formatDate={formatDate}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={onPageChange}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
        showInfo={true}
      />
    </div>
  );
});