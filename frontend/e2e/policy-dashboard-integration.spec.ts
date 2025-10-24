import { test, expect } from '@playwright/test';

test.describe('Policy Dashboard Integration E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('agent@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should update dashboard statistics when policies are created', async ({ page }) => {
    // Check initial dashboard statistics
    await expect(page.getByText(/Total Active Policies/i)).toBeVisible();
    await expect(page.getByText(/Total Commission This Month/i)).toBeVisible();
    
    // Create a test client
    await page.goto('/dashboard/clients');
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Dashboard Test Client');
    await page.getByLabel(/email/i).fill('dashboard.test@example.com');
    await page.getByLabel(/phone/i).fill('9999999999');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 30);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    // Navigate to client detail page
    await page.getByText('Dashboard Test Client').click();
    
    // Add a policy with significant commission
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-DASHBOARD-001');
    await page.getByRole('combobox').click();
    await page.getByText('Life').click();
    await page.getByLabel('Provider *').fill('Dashboard Insurance Co');
    await page.getByLabel('Premium Amount *').fill('10000'); // Large premium
    await page.getByLabel('Commission Amount *').fill('1000'); // Large commission
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Go back to dashboard
    await page.goto('/dashboard');
    
    // Statistics should be updated
    await expect(page.getByText(/Total Active Policies/i)).toBeVisible();
    await expect(page.getByText(/Total Commission This Month/i)).toBeVisible();
    
    // Should show recent activity for policy creation
    await expect(page.getByText(/Recent Activities/i)).toBeVisible();
    // Look for activity related to the policy (might contain policy number or client name)
    await expect(page.locator('text=/POL-DASHBOARD-001|Dashboard Test Client/').first()).toBeVisible();
  });

  test('should update dashboard when policies are updated', async ({ page }) => {
    // Create a client and policy first
    await page.goto('/dashboard/clients');
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Update Test Client');
    await page.getByLabel(/email/i).fill('update.test@example.com');
    await page.getByLabel(/phone/i).fill('8888888888');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 25);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    await page.getByText('Update Test Client').click();
    
    // Create initial policy
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-UPDATE-001');
    await page.getByRole('combobox').click();
    await page.getByText('Auto').click();
    await page.getByLabel('Provider *').fill('Update Insurance Co');
    await page.getByLabel('Premium Amount *').fill('2000');
    await page.getByLabel('Commission Amount *').fill('200');
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Check dashboard before update
    await page.goto('/dashboard');
    const beforeUpdateText = await page.textContent('body');
    
    // Go back and update the policy
    await page.goto('/dashboard/clients');
    await page.getByText('Update Test Client').click();
    
    await page.getByLabelText('Edit policy POL-UPDATE-001').click();
    await page.getByLabel('Commission Amount *').clear();
    await page.getByLabel('Commission Amount *').fill('500'); // Increase commission significantly
    await page.getByRole('button', { name: /update policy/i }).click();
    
    await expect(page.getByText(/policy updated successfully/i)).toBeVisible();
    
    // Check dashboard after update
    await page.goto('/dashboard');
    
    // Should show updated activity
    await expect(page.getByText(/Recent Activities/i)).toBeVisible();
    // Should have activity about policy update
    await expect(page.locator('text=/updated|POL-UPDATE-001/i').first()).toBeVisible();
  });

  test('should update dashboard when policies are deleted', async ({ page }) => {
    // Create a client and policy first
    await page.goto('/dashboard/clients');
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Delete Test Client');
    await page.getByLabel(/email/i).fill('delete.test@example.com');
    await page.getByLabel(/phone/i).fill('7777777777');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 40);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    await page.getByText('Delete Test Client').click();
    
    // Create policy
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-DELETE-DASH-001');
    await page.getByRole('combobox').click();
    await page.getByText('Health').click();
    await page.getByLabel('Provider *').fill('Delete Insurance Co');
    await page.getByLabel('Premium Amount *').fill('3000');
    await page.getByLabel('Commission Amount *').fill('300');
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Delete the policy
    await page.getByLabelText('Delete policy POL-DELETE-DASH-001').click();
    await page.getByRole('button', { name: /delete policy/i }).click();
    
    await expect(page.getByText(/policy deleted successfully/i)).toBeVisible();
    
    // Check dashboard
    await page.goto('/dashboard');
    
    // Should show activity about policy deletion
    await expect(page.getByText(/Recent Activities/i)).toBeVisible();
    await expect(page.locator('text=/deleted|POL-DELETE-DASH-001/i').first()).toBeVisible();
  });

  test('should show policy statistics in client overview cards', async ({ page }) => {
    // Create a client
    await page.goto('/dashboard/clients');
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Stats Overview Client');
    await page.getByLabel(/email/i).fill('stats.overview@example.com');
    await page.getByLabel(/phone/i).fill('6666666666');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 35);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    await page.getByText('Stats Overview Client').click();
    
    // Initially should show 0 policies
    await expect(page.getByText('0')).toBeVisible(); // Policy count in overview
    
    // Add first policy
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-STATS-001');
    await page.getByRole('combobox').click();
    await page.getByText('Life').click();
    await page.getByLabel('Provider *').fill('Stats Insurance 1');
    await page.getByLabel('Premium Amount *').fill('5000');
    await page.getByLabel('Commission Amount *').fill('500');
    
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Should show updated statistics
    await expect(page.getByText('1')).toBeVisible(); // Total policies
    await expect(page.getByText('1')).toBeVisible(); // Active policies
    await expect(page.getByText('$500.00')).toBeVisible(); // Total commission
    
    // Add second policy
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-STATS-002');
    await page.getByRole('combobox').click();
    await page.getByText('Auto').click();
    await page.getByLabel('Provider *').fill('Stats Insurance 2');
    await page.getByLabel('Premium Amount *').fill('3000');
    await page.getByLabel('Commission Amount *').fill('300');
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Should show updated statistics
    await expect(page.getByText('2')).toBeVisible(); // Total policies
    await expect(page.getByText('2')).toBeVisible(); // Active policies
    await expect(page.getByText('$8,000.00')).toBeVisible(); // Total premium (5000 + 3000)
    await expect(page.getByText('$800.00')).toBeVisible(); // Total commission (500 + 300)
  });

  test('should handle policy expiry warnings in dashboard context', async ({ page }) => {
    // Create a client
    await page.goto('/dashboard/clients');
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Expiry Warning Client');
    await page.getByLabel(/email/i).fill('expiry.warning@example.com');
    await page.getByLabel(/phone/i).fill('5555555555');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 45);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    await page.getByText('Expiry Warning Client').click();
    
    // Create a policy expiring soon
    await page.getByRole('button', { name: /add policy/i }).click();
    await page.getByLabel('Policy Number *').fill('POL-EXPIRY-WARN-001');
    await page.getByRole('combobox').click();
    await page.getByText('Health').click();
    await page.getByLabel('Provider *').fill('Expiry Warning Insurance');
    await page.getByLabel('Premium Amount *').fill('2500');
    await page.getByLabel('Commission Amount *').fill('250');
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11); // Started 11 months ago
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 20); // Expires in 20 days
    
    await page.getByLabel('Start Date *').fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel('Expiry Date *').fill(expiryDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /create policy/i }).click();
    
    await expect(page.getByText(/policy created successfully/i)).toBeVisible();
    
    // Should show expiry warning
    await expect(page.getByText('Expiring Soon')).toBeVisible();
    
    // Should show warning icon
    await expect(page.locator('[data-testid="alert-triangle"]')).toBeVisible();
    
    // Should show expiry warning text
    await expect(page.getByText(/Expires in \d+ days/)).toBeVisible();
  });

  test('should maintain policy data consistency across navigation', async ({ page }) => {
    // Create client and policies
    await page.goto('/dashboard/clients');
    await page.getByRole('button', { name: /add client/i }).click();
    await page.getByLabel(/full name/i).fill('Consistency Test Client');
    await page.getByLabel(/email/i).fill('consistency.test@example.com');
    await page.getByLabel(/phone/i).fill('4444444444');
    
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 50);
    const dateString = birthDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
    
    await page.getByRole('button', { name: /create client/i }).click();
    await expect(page.getByText(/client created successfully/i)).toBeVisible();
    
    await page.getByText('Consistency Test Client').click();
    
    // Create multiple policies
    const policies = [
      { number: 'POL-CONS-001', type: 'Life', premium: '4000', commission: '400' },
      { number: 'POL-CONS-002', type: 'Auto', premium: '1500', commission: '150' },
      { number: 'POL-CONS-003', type: 'Health', premium: '2000', commission: '200' }
    ];
    
    for (const policy of policies) {
      await page.getByRole('button', { name: /add policy/i }).click();
      await page.getByLabel('Policy Number *').fill(policy.number);
      await page.getByRole('combobox').click();
      await page.getByText(policy.type).click();
      await page.getByLabel('Provider *').fill(`${policy.type} Insurance Co`);
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
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Navigate back to clients
    await page.goto('/dashboard/clients');
    
    // Navigate back to client detail
    await page.getByText('Consistency Test Client').click();
    
    // All policies should still be there
    await expect(page.getByText('Policies (3)')).toBeVisible();
    await expect(page.getByText('POL-CONS-001')).toBeVisible();
    await expect(page.getByText('POL-CONS-002')).toBeVisible();
    await expect(page.getByText('POL-CONS-003')).toBeVisible();
    
    // Statistics should be consistent
    await expect(page.getByText('3')).toBeVisible(); // Total policies
    await expect(page.getByText('$7,500.00')).toBeVisible(); // Total premium
    await expect(page.getByText('$750.00')).toBeVisible(); // Total commission
    
    // Navigate to dashboard and back again
    await page.goto('/dashboard');
    await page.goto('/dashboard/clients');
    await page.getByText('Consistency Test Client').click();
    
    // Data should still be consistent
    await expect(page.getByText('Policies (3)')).toBeVisible();
    await expect(page.getByText('$7,500.00')).toBeVisible();
    await expect(page.getByText('$750.00')).toBeVisible();
  });
});