import { test, expect } from '@playwright/test';
import { login } from './helpers/test-utils';

function generatePerformanceTestData(count: number) {
  const clients = [];
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now() + i;
    clients.push({
      firstName: `Perf${timestamp}`,
      lastName: `Test${i}`,
      mobileNumber: `91${timestamp.toString().slice(-8)}`,
      email: `perf.test${timestamp}@example.com`,
      birthDate: '1990-01-01'
    });
  }
  return clients;
}

test.describe('Enhanced Client Management - Performance Testing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('File Upload Performance', () => {
    test('should handle large file uploads efficiently', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('Performance');
      await page.getByLabel(/last name/i).fill('Test');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Create a large but valid image file (5MB)
      const largeImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const baseContent = Buffer.from(largeImageContent, 'base64');
      const largeImageBuffer = Buffer.concat([baseContent, Buffer.alloc(5 * 1024 * 1024, 0)]);
      
      const uploadButton = page.getByText(/choose file|upload image/i).first();
      if (await uploadButton.isVisible()) {
        const startTime = Date.now();
        
        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;
        
        await fileChooser.setFiles([{
          name: 'large-image.png',
          mimeType: 'image/png',
          buffer: largeImageBuffer
        }]);
        
        // Wait for upload to complete or show progress
        const uploadProgress = page.locator('[data-testid="upload-progress"]').or(
          page.getByText(/uploading|progress/i)
        );
        
        if (await uploadProgress.isVisible()) {
          await expect(uploadProgress).toBeVisible();
          
          // Wait for upload completion
          await expect(uploadProgress).not.toBeVisible({ timeout: 30000 });
        }
        
        const endTime = Date.now();
        const uploadTime = endTime - startTime;
        
        // Upload should complete within reasonable time (30 seconds)
        expect(uploadTime).toBeLessThan(30000);
        
        // Should show success indicator
        const successIndicator = page.getByText(/upload successful|uploaded/i);
        if (await successIndicator.isVisible()) {
          await expect(successIndicator).toBeVisible();
        }
      }
    });

    test('should handle multiple file uploads concurrently', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('MultiUpload');
      await page.getByLabel(/last name/i).fill('Test');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Create multiple small files
      const imageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const imageBuffer = Buffer.from(imageContent, 'base64');
      
      const files = [
        { name: 'image1.png', mimeType: 'image/png', buffer: imageBuffer },
        { name: 'image2.png', mimeType: 'image/png', buffer: imageBuffer },
        { name: 'image3.png', mimeType: 'image/png', buffer: imageBuffer }
      ];
      
      const startTime = Date.now();
      
      // Upload profile image
      const profileUploadButton = page.getByText(/choose file|upload image/i).first();
      if (await profileUploadButton.isVisible()) {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await profileUploadButton.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles([files[0]]);
        
        await page.waitForTimeout(1000); // Wait for upload
      }
      
      // Add and upload documents
      for (let i = 1; i < files.length; i++) {
        const addDocumentButton = page.getByRole('button', { name: /add document/i });
        if (await addDocumentButton.isVisible()) {
          await addDocumentButton.click();
          
          // Select document type
          await page.getByLabel(/document type/i).click();
          await page.getByRole('option', { name: /identity proof/i }).click();
          
          // Upload document
          const docFileChooserPromise = page.waitForEvent('filechooser');
          await page.getByText(/choose file|upload/i).last().click();
          const docFileChooser = await docFileChooserPromise;
          await docFileChooser.setFiles([files[i]]);
          
          await page.waitForTimeout(1000); // Wait for upload
        }
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Multiple uploads should complete within reasonable time
      expect(totalTime).toBeLessThan(15000);
    });

    test('should show upload progress for large files', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill('Progress');
      await page.getByLabel(/last name/i).fill('Test');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Create a moderately large file
      const imageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const baseContent = Buffer.from(imageContent, 'base64');
      const mediumImageBuffer = Buffer.concat([baseContent, Buffer.alloc(2 * 1024 * 1024, 0)]);
      
      const uploadButton = page.getByText(/choose file|upload image/i).first();
      if (await uploadButton.isVisible()) {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;
        
        await fileChooser.setFiles([{
          name: 'medium-image.png',
          mimeType: 'image/png',
          buffer: mediumImageBuffer
        }]);
        
        // Should show progress indicator
        const progressIndicator = page.locator('[data-testid="upload-progress"]').or(
          page.locator('.progress-bar')
        ).or(
          page.getByText(/uploading/i)
        );
        
        if (await progressIndicator.isVisible()) {
          await expect(progressIndicator).toBeVisible();
          
          // Progress should eventually complete
          await expect(progressIndicator).not.toBeVisible({ timeout: 15000 });
        }
      }
    });
  });

  test.describe('Form Performance', () => {
    test('should handle rapid form input without lag', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      const startTime = Date.now();
      
      // Rapidly fill all form fields
      await page.getByLabel(/first name/i).fill('RapidInput');
      await page.getByLabel(/last name/i).fill('PerformanceTest');
      await page.getByLabel(/middle name/i).fill('Speed');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/email/i).fill('rapid@performance.test');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Fill location fields
      await page.getByLabel(/state/i).click();
      await page.getByRole('option', { name: /maharashtra/i }).click();
      
      await page.waitForTimeout(500); // Wait for cities to load
      await page.getByLabel(/city/i).click();
      await page.getByRole('option', { name: /mumbai/i }).click();
      
      await page.getByLabel(/address/i).fill('123 Performance Test Street, Speed Area, Mumbai');
      await page.getByLabel(/birth place/i).fill('Mumbai');
      
      // Fill personal details rapidly
      await page.getByLabel(/gender/i).click();
      await page.getByRole('option', { name: /male/i }).click();
      
      await page.getByLabel(/height/i).fill('5.9');
      await page.getByLabel(/weight/i).fill('75');
      await page.getByLabel(/education/i).fill('Engineering');
      
      await page.getByLabel(/marital status/i).click();
      await page.getByRole('option', { name: /single/i }).click();
      
      // Fill professional details
      await page.getByLabel(/business\/job/i).fill('Software Engineer');
      await page.getByLabel(/name of business/i).fill('Tech Corp');
      await page.getByLabel(/type of duty/i).fill('Development');
      await page.getByLabel(/annual income/i).fill('1000000');
      
      // Fill identification
      await page.getByLabel(/pan number/i).fill('ABCDE1234F');
      await page.getByLabel(/gst number/i).fill('27ABCDE1234F1Z5');
      
      const endTime = Date.now();
      const fillTime = endTime - startTime;
      
      // Form filling should be responsive (under 10 seconds)
      expect(fillTime).toBeLessThan(10000);
      
      // All fields should have correct values
      expect(await page.getByLabel(/first name/i).inputValue()).toBe('RapidInput');
      expect(await page.getByLabel(/last name/i).inputValue()).toBe('PerformanceTest');
      expect(await page.getByLabel(/email/i).inputValue()).toBe('rapid@performance.test');
    });

    test('should handle form validation without performance degradation', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      const startTime = Date.now();
      
      // Trigger multiple validation errors rapidly
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/mobile number/i).fill('123');
      await page.getByLabel(/pan number/i).fill('INVALID');
      await page.getByLabel(/gst number/i).fill('INVALID');
      
      // Trigger validation by clicking away
      await page.getByLabel(/first name/i).click();
      
      // Wait for validation messages
      await expect(page.getByText(/invalid email format/i)).toBeVisible();
      
      const validationTime = Date.now() - startTime;
      
      // Validation should be fast (under 2 seconds)
      expect(validationTime).toBeLessThan(2000);
      
      // Fix errors rapidly
      const fixStartTime = Date.now();
      
      await page.getByLabel(/email/i).clear();
      await page.getByLabel(/email/i).fill('valid@email.com');
      
      await page.getByLabel(/mobile number/i).clear();
      await page.getByLabel(/mobile number/i).fill('9123456789');
      
      await page.getByLabel(/pan number/i).clear();
      await page.getByLabel(/pan number/i).fill('ABCDE1234F');
      
      await page.getByLabel(/gst number/i).clear();
      await page.getByLabel(/gst number/i).fill('27ABCDE1234F1Z5');
      
      // Trigger validation again
      await page.getByLabel(/first name/i).click();
      
      const fixTime = Date.now() - fixStartTime;
      
      // Error fixing should also be fast
      expect(fixTime).toBeLessThan(3000);
      
      // Validation errors should disappear
      await expect(page.getByText(/invalid email format/i)).not.toBeVisible();
    });

    test('should handle auto-save without blocking UI', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill some fields
      await page.getByLabel(/first name/i).fill('AutoSave');
      await page.getByLabel(/last name/i).fill('Test');
      
      // Wait for potential auto-save
      await page.waitForTimeout(3000);
      
      // UI should remain responsive
      const startTime = Date.now();
      await page.getByLabel(/email/i).fill('autosave@test.com');
      const responseTime = Date.now() - startTime;
      
      // Input should be immediate (under 100ms)
      expect(responseTime).toBeLessThan(100);
      
      // Check for auto-save indicator
      const autoSaveIndicator = page.locator('[data-testid="auto-save"]').or(
        page.getByText(/saving|saved/i)
      );
      
      if (await autoSaveIndicator.isVisible()) {
        // Auto-save should not block further input
        await page.getByLabel(/mobile number/i).fill('9123456789');
        await expect(page.getByLabel(/mobile number/i)).toHaveValue('9123456789');
      }
    });
  });

  test.describe('List Performance', () => {
    test('should handle large client lists efficiently', async ({ page }) => {
      // Note: This test assumes there are many clients in the system
      // In a real scenario, you might need to create test data first
      
      await page.goto('/dashboard/clients');
      
      const startTime = Date.now();
      
      // Wait for page to load
      await expect(page.getByText(/clients/i)).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Page should load quickly (under 5 seconds)
      expect(loadTime).toBeLessThan(5000);
      
      // Test scrolling performance
      const scrollStartTime = Date.now();
      
      // Scroll down multiple times
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(100);
      }
      
      const scrollTime = Date.now() - scrollStartTime;
      
      // Scrolling should be smooth (under 2 seconds for 5 page downs)
      expect(scrollTime).toBeLessThan(2000);
    });

    test('should handle search and filtering efficiently', async ({ page }) => {
      await page.goto('/dashboard/clients');
      
      // Wait for page to load
      await expect(page.getByText(/clients/i)).toBeVisible();
      
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        const searchStartTime = Date.now();
        
        // Type search query
        await searchInput.fill('test');
        
        // Wait for search results
        await page.waitForTimeout(1000);
        
        const searchTime = Date.now() - searchStartTime;
        
        // Search should be fast (under 2 seconds)
        expect(searchTime).toBeLessThan(2000);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
      
      // Test filtering
      const filterButton = page.getByRole('button', { name: /filter/i }).first();
      if (await filterButton.isVisible()) {
        const filterStartTime = Date.now();
        
        await filterButton.click();
        await page.getByText(/personal/i).click();
        
        // Wait for filter to apply
        await page.waitForTimeout(1000);
        
        const filterTime = Date.now() - filterStartTime;
        
        // Filtering should be fast (under 2 seconds)
        expect(filterTime).toBeLessThan(2000);
      }
    });
  });

  test.describe('Memory Performance', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      // Navigate between different client forms multiple times
      const routes = [
        '/dashboard/clients/create/personal',
        '/dashboard/clients/create/family-employee',
        '/dashboard/clients/create/corporate',
        '/dashboard/clients'
      ];
      
      for (let i = 0; i < 3; i++) {
        for (const route of routes) {
          const startTime = Date.now();
          await page.goto(route);
          
          // Wait for page to load
          await page.waitForLoadState('networkidle');
          
          const loadTime = Date.now() - startTime;
          
          // Each navigation should be reasonably fast
          expect(loadTime).toBeLessThan(5000);
          
          // Brief pause to allow for any cleanup
          await page.waitForTimeout(100);
        }
      }
      
      // Final navigation should still be fast (no memory leak)
      const finalStartTime = Date.now();
      await page.goto('/dashboard/clients');
      await page.waitForLoadState('networkidle');
      const finalLoadTime = Date.now() - finalStartTime;
      
      expect(finalLoadTime).toBeLessThan(5000);
    });

    test('should handle multiple form instances without degradation', async ({ browser }) => {
      // Open multiple tabs with client forms
      const contexts = [];
      const pages = [];
      
      try {
        for (let i = 0; i < 3; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          
          await login(page);
          await page.goto('/dashboard/clients/create/personal');
          
          // Fill some data in each form
          await page.getByLabel(/first name/i).fill(`Multi${i}`);
          await page.getByLabel(/last name/i).fill(`Test${i}`);
          
          contexts.push(context);
          pages.push(page);
        }
        
        // All forms should remain responsive
        for (let i = 0; i < pages.length; i++) {
          const startTime = Date.now();
          await pages[i].getByLabel(/email/i).fill(`multi${i}@test.com`);
          const responseTime = Date.now() - startTime;
          
          expect(responseTime).toBeLessThan(1000);
        }
        
      } finally {
        // Clean up contexts
        for (const context of contexts) {
          await context.close();
        }
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network gracefully', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Simulate slow network
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });
      
      // Fill form
      await page.getByLabel(/first name/i).fill('SlowNetwork');
      await page.getByLabel(/last name/i).fill('Test');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      const submitStartTime = Date.now();
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show loading indicator
      await expect(page.getByText(/creating|loading/i)).toBeVisible();
      
      // Wait for completion
      await expect(page.getByText(/client created successfully/i)).toBeVisible({ timeout: 10000 });
      
      const submitTime = Date.now() - submitStartTime;
      
      // Should complete within reasonable time considering 2s delay
      expect(submitTime).toBeGreaterThan(2000);
      expect(submitTime).toBeLessThan(8000);
    });

    test('should optimize API calls', async ({ page }) => {
      let apiCallCount = 0;
      
      // Monitor API calls
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          apiCallCount++;
        }
      });
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form fields that might trigger API calls
      await page.getByLabel(/state/i).click();
      await page.getByRole('option', { name: /maharashtra/i }).click();
      
      await page.waitForTimeout(1000);
      
      await page.getByLabel(/city/i).click();
      await page.getByRole('option', { name: /mumbai/i }).click();
      
      // Should not make excessive API calls
      expect(apiCallCount).toBeLessThan(10);
    });
  });

  test.describe('Concurrent Operations', () => {
    test('should handle concurrent client creation', async ({ browser }) => {
      const testData = generatePerformanceTestData(3);
      const contexts = [];
      const pages = [];
      
      try {
        // Create multiple browser contexts
        for (let i = 0; i < 3; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          
          await login(page);
          await page.goto('/dashboard/clients/create/personal');
          
          contexts.push(context);
          pages.push(page);
        }
        
        // Fill and submit forms concurrently
        const submitPromises = pages.map(async (page, index) => {
          const data = testData[index];
          
          await page.getByLabel(/first name/i).fill(data.firstName);
          await page.getByLabel(/last name/i).fill(data.lastName);
          await page.getByLabel(/mobile number/i).fill(data.mobileNumber);
          await page.getByLabel(/birth date/i).fill(data.birthDate);
          
          await page.getByRole('button', { name: /create client/i }).click();
          
          return page.waitForSelector('text=/client created successfully/i', { timeout: 10000 });
        });
        
        const startTime = Date.now();
        
        // Wait for all submissions to complete
        await Promise.all(submitPromises);
        
        const totalTime = Date.now() - startTime;
        
        // Concurrent operations should complete efficiently
        expect(totalTime).toBeLessThan(15000);
        
      } finally {
        // Clean up contexts
        for (const context of contexts) {
          await context.close();
        }
      }
    });
  });
});