import { test, expect } from '@playwright/test';

test.describe('Leads Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('agent@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to leads page and display leads table', async ({ page }) => {
    // Navigate to leads page
    await page.getByRole('link', { name: /leads/i }).click();
    await expect(page).toHaveURL('/dashboard/leads');
    
    // Check leads page elements
    await expect(page.getByRole('heading', { name: /leads/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add lead/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search leads/i)).toBeVisible();
    
    // Check table headers
    await expect(page.getByText(/name/i)).toBeVisible();
    await expect(page.getByText(/email/i)).toBeVisible();
    await expect(page.getByText(/phone/i)).toBeVisible();
    await expect(page.getByText(/insurance interest/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();
    await expect(page.getByText(/priority/i)).toBeVisible();
  });

  test('should create a new lead successfully', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Click Add Lead button
    await page.getByRole('button', { name: /add lead/i }).click();
    
    // Fill in the lead form
    await page.getByLabel(/full name/i).fill('John Doe');
    await page.getByLabel(/email/i).fill('john.doe@example.com');
    await page.getByLabel(/phone/i).fill('1234567890');
    
    // Select insurance interest
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /life/i }).click();
    
    // Select status
    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /new/i }).click();
    
    // Select priority
    await page.getByLabel(/priority/i).click();
    await page.getByRole('option', { name: /hot/i }).click();
    
    // Add notes
    await page.getByLabel(/notes/i).fill('Interested in life insurance policy');
    
    // Submit form
    await page.getByRole('button', { name: /create lead/i }).click();
    
    // Should show success message
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Should see the new lead in the table
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('john.doe@example.com')).toBeVisible();
  });

  test('should validate required fields when creating a lead', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Click Add Lead button
    await page.getByRole('button', { name: /add lead/i }).click();
    
    // Try to submit empty form
    await page.getByRole('button', { name: /create lead/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/phone is required/i)).toBeVisible();
  });

  test('should search leads by name', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Create a test lead first
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Jane Smith');
    await page.getByLabel(/email/i).fill('jane.smith@example.com');
    await page.getByLabel(/phone/i).fill('9876543210');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /auto/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    // Wait for success message
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Search for the lead
    await page.getByPlaceholder(/search leads/i).fill('Jane');
    
    // Should show filtered results
    await expect(page.getByText('Jane Smith')).toBeVisible();
  });

  test('should filter leads by status', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Create leads with different statuses
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Test Lead 1');
    await page.getByLabel(/email/i).fill('test1@example.com');
    await page.getByLabel(/phone/i).fill('1111111111');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /life/i }).click();
    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /contacted/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Filter by status
    await page.getByRole('combobox', { name: /filter by status/i }).click();
    await page.getByRole('option', { name: /contacted/i }).click();
    
    // Should show only contacted leads
    await expect(page.getByText('Test Lead 1')).toBeVisible();
  });

  test('should view lead details', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Create a test lead
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Detail Test Lead');
    await page.getByLabel(/email/i).fill('detail@example.com');
    await page.getByLabel(/phone/i).fill('5555555555');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /health/i }).click();
    await page.getByLabel(/notes/i).fill('Test notes for detail view');
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Click on the lead row to view details
    await page.getByText('Detail Test Lead').click();
    
    // Should navigate to lead detail page
    await expect(page.getByRole('heading', { name: /lead details/i })).toBeVisible();
    await expect(page.getByText('Detail Test Lead')).toBeVisible();
    await expect(page.getByText('detail@example.com')).toBeVisible();
    await expect(page.getByText('Test notes for detail view')).toBeVisible();
  });

  test('should edit a lead', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Create a test lead
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Edit Test Lead');
    await page.getByLabel(/email/i).fill('edit@example.com');
    await page.getByLabel(/phone/i).fill('6666666666');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /home/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Go to lead details
    await page.getByText('Edit Test Lead').click();
    
    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click();
    
    // Update the lead
    await page.getByLabel(/full name/i).clear();
    await page.getByLabel(/full name/i).fill('Updated Lead Name');
    await page.getByRole('button', { name: /update lead/i }).click();
    
    // Should show success message
    await expect(page.getByText(/lead updated successfully/i)).toBeVisible();
    
    // Should show updated name
    await expect(page.getByText('Updated Lead Name')).toBeVisible();
  });

  test('should delete a lead', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Create a test lead
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Delete Test Lead');
    await page.getByLabel(/email/i).fill('delete@example.com');
    await page.getByLabel(/phone/i).fill('7777777777');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /business/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Go to lead details
    await page.getByText('Delete Test Lead').click();
    
    // Click delete button
    await page.getByRole('button', { name: /delete/i }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Should show success message and redirect to leads list
    await expect(page.getByText(/lead deleted successfully/i)).toBeVisible();
    await expect(page).toHaveURL('/dashboard/leads');
    
    // Lead should not be in the list anymore
    await expect(page.getByText('Delete Test Lead')).not.toBeVisible();
  });
});