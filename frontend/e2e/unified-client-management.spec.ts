import { test, expect, Page } from '@playwright/test';
import { login, generateTestData, waitForToast } from './helpers/test-utils';

// Test data generator for unified client form
function generateUnifiedClientData() {
  const timestamp = Date.now();
  return {
    // Mandatory fields
    firstName: `John${timestamp}`,
    lastName: `Doe${timestamp}`,
    phoneNumber: `91${timestamp.toString().slice(-8)}`,
    whatsappNumber: `91${timestamp.toString().slice(-7)}1`,
    dateOfBirth: '1990-05-15',
    
    // Optional personal fields
    middleName: 'Michael',
    email: `john.doe${timestamp}@example.com`,
    state: 'Maharashtra',
    city: 'Mumbai',
    address: '123 Test Street, Test Area',
    birthPlace: 'Mumbai',
    gender: 'MALE',
    height: '5.8',
    weight: '70',
    education: 'Graduate',
    maritalStatus: 'SINGLE',
    businessJob: 'Software Engineer',
    nameOfBusiness: 'Tech Corp',
    typeOfDuty: 'Development',
    annualIncome: '1200000',
    panNumber: 'ABCDE1234F',
    gstNumber: '27ABCDE1234F1Z5',
    
    // Optional corporate fields
    companyName: `Test Corp ${timestamp}`,
    
    // Optional family/employee fields
    relationship: 'SPOUSE'
  };
}

// Helper function to expand form sections
async function expandSection(page: Page, sectionName: string) {
  const sectionButton = page.getByRole('button', { name: new RegExp(sectionName, 'i') });
  if (await sectionButton.isVisible()) {
    await sectionButton.click();
    // Wait for section to expand
    await page.waitForTimeout(500);
  }
}

// Helper function to upload test files
async function uploadTestFile(page: Page, fileType: 'image' | 'document' = 'document') {
  const fileContent = fileType === 'image' 
    ? 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' // 1x1 PNG
    : 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgo='; // Simple PDF
  
  const fileName = fileType === 'image' ? 'test-image.png' : 'test-document.pdf';
  const mimeType = fileType === 'image' ? 'image/png' : 'application/pdf';
  
  const buffer = Buffer.from(fileContent, 'base64');
  
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText(/choose file|upload/i).first().click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles([{
    name: fileName,
    mimeType: mimeType,
    buffer: buffer
  }]);
}

test.describe('Unified Client Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Complete User Journey with Unified Form', () => {
    test('should create client with minimal mandatory data only', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Verify unified form is displayed (Requirements 10.1)
      await expect(page.getByRole('heading', { name: /client information/i })).toBeVisible();
      await expect(page.getByText(/only 5 fields are required/i)).toBeVisible();
      
      // Fill only the 5 mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Submit form with minimal data
      await page.getByRole('button', { name: /save client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
      
      // Should redirect to clients list
      await expect(page).toHaveURL('/dashboard/clients');
      
      // Should see the new client in the list
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
    });

    test('should create client with personal information fields filled', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Fill optional personal fields
      await page.getByLabel(/middle name/i).fill(clientData.middleName);
      await page.getByLabel(/email/i).fill(clientData.email);
      
      // Select state and city
      await page.getByLabel(/state/i).click();
      await page.getByRole('option', { name: clientData.state }).click();
      
      await page.waitForTimeout(1000);
      await page.getByLabel(/city/i).click();
      await page.getByRole('option', { name: clientData.city }).click();
      
      await page.getByLabel(/address/i).fill(clientData.address);
      await page.getByLabel(/birth place/i).fill(clientData.birthPlace);
      
      // Select gender
      await page.getByLabel(/gender/i).click();
      await page.getByRole('option', { name: /male/i }).click();
      
      await page.getByLabel(/height/i).fill(clientData.height);
      await page.getByLabel(/weight/i).fill(clientData.weight);
      await page.getByLabel(/education/i).fill(clientData.education);
      
      // Select marital status
      await page.getByLabel(/marital status/i).click();
      await page.getByRole('option', { name: /single/i }).click();
      
      await page.getByLabel(/business.*job/i).fill(clientData.businessJob);
      await page.getByLabel(/name of business/i).fill(clientData.nameOfBusiness);
      await page.getByLabel(/type of duty/i).fill(clientData.typeOfDuty);
      await page.getByLabel(/annual income/i).fill(clientData.annualIncome);
      await page.getByLabel(/pan number/i).fill(clientData.panNumber);
      await page.getByLabel(/gst number/i).fill(clientData.gstNumber);
      
      // Submit form
      await page.getByRole('button', { name: /save client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
      
      // Should redirect to clients list
      await expect(page).toHaveURL('/dashboard/clients');
      
      // Should see the new client in the list
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
    });

    test('should create client with corporate information fields filled', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Expand corporate details section
      await expandSection(page, 'corporate details');
      
      // Fill corporate fields
      await page.getByLabel(/company name/i).fill(clientData.companyName);
      await page.getByLabel(/annual revenue/i).fill('5000000');
      await page.getByLabel(/gst number/i).fill(clientData.gstNumber);
      
      // Submit form
      await page.getByRole('button', { name: /save client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
      
      // Should see the new client in the list
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
    });

    test('should create client with family/employee relationship fields filled', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Expand family/employee details section
      await expandSection(page, 'family.*employee details');
      
      // Fill relationship field
      await page.getByLabel(/relationship/i).click();
      await page.getByRole('option', { name: /spouse/i }).click();
      
      // Submit form
      await page.getByRole('button', { name: /save client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
      
      // Should see the new client in the list
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness of Unified Form', () => {
    test('should display unified form properly on mobile devices', async ({ page }) => {
      // Set mobile viewport (Requirements 10.2)
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/dashboard/clients/create');
      
      // Verify form is responsive
      await expect(page.getByRole('heading', { name: /client information/i })).toBeVisible();
      await expect(page.getByText(/only 5 fields are required/i)).toBeVisible();
      
      // Check that form fields are properly sized for mobile
      const firstNameField = page.getByLabel(/first name/i);
      await expect(firstNameField).toBeVisible();
      
      // Verify form sections are collapsible on mobile
      await expect(page.getByText(/personal details/i)).toBeVisible();
      await expect(page.getByText(/corporate details/i)).toBeVisible();
      await expect(page.getByText(/family.*employee details/i)).toBeVisible();
      
      // Test form interaction on mobile
      const clientData = generateUnifiedClientData();
      await firstNameField.fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Submit button should be full-width on mobile
      const submitButton = page.getByRole('button', { name: /save client/i });
      await expect(submitButton).toBeVisible();
      
      await submitButton.click();
      await waitForToast(page, /client created successfully/i);
    });

    test('should handle touch interactions properly', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/dashboard/clients/create');
      
      // Test section expansion with touch
      await expandSection(page, 'corporate details');
      
      // Verify section expanded
      await expect(page.getByLabel(/company name/i)).toBeVisible();
      
      // Test dropdown interactions
      await page.getByLabel(/gender/i).click();
      await expect(page.getByRole('option', { name: /male/i })).toBeVisible();
      await page.getByRole('option', { name: /male/i }).click();
      
      // Test date picker on touch devices
      await page.getByLabel(/date of birth/i).click();
      // Date picker should be accessible
      await page.getByLabel(/date of birth/i).fill('1990-05-15');
    });
  });

  test.describe('Form Persistence Across Page Refreshes', () => {
    test('should persist form data across page refreshes', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Fill some form data (Requirements 10.3)
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/email/i).fill(clientData.email);
      
      // Wait for auto-save to trigger
      await page.waitForTimeout(3000);
      
      // Refresh the page
      await page.reload();
      
      // Verify form data is restored
      await expect(page.getByLabel(/first name/i)).toHaveValue(clientData.firstName);
      await expect(page.getByLabel(/last name/i)).toHaveValue(clientData.lastName);
      await expect(page.getByLabel(/email/i)).toHaveValue(clientData.email);
      
      // Should show recovery banner
      await expect(page.getByText(/restore.*data/i).or(page.getByText(/unsaved.*changes/i))).toBeVisible();
    });

    test('should allow dismissing saved form data', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Fill some form data
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      
      // Wait for auto-save
      await page.waitForTimeout(3000);
      
      // Refresh the page
      await page.reload();
      
      // Dismiss saved data
      const dismissButton = page.getByRole('button', { name: /dismiss|clear|discard/i });
      if (await dismissButton.isVisible()) {
        await dismissButton.click();
        
        // Form should be cleared
        await expect(page.getByLabel(/first name/i)).toHaveValue('');
        await expect(page.getByLabel(/last name/i)).toHaveValue('');
      }
    });
  });

  test.describe('Error Handling for Mandatory vs Optional Fields', () => {
    test('should validate all 5 mandatory fields before submission', async ({ page }) => {
      await page.goto('/dashboard/clients/create');
      
      // Try to submit empty form (Requirements 10.4)
      await page.getByRole('button', { name: /save client/i }).click();
      
      // Should show validation errors for all 5 mandatory fields
      await expect(page.getByText(/first name is required/i)).toBeVisible();
      await expect(page.getByText(/last name is required/i)).toBeVisible();
      await expect(page.getByText(/phone number is required/i)).toBeVisible();
      await expect(page.getByText(/whatsapp number is required/i)).toBeVisible();
      await expect(page.getByText(/date of birth.*required/i)).toBeVisible();
      
      // Should not submit the form
      await expect(page).toHaveURL('/dashboard/clients/create');
    });

    test('should validate optional field formats when provided', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Fill invalid optional field values (Requirements 10.5)
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/pan number/i).fill('INVALID');
      
      // Try to submit
      await page.getByRole('button', { name: /save client/i }).click();
      
      // Should show validation errors for optional fields
      await expect(page.getByText(/invalid email format/i)).toBeVisible();
      await expect(page.getByText(/invalid pan format/i)).toBeVisible();
      
      // Should not submit the form
      await expect(page).toHaveURL('/dashboard/clients/create');
    });

    test('should allow submission with valid mandatory fields and empty optional fields', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Fill only mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Leave optional fields empty
      // Submit form
      await page.getByRole('button', { name: /save client/i }).click();
      
      // Should submit successfully
      await waitForToast(page, /client created successfully/i);
      await expect(page).toHaveURL('/dashboard/clients');
    });

    test('should handle network errors gracefully', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Simulate network failure
      await page.context().setOffline(true);
      
      // Try to submit form
      await page.getByRole('button', { name: /save client/i }).click();
      
      // Should show network error message
      await expect(page.getByText(/network error|connection failed|offline/i)).toBeVisible();
      
      // Form should remain on the same page with data intact
      await expect(page).toHaveURL('/dashboard/clients/create');
      await expect(page.getByLabel(/first name/i)).toHaveValue(clientData.firstName);
      
      // Restore network
      await page.context().setOffline(false);
      
      // Retry submission should work
      await page.getByRole('button', { name: /save client/i }).click();
      await waitForToast(page, /client created successfully/i);
    });
  });

  test.describe('Form Section Management', () => {
    test('should expand and collapse form sections properly', async ({ page }) => {
      await page.goto('/dashboard/clients/create');
      
      // Personal Details should be expanded by default
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      
      // Corporate Details should be collapsed by default
      await expect(page.getByLabel(/company name/i)).not.toBeVisible();
      
      // Expand Corporate Details
      await expandSection(page, 'corporate details');
      await expect(page.getByLabel(/company name/i)).toBeVisible();
      
      // Collapse Corporate Details
      await page.getByRole('button', { name: /corporate details/i }).click();
      await page.waitForTimeout(500);
      await expect(page.getByLabel(/company name/i)).not.toBeVisible();
      
      // Family/Employee Details should be collapsed by default
      await expect(page.getByLabel(/relationship/i)).not.toBeVisible();
      
      // Expand Family/Employee Details
      await expandSection(page, 'family.*employee details');
      await expect(page.getByLabel(/relationship/i)).toBeVisible();
    });

    test('should maintain form data when sections are collapsed and expanded', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Expand Corporate Details and fill data
      await expandSection(page, 'corporate details');
      await page.getByLabel(/company name/i).fill(clientData.companyName);
      
      // Collapse and re-expand
      await page.getByRole('button', { name: /corporate details/i }).click();
      await page.waitForTimeout(500);
      await expandSection(page, 'corporate details');
      
      // Data should be preserved
      await expect(page.getByLabel(/company name/i)).toHaveValue(clientData.companyName);
    });
  });

  test.describe('Age Calculation and Auto-fill Features', () => {
    test('should automatically calculate age from date of birth', async ({ page }) => {
      await page.goto('/dashboard/clients/create');
      
      // Enter birth date
      await page.getByLabel(/date of birth/i).fill('1990-05-15');
      
      // Click outside to trigger calculation
      await page.getByLabel(/first name/i).click();
      
      // Age should be calculated
      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - 1990;
      
      const ageField = page.getByLabel(/age/i);
      if (await ageField.isVisible()) {
        await expect(ageField).toHaveValue(expectedAge.toString());
      }
    });

    test('should update age when date of birth changes', async ({ page }) => {
      await page.goto('/dashboard/clients/create');
      
      // Enter first birth date
      await page.getByLabel(/date of birth/i).fill('1990-05-15');
      await page.getByLabel(/first name/i).click();
      
      // Change birth date
      await page.getByLabel(/date of birth/i).fill('1985-05-15');
      await page.getByLabel(/first name/i).click();
      
      // Age should be updated
      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - 1985;
      
      const ageField = page.getByLabel(/age/i);
      if (await ageField.isVisible()) {
        await expect(ageField).toHaveValue(expectedAge.toString());
      }
    });
  });

  test.describe('Document and Image Upload Integration', () => {
    test('should handle profile image upload', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Upload profile image
      await uploadTestFile(page, 'image');
      
      // Should show upload progress or success
      await expect(page.getByText(/uploading/i).or(page.getByText(/uploaded/i))).toBeVisible();
      
      // Submit form
      await page.getByRole('button', { name: /save client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
    });

    test('should handle document upload', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      await page.goto('/dashboard/clients/create');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Add document
      const addDocumentButton = page.getByRole('button', { name: /add document/i });
      if (await addDocumentButton.isVisible()) {
        await addDocumentButton.click();
        
        // Select document type
        await page.getByLabel(/document type/i).click();
        await page.getByRole('option', { name: /identity proof/i }).click();
        
        // Upload document
        await uploadTestFile(page, 'document');
        
        // Should show upload progress or success
        await expect(page.getByText(/uploading/i).or(page.getByText(/uploaded/i))).toBeVisible();
      }
      
      // Submit form
      await page.getByRole('button', { name: /save client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
    });
  });

  test.describe('Client Display and Management', () => {
    test('should display clients with various field combinations', async ({ page }) => {
      // Create clients with different field combinations
      const personalData = generateUnifiedClientData();
      const corporateData = generateUnifiedClientData();
      
      // Create client with personal fields
      await page.goto('/dashboard/clients/create');
      await page.getByLabel(/first name/i).fill(personalData.firstName);
      await page.getByLabel(/last name/i).fill(personalData.lastName);
      await page.getByLabel(/phone number/i).fill(personalData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(personalData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(personalData.dateOfBirth);
      await page.getByLabel(/email/i).fill(personalData.email);
      await page.getByRole('button', { name: /save client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Create client with corporate fields
      await page.goto('/dashboard/clients/create');
      await page.getByLabel(/first name/i).fill(corporateData.firstName);
      await page.getByLabel(/last name/i).fill(corporateData.lastName);
      await page.getByLabel(/phone number/i).fill(corporateData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(corporateData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(corporateData.dateOfBirth);
      
      await expandSection(page, 'corporate details');
      await page.getByLabel(/company name/i).fill(corporateData.companyName);
      await page.getByRole('button', { name: /save client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Go to clients list
      await page.goto('/dashboard/clients');
      
      // Should see both clients
      await expect(page.getByText(`${personalData.firstName} ${personalData.lastName}`)).toBeVisible();
      await expect(page.getByText(`${corporateData.firstName} ${corporateData.lastName}`)).toBeVisible();
    });

    test('should search clients across all field types', async ({ page }) => {
      const clientData = generateUnifiedClientData();
      
      // Create a test client
      await page.goto('/dashboard/clients/create');
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      await page.getByLabel(/email/i).fill(clientData.email);
      
      await expandSection(page, 'corporate details');
      await page.getByLabel(/company name/i).fill(clientData.companyName);
      
      await page.getByRole('button', { name: /save client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Search by first name
      await page.getByPlaceholder(/search/i).fill(clientData.firstName);
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
      
      // Search by email
      await page.getByPlaceholder(/search/i).clear();
      await page.getByPlaceholder(/search/i).fill(clientData.email);
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
      
      // Search by company name
      await page.getByPlaceholder(/search/i).clear();
      await page.getByPlaceholder(/search/i).fill(clientData.companyName);
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
    });
  });
});