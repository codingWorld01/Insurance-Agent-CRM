"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Shield, 
  Heart, 
  Car, 
  Home, 
  Building2,
  Filter,
  X,
  Users
} from 'lucide-react'
import { SearchInput } from '@/components/common/SearchInput'
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ValidationErrorDisplay } from '@/components/common/ValidationErrorDisplay'
import { PolicyTemplateFilters as PolicyTemplateFiltersType, InsuranceType } from '@/types'
import { validateFilters, sanitizeSearchQuery, debounce } from '@/utils/errorHandling'

interface PolicyTemplateFiltersProps {
  filters: PolicyTemplateFiltersType
  onFiltersChange: (filters: PolicyTemplateFiltersType) => void
  availableProviders: string[]
  totalCount: number
  filteredCount: number
  className?: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

// Policy type options with icons
const policyTypeOptions: MultiSelectOption[] = [
  { label: 'Life Insurance', value: 'Life', icon: Heart },
  { label: 'Health Insurance', value: 'Health', icon: Shield },
  { label: 'Auto Insurance', value: 'Auto', icon: Car },
  { label: 'Home Insurance', value: 'Home', icon: Home },
  { label: 'Business Insurance', value: 'Business', icon: Building2 },
]

// Has instances options
const hasInstancesOptions = [
  { label: 'All Templates', value: 'all' },
  { label: 'With Clients', value: 'true' },
  { label: 'Without Clients', value: 'false' },
]

export function PolicyTemplateFilters({
  filters,
  onFiltersChange,
  availableProviders,
  totalCount,
  filteredCount,
  className,
  loading = false,
  error = null,
  onRetry
}: PolicyTemplateFiltersProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [searchValue, setSearchValue] = useState(filters.search || '')

  // Helper function to update filters
  const updateFilter = useCallback(<K extends keyof PolicyTemplateFiltersType>(
    key: K,
    value: PolicyTemplateFiltersType[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }, [filters, onFiltersChange])

  // Debounced search handler
  const debouncedSearchChange = useMemo(
    () => debounce((value: string) => {
      const sanitized = sanitizeSearchQuery(value)
      updateFilter('search', sanitized || undefined)
    }, 300),
    [updateFilter]
  )

  // Handle search input changes with debouncing
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    debouncedSearchChange(value)
  }

  // Validate filters whenever they change
  useEffect(() => {
    const errors = validateFilters(filters)
    setValidationErrors(errors)
  }, [filters])

  // Clear all filters
  const clearAllFilters = () => {
    setSearchValue('')
    onFiltersChange({})
  }

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.policyTypes?.length) count++
    if (filters.providers?.length) count++
    if (filters.hasInstances !== undefined) count++
    return count
  }

  // Convert providers to multi-select options
  const providerOptions: MultiSelectOption[] = availableProviders.map(provider => ({
    label: provider,
    value: provider,
  }))

  const activeFilterCount = getActiveFilterCount()

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
              {loading && (
                <Badge variant="outline" className="ml-2">
                  Loading...
                </Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                disabled={loading}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <ValidationErrorDisplay
              errors={validationErrors}
              variant="warning"
              title="Filter Validation Issues"
              onDismiss={() => setValidationErrors([])}
            />
          )}

          {/* General Error */}
          {error && (
            <ValidationErrorDisplay
              errors={[error]}
              variant="destructive"
              title="Filter Error"
              onDismiss={onRetry}
            />
          )}

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Search
              </label>
              <SearchInput
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Policy number, provider..."
                className="w-full"
                aria-label="Search policy templates by policy number or provider"
              />
            </div>

            {/* Policy Types */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Policy Types
              </label>
              <MultiSelect
                options={policyTypeOptions}
                selected={filters.policyTypes || []}
                onChange={(selected) => 
                  updateFilter('policyTypes', selected.length > 0 ? selected as InsuranceType[] : undefined)
                }
                placeholder="Select types..."
                className="w-full"
                disabled={loading}
              />
            </div>

            {/* Providers */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Providers
              </label>
              <MultiSelect
                options={providerOptions}
                selected={filters.providers || []}
                onChange={(selected) => 
                  updateFilter('providers', selected.length > 0 ? selected : undefined)
                }
                placeholder="Select providers..."
                className="w-full"
                disabled={loading}
              />
            </div>

            {/* Has Instances Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Client Association
              </label>
              <Select
                value={
                  filters.hasInstances === undefined 
                    ? 'all' 
                    : filters.hasInstances.toString()
                }
                onValueChange={(value) => {
                  if (value === 'all') {
                    updateFilter('hasInstances', undefined)
                  } else {
                    updateFilter('hasInstances', value === 'true')
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select association..." />
                </SelectTrigger>
                <SelectContent>
                  {hasInstancesOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.value === 'true' && <Users className="h-4 w-4" />}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              {filteredCount === totalCount ? (
                <span>Showing all {totalCount} templates</span>
              ) : (
                <span>
                  Showing {filteredCount} of {totalCount} templates
                </span>
              )}
            </div>
            
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}