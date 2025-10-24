import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    await page.goto('http://localhost:3000');
    
    // Check if login page is accessible
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    
    console.log('✅ Application is ready for E2E testing');
  } catch (error) {
    console.error('❌ Application setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;