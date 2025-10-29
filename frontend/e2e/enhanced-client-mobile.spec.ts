import { test, expect, devices } from '@playwright/test';
import { login } from './helpers/test-utils';

function generateMobileTestData() {
  const timestamp = Date.now();
  return {
    firstName: `Mobile${timestamp}`,
    lastName: `Test${timestamp}`,
    mobileNumber: `91${timestamp.toString().slice(-8)}`,
    email: `mobile.test${timestamp}@example.com`,
    birthDate: '1990-01-01'
  };
}

// Configure mobile device at top level
test.use({ ...devices['iPhone 12'] });

test.describe('Enhanced Client Management - Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display mobile-optimized client type selection', async ({ page }) => {
    await page.goto('/dashboard/clients/create');
    
    // Should have all three client types visible
    await expect(page.getByText(/personal client/i)).toBeVisible();
    await expect(page.getByText(/family\/employee client/i)).toBeVisible();
    await expect(page.getByText(/corporate client/i)).toBeVisible();
    
    // Cards should be touch-friendly (check minimum height)
    const firstCard = page.getByText(/personal client/i).locator('..').first();
    const boundingBox = await firstCard.boundingBox();
    expect(boundingBox?.height).toBeGreaterThan(44); // Minimum touch target size
  });

  test('should have mobile-optimized form layout', async ({ page }) => {
    await page.goto('/dashboard/clients/create/personal');
    
    // Form should be single column on mobile
    const formContainer = page.locator('form').first();
    await expect(formContainer).toBeVisible();
    
    // Input fields should be full width and touch-friendly
    const firstNameInput = page.getByLabel(/first name/i);
    await expect(firstNameInput).toBeVisible();
    
    const inputBox = await firstNameInput.boundingBox();
    expect(inputBox?.height).toBeGreaterThan(44); // Touch-friendly height
    
    // Check that form fields are stacked vertically
    const lastNameInput = page.getByLabel(/last name/i);
    const firstNameBox = await firstNameInput.boundingBox();
    const lastNameBox = await lastNameInput.boundingBox();
    
    if (firstNameBox && lastNameBox) {
      expect(lastNameBox.y).toBeGreaterThan(firstNameBox.y + firstNameBox.height);
    }
  });

  test('should handle mobile keyboard types', async ({ page }) => {
    await page.goto('/dashboard/clients/create/personal');
    
    // Email input should trigger email keyboard
    const emailInput = page.getByLabel(/email/i);
    const emailInputType = await emailInput.getAttribute('type');
    expect(emailInputType).toBe('email');
    
    // Phone input should trigger numeric keyboard
    const phoneInput = page.getByLabel(/mobile number/i);
    const phoneInputType = await phoneInput.getAttribute('type');
    expect(['tel', 'number'].includes(phoneInputType || '')).toBe(true);
  });

  test('should complete mobile workflow', async ({ page }) => {
    const timestamp = Date.now();
    
    await page.goto('/dashboard/clients/create/personal');
    
    // Fill form on mobile
    await page.getByLabel(/first name/i).fill(`Mobile${timestamp}`);
    await page.getByLabel(/last name/i).fill('Test');
    await page.getByLabel(/mobile number/i).fill(`91${timestamp.toString().slice(-8)}`);
    await page.getByLabel(/birth date/i).fill('1990-01-01');
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Test mobile client list
    await page.goto('/dashboard/clients');
    
    // Should show the created client
    await expect(page.getByText(`Mobile${timestamp} Test`)).toBeVisible();
  });
});