import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsiveness Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('agent@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display mobile-friendly login page', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    
    await page.goto('/login');
    
    // Check that login form is visible and properly sized
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Check viewport dimensions
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(390);
    expect(viewport?.height).toBe(844);
    
    await context.close();
  });

  test('should display responsive dashboard on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('agent@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/dashboard');
    
    // Check dashboard elements are visible on mobile
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/total leads/i)).toBeVisible();
    await expect(page.getByText(/total clients/i)).toBeVisible();
    
    // Check that stats cards stack vertically on mobile
    const statsCards = page.locator('[data-testid="stats-card"]');
    const firstCard = statsCards.first();
    const secondCard = statsCards.nth(1);
    
    if (await firstCard.isVisible() && await secondCard.isVisible()) {
      const firstCardBox = await firstCard.boundingBox();
      const secondCardBox = await secondCard.boundingBox();
      
      // On mobile, cards should stack vertically (second card should be below first)
      if (firstCardBox && secondCardBox) {
        expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 10);
      }
    }
    
    await context.close();
  });

  test('should display responsive navigation on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('agent@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/dashboard');
    
    // Check navigation elements
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /leads/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /clients/i })).toBeVisible();
    
    // Test navigation to leads page
    await page.getByRole('link', { name: /leads/i }).click();
    await expect(page).toHaveURL('/dashboard/leads');
    await expect(page.getByRole('heading', { name: /leads/i })).toBeVisible();
    
    await context.close();
  });

  test('should display responsive tables on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    
    // Login and navigate to leads
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('agent@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByRole('link', { name: /leads/i }).click();
    
    // Check that table is responsive
    await expect(page.getByRole('button', { name: /add lead/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search leads/i)).toBeVisible();
    
    // Table should be scrollable horizontally on mobile if needed
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    await context.close();
  });

  test('should display responsive modals on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    
    // Login and navigate to leads
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('agent@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByRole('link', { name: /leads/i }).click();
    
    // Open add lead modal
    await page.getByRole('button', { name: /add lead/i }).click();
    
    // Check modal is visible and properly sized
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
    
    // Modal should fit within viewport
    const modal = page.locator('[role="dialog"]');
    const modalBox = await modal.boundingBox();
    const viewport = page.viewportSize();
    
    if (modalBox && viewport) {
      expect(modalBox.width).toBeLessThanOrEqual(viewport.width);
      expect(modalBox.height).toBeLessThanOrEqual(viewport.height);
    }
    
    await context.close();
  });

  test('should work on tablet viewport', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro'],
    });
    const page = await context.newPage();
    
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('agent@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/dashboard');
    
    // Check dashboard layout on tablet
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/total leads/i)).toBeVisible();
    
    // Navigate to leads and check table display
    await page.getByRole('link', { name: /leads/i }).click();
    await expect(page.getByRole('button', { name: /add lead/i })).toBeVisible();
    
    // Table should display more columns on tablet
    await expect(page.getByText(/name/i)).toBeVisible();
    await expect(page.getByText(/email/i)).toBeVisible();
    await expect(page.getByText(/phone/i)).toBeVisible();
    
    await context.close();
  });
});