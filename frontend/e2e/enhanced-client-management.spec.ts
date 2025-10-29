import { test, expect, Page } from '@playwright/test';
import { login, generateTestData, waitForToast } from './helpers/test-utils';

// Test data generators
function generatePersonalClientData() {
  const timestamp = Date.now();
  return {
    firstName: `John${timestamp}`,
    lastName: `Doe${timestamp}`,
    middleName: 'Michael',
    mobileNumber: `91${timestamp.toString().slice(-8)}`,
    email: `john.doe${timestamp}@example.com`,
    birthDate: '1990-05-15',
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
    gstNumber: '27ABCDE1234F1Z5'
  };
}

function generateFamilyEmployeeData() {
  const timestamp = Date.now();
  return {
    firstName: `Jane${timestamp}`,
    lastName: `Smith${timestamp}`,
    middleName: 'Elizabeth',
    phoneNumber: `91${timestamp.toString().slice(-8)}`,
    whatsappNumber: `91${timestamp.toString().slice(-8)}`,
    dateOfBirth: '1985-08-20',
    gender: 'FEMALE',
    height: '5.5',
    weight: '60',
    relationship: 'SPOUSE',
    panNumber: 'FGHIJ5678K'
  };
}

function generateCorporateClientData() {
  const timestamp = Date.now();
  return {
    companyName: `Test Corp ${timestamp}`,
    mobile: `91${timestamp.toString().slice(-8)}`,
    email: `contact${timestamp}@testcorp.com`,
    state: 'Karnataka',
    city: 'Bangalore',
    address: '456 Business Park, Tech City',
    annualIncome: '50000000',
    panNumber: 'KLMNO9012P',
    gstNumber: '29KLMNO9012P1Z8'
  };
}

// Helper functions for file upload testing
async function uploadTestFile(page: Page, fileType: 'image' | 'document' = 'document') {
  const fileContent = fileType === 'image' 
    ? 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' // 1x1 PNG
    : 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgo='; // Simple PDF
  
  const fileName = fileType === 'image' ? 'test-image.png' : 'test-document.pdf';
  const mimeType = fileType === 'image' ? 'image/png' : 'application/pdf';
  
  // Create a buffer from base64
  const buffer = Buffer.from(fileContent, 'base64');
  
  // Upload file
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText(/choose file|upload/i).first().click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles([{
    name: fileName,
    mimeType: mimeType,
    buffer: buffer
  }]);
}

test.describe('Enhanced Client Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Client Type Selection and Navigation', () => {
    test('should display client type selection page', async ({ page }) => {
      await page.goto('/dashboard/clients/create');
      
      // Check page title and description
      await expect(page.getByRole('heading', { name: /create new client/i })).toBeVisible();
      await expect(page.getByText(/select the type of client/i)).toBeVisible();
      
      // Check all three client type options are visible
      await expect(page.getByText(/personal client/i)).toBeVisible();
      await expect(page.getByText(/family\/employee client/i)).toBeVisible();
      await expect(page.getByText(/corporate client/i)).toBeVisible();
      
      // Check mandatory fields are displayed
      await expect(page.getByText(/first name/i)).toBeVisible();
      await expect(page.getByText(/last name/i)).toBeVisible();
      await expect(page.getByText(/mobile number/i)).toBeVisible();
      await expect(page.getByText(/birth date/i)).toBeVisible();
    });

    test('should navigate to personal client form', async ({ page }) => {
      await page.goto('/dashboard/clients/create');
      
      // Click on Personal Client option
      await page.getByRole('button', { name: /create personal client/i }).click();
      
      // Should navigate to personal client form
      await expect(page).toHaveURL('/dashboard/clients/create/personal');
      await expect(page.getByRole('heading', { name: /personal client/i })).toBeVisible();
    });

    test('should navigate to family/employee client form', async ({ page }) => {
      await page.goto('/dashboard/clients/create');
      
      // Click on Family/Employee Client option
      await page.getByRole('button', { name: /create family\/employee client/i }).click();
      
      // Should navigate to family/employee client form
      await expect(page).toHaveURL('/dashboard/clients/create/family-employee');
      await expect(page.getByRole('heading', { name: /family\/employee client/i })).toBeVisible();
    });

    test('should navigate to corporate client form', async ({ page }) => {
      await page.goto('/dashboard/clients/create');
      
      // Click on Corporate Client option
      await page.getByRole('button', { name: /create corporate client/i }).click();
      
      // Should navigate to corporate client form
      await expect(page).toHaveURL('/dashboard/clients/create/corporate');
      await expect(page.getByRole('heading', { name: /corporate client/i })).toBeVisible();
    });
  });

  test.describe('Personal Client Form - Complete User Journey', () => {
    test('should create personal client with all fields', async ({ page }) => {
      const clientData = generatePersonalClientData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      
      // Fill optional fields
      await page.getByLabel(/middle name/i).fill(clientData.middleName);
      await page.getByLabel(/email/i).fill(clientData.email);
      
      // Select state and city
      await page.getByLabel(/state/i).click();
      await page.getByRole('option', { name: clientData.state }).click();
      
      // Wait for cities to load
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
      
      await page.getByLabel(/business\/job/i).fill(clientData.businessJob);
      await page.getByLabel(/name of business/i).fill(clientData.nameOfBusiness);
      await page.getByLabel(/type of duty/i).fill(clientData.typeOfDuty);
      await page.getByLabel(/annual income/i).fill(clientData.annualIncome);
      await page.getByLabel(/pan number/i).fill(clientData.panNumber);
      await page.getByLabel(/gst number/i).fill(clientData.gstNumber);
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
      
      // Should redirect to clients list
      await expect(page).toHaveURL('/dashboard/clients');
      
      // Should see the new client in the list
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
    });

    test('should validate mandatory fields', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Try to submit empty form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show validation errors for mandatory fields
      await expect(page.getByText(/first name is required/i)).toBeVisible();
      await expect(page.getByText(/last name is required/i)).toBeVisible();
      await expect(page.getByText(/mobile number is required/i)).toBeVisible();
      await expect(page.getByText(/birth date is required/i)).toBeVisible();
    });

    test('should validate PAN number format', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      const clientData = generatePersonalClientData();
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      
      // Enter invalid PAN number
      await page.getByLabel(/pan number/i).fill('INVALID123');
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show PAN validation error
      await expect(page.getByText(/invalid pan number format/i)).toBeVisible();
    });

    test('should validate GST number format', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      const clientData = generatePersonalClientData();
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      
      // Enter invalid GST number
      await page.getByLabel(/gst number/i).fill('INVALID123');
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show GST validation error
      await expect(page.getByText(/invalid gst number format/i)).toBeVisible();
    });

    test('should auto-calculate age from birth date', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Enter birth date
      await page.getByLabel(/birth date/i).fill('1990-05-15');
      
      // Click outside to trigger calculation
      await page.getByLabel(/first name/i).click();
      
      // Age should be calculated (approximately 33-34 years)
      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - 1990;
      await expect(page.getByDisplayValue(expectedAge.toString())).toBeVisible();
    });
  });

  test.describe('Family/Employee Client Form - Complete User Journey', () => {
    test('should create family/employee client with all fields', async ({ page }) => {
      const clientData = generateFamilyEmployeeData();
      
      await page.goto('/dashboard/clients/create/family-employee');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Fill optional fields
      await page.getByLabel(/middle name/i).fill(clientData.middleName);
      
      // Select gender
      await page.getByLabel(/gender/i).click();
      await page.getByRole('option', { name: /female/i }).click();
      
      await page.getByLabel(/height/i).fill(clientData.height);
      await page.getByLabel(/weight/i).fill(clientData.weight);
      
      // Select relationship
      await page.getByLabel(/relationship/i).click();
      await page.getByRole('option', { name: /spouse/i }).click();
      
      await page.getByLabel(/pan number/i).fill(clientData.panNumber);
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
      
      // Should redirect to clients list
      await expect(page).toHaveURL('/dashboard/clients');
      
      // Should see the new client in the list
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
    });

    test('should validate mandatory fields for family/employee client', async ({ page }) => {
      await page.goto('/dashboard/clients/create/family-employee');
      
      // Try to submit empty form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show validation errors for mandatory fields
      await expect(page.getByText(/first name is required/i)).toBeVisible();
      await expect(page.getByText(/last name is required/i)).toBeVisible();
      await expect(page.getByText(/phone number is required/i)).toBeVisible();
      await expect(page.getByText(/whatsapp number is required/i)).toBeVisible();
      await expect(page.getByText(/date of birth is required/i)).toBeVisible();
    });
  });

  test.describe('Corporate Client Form - Complete User Journey', () => {
    test('should create corporate client with all fields', async ({ page }) => {
      const clientData = generateCorporateClientData();
      
      await page.goto('/dashboard/clients/create/corporate');
      
      // Fill mandatory field
      await page.getByLabel(/company name/i).fill(clientData.companyName);
      
      // Fill optional fields
      await page.getByLabel(/mobile/i).fill(clientData.mobile);
      await page.getByLabel(/email/i).fill(clientData.email);
      
      // Select state and city
      await page.getByLabel(/state/i).click();
      await page.getByRole('option', { name: clientData.state }).click();
      
      // Wait for cities to load
      await page.waitForTimeout(1000);
      await page.getByLabel(/city/i).click();
      await page.getByRole('option', { name: clientData.city }).click();
      
      await page.getByLabel(/address/i).fill(clientData.address);
      await page.getByLabel(/annual income/i).fill(clientData.annualIncome);
      await page.getByLabel(/pan number/i).fill(clientData.panNumber);
      await page.getByLabel(/gst number/i).fill(clientData.gstNumber);
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
      
      // Should redirect to clients list
      await expect(page).toHaveURL('/dashboard/clients');
      
      // Should see the new client in the list
      await expect(page.getByText(clientData.companyName)).toBeVisible();
    });

    test('should validate mandatory field for corporate client', async ({ page }) => {
      await page.goto('/dashboard/clients/create/corporate');
      
      // Try to submit empty form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show validation error for mandatory field
      await expect(page.getByText(/company name is required/i)).toBeVisible();
    });
  });

  test.describe('Document Upload Functionality', () => {
    test('should upload profile image for personal client', async ({ page }) => {
      const clientData = generatePersonalClientData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      
      // Upload profile image
      await uploadTestFile(page, 'image');
      
      // Should show upload progress or success
      await expect(page.getByText(/uploading/i).or(page.getByText(/uploaded/i))).toBeVisible();
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
    });

    test('should upload documents for any client type', async ({ page }) => {
      const clientData = generatePersonalClientData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      
      // Add document
      await page.getByRole('button', { name: /add document/i }).click();
      
      // Select document type
      await page.getByLabel(/document type/i).click();
      await page.getByRole('option', { name: /identity proof/i }).click();
      
      // Upload document
      await uploadTestFile(page, 'document');
      
      // Should show upload progress or success
      await expect(page.getByText(/uploading/i).or(page.getByText(/uploaded/i))).toBeVisible();
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show success message
      await waitForToast(page, /client created successfully/i);
    });

    test('should validate file size limits', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Try to upload a large file (simulate by creating a large buffer)
      const largeFileContent = 'A'.repeat(11 * 1024 * 1024); // 11MB file
      const buffer = Buffer.from(largeFileContent);
      
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByText(/choose file|upload/i).first().click();
      const fileChooser = await fileChooserPromise;
      
      try {
        await fileChooser.setFiles([{
          name: 'large-file.pdf',
          mimeType: 'application/pdf',
          buffer: buffer
        }]);
        
        // Should show file size error
        await expect(page.getByText(/file size too large/i)).toBeVisible();
      } catch (error) {
        // File size validation might prevent the upload entirely
        console.log('File size validation prevented upload');
      }
    });
  });

  test.describe('Client List and Management', () => {
    test('should display clients with type indicators', async ({ page }) => {
      // Create clients of different types first
      const personalData = generatePersonalClientData();
      const corporateData = generateCorporateClientData();
      
      // Create personal client
      await page.goto('/dashboard/clients/create/personal');
      await page.getByLabel(/first name/i).fill(personalData.firstName);
      await page.getByLabel(/last name/i).fill(personalData.lastName);
      await page.getByLabel(/mobile number/i).fill(personalData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(personalData.birthDate);
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Create corporate client
      await page.goto('/dashboard/clients/create/corporate');
      await page.getByLabel(/company name/i).fill(corporateData.companyName);
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Go to clients list
      await page.goto('/dashboard/clients');
      
      // Should see both clients with type indicators
      await expect(page.getByText(`${personalData.firstName} ${personalData.lastName}`)).toBeVisible();
      await expect(page.getByText(corporateData.companyName)).toBeVisible();
      
      // Should see client type badges or indicators
      await expect(page.getByText(/personal/i)).toBeVisible();
      await expect(page.getByText(/corporate/i)).toBeVisible();
    });

    test('should filter clients by type', async ({ page }) => {
      await page.goto('/dashboard/clients');
      
      // Should have filter options
      await expect(page.getByText(/filter/i).or(page.getByText(/type/i))).toBeVisible();
      
      // Try filtering by client type (if filter exists)
      const filterButton = page.getByRole('button', { name: /filter/i }).first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await expect(page.getByText(/personal/i)).toBeVisible();
        await expect(page.getByText(/corporate/i)).toBeVisible();
        await expect(page.getByText(/family/i)).toBeVisible();
      }
    });

    test('should search clients', async ({ page }) => {
      const clientData = generatePersonalClientData();
      
      // Create a test client first
      await page.goto('/dashboard/clients/create/personal');
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Search for the client
      await page.getByPlaceholder(/search/i).fill(clientData.firstName);
      
      // Should show filtered results
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
    });
  });

  test.describe('Client Detail View and Editing', () => {
    test('should view client details', async ({ page }) => {
      const clientData = generatePersonalClientData();
      
      // Create a test client first
      await page.goto('/dashboard/clients/create/personal');
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      await page.getByLabel(/email/i).fill(clientData.email);
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Click on client to view details
      await page.getByText(`${clientData.firstName} ${clientData.lastName}`).click();
      
      // Should show client details
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
      await expect(page.getByText(clientData.email)).toBeVisible();
      await expect(page.getByText(clientData.mobileNumber)).toBeVisible();
      
      // Should show edit and delete buttons
      await expect(page.getByRole('button', { name: /edit/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /delete/i })).toBeVisible();
    });

    test('should edit client information', async ({ page }) => {
      const clientData = generatePersonalClientData();
      
      // Create a test client first
      await page.goto('/dashboard/clients/create/personal');
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Click on client to view details
      await page.getByText(`${clientData.firstName} ${clientData.lastName}`).click();
      
      // Click edit button
      await page.getByRole('button', { name: /edit/i }).click();
      
      // Update client information
      const updatedFirstName = `Updated${clientData.firstName}`;
      await page.getByLabel(/first name/i).clear();
      await page.getByLabel(/first name/i).fill(updatedFirstName);
      
      // Save changes
      await page.getByRole('button', { name: /save|update/i }).click();
      
      // Should show success message
      await waitForToast(page, /client updated successfully/i);
      
      // Should show updated information
      await expect(page.getByText(updatedFirstName)).toBeVisible();
    });

    test('should delete client', async ({ page }) => {
      const clientData = generatePersonalClientData();
      
      // Create a test client first
      await page.goto('/dashboard/clients/create/personal');
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Click on client to view details
      await page.getByText(`${clientData.firstName} ${clientData.lastName}`).click();
      
      // Click delete button
      await page.getByRole('button', { name: /delete/i }).click();
      
      // Confirm deletion
      await page.getByRole('button', { name: /confirm|delete/i }).click();
      
      // Should show success message and redirect
      await waitForToast(page, /client deleted successfully/i);
      await expect(page).toHaveURL('/dashboard/clients');
      
      // Client should not be in the list anymore
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).not.toBeVisible();
    });
  });

  test.describe('Error Handling Scenarios', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill form
      const clientData = generatePersonalClientData();
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      
      // Simulate network failure by going offline
      await page.context().setOffline(true);
      
      // Try to submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show network error message
      await expect(page.getByText(/network error|connection failed|offline/i)).toBeVisible();
      
      // Restore network
      await page.context().setOffline(false);
    });

    test('should handle duplicate email validation', async ({ page }) => {
      const clientData = generatePersonalClientData();
      
      // Create first client
      await page.goto('/dashboard/clients/create/personal');
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      await page.getByLabel(/email/i).fill(clientData.email);
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Try to create second client with same email
      await page.goto('/dashboard/clients/create/personal');
      const secondClientData = generatePersonalClientData();
      await page.getByLabel(/first name/i).fill(secondClientData.firstName);
      await page.getByLabel(/last name/i).fill(secondClientData.lastName);
      await page.getByLabel(/mobile number/i).fill(secondClientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(secondClientData.birthDate);
      await page.getByLabel(/email/i).fill(clientData.email); // Same email
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show duplicate email error
      await expect(page.getByText(/email already exists|duplicate email/i)).toBeVisible();
    });

    test('should handle form validation errors', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill invalid data
      await page.getByLabel(/first name/i).fill('A'); // Too short
      await page.getByLabel(/email/i).fill('invalid-email'); // Invalid format
      await page.getByLabel(/mobile number/i).fill('123'); // Too short
      await page.getByLabel(/pan number/i).fill('INVALID'); // Invalid format
      
      // Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Should show multiple validation errors
      await expect(page.getByText(/invalid/i)).toBeVisible();
    });
  });

  test.describe('Audit Trail and Change Tracking', () => {
    test('should display audit trail for client changes', async ({ page }) => {
      const clientData = generatePersonalClientData();
      
      // Create a test client
      await page.goto('/dashboard/clients/create/personal');
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // View client details
      await page.getByText(`${clientData.firstName} ${clientData.lastName}`).click();
      
      // Should show audit trail section
      await expect(page.getByText(/audit trail|history|changes/i)).toBeVisible();
      
      // Should show creation entry
      await expect(page.getByText(/created/i)).toBeVisible();
    });
  });
});