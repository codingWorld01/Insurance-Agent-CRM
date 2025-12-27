# End-to-End Tests

This directory contains comprehensive E2E tests for the Insurance CRM MVP application using Playwright.

## Test Coverage

### Authentication Tests (`auth.spec.ts`)
- Login page display and validation
- Successful authentication flow
- Invalid credentials handling
- Logout functionality
- Redirect protection for authenticated users

### Leads Management Tests (`leads.spec.ts`)
- Leads page navigation and display
- Lead creation with validation
- Lead search and filtering
- Lead detail view and editing
- Lead deletion

### Lead Conversion Tests (`lead-conversion.spec.ts`)
- Converting leads to clients
- Status updates after conversion
- Activity logging for conversions
- Preventing duplicate conversions

### Clients Management Tests (`clients.spec.ts`)
- Clients page navigation and display
- Client creation with validation
- Email uniqueness validation
- Client search functionality
- Client detail view and editing
- Client deletion

### Responsive Design Tests (`responsive.spec.ts`)
- Mobile viewport testing (iPhone 12)
- Tablet viewport testing (iPad Pro)
- Modal responsiveness
- Navigation on mobile devices
- Table display on different screen sizes

### Cross-Browser Tests (`cross-browser.spec.ts`)
- Chromium compatibility
- Firefox compatibility
- WebKit (Safari) compatibility
- CSS animations consistency
- Form validation across browsers
- Keyboard navigation
- Local storage handling

### Complete User Journey (`user-journey.spec.ts`)
- Full workflow from login to client conversion
- Data persistence verification
- Error scenario handling
- Multi-step user interactions

## Running Tests

### Prerequisites
1. Ensure both frontend and backend servers are running:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. Make sure the database is set up and seeded with default credentials:
   - Email: `amitulhe@gmail.com`
   - Password: `Amit@123`

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# Run specific test file
npx playwright test auth.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run mobile tests
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Test Structure

### Helper Functions (`helpers/test-utils.ts`)
- `login()` - Authenticate user
- `createTestLead()` - Create test lead data
- `createTestClient()` - Create test client data
- `convertLeadToClient()` - Convert lead to client
- `waitForToast()` - Wait for notification messages
- `generateTestData()` - Generate unique test data

### Global Setup (`global-setup.ts`)
- Verifies application is running before tests
- Ensures database connectivity
- Sets up test environment

## Browser Support

Tests run on multiple browsers to ensure cross-browser compatibility:

- **Chromium** (Chrome/Edge)
- **Firefox**
- **WebKit** (Safari)
- **Mobile Chrome** (Pixel 5 simulation)
- **Mobile Safari** (iPhone 12 simulation)

## Test Data Management

Tests create and clean up their own data to ensure isolation:
- Each test uses unique email addresses and names
- Tests don't depend on existing data
- Cleanup happens automatically after test completion

## Debugging Tests

### Visual Debugging
```bash
# Run with browser visible
npm run test:e2e:headed

# Step through tests interactively
npm run test:e2e:debug
```

### Screenshots and Videos
- Screenshots are captured on test failures
- Videos are recorded for failed tests
- Traces are collected for debugging

### Common Issues

1. **Application not ready**: Ensure both servers are running
2. **Database connection**: Verify database is accessible
3. **Port conflicts**: Check ports 3000 (frontend) and 5000 (backend) are available
4. **Timeout errors**: Increase timeout in playwright.config.ts if needed

## CI/CD Integration

For continuous integration:
```bash
# Set CI environment variable
export CI=true

# Run tests with appropriate settings
npm run test:e2e
```

CI configuration automatically:
- Reduces parallelism for stability
- Increases retry attempts
- Uses headless mode
- Generates reports for artifacts

## Performance Considerations

- Tests run in parallel by default for speed
- Use `test.describe.serial()` for tests that must run sequentially
- Consider test isolation vs. performance trade-offs
- Monitor test execution time and optimize slow tests