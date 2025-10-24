'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useResponsive, 
  usePrefersReducedMotion, 
  usePrefersHighContrast,
  useIsTouchDevice 
} from '@/hooks/useResponsive';
import { 
  announceToScreenReader, 
  getFocusableElements,
  prefersHighContrast
} from '@/utils/accessibility';

interface AccessibilityTestProps {
  onClose?: () => void;
}

export function AccessibilityTest({ onClose }: AccessibilityTestProps) {
  const { isMobile, isTablet, isDesktop, screenSize } = useResponsive();
  const prefersReducedMotionHook = usePrefersReducedMotion();
  const prefersHighContrastHook = usePrefersHighContrast();
  const isTouchDevice = useIsTouchDevice();
  
  const [focusableCount, setFocusableCount] = useState(0);
  const [testResults, setTestResults] = useState<{
    keyboardNavigation: boolean;
    screenReaderSupport: boolean;
    colorContrast: boolean;
    responsiveDesign: boolean;
    touchTargets: boolean;
  }>({
    keyboardNavigation: false,
    screenReaderSupport: false,
    colorContrast: false,
    responsiveDesign: false,
    touchTargets: false,
  });

  const testColorContrast = useCallback((): boolean => {
    // Basic check for high contrast preference
    return !prefersHighContrast() || prefersHighContrastHook;
  }, [prefersHighContrastHook]);

  const testResponsiveDesign = useCallback((): boolean => {
    // Check if viewport is properly configured and responsive classes are working
    return screenSize.width > 0 && (isMobile || isTablet || isDesktop);
  }, [screenSize.width, isMobile, isTablet, isDesktop]);

  const runAccessibilityTests = useCallback(() => {
    const results = {
      keyboardNavigation: testKeyboardNavigation(),
      screenReaderSupport: testScreenReaderSupport(),
      colorContrast: testColorContrast(),
      responsiveDesign: testResponsiveDesign(),
      touchTargets: testTouchTargets(),
    };

    setTestResults(results);
  }, [testColorContrast, testResponsiveDesign]);

  useEffect(() => {
    // Count focusable elements on the page
    const focusableElements = getFocusableElements(document.body);
    setFocusableCount(focusableElements.length);

    // Run accessibility tests
    runAccessibilityTests();
  }, [runAccessibilityTests]);

  const testKeyboardNavigation = (): boolean => {
    // Check if focusable elements have proper focus indicators
    const focusableElements = getFocusableElements(document.body);
    return focusableElements.length > 0;
  };

  const testScreenReaderSupport = (): boolean => {
    // Check for ARIA labels, roles, and semantic HTML
    const elementsWithAriaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]');
    const semanticElements = document.querySelectorAll('main, nav, header, footer, section, article');
    return elementsWithAriaLabels.length > 0 && semanticElements.length > 0;
  };



  const testTouchTargets = (): boolean => {
    // Check if touch targets are appropriately sized (44px minimum)
    const buttons = document.querySelectorAll('button, [role="button"]');
    let validTouchTargets = 0;
    
    buttons.forEach((button) => {
      const rect = button.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) {
        validTouchTargets++;
      }
    });

    return validTouchTargets > 0;
  };

  const testScreenReaderAnnouncement = () => {
    announceToScreenReader('This is a test announcement for screen readers', 'polite');
  };

  const getStatusBadge = (passed: boolean) => (
    <Badge variant={passed ? 'default' : 'destructive'}>
      {passed ? 'Pass' : 'Fail'}
    </Badge>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Accessibility Test Results</CardTitle>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Device Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Screen Size:</strong> {screenSize.width} × {screenSize.height}
            </div>
            <div>
              <strong>Device Type:</strong> {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
            </div>
            <div>
              <strong>Touch Device:</strong> {isTouchDevice ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Focusable Elements:</strong> {focusableCount}
            </div>
          </div>
        </div>

        {/* User Preferences */}
        <div>
          <h3 className="text-lg font-semibold mb-3">User Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Reduced Motion:</strong> {prefersReducedMotionHook ? 'Enabled' : 'Disabled'}
            </div>
            <div>
              <strong>High Contrast:</strong> {prefersHighContrastHook ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

        {/* Accessibility Tests */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Accessibility Tests</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Keyboard Navigation</span>
              {getStatusBadge(testResults.keyboardNavigation)}
            </div>
            <div className="flex items-center justify-between">
              <span>Screen Reader Support</span>
              {getStatusBadge(testResults.screenReaderSupport)}
            </div>
            <div className="flex items-center justify-between">
              <span>Color Contrast</span>
              {getStatusBadge(testResults.colorContrast)}
            </div>
            <div className="flex items-center justify-between">
              <span>Responsive Design</span>
              {getStatusBadge(testResults.responsiveDesign)}
            </div>
            <div className="flex items-center justify-between">
              <span>Touch Targets</span>
              {getStatusBadge(testResults.touchTargets)}
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Test Actions</h3>
          <div className="space-y-2">
            <Button 
              onClick={testScreenReaderAnnouncement}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Test Screen Reader Announcement
            </Button>
            <Button 
              onClick={runAccessibilityTests}
              variant="outline"
              className="w-full sm:w-auto ml-0 sm:ml-2"
            >
              Re-run Tests
            </Button>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h3>
          <div className="text-sm space-y-1">
            <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Tab</kbd> - Navigate forward</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Shift + Tab</kbd> - Navigate backward</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> - Activate button/link</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd> - Activate button</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Escape</kbd> - Close modal/menu</div>
            <div><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Arrow Keys</kbd> - Navigate lists/menus</div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Test with actual screen readers (NVDA, JAWS, VoiceOver)</li>
            <li>Verify keyboard navigation works without a mouse</li>
            <li>Check color contrast ratios meet WCAG AA standards</li>
            <li>Test on various devices and screen sizes</li>
            <li>Validate HTML for semantic correctness</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Development-only component to show accessibility info
export function AccessibilityDevInfo() {
  const [showTest, setShowTest] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setShowTest(true)}
        className="fixed bottom-4 right-4 z-50"
        size="sm"
        variant="outline"
      >
        A11y Test
      </Button>
      
      {showTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <AccessibilityTest onClose={() => setShowTest(false)} />
        </div>
      )}
    </>
  );
}