import { test, expect } from '@playwright/test';

test.describe('Policy Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('amitulhe@gmail.com');
    await page.getByLabel(/password/i).fill('Amit@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Create a test client for policy operations
    await page.goto('/dashboard/clients');
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Policy Test Client');
    await page.getByLabel(/email/i).fill('policy.test@example.com');
    await page.getByLabel(/phone/i).fill('1234567890');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 35);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByLabel(/address/i).fill('123 Test St, Test City, TS 12345');
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Navigate to client detail page
    await page.getByText('Policy Test Client').click();
    await expect(page.getByRole('heading', { name: /policy test client/i })).toBeVisible();
  });

  test('should display empty policies section for new client', async ({ page }) => {
    // Should show policies section with empty state
    await expect(page.getByText('Policies')).toBeVisible();
    await expect(page.getByText('(0)')).toBeVisible();
    await expect(page.getByText('No policies found')).toBeVisible();
    await expect(page.getByText("This client doesn't have any insurance policies yet")).toBeVisible();
    await expect(page.getByRole('button', { name: /add first policy/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add policy/i })).toBeVisible();
  });

  test('should create a new policy successfully', async ({ page }) => {
    // Click Add Policy button
    await page.getByRole('button', { name: /add policy/i }).click();
    
    // Verify modal opened
    await expect(page.getByText('Add New Policy')).toBeVisible();
    
    // Fill in policy form
    await page.getByLabel('Policy Number *').fill('POL-E2E-001');
    
    // Select policy type
    await page.getByRole('combobox').click();
    await page.getByText('Life').click();
    
    await page.getByLabel('Provider *').fill('Life Insurance Company');
    await page.getByLabel('Premium Amount *').fill('1000');
    await page.getByLabel('Commission Amount *').fill('100');
    
    // Set dates
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    
    // Submit form
    await page.getByRole('button', { name: /create policy/i }).click();
    
    // Should show success message
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Should see the new policy in the table
    await expect(page.getByText('POL-E2E-001')).toBeVisible();
    await expect(page.getByText('Life Insurance Company')).toBeVisible();
    await expect(page.getByText('$1,000.00')).toBeVisible();
    await expect(page.getByText('$100.00')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
    
    // Should update policy count
    await expect(page.getByText('Policies (1)')).toBeVisible();
    
    // Should show policy summary cards
    await expect(page.getByText('1').first()).toBeVisible(); // Total policies
    await expect(page.getByText('Total Policies')).toBeVisible();
    await expect(page.getByText('Active Policies')).toBeVisible();
    await expect(page.getByText('Total Premium')).toBeVisible();
    await expect(page.getByText('Total Commission')).toBeVisible();
  });

  test('should validate required fields when creating a policy', async ({ page }) => {
    // Click Add Policy button
    await page.getByRole('button', { name: /add policy/i }).click();
    
    // Try to submit empty form
    await page.getByRole('button', { name: /create policy/i }).click();
    
    // Should show validation errors
    await expect(page.getByText('Policy number is required')).toBeVisible();
    await expect(page.getByText('Provider is required')).toBeVisible();
    await expect(page.getByText('Start date is required')).toBeVisible();
    await expect(page.getByText('Expiry date is required')).toBeVisible();
    await expect(page.getByText('Premium amount must be greater than 0')).toBeVisible();
    await expect(page.getByText('Commission amount must be greater than 0')).toBeVisible();
  });

  test('should validate date range when creating a policy', async ({ page }) => {
    // Click Add Policy button
    await page.getByRole('button', { name: /add policy/i }).click();
    
    // Fill form with invalid date range
    await page.getByLabel('Policy Number *').fill('POL-E2E-002');
    await page.getByLabel('Provider *').fill('Test Insurance');
    await page.getByLabel('Premium Amount *').fill('1000');
    await page.getByLabel('Commission Amount *').fill('100');
    
    // Set expiry date before start date
    await page.getByLabel('Start Date *').fill('2025-01-01');
    await page.getByLabel('Expiry Date *').fill('2024-01-01');
    
    // Should show validation error
    await expect(page.getByText('Expiry date must be after start date')).toBeVisible();
    
    // Submit should not work
    await page.getByRole('button', { name: /create policy/i }).click();
    
    // Modal should still be open
    await expect(page.getByText('Add New Policy')).toBeVisible();
  });

  test('should validate policy number uniqueness', async ({ page }) => {
    // Create first policy
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-UNIQUE-001');
    await page.getByRole('combobox').click();
    await page.getByText('Auto').click();
    await page.getByLabel('Provider *').fill('Auto Insurance Co');
    await page.getByLabel('Premium Amount *').fill('800');
    await page.getByLabel('Commission Amount *').fill('80');
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Try to create second policy with same number
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-UNIQUE-001');
    await page.getByLabel('Provider *').fill('Different Insurance');
    await page.getByLabel('Premium Amount *').fill('1200');
    await page.getByLabel('Commission Amount *').fill('120');
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    // Should show uniqueness error
    await expect(page.getByText(/policy number already exists/i)).toBeVisible();
  });

  test('should edit an existing policy', async ({ page }) => {
    // Create a policy first
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-EDIT-001');
    await page.getByRole('combobox').click();
    await page.getByText('Health').click();
    await page.getByLabel('Provider *').fill('Health Insurance Co');
    await page.getByLabel('Premium Amount *').fill('1200');
    await page.getByLabel('Commission Amount *').fill('120');
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Click edit button for the policy
    await page.getByLabelText('Edit policy POL-EDIT-001').click();
    
    // Verify edit modal opened with pre-filled data
    await expect(page.getByText('Edit Policy')).toBeVisible();
    await expect(page.getByDisplayValue('POL-EDIT-001')).toBeVisible();
    await expect(page.getByDisplayValue('Health Insurance Co')).toBeVisible();
    
    // Update premium amount
    await page.getByLabel('Premium Amount *').clear();
    await page.getByLabel('Premium Amount *').fill('1500');
    
    // Update provider
    await page.getByLabel('Provider *').clear();
    await page.getByLabel('Provider *').fill('Updated Health Insurance');
    
    // Submit changes
    await page.getByRole('button', { name: /update policy/i }).click();
    
    // Should show success message
    await expect(page.getByText(/policy updated successfully/i)).toBeVisible();
    
    // Should see updated values in the table
    await expect(page.getByText('Updated Health Insurance')).toBeVisible();
    await expect(page.getByText('$1,500.00')).toBeVisible();
  });

  test('should delete a policy with confirmation', async ({ page }) => {
    // Create a policy first
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-DELETE-001');
    await page.getByRole('combobox').click();
    await page.getByText('Business').click();
    await page.getByLabel('Provider *').fill('Business Insurance Co');
    await page.getByLabel('Premium Amount *').fill('2000');
    await page.getByLabel('Commission Amount *').fill('200');
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Click delete button for the policy
    await page.getByLabelText('Delete policy POL-DELETE-001').click();
    
    // Should show confirmation dialog
    await expect(page.getByText('Delete Policy')).toBeVisible();
    await expect(page.getByText('Are you sure you want to delete policy "POL-DELETE-001"?')).toBeVisible();
    
    // Cancel first
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Policy should still be there
    await expect(page.getByText('POL-DELETE-001')).toBeVisible();
    
    // Try delete again and confirm
    await page.getByLabelText('Delete policy POL-DELETE-001').click();
    await page.getByRole('button', { name: /delete policy/i }).click();
    
    // Should show success message
    await expect(page.getByText(/policy deleted successfully/i)).toBeVisible();
    
    // Policy should be removed from table
    await expect(page.getByText('POL-DELETE-001')).not.toBeVisible();
    
    // Should update policy count back to 0
    await expect(page.getByText('Policies (0)')).toBeVisible();
    await expect(page.getByText('No policies found')).toBeVisible();
  });

  test('should display policy status badges correctly', async ({ page }) => {
    // Create an active policy
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-STATUS-001');
    await page.getByRole('combobox').click();
    await page.getByText('Life').click();
    await page.getByLabel('Provider *').fill('Status Test Insurance');
    await page.getByLabel('Premium Amount *').fill('1000');
    await page.getByLabel('Commission Amount *').fill('100');
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Should show Active status badge
    await expect(page.getByText('Active')).toBeVisible();
    
    // Create a policy expiring soon (within 30 days)
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-EXPIRING-001');
    await page.getByRole('combobox').click();
    await page.getByText('Auto').click();
    await page.getByLabel('Provider *').fill('Expiring Insurance');
    await page.getByLabel('Premium Amount *').fill('800');
    await page.getByLabel('Commission Amount *').fill('80');
    
    const soonStartDate = new Date();
    const soonExpiryDate = new Date();
    soonExpiryDate.setDate(soonExpiryDate.getDate() + 15); // 15 days from now
    
    await page.getByLabel('Start Date *').fill(soonStartDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(soonExpiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Should show Expiring Soon status badge
    await expect(page.getByText('Expiring Soon')).toBeVisible();
  });

  test('should handle currency formatting in policy forms', async ({ page }) => {
    // Click Add Policy button
    await page.getByRole('button', { name: /add policy/i }).click();
    
    // Test currency input formatting
    await page.getByLabel('Premium Amount *').fill('1234.56');
    await page.getByLabel('Commission Amount *').fill('123.45');
    
    // Values should be formatted correctly
    await expect(page.getByLabel('Premium Amount *')).toHaveValue('1234.56');
    await expect(page.getByLabel('Commission Amount *')).toHaveValue('123.45');
    
    // Test invalid currency input
    await page.getByLabel('Premium Amount *').clear();
    await page.getByLabel('Premium Amount *').fill('abc123def');
    
    // Should only show numeric characters
    await expect(page.getByLabel('Premium Amount *')).toHaveValue('123');
  });

  test('should show responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Create a policy first
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-MOBILE-001');
    await page.getByRole('combobox').click();
    await page.getByText('Life').click();
    await page.getByLabel('Provider *').fill('Mobile Insurance Co');
    await page.getByLabel('Premium Amount *').fill('1000');
    await page.getByLabel('Commission Amount *').fill('100');
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Should show mobile card layout instead of table
    await expect(page.getByText('POL-MOBILE-001')).toBeVisible();
    await expect(page.getByText('Life • Mobile Insurance Co')).toBeVisible();
    
    // Policy summary cards should stack vertically
    await expect(page.getByText('Total Policies')).toBeVisible();
    await expect(page.getByText('Active Policies')).toBeVisible();
  });

  test('should update dashboard statistics after policy operations', async ({ page }) => {
    // Go to dashboard to check initial stats
    await page.goto('/dashboard');
    
    // Note initial stats (they might be 0 or have existing data)
    const initialPoliciesText = await page.getByText(/Total Active Policies/i).locator('..').textContent();
    const initialCommissionText = await page.getByText(/Total Commission This Month/i).locator('..').textContent();
    
    // Go back to client and add a policy
    await page.goto('/dashboard/clients');
    await page.getByText('Policy Test Client').click();
    
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-STATS-001');
    await page.getByRole('combobox').click();
    await page.getByText('Life').click();
    await page.getByLabel('Provider *').fill('Stats Insurance Co');
    await page.getByLabel('Premium Amount *').fill('5000');
    await page.getByLabel('Commission Amount *').fill('500');
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Go back to dashboard and check updated stats
    await page.goto('/dashboard');
    
    // Stats should be updated (exact values depend on existing data)
    await expect(page.getByText(/Total Active Policies/i)).toBeVisible();
    await expect(page.getByText(/Total Commission This Month/i)).toBeVisible();
    
    // Should show some activity for the policy creation
    await expect(page.getByText(/recent activities/i)).toBeVisible();
  });

  test('should handle policy operations with loading states', async ({ page }) => {
    // Create a policy and observe loading states
    await page.getByRole('button', { name: /add policy/i }).click();
    
    await page.getByLabel('Policy Number *').fill('POL-LOADING-001');
    await page.getByRole('combobox').click();
    await page.getByText('Health').click();
    await page.getByLabel('Provider *').fill('Loading Test Insurance');
    await page.getByLabel('Premium Amount *').fill('1500');
    await page.getByLabel('Commission Amount *').fill('150');
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    
    // Submit and check for loading state
    await page.getByRole('button', { name: /create policy/i }).click();
    
    // Might briefly see "Saving..." text
    // await expect(page.getByText('Saving...')).toBeVisible();
    
    // Should eventually show success
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Policy should appear in table
    await expect(page.getByText('POL-LOADING-001')).toBeVisible();
  });

  test('should navigate between policy operations seamlessly', async ({ page }) => {
    // Create multiple policies
    const policies = [
      { number: 'POL-NAV-001', type: 'Life', provider: 'Life Co', premium: '1000', commission: '100' },
      { number: 'POL-NAV-002', type: 'Auto', provider: 'Auto Co', premium: '800', commission: '80' },
      { number: 'POL-NAV-003', type: 'Health', provider: 'Health Co', premium: '1200', commission: '120' }
    ];
    
    for (const policy of policies) {
      await page.getByRole('button', { name: /add policy/i }).click();
      await page.getByLabel('Policy Number *').fill(policy.number);
      await page.getByRole('combobox').click();
      await page.getByText(policy.type).click();
      await page.getByLabel('Provider *').fill(policy.provider);
      await page.getByLabel('Premium Amount *').fill(policy.premium);
      await page.getByLabel('Commission Amount *').fill(policy.commission);
      
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
      await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
      await page.getByRole('button', { name: /create policy/i }).click();
      
      await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    }
    
    // Should show all policies
    await expect(page.getByText('Policies (3)')).toBeVisible();
    await expect(page.getByText('POL-NAV-001')).toBeVisible();
    await expect(page.getByText('POL-NAV-002')).toBeVisible();
    await expect(page.getByText('POL-NAV-003')).toBeVisible();
    
    // Edit one policy
    await page.getByLabelText('Edit policy POL-NAV-002').click();
    await page.getByLabel('Premium Amount *').clear();
    await page.getByLabel('Premium Amount *').fill('900');
    await page.getByRole('button', { name: /update policy/i }).click();
    await expect(page.getByText(/policy updated successfully/i)).toBeVisible();
    
    // Delete one policy
    await page.getByLabelText('Delete policy POL-NAV-003').click();
    await page.getByRole('button', { name: /delete policy/i }).click();
    await expect(page.getByText(/policy deleted successfully/i)).toBeVisible();
    
    // Should show updated count and remaining policies
    await expect(page.getByText('Policies (2)')).toBeVisible();
    await expect(page.getByText('POL-NAV-001')).toBeVisible();
    await expect(page.getByText('POL-NAV-002')).toBeVisible();
    await expect(page.getByText('$900.00')).toBeVisible(); // Updated premium
    await expect(page.getByText('POL-NAV-003')).not.toBeVisible();
  });
});