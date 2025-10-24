'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showInfo?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showInfo = true,
  className = '',
}: PaginationProps) {
  const { isMobile } = useResponsive();

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = isMobile ? 1 : 2; // Show fewer pages on mobile
    const range = [];
    const rangeWithDots = [];

    // Calculate range around current page
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add first page and dots if needed
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push('...');
      }
    }

    // Add the range
    rangeWithDots.push(...range);

    // Add last page and dots if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, page: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePageChange(page);
    }
  };

  const getPageInfo = () => {
    if (!totalItems || !itemsPerPage) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return `Showing ${startItem} to ${endItem} of ${totalItems} results`;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Page info */}
      {showInfo && (
        <div className="text-sm text-gray-600 order-2 sm:order-1" role="status" aria-live="polite">
          {getPageInfo() || `Page ${currentPage} of ${totalPages}`}
        </div>
      )}

      {/* Pagination controls */}
      <nav 
        className="flex items-center gap-1 order-1 sm:order-2" 
        role="navigation" 
        aria-label="Pagination navigation"
      >
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {!isMobile && <span>Previous</span>}
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1" role="group" aria-label="Page numbers">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`dots-${index}`}
                  className="px-3 py-2 text-gray-400"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            const pageNumber = page as number;
            const isCurrentPage = pageNumber === currentPage;

            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(pageNumber)}
                onKeyDown={(e) => handleKeyDown(e, pageNumber)}
                aria-label={
                  isCurrentPage
                    ? `Current page, page ${pageNumber}`
                    : `Go to page ${pageNumber}`
                }
                aria-current={isCurrentPage ? 'page' : undefined}
                className={`min-w-[40px] ${isCurrentPage ? 'pointer-events-none' : ''}`}
                disabled={isCurrentPage}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
          className="flex items-center gap-1"
        >
          {!isMobile && <span>Next</span>}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}

// Simple pagination for smaller datasets
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: Pick<PaginationProps, 'currentPage' | 'totalPages' | 'onPageChange' | 'className'>) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm text-gray-600 px-3" role="status">
        {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}