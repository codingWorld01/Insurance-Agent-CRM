import { test, expect } from '@playwright/test';

test.describe('Complete User Journey E2E Tests', () => {
  test('should complete full insurance agent workflow', async ({ page }) => {
    // Step 1: Login
    await page.goto('/');
    await expect(page).toHaveURL('/login');
    
    await page.getByLabel(/email/i).fill('amitulhe@gmail.com');
    await page.getByLabel(/password/i).fill('Amit@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Step 2: View Dashboard Statistics
    await expect(page.getByText(/total leads/i)).toBeVisible();
    await expect(page.getByText(/total clients/i)).toBeVisible();
    await expect(page.getByText(/total active policies/i)).toBeVisible();
    await expect(page.getByText(/total commission this month/i)).toBeVisible();
    
    // Step 3: Create a New Lead
    await page.getByRole('link', { name: /leads/i }).click();
    await expect(page).toHaveURL('/dashboard/leads');
    
    await page.getByRole('button', { name: /add lead/i }).click();
    
    // Fill lead information
    await page.getByLabel(/full name/i).fill('Sarah Johnson');
    await page.getByLabel(/email/i).fill('sarah.johnson@example.com');
    await page.getByLabel(/phone/i).fill('5551234567');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /life/i }).click();
    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /new/i }).click();
    await page.getByLabel(/priority/i).click();
    await page.getByRole('option', { name: /hot/i }).click();
    await page.getByLabel(/notes/i).fill('Interested in term life insurance for family protection');
    
    await page.getByRole('button', { name: /create lead/i }).click();
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Verify lead appears in table
    await expect(page.getByText('Sarah Johnson')).toBeVisible();
    await expect(page.getByText('sarah.johnson@example.com')).toBeVisible();
    
    // Step 4: Update Lead Status
    await page.getByText('Sarah Johnson').click();
    await expect(page.getByRole('heading', { name: /lead details/i })).toBeVisible();
    
    await page.getByRole('button', { name: /edit/i }).click();
    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /contacted/i }).click();
    await page.getByLabel(/notes/i).clear();
    await page.getByLabel(/notes/i).fill('Called customer, scheduled meeting for next week');
    await page.getByRole('button', { name: /update lead/i }).click();
    
    await expect(page.getByText(/lead updated successfully/i)).toBeVisible();
    await expect(page.getByText(/contacted/i)).toBeVisible();
    
    // Step 5: Progress Lead to Qualified
    await page.getByRole('button', { name: /edit/i }).click();
    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /qualified/i }).click();
    await page.getByLabel(/notes/i).clear();
    await page.getByLabel(/notes/i).fill('Met with customer, ready to proceed with application');
    await page.getByRole('button', { name: /update lead/i }).click();
    
    await expect(page.getByText(/lead updated successfully/i)).toBeVisible();
    
    // Step 6: Convert Lead to Client
    await page.getByRole('button', { name: /convert to client/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    await expect(page.getByText(/lead converted to client successfully/i)).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/clients\/[a-f0-9-]+/);
    
    // Verify client details
    await expect(page.getByRole('heading', { name: /client details/i })).toBeVisible();
    await expect(page.getByText('Sarah Johnson')).toBeVisible();
    await expect(page.getByText('sarah.johnson@example.com')).toBeVisible();
    
    // Step 7: Verify Client in Clients List
    await page.getByRole('link', { name: /clients/i }).click();
    await expect(page).toHaveURL('/dashboard/clients');
    
    await expect(page.getByText('Sarah Johnson')).toBeVisible();
    await expect(page.getByText('sarah.johnson@example.com')).toBeVisible();
    
    // Step 8: Verify Lead Status Updated to Won
    await page.getByRole('link', { name: /leads/i }).click();
    
    // Filter by Won status
    await page.getByRole('combobox', { name: /filter by status/i }).click();
    await page.getByRole('option', { name: /won/i }).click();
    
    await expect(page.getByText('Sarah Johnson')).toBeVisible();
    await expect(page.getByText(/won/i)).toBeVisible();
    
    // Step 9: Check Dashboard for Updated Statistics
    await page.getByRole('link', { name: /dashboard/i }).click();
    
    // Should see activity logged
    await expect(page.getByText(/converted lead to client.*sarah johnson/i)).toBeVisible();
    
    // Step 10: Create Another Lead for Testing Search
    await page.getByRole('link', { name: /leads/i }).click();
    await page.getByRole('button', { name: /add lead/i }).click();
    
    await page.getByLabel(/full name/i).fill('Michael Brown');
    await page.getByLabel(/email/i).fill('michael.brown@example.com');
    await page.getByLabel(/phone/i).fill('5559876543');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /auto/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Step 11: Test Search Functionality
    await page.getByPlaceholder(/search leads/i).fill('Michael');
    await expect(page.getByText('Michael Brown')).toBeVisible();
    
    // Clear search
    await page.getByPlaceholder(/search leads/i).clear();
    
    // Step 12: Test Status Filtering
    await page.getByRole('combobox', { name: /filter by status/i }).click();
    await page.getByRole('option', { name: /new/i }).click();
    
    await expect(page.getByText('Michael Brown')).toBeVisible();
    
    // Step 13: Create a Direct Client
    await page.getByRole('link', { name: /clients/i }).click();
    await page.getByRole('button', { name: /add client/i }).click();
    
    await page.getByLabel(/full name/i).fill('Robert Wilson');
    await page.getByLabel(/email/i).fill('robert.wilson@example.com');
    await page.getByLabel(/phone/i).fill('5555551234');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 45);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByLabel(/address/i).fill('123 Oak Street, Springfield, IL 62701');
    await page.getByRole('button', { name: /create client/i }).click();
    
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Step 14: Test Client Search
    await page.getByPlaceholder(/search clients/i).fill('Robert');
    await expect(page.getByText('Robert Wilson')).toBeVisible();
    
    // Step 15: View Client Details
    await page.getByText('Robert Wilson').click();
    await expect(page.getByRole('heading', { name: /client details/i })).toBeVisible();
    await expect(page.getByText('123 Oak Street, Springfield, IL 62701')).toBeVisible();
    
    // Should show calculated age (approximately 45)
    await expect(page.getByText(/45/)).toBeVisible();
    
    // Step 16: Test Logout
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL('/login');
    
    // Step 17: Verify Redirect Protection
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
    
    // Step 18: Login Again to Verify Data Persistence
    await page.getByLabel(/email/i).fill('amitulhe@gmail.com');
    await page.getByLabel(/password/i).fill('Amit@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/dashboard');
    
    // Verify data is still there
    await page.getByRole('link', { name: /clients/i }).click();
    await expect(page.getByText('Sarah Johnson')).toBeVisible();
    await expect(page.getByText('Robert Wilson')).toBeVisible();
    
    await page.getByRole('link', { name: /leads/i }).click();
    await expect(page.getByText('Michael Brown')).toBeVisible();
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('amitulhe@gmail.com');
    await page.getByLabel(/password/i).fill('Amit@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Test duplicate email validation
    await page.getByRole('link', { name: /clients/i }).click();
    
    // Create first client
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Duplicate Test');
    await page.getByLabel(/email/i).fill('duplicate@example.com');
    await page.getByLabel(/phone/i).fill('1111111111');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 30);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Try to create client with same email
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Another Client');
    await page.getByLabel(/email/i).fill('duplicate@example.com');
    await page.getByLabel(/phone/i).fill('2222222222');
    await page.getByLabel(/date of birth/i).fill(dateString);
    await page.getByRole('button', { name: /create client/i }).click();
    
    // Should show error
    await expect(page.getByText(/email already exists/i)).toBeVisible();
    
    // Test form validation
    await page.keyboard.press('Escape'); // Close modal
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByRole('button', { name: /create client/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });
});