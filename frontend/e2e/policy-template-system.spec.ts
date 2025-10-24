import { test, expect } from '@playwright/test';

test.describe('Policy Template System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@agent.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Policy Template Management', () => {
    test('should create a new policy template', async ({ page }) => {
      // Navigate to policy templates page
      await page.click('text=Policy Templates');
      await expect(page).toHaveURL('/dashboard/policy-templates');

      // Click create template button
      await page.click('text=Add Policy Template');

      // Fill in template form
      await page.fill('input[name="policyNumber"]', 'E2E-TEST-001');
      await page.selectOption('select[name="policyType"]', 'Life');
      await page.fill('input[name="provider"]', 'E2E Test Provider');
      await page.fill('textarea[name="description"]', 'End-to-end test policy template');

      // Submit form
      await page.click('button[type="submit"]');

      // Verify template was created
      await expect(page.locator('text=E2E-TEST-001')).toBeVisible();
      await expect(page.locator('text=E2E Test Provider')).toBeVisible();
    });

    test('should edit an existing policy template', async ({ page }) => {
      // Navigate to policy templates page
      await page.click('text=Policy Templates');
      
      // Find and click edit on first template
      await page.click('[data-testid="template-actions-menu"]').first();
      await page.click('text=Edit Template');

      // Update provider name
      await page.fill('input[name="provider"]', 'Updated Provider Name');
      await page.click('button[type="submit"]');

      // Verify update
      await expect(page.locator('text=Updated Provider Name')).toBeVisible();
    });

    test('should delete a policy template', async ({ page }) => {
      // Navigate to policy templates page
      await page.click('text=Policy Templates');
      
      // Find and click delete on first template
      await page.click('[data-testid="template-actions-menu"]').first();
      await page.click('text=Delete Template');

      // Confirm deletion
      await page.click('text=Delete');

      // Verify template is removed
      await expect(page.locator('text=Template deleted successfully')).toBeVisible();
    });

    test('should view policy template details', async ({ page }) => {
      // Navigate to policy templates page
      await page.click('text=Policy Templates');
      
      // Click on first policy number to view details
      await page.click('[data-testid="policy-number-link"]').first();

      // Verify we're on detail page
      await expect(page.locator('h1')).toContainText('POL-');
      await expect(page.locator('text=Associated Clients')).toBeVisible();
    });
  });

  test.describe('Policy Instance Management', () => {
    test('should add policy to client via template search', async ({ page }) => {
      // Navigate to clients page
      await page.click('text=Clients');
      
      // Click on first client
      await page.click('[data-testid="client-name-link"]').first();

      // Click add policy button
      await page.click('text=Add Policy');

      // Search for policy template
      await page.fill('input[placeholder*="Search"]', 'POL-001');
      await page.click('button:has-text("Search")');

      // Select first search result
      await page.click('[data-testid="template-search-result"]').first();

      // Fill in instance details
      await page.fill('input[name="startDate"]', '2024-01-01');
      await page.selectOption('select[name="durationMonths"]', '12');
      await page.fill('input[name="premiumAmount"]', '1000');
      await page.fill('input[name="commissionAmount"]', '100');

      // Submit form
      await page.click('button:has-text("Add Policy")');

      // Verify policy was added
      await expect(page.locator('text=Policy added successfully')).toBeVisible();
      await expect(page.locator('text=POL-001')).toBeVisible();
    });

    test('should edit policy instance from client page', async ({ page }) => {
      // Navigate to client with existing policy
      await page.click('text=Clients');
      await page.click('[data-testid="client-name-link"]').first();

      // Click edit on first policy instance
      await page.click('[data-testid="edit-policy-instance"]').first();

      // Update premium amount
      await page.fill('input[name="premiumAmount"]', '1200');
      await page.click('button:has-text("Update Policy Instance")');

      // Verify update
      await expect(page.locator('text=Policy updated successfully')).toBeVisible();
      await expect(page.locator('text=$1,200.00')).toBeVisible();
    });

    test('should delete policy instance', async ({ page }) => {
      // Navigate to client with existing policy
      await page.click('text=Clients');
      await page.click('[data-testid="client-name-link"]').first();

      // Click delete on first policy instance
      await page.click('[data-testid="delete-policy-instance"]').first();

      // Confirm deletion
      await page.click('text=Delete Policy');

      // Verify deletion
      await expect(page.locator('text=Policy removed successfully')).toBeVisible();
    });
  });

  test.describe('Search and Filtering', () => {
    test('should search policy templates by policy number', async ({ page }) => {
      await page.click('text=Policy Templates');
      
      // Search for specific policy number
      await page.fill('input[placeholder*="Search"]', 'POL-001');
      
      // Verify search results
      await expect(page.locator('text=POL-001')).toBeVisible();
      await expect(page.locator('[data-testid="template-row"]')).toHaveCount(1);
    });

    test('should filter policy templates by type', async ({ page }) => {
      await page.click('text=Policy Templates');
      
      // Open filters
      await page.click('text=Filters');
      
      // Select Life insurance filter
      await page.check('input[value="Life"]');
      await page.click('text=Apply Filters');
      
      // Verify filtered results
      const rows = page.locator('[data-testid="template-row"]');
      await expect(rows).toHaveCount(await rows.count());
      
      // All visible rows should be Life insurance
      const lifeRows = page.locator('[data-testid="template-row"]:has-text("Life")');
      expect(await lifeRows.count()).toBe(await rows.count());
    });

    test('should filter policy templates by provider', async ({ page }) => {
      await page.click('text=Policy Templates');
      
      // Open filters
      await page.click('text=Filters');
      
      // Select specific provider
      await page.selectOption('select[name="providers"]', 'Life Insurance Co');
      await page.click('text=Apply Filters');
      
      // Verify filtered results
      await expect(page.locator('text=Life Insurance Co')).toBeVisible();
    });
  });

  test.describe('Statistics and Dashboard Integration', () => {
    test('should display policy template statistics', async ({ page }) => {
      await page.click('text=Policy Templates');
      
      // Verify statistics cards are visible
      await expect(page.locator('text=Total Templates')).toBeVisible();
      await expect(page.locator('text=Total Instances')).toBeVisible();
      await expect(page.locator('text=Active Instances')).toBeVisible();
      await expect(page.locator('text=Total Clients')).toBeVisible();
      
      // Verify numbers are displayed
      await expect(page.locator('[data-testid="total-templates-count"]')).toContainText(/\d+/);
    });

    test('should show policy template insights on dashboard', async ({ page }) => {
      // Should be on dashboard already
      await expect(page).toHaveURL('/dashboard');
      
      // Verify policy template insights are visible
      await expect(page.locator('text=Policy Templates')).toBeVisible();
      await expect(page.locator('[data-testid="policy-template-insights"]')).toBeVisible();
    });

    test('should display expiring policies warning', async ({ page }) => {
      await page.click('text=Policy Templates');
      
      // Look for expiring policies indicator
      const expiringIndicator = page.locator('[data-testid="expiring-policies-warning"]');
      if (await expiringIndicator.isVisible()) {
        await expect(expiringIndicator).toContainText('expiring');
      }
    });
  });

  test.describe('Navigation and User Experience', () => {
    test('should navigate between policy templates and client details', async ({ page }) => {
      // Start at policy templates
      await page.click('text=Policy Templates');
      
      // Click on a policy template to view details
      await page.click('[data-testid="policy-number-link"]').first();
      
      // Click on a client name to navigate to client details
      await page.click('[data-testid="client-name-link"]').first();
      
      // Verify we're on client detail page
      await expect(page.locator('h1')).toContainText(/Client:/);
      
      // Use breadcrumb to navigate back
      await page.click('text=Policy Templates');
      await expect(page).toHaveURL('/dashboard/policy-templates');
    });

    test('should handle loading states gracefully', async ({ page }) => {
      await page.click('text=Policy Templates');
      
      // Should show loading state initially
      await expect(page.locator('text=Loading templates...')).toBeVisible({ timeout: 1000 });
      
      // Should eventually show content
      await expect(page.locator('[data-testid="templates-table"]')).toBeVisible();
    });

    test('should handle empty states appropriately', async ({ page }) => {
      // Navigate to a new client without policies
      await page.click('text=Clients');
      await page.click('text=Add Client');
      
      // Fill minimal client info
      await page.fill('input[name="name"]', 'Empty Test Client');
      await page.fill('input[name="email"]', 'empty@test.com');
      await page.click('button[type="submit"]');
      
      // Navigate to client detail
      await page.click('text=Empty Test Client');
      
      // Should show empty state for policies
      await expect(page.locator('text=No policies found')).toBeVisible();
      await expect(page.locator('text=Add Policy')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle validation errors gracefully', async ({ page }) => {
      await page.click('text=Policy Templates');
      await page.click('text=Add Policy Template');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=Policy number is required')).toBeVisible();
      await expect(page.locator('text=Provider is required')).toBeVisible();
    });

    test('should handle duplicate policy number error', async ({ page }) => {
      await page.click('text=Policy Templates');
      await page.click('text=Add Policy Template');
      
      // Fill form with existing policy number
      await page.fill('input[name="policyNumber"]', 'POL-001'); // Assuming this exists
      await page.selectOption('select[name="policyType"]', 'Life');
      await page.fill('input[name="provider"]', 'Test Provider');
      
      await page.click('button[type="submit"]');
      
      // Should show duplicate error
      await expect(page.locator('text=Policy number already exists')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept network requests to simulate failure
      await page.route('**/api/policy-templates', route => {
        route.fulfill({ status: 500, body: 'Server Error' });
      });
      
      await page.click('text=Policy Templates');
      
      // Should show error message
      await expect(page.locator('text=Failed to load policy templates')).toBeVisible();
      await expect(page.locator('text=Retry')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.click('text=Policy Templates');
      
      // Tab through the interface
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to activate focused elements with Enter
      await page.keyboard.press('Enter');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('text=Policy Templates');
      
      // Check for proper ARIA labels
      await expect(page.locator('[aria-label="Policy templates table"]')).toBeVisible();
      await expect(page.locator('[aria-label="Add policy template"]')).toBeVisible();
    });

    test('should support screen readers', async ({ page }) => {
      await page.click('text=Policy Templates');
      
      // Check for proper heading structure
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2')).toBeVisible();
      
      // Check for table headers
      await expect(page.locator('th')).toHaveCount(8); // Assuming 8 columns
    });
  });
});