import { Page, expect } from '@playwright/test';

/**
 * Helper function to login to the application
 */
export async function login(page: Page, email = 'agent@example.com', password = 'password123') {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/dashboard');
}

/**
 * Helper function to create a test lead
 */
export async function createTestLead(
  page: Page,
  leadData: {
    name: string;
    email: string;
    phone: string;
    insuranceInterest?: string;
    status?: string;
    priority?: string;
    notes?: string;
  }
) {
  await page.goto('/dashboard/leads');
  await page.getByRole('button', { name: /add lead/i }).click();
  
  await page.getByLabel(/full name/i).fill(leadData.name);
  await page.getByLabel(/email/i).fill(leadData.email);
  await page.getByLabel(/phone/i).fill(leadData.phone);
  
  if (leadData.insuranceInterest) {
    await page.getByLabel(/insurance interest/i).click();
    await page.getByRole('option', { name: new RegExp(leadData.insuranceInterest, 'i') }).click();
  }
  
  if (leadData.status) {
    await page.getByLabel(/status/i).click();
    await page.getByRole('option', { name: new RegExp(leadData.status, 'i') }).click();
  }
  
  if (leadData.priority) {
    await page.getByLabel(/priority/i).click();
    await page.getByRole('option', { name: new RegExp(leadData.priority, 'i') }).click();
  }
  
  if (leadData.notes) {
    await page.getByLabel(/notes/i).fill(leadData.notes);
  }
  
  await page.getByRole('button', { name: /create lead/i }).click();
  await expect(page.getByText(/lead created successfully/i)).toBeVisible();
}

/**
 * Helper function to create a test client
 */
export async function createTestClient(
  page: Page,
  clientData: {
    name: string;
    email: string;
    phone: string;
    dateOfBirth?: Date;
    address?: string;
  }
) {
  await page.goto('/dashboard/clients');
  await page.getByRole('button', { name: /add client/i }).click();
  
  await page.getByLabel(/full name/i).fill(clientData.name);
  await page.getByLabel(/email/i).fill(clientData.email);
  await page.getByLabel(/phone/i).fill(clientData.phone);
  
  if (clientData.dateOfBirth) {
    const dateString = clientData.dateOfBirth.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
  } else {
    // Default to 30 years ago
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 30);
    const dateString = defaultDate.toISOString().split('T')[0];
    await page.getByLabel(/date of birth/i).fill(dateString);
  }
  
  if (clientData.address) {
    await page.getByLabel(/address/i).fill(clientData.address);
  }
  
  await page.getByRole('button', { name: /create client/i }).click();
  await expect(page.getByText(/client created successfully/i)).toBeVisible();
}

/**
 * Helper function to convert a lead to client
 */
export async function convertLeadToClient(page: Page, leadName: string) {
  await page.goto('/dashboard/leads');
  await page.getByText(leadName).click();
  await page.getByRole('button', { name: /convert to client/i }).click();
  await page.getByRole('button', { name: /confirm/i }).click();
  await expect(page.getByText(/lead converted to client successfully/i)).toBeVisible();
}

/**
 * Helper function to wait for toast notification
 */
export async function waitForToast(page: Page, message: string | RegExp) {
  await expect(page.getByText(message)).toBeVisible();
}

/**
 * Helper function to check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Helper function to generate random test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    phone: `555${timestamp.toString().slice(-7)}`,
  };
}

/**
 * Helper function to clean up test data (if needed)
 */
export async function cleanupTestData(page: Page) {
  // This would typically involve API calls to clean up test data
  // For now, we'll just ensure we're logged out
  try {
    await page.getByRole('button', { name: /logout/i }).click();
  } catch {
    // Ignore if logout button is not found
  }
}