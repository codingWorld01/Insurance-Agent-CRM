"use client";

import { 
  useState, 
  useEffect, 
  useRef, 
  useMemo, 
  useCallback,
  ReactNode,
  CSSProperties 
} from 'react';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange.start, visibleRange.end]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  const offsetY = visibleRange.start * itemHeight;

  if (loading && loadingComponent) {
    return (
      <div 
        className={`overflow-auto ${className}`}
        style={{ height: containerHeight }}
      >
        {loadingComponent}
      </div>
    );
  }

  if (items.length === 0 && emptyComponent) {
    return (
      <div 
        className={`overflow-auto ${className}`}
        style={{ height: containerHeight }}
      >
        {emptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{
                height: itemHeight,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook for managing virtual scroll state
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange.start, visibleRange.end]);

  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    scrollTop,
    totalHeight,
    visibleRange,
    visibleItems,
    offsetY,
    handleScroll,
  };
}

// Virtual table component for policy templates
interface VirtualTableProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderHeader: () => ReactNode;
  renderRow: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export function VirtualTable<T>({
  items,
  itemHeight,
  containerHeight,
  renderHeader,
  renderRow,
  overscan = 5,
  className = '',
  loading = false,
  emptyMessage = 'No items found',
}: VirtualTableProps<T>) {
  const headerHeight = 40; // Standard table header height
  const scrollableHeight = containerHeight - headerHeight;

  if (loading) {
    return (
      <div className={`border rounded-lg ${className}`}>
        {renderHeader()}
        <div 
          className="flex items-center justify-center"
          style={{ height: scrollableHeight }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`border rounded-lg ${className}`}>
        {renderHeader()}
        <div 
          className="flex items-center justify-center"
          style={{ height: scrollableHeight }}
        >
          <div className="text-center text-muted-foreground">
            <p>{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {renderHeader()}
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={scrollableHeight}
        renderItem={renderRow}
        overscan={overscan}
      />
    </div>
  );
}

// Performance monitoring hook
export function useVirtualScrollPerformance() {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development' && renderCount.current % 10 === 0) {
      console.log(`Virtual scroll performance: ${renderCount.current} renders, ${timeSinceLastRender}ms since last`);
    }
  });

  return {
    renderCount: renderCount.current,
  };
}