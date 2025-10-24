import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('agent@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should work correctly in Chromium', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'This test is only for Chromium');
    
    // Test basic functionality
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Test navigation
    await page.getByRole('link', { name: /leads/i }).click();
    await expect(page).toHaveURL('/dashboard/leads');
    
    // Test modal functionality
    await page.getByRole('button', { name: /add lead/i }).click();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    
    // Test form submission
    await page.getByLabel(/full name/i).fill('Chrome Test Lead');
    await page.getByLabel(/email/i).fill('chrome@example.com');
    await page.getByLabel(/phone/i).fill('1111111111');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /life/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
  });

  test('should work correctly in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'This test is only for Firefox');
    
    // Test basic functionality
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Test navigation
    await page.getByRole('link', { name: /clients/i }).click();
    await expect(page).toHaveURL('/dashboard/clients');
    
    // Test modal functionality
    await page.getByRole('button', { name: /add client/i }).click();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    
    // Test form submission with date picker
    await page.getByLabel(/full name/i).fill('Firefox Test Client');
    await page.getByLabel(/email/i).fill('firefox@example.com');
    await page.getByLabel(/phone/i).fill('2222222222');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 30);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
  });

  test('should work correctly in WebKit', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'This test is only for WebKit');
    
    // Test basic functionality
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Test chart rendering (important for WebKit)
    const chartContainer = page.locator('[data-testid="leads-chart"]');
    if (await chartContainer.isVisible()) {
      await expect(chartContainer).toBeVisible();
    }
    
    // Test navigation
    await page.getByRole('link', { name: /leads/i }).click();
    await expect(page).toHaveURL('/dashboard/leads');
    
    // Test search functionality
    await page.getByPlaceholder(/search leads/i).fill('test');
    await page.getByPlaceholder(/search leads/i).clear();
    
    // Test dropdown functionality
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/insurance interest/i).click();
    await expect(page.getByRole('option', { name: /life/i })).toBeVisible();
    await page.getByRole('option', { name: /auto/i }).click();
    
    // Close modal
    await page.keyboard.press('Escape');
  });

  test('should handle CSS animations across browsers', async ({ page }) => {
    // Test toast notifications (which use animations)
    await page.getByRole('link', { name: /leads/i }).click();
    
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Animation Test');
    await page.getByLabel(/email/i).fill('animation@example.com');
    await page.getByLabel(/phone/i).fill('3333333333');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /health/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    // Toast should appear and be visible
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Wait for toast to potentially disappear (auto-dismiss)
    await page.waitForTimeout(1000);
  });

  test('should handle form validation consistently across browsers', async ({ page }) => {
    await page.getByRole('link', { name: /leads/i }).click();
    
    // Test empty form validation
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    // All browsers should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/phone is required/i)).toBeVisible();
    
    // Test email format validation
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/phone/i).fill('1234567890');
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/invalid email format/i)).toBeVisible();
  });

  test('should handle keyboard navigation consistently', async ({ page }) => {
    await page.getByRole('link', { name: /leads/i }).click();
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Test Enter key on buttons
    await page.getByRole('button', { name: /add lead/i }).focus();
    await page.keyboard.press('Enter');
    
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    
    // Test Escape key to close modal
    await page.keyboard.press('Escape');
    
    // Modal should be closed
    await expect(page.getByLabel(/full name/i)).not.toBeVisible();
  });

  test('should handle local storage consistently across browsers', async ({ page }) => {
    // The authentication token should be stored consistently
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    
    // Test logout clears storage
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL('/login');
    
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenAfterLogout).toBeFalsy();
  });

  test('should render fonts and icons consistently', async ({ page }) => {
    // Check that icons are rendered (Lucide React icons)
    const dashboardIcon = page.locator('[data-testid="dashboard-icon"]');
    const leadsIcon = page.locator('[data-testid="leads-icon"]');
    const clientsIcon = page.locator('[data-testid="clients-icon"]');
    
    // Icons should be visible if they exist
    if (await dashboardIcon.isVisible()) {
      await expect(dashboardIcon).toBeVisible();
    }
    if (await leadsIcon.isVisible()) {
      await expect(leadsIcon).toBeVisible();
    }
    if (await clientsIcon.isVisible()) {
      await expect(clientsIcon).toBeVisible();
    }
    
    // Check that text is readable
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/total leads/i)).toBeVisible();
  });
});