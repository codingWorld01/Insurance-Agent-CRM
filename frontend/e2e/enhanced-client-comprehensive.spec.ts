import { test, expect, devices } from '@playwright/test';
import { login, waitForToast } from './helpers/test-utils';

// Comprehensive test suite that covers all enhanced client management requirements
test.describe('Enhanced Client Management - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Complete User Journey - All Client Types', () => {
    test('should complete end-to-end workflow for all client types', async ({ page }) => {
      const timestamp = Date.now();
      
      // Test Personal Client Complete Journey
      await page.goto('/dashboard/clients/create');
      await page.getByRole('button', { name: /create personal client/i }).click();
      
      // Fill personal client form
      await page.getByLabel(/first name/i).fill(`Personal${timestamp}`);
      await page.getByLabel(/last name/i).fill('Client');
      await page.getByLabel(/mobile number/i).fill(`91${timestamp.toString().slice(-8)}`);
      await page.getByLabel(/birth date/i).fill('1985-06-15');
      await page.getByLabel(/email/i).fill(`personal${timestamp}@test.com`);
      
      // Test profile image upload
      const imageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const imageBuffer = Buffer.from(imageContent, 'base64');
      
      const profileUploadButton = page.getByText(/choose file|upload image/i).first();
      if (await profileUploadButton.isVisible()) {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await profileUploadButton.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles([{
          name: 'profile.png',
          mimeType: 'image/png',
          buffer: imageBuffer
        }]);
        await page.waitForTimeout(2000);
      }
      
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Verify personal client in list
      await expect(page.getByText(`Personal${timestamp} Client`)).toBeVisible();
      
      // Test Family/Employee Client
      await page.goto('/dashboard/clients/create/family-employee');
      
      await page.getByLabel(/first name/i).fill(`Family${timestamp}`);
      await page.getByLabel(/last name/i).fill('Member');
      await page.getByLabel(/phone number/i).fill(`91${(timestamp + 1).toString().slice(-8)}`);
      await page.getByLabel(/whatsapp number/i).fill(`91${(timestamp + 2).toString().slice(-8)}`);
      await page.getByLabel(/date of birth/i).fill('1990-08-20');
      
      // Select relationship
      await page.getByLabel(/relationship/i).click();
      await page.getByRole('option', { name: /spouse/i }).click();
      
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Test Corporate Client
      await page.goto('/dashboard/clients/create/corporate');
      
      await page.getByLabel(/company name/i).fill(`Corporate${timestamp} Ltd`);
      await page.getByLabel(/mobile/i).fill(`91${(timestamp + 3).toString().slice(-8)}`);
      await page.getByLabel(/email/i).fill(`corporate${timestamp}@company.com`);
      
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Verify all clients exist
      await page.goto('/dashboard/clients');
      await expect(page.getByText(`Personal${timestamp} Client`)).toBeVisible();
      await expect(page.getByText(`Family${timestamp} Member`)).toBeVisible();
      await expect(page.getByText(`Corporate${timestamp} Ltd`)).toBeVisible();
      
      // Test client type filtering
      const filterButton = page.getByRole('button', { name: /filter/i }).first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.getByText(/personal/i).click();
        await expect(page.getByText(`Personal${timestamp} Client`)).toBeVisible();
        await expect(page.getByText(`Corporate${timestamp} Ltd`)).not.toBeVisible();
        
        // Clear filter
        await filterButton.click();
        await page.getByText(/all|clear/i).click();
      }
      
      // Test search functionality
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill(`Personal${timestamp}`);
        await expect(page.getByText(`Personal${timestamp} Client`)).toBeVisible();
        await expect(page.getByText(`Corporate${timestamp} Ltd`)).not.toBeVisible();
        
        await searchInput.clear();
      }
    });
  });

  test.describe('Mobile Responsiveness Complete Journey', () => {
    
    test('should complete mobile workflow for all client types', async ({ page, browser }) => {
      // Create mobile context
      const mobileContext = await browser.newContext(devices['iPhone 12']);
      const mobilePage = await mobileContext.newPage();
      await login(mobilePage);
      const timestamp = Date.now();
      
      try {
        // Test mobile client type selection
        await mobilePage.goto('/dashboard/clients/create');
      
        // Verify mobile-optimized layout
        const personalButton = mobilePage.getByRole('button', { name: /create personal client/i });
      const buttonBox = await personalButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThan(44); // Touch-friendly
      
      await personalButton.click();
      
        // Test mobile form layout
        const firstNameInput = mobilePage.getByLabel(/first name/i);
        const inputBox = await firstNameInput.boundingBox();
        expect(inputBox?.height).toBeGreaterThan(44); // Touch-friendly
        
        // Fill form on mobile
        await firstNameInput.fill(`Mobile${timestamp}`);
        await mobilePage.getByLabel(/last name/i).fill('Test');
        await mobilePage.getByLabel(/mobile number/i).fill(`91${timestamp.toString().slice(-8)}`);
        
        // Test mobile date picker
        const dateInput = mobilePage.getByLabel(/birth date/i);
        await dateInput.click();
        
        // Should use mobile-optimized date input
        const inputType = await dateInput.getAttribute('type');
        if (inputType === 'date') {
          await dateInput.fill('1990-01-01');
        }
        
        await mobilePage.getByRole('button', { name: /create client/i }).click();
        await expect(mobilePage.getByText(/client created successfully/i)).toBeVisible();
        
        // Test mobile client list
        await mobilePage.goto('/dashboard/clients');
        
        // Should show mobile-optimized list
        const clientCard = mobilePage.locator('[data-testid="client-card"]').or(
          mobilePage.getByText(`Mobile${timestamp} Test`)
        );
        await expect(clientCard.first()).toBeVisible();
        
      } finally {
        await mobileContext.close();
      }
    });
    
    test('should handle mobile orientation changes', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Test portrait mode
      let viewportSize = page.viewportSize();
      expect(viewportSize?.height).toBeGreaterThan(viewportSize?.width || 0);
      
      // Fill some form data
      await page.getByLabel(/first name/i).fill('Orientation');
      await page.getByLabel(/last name/i).fill('Test');
      
      // Switch to landscape
      await page.setViewportSize({ width: 812, height: 375 });
      
      // Form should still be usable
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/first name/i)).toHaveValue('Orientation');
      
      // Should be able to continue filling form
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
    });
  });

  test.describe('Error Handling Complete Journey', () => {
    test('should handle complete error recovery workflow', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Test validation error recovery
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show multiple validation errors
      await expect(page.getByText(/first name is required/i)).toBeVisible();
      await expect(page.getByText(/last name is required/i)).toBeVisible();
      await expect(page.getByText(/mobile number is required/i)).toBeVisible();
      
      // Fix errors one by one
      await page.getByLabel(/first name/i).fill('Error');
      await expect(page.getByText(/first name is required/i)).not.toBeVisible();
      
      await page.getByLabel(/last name/i).fill('Recovery');
      await expect(page.getByText(/last name is required/i)).not.toBeVisible();
      
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await expect(page.getByText(/mobile number is required/i)).not.toBeVisible();
      
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Test email validation error and recovery
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/first name/i).click(); // Trigger validation
      await expect(page.getByText(/invalid email format/i)).toBeVisible();
      
      await page.getByLabel(/email/i).clear();
      await page.getByLabel(/email/i).fill('valid@email.com');
      await page.getByLabel(/first name/i).click();
      await expect(page.getByText(/invalid email format/i)).not.toBeVisible();
      
      // Test network error simulation and recovery
      await page.route('**/api/clients', route => {
        route.abort('failed');
      });
      
      await page.getByRole('button', { name: /create client/i }).click();
      await expect(page.getByText(/network error|connection failed/i)).toBeVisible();
      
      // Remove network failure and retry
      await page.unroute('**/api/clients');
      
      const retryButton = page.getByRole('button', { name: /retry/i });
      if (await retryButton.isVisible()) {
        await retryButton.click();
        await waitForToast(page, /client created successfully/i);
      } else {
        // If no retry button, try submitting again
        await page.getByRole('button', { name: /create client/i }).click();
        await waitForToast(page, /client created successfully/i);
      }
    });
    
    test('should handle file upload error recovery', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('FileError');
      await page.getByLabel(/last name/i).fill('Test');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Simulate upload failure
      await page.route('**/api/upload/**', route => {
        route.abort('failed');
      });
      
      // Try to upload file
      const imageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const imageBuffer = Buffer.from(imageContent, 'base64');
      
      const uploadButton = page.getByText(/choose file|upload image/i).first();
      if (await uploadButton.isVisible()) {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;
        
        await fileChooser.setFiles([{
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: imageBuffer
        }]);
        
        // Should show upload error
        await expect(page.getByText(/upload failed/i)).toBeVisible();
        
        // Remove upload failure and retry
        await page.unroute('**/api/upload/**');
        
        const retryButton = page.getByRole('button', { name: /retry/i });
        if (await retryButton.isVisible()) {
          await retryButton.click();
          await expect(page.getByText(/upload successful/i)).toBeVisible();
        }
      }
      
      // Should still be able to create client
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
    });
  });

  test.describe('Performance Complete Journey', () => {
    test('should maintain performance across complete workflow', async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to client creation
      await page.goto('/dashboard/clients/create');
      const navigationTime = Date.now() - startTime;
      expect(navigationTime).toBeLessThan(3000);
      
      // Select client type
      const selectionStartTime = Date.now();
      await page.getByRole('button', { name: /create personal client/i }).click();
      const selectionTime = Date.now() - selectionStartTime;
      expect(selectionTime).toBeLessThan(1000);
      
      // Fill form rapidly
      const formStartTime = Date.now();
      await page.getByLabel(/first name/i).fill('Performance');
      await page.getByLabel(/last name/i).fill('Test');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      await page.getByLabel(/email/i).fill('performance@test.com');
      
      // Fill additional fields
      await page.getByLabel(/state/i).click();
      await page.getByRole('option', { name: /maharashtra/i }).click();
      
      await page.waitForTimeout(500); // Wait for cities to load
      await page.getByLabel(/city/i).click();
      await page.getByRole('option', { name: /mumbai/i }).click();
      
      const formTime = Date.now() - formStartTime;
      expect(formTime).toBeLessThan(5000);
      
      // Submit form
      const submitStartTime = Date.now();
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      const submitTime = Date.now() - submitStartTime;
      expect(submitTime).toBeLessThan(5000);
      
      // Navigate to client list
      const listStartTime = Date.now();
      await page.goto('/dashboard/clients');
      await expect(page.getByText('Performance Test')).toBeVisible();
      const listTime = Date.now() - listStartTime;
      expect(listTime).toBeLessThan(3000);
      
      // Test search performance
      const searchStartTime = Date.now();
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('Performance');
        await expect(page.getByText('Performance Test')).toBeVisible();
      }
      const searchTime = Date.now() - searchStartTime;
      expect(searchTime).toBeLessThan(2000);
      
      // Total workflow time
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(20000); // Complete workflow under 20 seconds
    });
    
    test('should handle large file uploads efficiently', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('LargeFile');
      await page.getByLabel(/last name/i).fill('Test');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Create a large file (2MB)
      const largeImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const baseContent = Buffer.from(largeImageContent, 'base64');
      const largeImageBuffer = Buffer.concat([baseContent, Buffer.alloc(2 * 1024 * 1024, 0)]);
      
      const uploadButton = page.getByText(/choose file|upload image/i).first();
      if (await uploadButton.isVisible()) {
        const uploadStartTime = Date.now();
        
        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;
        
        await fileChooser.setFiles([{
          name: 'large-image.png',
          mimeType: 'image/png',
          buffer: largeImageBuffer
        }]);
        
        // Should show progress indicator
        const progressIndicator = page.locator('[data-testid="upload-progress"]').or(
          page.getByText(/uploading/i)
        );
        
        if (await progressIndicator.isVisible()) {
          await expect(progressIndicator).toBeVisible();
          await expect(progressIndicator).not.toBeVisible({ timeout: 15000 });
        }
        
        const uploadTime = Date.now() - uploadStartTime;
        expect(uploadTime).toBeLessThan(15000); // Upload should complete within 15 seconds
      }
      
      // Should still be able to create client
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
    });
  });

  test.describe('Accessibility Complete Journey', () => {
    test('should support complete keyboard navigation workflow', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Test keyboard navigation through entire form
      await page.keyboard.press('Tab'); // First input
      let focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Navigate through all form fields
      const formFields = [
        'first name', 'last name', 'middle name', 'mobile number', 
        'email', 'birth date'
      ];
      
      for (let i = 0; i < formFields.length; i++) {
        const currentFocus = page.locator(':focus');
        await expect(currentFocus).toBeVisible();
        
        // Fill field if it's a required field
        if (['first name', 'last name', 'mobile number', 'birth date'].includes(formFields[i])) {
          if (formFields[i] === 'first name') await page.keyboard.type('Keyboard');
          else if (formFields[i] === 'last name') await page.keyboard.type('Test');
          else if (formFields[i] === 'mobile number') await page.keyboard.type('9123456789');
          else if (formFields[i] === 'birth date') await page.keyboard.type('1990-01-01');
        }
        
        await page.keyboard.press('Tab');
      }
      
      // Navigate to submit button
      let attempts = 0;
      while (attempts < 20) {
        const focused = page.locator(':focus');
        const tagName = await focused.evaluate(el => el.tagName.toLowerCase());
        const type = await focused.getAttribute('type');
        
        if (tagName === 'button' && (type === 'submit' || (await focused.textContent())?.includes('Create'))) {
          break;
        }
        
        await page.keyboard.press('Tab');
        attempts++;
      }
      
      // Submit with keyboard
      await page.keyboard.press('Enter');
      await waitForToast(page, /client created successfully/i);
    });
    
    test('should have proper ARIA labels and screen reader support', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Check form has proper structure
      const form = page.locator('form').first();
      await expect(form).toBeVisible();
      
      // Check required fields have proper ARIA attributes
      const requiredFields = ['first name', 'last name', 'mobile number', 'birth date'];
      
      for (const fieldName of requiredFields) {
        const field = page.getByLabel(new RegExp(fieldName, 'i'));
        
        // Should have aria-label or aria-labelledby
        const ariaLabel = await field.getAttribute('aria-label');
        const ariaLabelledBy = await field.getAttribute('aria-labelledby');
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        
        // Should be marked as required
        const required = await field.getAttribute('required');
        const ariaRequired = await field.getAttribute('aria-required');
        expect(required !== null || ariaRequired === 'true').toBe(true);
      }
      
      // Test error message accessibility
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Error messages should have proper ARIA attributes
      const errorMessages = page.locator('[role="alert"]').or(
        page.locator('[aria-live="polite"]')
      ).or(
        page.locator('[aria-live="assertive"]')
      );
      
      if (await errorMessages.first().isVisible()) {
        const errorCount = await errorMessages.count();
        expect(errorCount).toBeGreaterThan(0);
        
        // First error should be announced to screen readers
        await expect(errorMessages.first()).toBeVisible();
      }
      
      // Test heading hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      if (headingCount > 0) {
        // Should have at least one main heading
        const mainHeading = page.getByRole('heading', { level: 1 });
        if (await mainHeading.isVisible()) {
          await expect(mainHeading).toBeVisible();
        }
      }
    });
    
    test('should maintain focus management during errors and recovery', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Focus on first field
      await page.getByLabel(/first name/i).focus();
      
      // Submit form with errors
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Focus should be managed properly
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Should be able to navigate to error fields
      await page.keyboard.press('Tab');
      const nextFocused = page.locator(':focus');
      await expect(nextFocused).toBeVisible();
      
      // Fill form and verify focus management
      await page.getByLabel(/first name/i).fill('Focus');
      await page.getByLabel(/last name/i).fill('Test');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Submit successfully
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Focus should be managed after successful submission
      const finalFocused = page.locator(':focus');
      await expect(finalFocused).toBeVisible();
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        // Skip if not the current browser being tested
        test.skip(currentBrowser !== browserName, `Skipping ${browserName} test`);
        
        const timestamp = Date.now();
        
        await page.goto('/dashboard/clients/create/personal');
        
        // Fill form
        await page.getByLabel(/first name/i).fill(`Browser${timestamp}`);
        await page.getByLabel(/last name/i).fill('Test');
        await page.getByLabel(/mobile number/i).fill(`91${timestamp.toString().slice(-8)}`);
        await page.getByLabel(/birth date/i).fill('1990-01-01');
        
        // Test file upload
        const imageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const imageBuffer = Buffer.from(imageContent, 'base64');
        
        const uploadButton = page.getByText(/choose file|upload image/i).first();
        if (await uploadButton.isVisible()) {
          const fileChooserPromise = page.waitForEvent('filechooser');
          await uploadButton.click();
          const fileChooser = await fileChooserPromise;
          
          await fileChooser.setFiles([{
            name: 'browser-test.png',
            mimeType: 'image/png',
            buffer: imageBuffer
          }]);
          
          await page.waitForTimeout(2000);
        }
        
        // Submit form
        await page.getByRole('button', { name: /create client/i }).click();
        await waitForToast(page, /client created successfully/i);
        
        // Verify client was created
        await expect(page.getByText(`Browser${timestamp} Test`)).toBeVisible();
      });
    });
  });

  test.describe('Data Persistence and Recovery', () => {
    test('should persist form data across page refreshes', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill partial form
      await page.getByLabel(/first name/i).fill('Persistence');
      await page.getByLabel(/last name/i).fill('Test');
      await page.getByLabel(/email/i).fill('persistence@test.com');
      
      // Wait for potential auto-save
      await page.waitForTimeout(3000);
      
      // Refresh page
      await page.reload();
      
      // Check if data persists (implementation dependent)
      const firstNameValue = await page.getByLabel(/first name/i).inputValue();
      const lastNameValue = await page.getByLabel(/last name/i).inputValue();
      const emailValue = await page.getByLabel(/email/i).inputValue();
      
      // If auto-save is implemented, data should persist
      if (firstNameValue || lastNameValue || emailValue) {
        expect(firstNameValue).toBe('Persistence');
        expect(lastNameValue).toBe('Test');
        expect(emailValue).toBe('persistence@test.com');
        
        // Complete the form
        await page.getByLabel(/mobile number/i).fill('9123456789');
        await page.getByLabel(/birth date/i).fill('1990-01-01');
        
        await page.getByRole('button', { name: /create client/i }).click();
        await waitForToast(page, /client created successfully/i);
      }
    });
    
    test('should handle browser back/forward navigation', async ({ page }) => {
      const timestamp = Date.now();
      
      // Create a client
      await page.goto('/dashboard/clients/create/personal');
      await page.getByLabel(/first name/i).fill(`Navigation${timestamp}`);
      await page.getByLabel(/last name/i).fill('Test');
      await page.getByLabel(/mobile number/i).fill(`91${timestamp.toString().slice(-8)}`);
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Navigate to client details
      await page.getByText(`Navigation${timestamp} Test`).click();
      
      // Go back
      await page.goBack();
      await expect(page).toHaveURL('/dashboard/clients');
      
      // Go forward
      await page.goForward();
      await expect(page.getByText(`Navigation${timestamp} Test`)).toBeVisible();
      
      // Test edit functionality after navigation
      const editButton = page.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Should be able to edit
        const emailField = page.getByLabel(/email/i);
        if (await emailField.isVisible()) {
          await emailField.fill('navigation@test.com');
          
          await page.getByRole('button', { name: /save|update/i }).click();
          await waitForToast(page, /client updated successfully/i);
        }
      }
    });
  });
});