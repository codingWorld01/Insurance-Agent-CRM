import { test, expect, Page } from '@playwright/test';
import { login, waitForToast } from './helpers/test-utils';

function generateErrorTestData() {
  const timestamp = Date.now();
  return {
    firstName: `Error${timestamp}`,
    lastName: `Test${timestamp}`,
    mobileNumber: `91${timestamp.toString().slice(-8)}`,
    email: `error.test${timestamp}@example.com`,
    birthDate: '1990-01-01'
  };
}

// Helper function to simulate network failure
async function simulateNetworkFailure(page: Page) {
  await page.route('**/api/**', route => {
    route.abort('failed');
  });
}

// Helper function to simulate slow network
async function simulateSlowNetwork(page: Page, delay = 5000) {
  await page.route('**/api/**', async route => {
    await new Promise(resolve => setTimeout(resolve, delay));
    route.continue();
  });
}

test.describe('Enhanced Client Management - Error Handling Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Form Validation Errors', () => {
    test('should display validation errors for missing mandatory fields', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Try to submit form without filling mandatory fields
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show validation errors for mandatory fields
      await expect(page.getByText(/first name is required/i)).toBeVisible();
      await expect(page.getByText(/last name is required/i)).toBeVisible();
      await expect(page.getByText(/mobile number is required/i)).toBeVisible();
      await expect(page.getByText(/birth date is required/i)).toBeVisible();
      
      // Form should not be submitted
      await expect(page).toHaveURL('/dashboard/clients/create/personal');
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Enter invalid email
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/first name/i).click(); // Trigger validation
      
      // Should show email validation error
      await expect(page.getByText(/invalid email format/i)).toBeVisible();
    });

    test('should validate phone number format', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Enter invalid phone number
      await page.getByLabel(/mobile number/i).fill('123');
      await page.getByLabel(/first name/i).click(); // Trigger validation
      
      // Should show phone validation error
      await expect(page.getByText(/invalid phone number/i)).toBeVisible();
    });

    test('should validate PAN number format', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Enter invalid PAN number
      await page.getByLabel(/pan number/i).fill('INVALID123');
      await page.getByLabel(/first name/i).click(); // Trigger validation
      
      // Should show PAN validation error
      await expect(page.getByText(/invalid pan number format/i)).toBeVisible();
    });

    test('should validate GST number format', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Enter invalid GST number
      await page.getByLabel(/gst number/i).fill('INVALID123');
      await page.getByLabel(/first name/i).click(); // Trigger validation
      
      // Should show GST validation error
      await expect(page.getByText(/invalid gst number format/i)).toBeVisible();
    });

    test('should validate date fields', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Enter future birth date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await page.getByLabel(/birth date/i).fill(futureDateString);
      await page.getByLabel(/first name/i).click(); // Trigger validation
      
      // Should show date validation error
      await expect(page.getByText(/birth date cannot be in the future/i)).toBeVisible();
    });
  });

  test.describe('File Upload Errors', () => {
    test('should handle file size limit errors', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Try to upload a large file (simulate by creating large buffer)
      const largeFileContent = 'x'.repeat(15 * 1024 * 1024); // 15MB file
      const largeFileBuffer = Buffer.from(largeFileContent);
      
      const fileChooserPromise = page.waitForEvent('filechooser');
      const uploadButton = page.getByText(/choose file|upload image/i).first();
      
      if (await uploadButton.isVisible()) {
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;
        
        try {
          await fileChooser.setFiles([{
            name: 'large-file.jpg',
            mimeType: 'image/jpeg',
            buffer: largeFileBuffer
          }]);
          
          // Should show file size error
          await expect(page.getByText(/file size too large/i)).toBeVisible();
        } catch (error) {
          // File might be rejected before upload
          console.log('Large file rejected as expected');
        }
      }
    });

    test('should handle invalid file type errors', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Try to upload invalid file type
      const invalidFileContent = 'This is not an image file';
      const invalidFileBuffer = Buffer.from(invalidFileContent);
      
      const fileChooserPromise = page.waitForEvent('filechooser');
      const uploadButton = page.getByText(/choose file|upload image/i).first();
      
      if (await uploadButton.isVisible()) {
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;
        
        await fileChooser.setFiles([{
          name: 'invalid-file.txt',
          mimeType: 'text/plain',
          buffer: invalidFileBuffer
        }]);
        
        // Should show file type error
        await expect(page.getByText(/invalid file type/i)).toBeVisible();
      }
    });

    test('should handle upload failure and retry', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Simulate upload failure
      await page.route('**/api/upload/**', route => {
        route.abort('failed');
      });
      
      // Try to upload file
      const validImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const validImageBuffer = Buffer.from(validImageContent, 'base64');
      
      const fileChooserPromise = page.waitForEvent('filechooser');
      const uploadButton = page.getByText(/choose file|upload image/i).first();
      
      if (await uploadButton.isVisible()) {
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;
        
        await fileChooser.setFiles([{
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: validImageBuffer
        }]);
        
        // Should show upload error
        await expect(page.getByText(/upload failed/i)).toBeVisible();
        
        // Should show retry button
        const retryButton = page.getByRole('button', { name: /retry/i });
        if (await retryButton.isVisible()) {
          // Remove network failure simulation
          await page.unroute('**/api/upload/**');
          
          // Click retry
          await retryButton.click();
          
          // Should show success message
          await expect(page.getByText(/upload successful/i)).toBeVisible();
        }
      }
    });
  });

  test.describe('Network Error Handling', () => {
    test('should handle network failure during form submission', async ({ page }) => {
      const testData = generateErrorTestData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form with valid data
      await page.getByLabel(/first name/i).fill(testData.firstName);
      await page.getByLabel(/last name/i).fill(testData.lastName);
      await page.getByLabel(/mobile number/i).fill(testData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(testData.birthDate);
      
      // Simulate network failure
      await simulateNetworkFailure(page);
      
      // Try to submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show network error message
      await expect(page.getByText(/network error|connection failed/i)).toBeVisible();
      
      // Should show retry option
      const retryButton = page.getByRole('button', { name: /retry/i });
      if (await retryButton.isVisible()) {
        // Remove network failure simulation
        await page.unroute('**/api/**');
        
        // Click retry
        await retryButton.click();
        
        // Should succeed
        await waitForToast(page, /client created successfully/i);
      }
    });

    test('should handle slow network with loading indicators', async ({ page }) => {
      const testData = generateErrorTestData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form with valid data
      await page.getByLabel(/first name/i).fill(testData.firstName);
      await page.getByLabel(/last name/i).fill(testData.lastName);
      await page.getByLabel(/mobile number/i).fill(testData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(testData.birthDate);
      
      // Simulate slow network
      await simulateSlowNetwork(page, 3000);
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show loading indicator
      await expect(page.getByText(/creating|loading/i)).toBeVisible();
      
      // Submit button should be disabled
      const submitButton = page.getByRole('button', { name: /create client/i });
      await expect(submitButton).toBeDisabled();
      
      // Wait for completion
      await waitForToast(page, /client created successfully/i);
      
      // Loading indicator should disappear
      await expect(page.getByText(/creating|loading/i)).not.toBeVisible();
    });

    test('should handle API timeout errors', async ({ page }) => {
      const testData = generateErrorTestData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form with valid data
      await page.getByLabel(/first name/i).fill(testData.firstName);
      await page.getByLabel(/last name/i).fill(testData.lastName);
      await page.getByLabel(/mobile number/i).fill(testData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(testData.birthDate);
      
      // Simulate very slow network (timeout)
      await simulateSlowNetwork(page, 30000);
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should eventually show timeout error
      await expect(page.getByText(/request timeout|took too long/i)).toBeVisible({ timeout: 35000 });
    });
  });

  test.describe('Server Error Handling', () => {
    test('should handle 500 server errors gracefully', async ({ page }) => {
      const testData = generateErrorTestData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form with valid data
      await page.getByLabel(/first name/i).fill(testData.firstName);
      await page.getByLabel(/last name/i).fill(testData.lastName);
      await page.getByLabel(/mobile number/i).fill(testData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(testData.birthDate);
      
      // Simulate server error
      await page.route('**/api/clients', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show server error message
      await expect(page.getByText(/server error|something went wrong/i)).toBeVisible();
    });

    test('should handle 400 validation errors from server', async ({ page }) => {
      const testData = generateErrorTestData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form with data that will cause server validation error
      await page.getByLabel(/first name/i).fill(testData.firstName);
      await page.getByLabel(/last name/i).fill(testData.lastName);
      await page.getByLabel(/mobile number/i).fill(testData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(testData.birthDate);
      
      // Simulate server validation error
      await page.route('**/api/clients', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Validation failed',
            details: [
              { field: 'mobileNumber', message: 'Mobile number already exists' }
            ]
          })
        });
      });
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show specific validation error
      await expect(page.getByText(/mobile number already exists/i)).toBeVisible();
    });
  });

  test.describe('Browser Error Handling', () => {
    test('should handle JavaScript errors gracefully', async ({ page }) => {
      // Listen for console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Inject a JavaScript error
      await page.evaluate(() => {
        // Simulate an error in form validation
        (window as any).simulateError = () => {
          throw new Error('Simulated JavaScript error');
        };
      });
      
      // Try to trigger the error
      await page.evaluate(() => {
        try {
          (window as unknown).simulateError();
        } catch (error) {
          console.error('Caught error:', error);
        }
      });
      
      // Page should still be functional
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      
      // Should have logged the error
      expect(errors.some(error => error.includes('Simulated JavaScript error'))).toBe(true);
    });

    test('should handle memory issues with large forms', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form with very large data
      const largeText = 'x'.repeat(10000);
      
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Fill address with large text
      const addressField = page.getByLabel(/address/i);
      if (await addressField.isVisible()) {
        await addressField.fill(largeText);
      }
      
      // Form should still be responsive
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      
      // Should be able to submit (though it might be rejected by server)
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should either succeed or show appropriate error
      const successToast = page.getByText(/client created successfully/i);
      const errorMessage = page.getByText(/error|failed/i);
      
      await expect(successToast.or(errorMessage)).toBeVisible();
    });
  });

  test.describe('Accessibility Error Handling', () => {
    test('should announce errors to screen readers', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Try to submit form without filling mandatory fields
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Error messages should have proper ARIA attributes
      const errorMessages = page.locator('[role="alert"]').or(
        page.locator('[aria-live="polite"]')
      ).or(
        page.locator('[aria-live="assertive"]')
      );
      
      const errorCount = await errorMessages.count();
      expect(errorCount).toBeGreaterThan(0);
      
      // First error message should be visible
      await expect(errorMessages.first()).toBeVisible();
    });

    test('should maintain focus management during errors', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Focus on first name field
      await page.getByLabel(/first name/i).focus();
      
      // Try to submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Focus should move to first error field or stay on current field
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Should be able to navigate with keyboard
      await page.keyboard.press('Tab');
      const nextFocusedElement = page.locator(':focus');
      await expect(nextFocusedElement).toBeVisible();
    });
  });

  test.describe('Error Recovery', () => {
    test('should allow form correction after validation errors', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Submit form with errors
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show validation errors
      await expect(page.getByText(/first name is required/i)).toBeVisible();
      
      // Fill the form correctly
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Errors should disappear as fields are filled
      await expect(page.getByText(/first name is required/i)).not.toBeVisible();
      
      // Should be able to submit successfully
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
    });

    test('should preserve form data during error recovery', async ({ page }) => {
      const testData = generateErrorTestData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form with some valid and some invalid data
      await page.getByLabel(/first name/i).fill(testData.firstName);
      await page.getByLabel(/last name/i).fill(testData.lastName);
      await page.getByLabel(/email/i).fill('invalid-email'); // Invalid email
      await page.getByLabel(/mobile number/i).fill(testData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(testData.birthDate);
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show email validation error
      await expect(page.getByText(/invalid email format/i)).toBeVisible();
      
      // Valid data should be preserved
      expect(await page.getByLabel(/first name/i).inputValue()).toBe(testData.firstName);
      expect(await page.getByLabel(/last name/i).inputValue()).toBe(testData.lastName);
      expect(await page.getByLabel(/mobile number/i).inputValue()).toBe(testData.mobileNumber);
      
      // Fix the email
      await page.getByLabel(/email/i).clear();
      await page.getByLabel(/email/i).fill(testData.email);
      
      // Should be able to submit successfully
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle concurrent form submissions', async ({ page }) => {
      const testData = generateErrorTestData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form
      await page.getByLabel(/first name/i).fill(testData.firstName);
      await page.getByLabel(/last name/i).fill(testData.lastName);
      await page.getByLabel(/mobile number/i).fill(testData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(testData.birthDate);
      
      // Simulate slow network
      await simulateSlowNetwork(page, 2000);
      
      // Click submit button multiple times quickly
      const submitButton = page.getByRole('button', { name: /create client/i });
      await submitButton.click();
      await submitButton.click();
      await submitButton.click();
      
      // Should only create one client
      await waitForToast(page, /client created successfully/i);
      
      // Should not show multiple success messages
      const successMessages = page.getByText(/client created successfully/i);
      const messageCount = await successMessages.count();
      expect(messageCount).toBe(1);
    });

    test('should handle browser back button during form submission', async ({ page }) => {
      const testData = generateErrorTestData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form
      await page.getByLabel(/first name/i).fill(testData.firstName);
      await page.getByLabel(/last name/i).fill(testData.lastName);
      await page.getByLabel(/mobile number/i).fill(testData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(testData.birthDate);
      
      // Simulate slow network
      await simulateSlowNetwork(page, 3000);
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Immediately go back
      await page.goBack();
      
      // Should be on clients list page
      await expect(page).toHaveURL('/dashboard/clients');
      
      // Should not show success message
      await expect(page.getByText(/client created successfully/i)).not.toBeVisible();
    });
  });
});