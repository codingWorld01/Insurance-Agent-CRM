import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    
    // Check that basic elements are present
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should handle basic navigation', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Try to access protected route without authentication
    await page.goto('/dashboard');
    
    // Should redirect back to login
    await expect(page).toHaveURL('/login');
  });
});