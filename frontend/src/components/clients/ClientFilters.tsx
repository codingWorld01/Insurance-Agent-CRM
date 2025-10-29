'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  SortAsc,
  SortDesc
} from 'lucide-react';

export type SortField = 'name' | 'email' | 'createdAt' | 'age';
export type SortOrder = 'asc' | 'desc';

interface ClientFiltersProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  totalCount: number;
}

const sortOptions = [
  { field: 'name' as SortField, label: 'Name' },
  { field: 'email' as SortField, label: 'Email' },
  { field: 'createdAt' as SortField, label: 'Date Added' },
  { field: 'age' as SortField, label: 'Age' }
];

export function ClientFilters({
  sortField,
  sortOrder,
  onSortChange,
  totalCount
}: ClientFiltersProps) {
  const [isSortFilterOpen, setIsSortFilterOpen] = useState(false);

  const handleSortFieldChange = (field: SortField) => {
    if (field === sortField) {
      // Toggle order if same field
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for new field
      onSortChange(field, 'asc');
    }
    setIsSortFilterOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Sort Control */}
      <div className="flex flex-wrap gap-2 items-center">
        <DropdownMenu open={isSortFilterOpen} onOpenChange={setIsSortFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4 mr-2" />
              ) : (
                <SortDesc className="h-4 w-4 mr-2" />
              )}
              Sort by {sortOptions.find(opt => opt.field === sortField)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sortOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.field}
                checked={sortField === option.field}
                onCheckedChange={() => handleSortFieldChange(option.field)}
              >
                {option.label}
                {sortField === option.field && (
                  <span className="ml-auto">
                    {sortOrder === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                  </span>
                )}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        <span>
          {totalCount} clients total
        </span>
      </div>
    </div>
  );
}

export default ClientFilters;