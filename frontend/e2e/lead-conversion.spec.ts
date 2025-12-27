import { test, expect } from '@playwright/test';

test.describe('Lead to Client Conversion Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('amitulhe@gmail.com');
    await page.getByLabel(/password/i).fill('Amit@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should convert a lead to client successfully', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Create a test lead for conversion
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Convert Test Lead');
    await page.getByLabel(/email/i).fill('convert@example.com');
    await page.getByLabel(/phone/i).fill('8888888888');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /life/i }).click();
    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /qualified/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Go to lead details
    await page.getByText('Convert Test Lead').click();
    
    // Click convert to client button
    await page.getByRole('button', { name: /convert to client/i }).click();
    
    // Confirm conversion
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Should show success message
    await expect(page.getByText(/lead converted to client successfully/i)).toBeVisible();
    
    // Should redirect to the new client page
    await expect(page).toHaveURL(/\/dashboard\/clients\/[a-f0-9-]+/);
    
    // Should show client details
    await expect(page.getByRole('heading', { name: /client details/i })).toBeVisible();
    await expect(page.getByText('Convert Test Lead')).toBeVisible();
    await expect(page.getByText('convert@example.com')).toBeVisible();
  });

  test('should update lead status to Won after conversion', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Create a test lead
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Status Test Lead');
    await page.getByLabel(/email/i).fill('status@example.com');
    await page.getByLabel(/phone/i).fill('9999999999');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /auto/i }).click();
    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /qualified/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Convert the lead
    await page.getByText('Status Test Lead').click();
    await page.getByRole('button', { name: /convert to client/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    await expect(page.getByText(/lead converted to client successfully/i)).toBeVisible();
    
    // Go back to leads page
    await page.getByRole('link', { name: /leads/i }).click();
    
    // Filter by Won status to see the converted lead
    await page.getByRole('combobox', { name: /filter by status/i }).click();
    await page.getByRole('option', { name: /won/i }).click();
    
    // Should see the lead with Won status
    await expect(page.getByText('Status Test Lead')).toBeVisible();
    await expect(page.getByText(/won/i)).toBeVisible();
  });

  test('should show converted client in clients list', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Create and convert a lead
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Client List Test');
    await page.getByLabel(/email/i).fill('clientlist@example.com');
    await page.getByLabel(/phone/i).fill('1010101010');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /health/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Convert the lead
    await page.getByText('Client List Test').click();
    await page.getByRole('button', { name: /convert to client/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    await expect(page.getByText(/lead converted to client successfully/i)).toBeVisible();
    
    // Navigate to clients page
    await page.getByRole('link', { name: /clients/i }).click();
    await expect(page).toHaveURL('/dashboard/clients');
    
    // Should see the converted client in the list
    await expect(page.getByText('Client List Test')).toBeVisible();
    await expect(page.getByText('clientlist@example.com')).toBeVisible();
  });

  test('should prevent conversion of already won leads', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Create a lead with Won status
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Already Won Lead');
    await page.getByLabel(/email/i).fill('won@example.com');
    await page.getByLabel(/phone/i).fill('1111111111');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /home/i }).click();
    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: /won/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Go to lead details
    await page.getByText('Already Won Lead').click();
    
    // Convert to Client button should be disabled or not visible for Won leads
    const convertButton = page.getByRole('button', { name: /convert to client/i });
    await expect(convertButton).toBeDisabled();
  });

  test('should log activity for lead conversion', async ({ page }) => {
    await page.goto('/dashboard/leads');
    
    // Create and convert a lead
    await page.getByRole('button', { name: /add lead/i }).click();
    await page.getByLabel(/full name/i).fill('Activity Log Test');
    await page.getByLabel(/email/i).fill('activity@example.com');
    await page.getByLabel(/phone/i).fill('2222222222');
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: /business/i }).click();
    await page.getByRole('button', { name: /create lead/i }).click();
    
    await expect(page.getByText(/lead created successfully/i)).toBeVisible();
    
    // Convert the lead
    await page.getByText('Activity Log Test').click();
    await page.getByRole('button', { name: /convert to client/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    await expect(page.getByText(/lead converted to client successfully/i)).toBeVisible();
    
    // Go to dashboard to check recent activities
    await page.getByRole('link', { name: /dashboard/i }).click();
    
    // Should see conversion activity in recent activities
    await expect(page.getByText(/converted lead to client.*activity log test/i)).toBeVisible();
  });
});