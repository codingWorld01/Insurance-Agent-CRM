"use client";

import { memo, useMemo, useCallback } from 'react';
import { PolicyTemplateWithStats, PolicyTemplateSort, InsuranceType } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualTable } from '@/components/ui/virtual-scroll';
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
import { Pagination } from '@/components/common/Pagination';

interface VirtualizedPolicyTemplatesTableProps {
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
  containerHeight?: number;
  enableVirtualization?: boolean;
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

export const VirtualizedPolicyTemplatesTable = memo(function VirtualizedPolicyTemplatesTable({
  templates,
  loading,
  sort,
  onSort,
  onEdit,
  onDelete,
  onViewDetails,
  pagination,
  onPageChange,
  containerHeight = 600,
  enableVirtualization = true,
}: VirtualizedPolicyTemplatesTableProps) {
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

  const renderHeader = useCallback(() => (
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
    </Table>
  ), [getSortIcon, onSort]);

  const PolicyTemplateRow = memo(({ 
    template, 
    index 
  }: {
    template: PolicyTemplateWithStats;
    index: number;
  }) => (
    <div className="w-full border-b border-border">
      <Table>
        <TableBody>
          <TableRow className="transition-colors hover:bg-accent/50">
            <TableCell className="font-medium w-[140px]">
              <button
                onClick={() => onViewDetails(template)}
                className="truncate max-w-32 hover:text-primary text-left font-medium"
              >
                {template.policyNumber}
              </button>
            </TableCell>
            <TableCell className="w-[120px]">
              <div className="flex items-center gap-2">
                <PolicyTypeIcon type={template.policyType} />
                <span className="truncate max-w-24">{template.policyType}</span>
              </div>
            </TableCell>
            <TableCell className="w-[140px]">
              <div className="truncate max-w-32">{template.provider}</div>
            </TableCell>
            <TableCell className="w-[200px]">
              <div className="truncate max-w-48" title={template.description || 'No description'}>
                {template.description || (
                  <span className="text-muted-foreground italic">No description</span>
                )}
              </div>
            </TableCell>
            <TableCell className="w-[80px]">
              <Badge variant="secondary">
                {template.instanceCount}
              </Badge>
            </TableCell>
            <TableCell className="w-[80px]">
              <Badge variant={template.activeInstanceCount > 0 ? "default" : "secondary"}>
                {template.activeInstanceCount}
              </Badge>
            </TableCell>
            <TableCell className="w-[120px] text-muted-foreground">
              {formatDate(template.createdAt)}
            </TableCell>
            <TableCell className="text-right w-[80px]">
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
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ));

  PolicyTemplateRow.displayName = 'PolicyTemplateRow';

  const renderRow = useCallback((template: PolicyTemplateWithStats, index: number) => (
    <PolicyTemplateRow template={template} index={index} />
  ), []);

  // Determine if we should use virtualization
  const shouldVirtualize = enableVirtualization && templates.length > 50;
  const itemHeight = 65; // Height of each row in pixels

  if (templates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="text-center py-12 bg-muted/30" role="status">
            <div className="text-muted-foreground text-lg mb-2">No policy templates found</div>
            <div className="text-muted-foreground/70">Try adjusting your filters or add a new policy template</div>
          </div>
        </div>
        
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
  }

  return (
    <div className="space-y-4">
      {shouldVirtualize ? (
        <VirtualTable
          items={templates}
          itemHeight={itemHeight}
          containerHeight={containerHeight}
          renderHeader={renderHeader}
          renderRow={renderRow}
          loading={loading}
          emptyMessage="No policy templates found"
          className="w-full"
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
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
                  <TableRow 
                    key={template.id} 
                    className="transition-colors hover:bg-accent/50"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Performance indicator */}
      {shouldVirtualize && (
        <div className="text-xs text-muted-foreground text-center">
          Virtual scrolling enabled for {templates.length} items
        </div>
      )}

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