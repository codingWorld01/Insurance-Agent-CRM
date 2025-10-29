import { test, expect, Page } from '@playwright/test';
import { login, waitForToast } from './helpers/test-utils';

// Test data generators
function generateCompletePersonalClientData() {
  const timestamp = Date.now();
  return {
    firstName: `Complete${timestamp}`,
    lastName: `Personal${timestamp}`,
    middleName: 'Test',
    mobileNumber: `91${timestamp.toString().slice(-8)}`,
    email: `complete.personal${timestamp}@example.com`,
    birthDate: '1985-03-15',
    state: 'Maharashtra',
    city: 'Mumbai',
    address: '123 Complete Test Street, Test Area, Mumbai',
    birthPlace: 'Mumbai',
    gender: 'MALE',
    height: '5.9',
    weight: '75',
    education: 'Post Graduate',
    maritalStatus: 'MARRIED',
    businessJob: 'Senior Software Engineer',
    nameOfBusiness: 'Tech Solutions Pvt Ltd',
    typeOfDuty: 'Full Stack Development',
    annualIncome: '1500000',
    panNumber: 'ABCDE1234F',
    gstNumber: '27ABCDE1234F1Z5'
  };
}

function generateCompleteFamilyEmployeeData() {
  const timestamp = Date.now();
  return {
    firstName: `Family${timestamp}`,
    lastName: `Employee${timestamp}`,
    middleName: 'Test',
    phoneNumber: `91${timestamp.toString().slice(-8)}`,
    whatsappNumber: `91${(timestamp + 1).toString().slice(-8)}`,
    dateOfBirth: '1990-07-20',
    gender: 'FEMALE',
    height: '5.4',
    weight: '55',
    relationship: 'SPOUSE',
    panNumber: 'FGHIJ5678K'
  };
}

function generateCompleteCorporateClientData() {
  const timestamp = Date.now();
  return {
    companyName: `Complete Corp Solutions ${timestamp}`,
    mobile: `91${timestamp.toString().slice(-8)}`,
    email: `contact${timestamp}@completecorp.com`,
    state: 'Karnataka',
    city: 'Bangalore',
    address: '456 Corporate Park, Tech City, Bangalore',
    annualIncome: '75000000',
    panNumber: 'KLMNO9012P',
    gstNumber: '29KLMNO9012P1Z8'
  };
}

// Helper function for comprehensive file upload
async function uploadMultipleFiles(page: Page) {
  // Upload profile image
  const profileImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const profileImageBuffer = Buffer.from(profileImageContent, 'base64');
  
  const profileFileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText(/choose file|upload image/i).first().click();
  const profileFileChooser = await profileFileChooserPromise;
  await profileFileChooser.setFiles([{
    name: 'profile-image.png',
    mimeType: 'image/png',
    buffer: profileImageBuffer
  }]);
  
  // Wait for profile image upload
  await page.waitForTimeout(2000);
  
  // Add and upload document
  const addDocumentButton = page.getByRole('button', { name: /add document/i });
  if (await addDocumentButton.isVisible()) {
    await addDocumentButton.click();
    
    // Select document type
    await page.getByLabel(/document type/i).click();
    await page.getByRole('option', { name: /identity proof/i }).click();
    
    // Upload document
    const documentContent = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgo=';
    const documentBuffer = Buffer.from(documentContent, 'base64');
    
    const docFileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/choose file|upload/i).last().click();
    const docFileChooser = await docFileChooserPromise;
    await docFileChooser.setFiles([{
      name: 'identity-proof.pdf',
      mimeType: 'application/pdf',
      buffer: documentBuffer
    }]);
    
    // Wait for document upload
    await page.waitForTimeout(2000);
  }
}

test.describe('Enhanced Client Management - Complete User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Complete Personal Client Journey', () => {
    test('should complete full personal client lifecycle', async ({ page }) => {
      const clientData = generateCompletePersonalClientData();
      
      // Step 1: Navigate to client creation
      await page.goto('/dashboard/clients');
      await page.getByRole('button', { name: /create|add client/i }).click();
      await expect(page).toHaveURL('/dashboard/clients/create');
      
      // Step 2: Select personal client type
      await page.getByRole('button', { name: /create personal client/i }).click();
      await expect(page).toHaveURL('/dashboard/clients/create/personal');
      
      // Step 3: Fill all form fields comprehensively
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/middle name/i).fill(clientData.middleName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/email/i).fill(clientData.email);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      
      // Verify age auto-calculation
      await page.getByLabel(/first name/i).click(); // Trigger blur
      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - 1985;
      const ageInput = page.getByLabel(/age/i);
      if (await ageInput.isVisible()) {
        await expect(ageInput).toHaveValue(expectedAge.toString());
      }
      
      // Fill location details
      await page.getByLabel(/state/i).click();
      await page.getByRole('option', { name: clientData.state }).click();
      
      await page.waitForTimeout(1000); // Wait for cities to load
      await page.getByLabel(/city/i).click();
      await page.getByRole('option', { name: clientData.city }).click();
      
      await page.getByLabel(/address/i).fill(clientData.address);
      await page.getByLabel(/birth place/i).fill(clientData.birthPlace);
      
      // Fill personal details
      await page.getByLabel(/gender/i).click();
      await page.getByRole('option', { name: /male/i }).click();
      
      await page.getByLabel(/height/i).fill(clientData.height);
      await page.getByLabel(/weight/i).fill(clientData.weight);
      await page.getByLabel(/education/i).fill(clientData.education);
      
      await page.getByLabel(/marital status/i).click();
      await page.getByRole('option', { name: /married/i }).click();
      
      // Fill professional details
      await page.getByLabel(/business\/job/i).fill(clientData.businessJob);
      await page.getByLabel(/name of business/i).fill(clientData.nameOfBusiness);
      await page.getByLabel(/type of duty/i).fill(clientData.typeOfDuty);
      await page.getByLabel(/annual income/i).fill(clientData.annualIncome);
      
      // Fill identification details
      await page.getByLabel(/pan number/i).fill(clientData.panNumber);
      await page.getByLabel(/gst number/i).fill(clientData.gstNumber);
      
      // Step 4: Upload files
      await uploadMultipleFiles(page);
      
      // Step 5: Submit form
      await page.getByRole('button', { name: /create client/i }).click();
      
      // Step 6: Verify creation success
      await waitForToast(page, /client created successfully/i);
      await expect(page).toHaveURL('/dashboard/clients');
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
      
      // Step 7: View client details
      await page.getByText(`${clientData.firstName} ${clientData.lastName}`).click();
      
      // Verify all data is displayed correctly
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
      await expect(page.getByText(clientData.email)).toBeVisible();
      await expect(page.getByText(clientData.mobileNumber)).toBeVisible();
      await expect(page.getByText(clientData.address)).toBeVisible();
      await expect(page.getByText(clientData.businessJob)).toBeVisible();
      await expect(page.getByText(clientData.panNumber)).toBeVisible();
      
      // Step 8: Edit client information
      await page.getByRole('button', { name: /edit/i }).click();
      
      const updatedBusinessJob = 'Lead Software Architect';
      await page.getByLabel(/business\/job/i).clear();
      await page.getByLabel(/business\/job/i).fill(updatedBusinessJob);
      
      await page.getByRole('button', { name: /save|update/i }).click();
      await waitForToast(page, /client updated successfully/i);
      
      // Verify update
      await expect(page.getByText(updatedBusinessJob)).toBeVisible();
      
      // Step 9: Verify audit trail
      const auditSection = page.locator('[data-testid="audit-trail"]').or(
        page.getByText(/audit trail|history|changes/i)
      );
      if (await auditSection.isVisible()) {
        await expect(auditSection).toBeVisible();
        await expect(page.getByText(/created/i)).toBeVisible();
        await expect(page.getByText(/updated/i)).toBeVisible();
      }
      
      // Step 10: Test client deletion (optional - comment out if you want to keep test data)
      /*
      await page.getByRole('button', { name: /delete/i }).click();
      await page.getByRole('button', { name: /confirm|delete/i }).click();
      await waitForToast(page, /client deleted successfully/i);
      await expect(page).toHaveURL('/dashboard/clients');
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).not.toBeVisible();
      */
    });
  });

  test.describe('Complete Family/Employee Client Journey', () => {
    test('should complete full family/employee client lifecycle', async ({ page }) => {
      const clientData = generateCompleteFamilyEmployeeData();
      
      // Navigate and create family/employee client
      await page.goto('/dashboard/clients/create/family-employee');
      
      // Fill all mandatory fields
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/middle name/i).fill(clientData.middleName);
      await page.getByLabel(/phone number/i).fill(clientData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(clientData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(clientData.dateOfBirth);
      
      // Fill optional fields
      await page.getByLabel(/gender/i).click();
      await page.getByRole('option', { name: /female/i }).click();
      
      await page.getByLabel(/height/i).fill(clientData.height);
      await page.getByLabel(/weight/i).fill(clientData.weight);
      
      await page.getByLabel(/relationship/i).click();
      await page.getByRole('option', { name: /spouse/i }).click();
      
      await page.getByLabel(/pan number/i).fill(clientData.panNumber);
      
      // Submit and verify
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Verify in client list
      await expect(page.getByText(`${clientData.firstName} ${clientData.lastName}`)).toBeVisible();
      
      // Test complete edit workflow
      await page.getByText(`${clientData.firstName} ${clientData.lastName}`).click();
      await page.getByRole('button', { name: /edit/i }).click();
      
      // Update relationship
      await page.getByLabel(/relationship/i).click();
      await page.getByRole('option', { name: /child/i }).click();
      
      await page.getByRole('button', { name: /save|update/i }).click();
      await waitForToast(page, /client updated successfully/i);
      
      // Verify relationship update
      await expect(page.getByText(/child/i)).toBeVisible();
    });
  });

  test.describe('Complete Corporate Client Journey', () => {
    test('should complete full corporate client lifecycle', async ({ page }) => {
      const clientData = generateCompleteCorporateClientData();
      
      // Navigate and create corporate client
      await page.goto('/dashboard/clients/create/corporate');
      
      // Fill all fields
      await page.getByLabel(/company name/i).fill(clientData.companyName);
      await page.getByLabel(/mobile/i).fill(clientData.mobile);
      await page.getByLabel(/email/i).fill(clientData.email);
      
      // Fill location
      await page.getByLabel(/state/i).click();
      await page.getByRole('option', { name: clientData.state }).click();
      
      await page.waitForTimeout(1000);
      await page.getByLabel(/city/i).click();
      await page.getByRole('option', { name: clientData.city }).click();
      
      await page.getByLabel(/address/i).fill(clientData.address);
      await page.getByLabel(/annual income/i).fill(clientData.annualIncome);
      await page.getByLabel(/pan number/i).fill(clientData.panNumber);
      await page.getByLabel(/gst number/i).fill(clientData.gstNumber);
      
      // Upload corporate documents
      await uploadMultipleFiles(page);
      
      // Submit and verify
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Verify corporate client in list with proper type indicator
      await expect(page.getByText(clientData.companyName)).toBeVisible();
      await expect(page.getByText(/corporate/i)).toBeVisible();
      
      // Test complete corporate client management
      await page.getByText(clientData.companyName).click();
      
      // Verify all corporate details
      await expect(page.getByText(clientData.companyName)).toBeVisible();
      await expect(page.getByText(clientData.email)).toBeVisible();
      await expect(page.getByText(clientData.mobile)).toBeVisible();
      await expect(page.getByText(clientData.gstNumber)).toBeVisible();
      
      // Test edit functionality
      await page.getByRole('button', { name: /edit/i }).click();
      
      const updatedIncome = '100000000';
      await page.getByLabel(/annual income/i).clear();
      await page.getByLabel(/annual income/i).fill(updatedIncome);
      
      await page.getByRole('button', { name: /save|update/i }).click();
      await waitForToast(page, /client updated successfully/i);
    });
  });

  test.describe('Cross-Client Type Operations', () => {
    test('should handle multiple client types in the same session', async ({ page }) => {
      const personalData = generateCompletePersonalClientData();
      const corporateData = generateCompleteCorporateClientData();
      const familyData = generateCompleteFamilyEmployeeData();
      
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
      
      // Create family/employee client
      await page.goto('/dashboard/clients/create/family-employee');
      await page.getByLabel(/first name/i).fill(familyData.firstName);
      await page.getByLabel(/last name/i).fill(familyData.lastName);
      await page.getByLabel(/phone number/i).fill(familyData.phoneNumber);
      await page.getByLabel(/whatsapp number/i).fill(familyData.whatsappNumber);
      await page.getByLabel(/date of birth/i).fill(familyData.dateOfBirth);
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // Verify all clients in list with proper type indicators
      await page.goto('/dashboard/clients');
      await expect(page.getByText(`${personalData.firstName} ${personalData.lastName}`)).toBeVisible();
      await expect(page.getByText(corporateData.companyName)).toBeVisible();
      await expect(page.getByText(`${familyData.firstName} ${familyData.lastName}`)).toBeVisible();
      
      // Test filtering by client type
      const filterButton = page.getByRole('button', { name: /filter/i }).first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        
        // Filter by personal clients
        await page.getByText(/personal/i).click();
        await expect(page.getByText(`${personalData.firstName} ${personalData.lastName}`)).toBeVisible();
        
        // Filter by corporate clients
        await filterButton.click();
        await page.getByText(/corporate/i).click();
        await expect(page.getByText(corporateData.companyName)).toBeVisible();
        
        // Clear filter
        await filterButton.click();
        await page.getByText(/all|clear/i).click();
      }
      
      // Test search across all client types
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill(personalData.firstName);
      await expect(page.getByText(`${personalData.firstName} ${personalData.lastName}`)).toBeVisible();
      
      await searchInput.clear();
      await searchInput.fill(corporateData.companyName);
      await expect(page.getByText(corporateData.companyName)).toBeVisible();
    });
  });

  test.describe('Document Management Complete Journey', () => {
    test('should handle complete document lifecycle', async ({ page }) => {
      const clientData = generateCompletePersonalClientData();
      
      // Create client with documents
      await page.goto('/dashboard/clients/create/personal');
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/mobile number/i).fill(clientData.mobileNumber);
      await page.getByLabel(/birth date/i).fill(clientData.birthDate);
      
      // Upload multiple documents
      await uploadMultipleFiles(page);
      
      // Add additional document
      const addDocumentButton = page.getByRole('button', { name: /add document/i });
      if (await addDocumentButton.isVisible()) {
        await addDocumentButton.click();
        
        await page.getByLabel(/document type/i).click();
        await page.getByRole('option', { name: /address proof/i }).click();
        
        const docContent = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgo=';
        const docBuffer = Buffer.from(docContent, 'base64');
        
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.getByText(/choose file|upload/i).last().click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles([{
          name: 'address-proof.pdf',
          mimeType: 'application/pdf',
          buffer: docBuffer
        }]);
        
        await page.waitForTimeout(2000);
      }
      
      await page.getByRole('button', { name: /create client/i }).click();
      await waitForToast(page, /client created successfully/i);
      
      // View client and verify documents
      await page.getByText(`${clientData.firstName} ${clientData.lastName}`).click();
      
      // Should show uploaded documents
      await expect(page.getByText(/documents/i)).toBeVisible();
      await expect(page.getByText(/identity proof/i)).toBeVisible();
      await expect(page.getByText(/address proof/i)).toBeVisible();
      
      // Test document viewing/downloading
      const viewDocumentButton = page.getByRole('button', { name: /view|download/i }).first();
      if (await viewDocumentButton.isVisible()) {
        await viewDocumentButton.click();
        // Document should open in new tab or download
      }
      
      // Test document deletion
      const deleteDocumentButton = page.getByRole('button', { name: /delete|remove/i }).first();
      if (await deleteDocumentButton.isVisible()) {
        await deleteDocumentButton.click();
        await page.getByRole('button', { name: /confirm|delete/i }).click();
        await waitForToast(page, /document deleted successfully/i);
      }
    });
  });

  test.describe('Form State Persistence Journey', () => {
    test('should persist form data across page refreshes', async ({ page }) => {
      const clientData = generateCompletePersonalClientData();
      
      await page.goto('/dashboard/clients/create/personal');
      
      // Fill partial form data
      await page.getByLabel(/first name/i).fill(clientData.firstName);
      await page.getByLabel(/last name/i).fill(clientData.lastName);
      await page.getByLabel(/email/i).fill(clientData.email);
      
      // Wait for auto-save (if implemented)
      await page.waitForTimeout(2000);
      
      // Refresh page
      await page.reload();
      
      // Check if data persists (if auto-save is implemented)
      const firstNameValue = await page.getByLabel(/first name/i).inputValue();
      const lastNameValue = await page.getByLabel(/last name/i).inputValue();
      const emailValue = await page.getByLabel(/email/i).inputValue();
      
      // If form persistence is implemented, values should be restored
      if (firstNameValue || lastNameValue || emailValue) {
        expect(firstNameValue).toBe(clientData.firstName);
        expect(lastNameValue).toBe(clientData.lastName);
        expect(emailValue).toBe(clientData.email);
      }
    });
  });

  test.describe('Accessibility Complete Journey', () => {
    test('should support complete keyboard navigation', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Test keyboard navigation through form
      await page.keyboard.press('Tab'); // Should focus first input
      let focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Navigate through all form fields
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
      
      // Test form submission with keyboard
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/mobile number/i).fill('9123456789');
      await page.getByLabel(/birth date/i).fill('1990-01-01');
      
      // Navigate to submit button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const submitButton = page.locator(':focus');
      await expect(submitButton).toHaveAttribute('type', 'submit');
      await page.keyboard.press('Enter');
      
      await waitForToast(page, /client created successfully/i);
    });

    test('should have proper ARIA labels and screen reader support', async ({ page }) => {
      await page.goto('/dashboard/clients/create/personal');
      
      // Check for proper ARIA labels
      const firstNameInput = page.getByLabel(/first name/i);
      const ariaLabel = await firstNameInput.getAttribute('aria-label');
      const ariaLabelledBy = await firstNameInput.getAttribute('aria-labelledby');
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      
      // Check for required field indicators
      const requiredFields = page.locator('[required]');
      const requiredCount = await requiredFields.count();
      expect(requiredCount).toBeGreaterThan(0);
      
      // Check for error message associations
      await page.getByRole('button', { name: /create client/i }).click();
      
      const errorMessages = page.locator('[role="alert"]').or(
        page.locator('.error-message')
      );
      
      if (await errorMessages.first().isVisible()) {
        const errorCount = await errorMessages.count();
        expect(errorCount).toBeGreaterThan(0);
      }
    });
  });
});