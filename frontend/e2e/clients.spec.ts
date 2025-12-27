import { test, expect } from '@playwright/test';

test.describe('Clients Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('amitulhe@gmail.com');
    await page.getByLabel(/password/i).fill('Amit@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to clients page and display clients table', async ({ page }) => {
    // Navigate to clients page
    await page.getByRole('link', { name: /clients/i }).click();
    await expect(page).toHaveURL('/dashboard/clients');
    
    // Check clients page elements
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add client/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search clients/i)).toBeVisible();
    
    // Check table headers
    await expect(page.getByText(/name/i)).toBeVisible();
    await expect(page.getByText(/email/i)).toBeVisible();
    await expect(page.getByText(/phone/i)).toBeVisible();
    await expect(page.getByText(/age/i)).toBeVisible();
    await expect(page.getByText(/policies/i)).toBeVisible();
  });

  test('should create a new client successfully', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    // Click Add Client button
    await page.getByRole('button', { name: /add client/i }).click();
    
    // Fill in the client form
    await page.getByLabel(/full name/i).fill('John Client');
    await page.getByLabel(/email/i).fill('john.client@example.com');
    await page.getByLabel(/phone/i).fill('1234567890');
    
    // Set date of birth (use a date that makes the client 35 years old)
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 35);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    // Add address
    await page.getByLabel(/address/i).fill('123 Main St, City, State 12345');
    
    // Submit form
    await page.getByRole('button', { name: /create client/i }).click();
    
    // Should show success message
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Should see the new client in the table
    await expect(page.getByText('John Client')).toBeVisible();
    await expect(page.getByText('john.client@example.com')).toBeVisible();
  });

  test('should validate required fields when creating a client', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    // Click Add Client button
    await page.getByRole('button', { name: /add client/i }).click();
    
    // Try to submit empty form
    await page.getByRole('button', { name: /create client/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/phone is required/i)).toBeVisible();
    await expect(page.getByText(/date of birth is required/i)).toBeVisible();
  });

  test('should validate email uniqueness', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    // Create first client
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('First Client');
    await page.getByLabel(/email/i).fill('unique@example.com');
    await page.getByLabel(/phone/i).fill('1111111111');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 30);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Try to create second client with same email
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Second Client');
    await page.getByLabel(/email/i).fill('unique@example.com');
    await page.getByLabel(/phone/i).fill('2222222222');
    await page.getByLabel(/date of birth/i).fill(dateString);
    await page.getByRole('button', { name: /create client/i }).click();
    
    // Should show email uniqueness error
    await expect(page.getByText(/email already exists/i)).toBeVisible();
  });

  test('should search clients by name', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    // Create a test client
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Jane Client');
    await page.getByLabel(/email/i).fill('jane.client@example.com');
    await page.getByLabel(/phone/i).fill('9876543210');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 40);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Search for the client
    await page.getByPlaceholder(/search clients/i).fill('Jane');
    
    // Should show filtered results
    await expect(page.getByText('Jane Client')).toBeVisible();
  });

  test('should view client details', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    // Create a test client
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Detail Test Client');
    await page.getByLabel(/email/i).fill('detail.client@example.com');
    await page.getByLabel(/phone/i).fill('5555555555');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 25);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByLabel(/address/i).fill('456 Oak Ave, Town, State 67890');
    await page.getByRole('button', { name: /create client/i }).click();
    
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Click on the client row to view details
    await page.getByText('Detail Test Client').click();
    
    // Should navigate to client detail page
    await expect(page.getByRole('heading', { name: /client details/i })).toBeVisible();
    await expect(page.getByText('Detail Test Client')).toBeVisible();
    await expect(page.getByText('detail.client@example.com')).toBeVisible();
    await expect(page.getByText('456 Oak Ave, Town, State 67890')).toBeVisible();
    
    // Should show calculated age (approximately 25)
    await expect(page.getByText(/25/)).toBeVisible();
  });

  test('should edit a client', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    // Create a test client
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Edit Test Client');
    await page.getByLabel(/email/i).fill('edit.client@example.com');
    await page.getByLabel(/phone/i).fill('6666666666');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 45);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Go to client details
    await page.getByText('Edit Test Client').click();
    
    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click();
    
    // Update the client
    await page.getByLabel(/full name/i).clear();
    await page.getByLabel(/full name/i).fill('Updated Client Name');
    await page.getByLabel(/address/i).fill('789 Pine St, Village, State 11111');
    await page.getByRole('button', { name: /update client/i }).click();
    
    // Should show success message
    await expect(page.getByText(/client updated successfully/i)).toBeVisible();
    
    // Should show updated information
    await expect(page.getByText('Updated Client Name')).toBeVisible();
    await expect(page.getByText('789 Pine St, Village, State 11111')).toBeVisible();
  });

  test('should delete a client', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    // Create a test client
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Delete Test Client');
    await page.getByLabel(/email/i).fill('delete.client@example.com');
    await page.getByLabel(/phone/i).fill('7777777777');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 50);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Go to client details
    await page.getByText('Delete Test Client').click();
    
    // Click delete button
    await page.getByRole('button', { name: /delete/i }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Should show success message and redirect to clients list
    await expect(page.getByText(/client deleted successfully/i)).toBeVisible();
    await expect(page).toHaveURL('/dashboard/clients');
    
    // Client should not be in the list anymore
    await expect(page.getByText('Delete Test Client')).not.toBeVisible();
  });

  test('should display policies for a client', async ({ page }) => {
    await page.goto('/dashboard/clients');
    
    // Create a test client
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Policy Test Client');
    await page.getByLabel(/email/i).fill('policy.client@example.com');
    await page.getByLabel(/phone/i).fill('8888888888');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 35);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Go to client details
    await page.getByText('Policy Test Client').click();
    
    // Should show policies section (even if empty)
    await expect(page.getByText(/policies/i)).toBeVisible();
    await expect(page.getByText(/no policies found/i)).toBeVisible();
  });
});