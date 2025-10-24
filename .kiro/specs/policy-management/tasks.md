# Implementation Plan

- [x] 1. Create client detail page infrastructure

  - Create `/app/dashboard/clients/[id]/page.tsx` with client detail view
  - Implement client information display section
  - Add breadcrumb navigation and page title management
  - _Requirements: 6.1, 6.2_

- [x] 2. Implement policy data types and validation

  - [x] 2.1 Add policy management types to types/index.ts

    - Create CreatePolicyRequest and UpdatePolicyRequest interfaces
    - Add PolicyWithClient and ClientWithPolicies interfaces
    - Define PolicyStats interface for statistics
    - _Requirements: 1.1, 2.1, 7.1_

  - [x] 2.2 Create policy validation utilities

    - Implement policy form validation functions
    - Add date range validation (start date before expiry date)
    - Create amount validation for premium and commission
    - Add policy number uniqueness validation
    - _Requirements: 1.4, 1.5, 1.6, 7.2, 7.3, 7.4_

- [x] 3. Build policy management API layer

  - [x] 3.1 Create policy API routes

    - Implement `/app/api/policies/route.ts` for GET operations
    - Create `/app/api/policies/[id]/route.ts` for PUT and DELETE operations
    - Add `/app/api/clients/[id]/policies/route.ts` for POST operations
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 3.2 Implement backend policy controller

    - Create policy CRUD operations in backend
    - Add policy validation middleware
    - Implement policy statistics calculations
    - _Requirements: 1.3, 2.3, 6.1, 6.2_

- [x] 4. Create policy management components

  - [x] 4.1 Build PolicyModal component

    - Create modal form with all required policy fields
    - Implement form validation with inline error messages
    - Add currency formatting for premium and commission fields
    - Include date picker components for start and expiry dates
    - _Requirements: 1.2, 1.7, 2.2, 7.1_

  - [x] 4.2 Create PoliciesTable component

    - Build responsive table for displaying client policies
    - Add policy status badges with color coding
    - Implement warning indicators for policies expiring within 30 days
    - Include edit and delete action buttons for each policy
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.3 Build PolicyStatusBadge component

    - Create status indicator component with color coding
    - Add expiry warning logic for policies near expiration
    - Implement responsive badge styling
    - _Requirements: 4.2, 4.3_

- [x] 5. Implement policy data management hook

  - [x] 5.1 Create usePolicies hook

    - Implement policy CRUD operations
    - Add loading states and error handling
    - Include policy statistics calculations
    - Integrate with toast notifications for user feedback
    - _Requirements: 1.3, 2.3, 3.3, 6.5_

  - [x] 5.2 Add policy operations to useClients hook

    - Extend client data to include policy information
    - Add policy count and statistics to client objects
    - Implement client-policy relationship management
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 6. Integrate policies section into client detail page

  - [x] 6.1 Add policies section to client detail view

    - Create policies summary cards showing totals and statistics
    - Add "Add Policy" button with proper styling
    - Implement empty state for clients with no policies
    - _Requirements: 4.6, 6.1, 6.2_

  - [x] 6.2 Wire up policy management functionality

    - Connect PolicyModal to policy creation and editing
    - Implement policy deletion with confirmation dialog
    - Add policy table integration with client data
    - _Requirements: 1.1, 2.1, 3.1, 3.2_

- [x] 7. Implement activity logging for policy operations

  - [x] 7.1 Add policy activity logging

    - Log policy creation activities
    - Log policy update activities
    - Log policy deletion activities
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.2 Integrate policy activities with dashboard

    - Include policy activities in recent activities feed
    - Add policy-related activity descriptions
    - Implement relative timestamp formatting
    - _Requirements: 5.5, 5.6_

- [x] 8. Update dashboard statistics integration

  - [x] 8.1 Modify dashboard statistics calculations

    - Update "Total Active Policies" calculation to include new policies
    - Modify "Total Commission This Month" to include policy commissions
    - Add policy-related percentage change calculations
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.2 Implement real-time statistics updates

    - Trigger dashboard refresh when policies are added/updated/deleted
    - Update client statistics when policy operations occur
    - Ensure policy status changes reflect in dashboard immediately
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 9. Add comprehensive error handling and loading states

  - [x] 9.1 Implement frontend error handling

    - Add form validation error display
    - Implement API error handling with user-friendly messages
    - Add loading states for all policy operations
    - _Requirements: 7.5, 7.6, 8.2, 8.4_

  - [x] 9.2 Add backend error handling

    - Implement policy validation error responses
    - Add database constraint error handling
    - Create standardized error response format for policy operations
    - _Requirements: 7.7, 1.4, 2.4_

- [x] 10. Write comprehensive tests for policy management


  - [x] 10.1 Create component unit tests

    - Write tests for PolicyModal form validation and submission
    - Test PoliciesTable rendering and interactions
    - Create tests for PolicyStatusBadge display logic
    - Test client detail page policy section integration
    - _Requirements: All requirements_

  - [x] 10.2 Write integration tests

    - Test policy CRUD operations with mock API responses
    - Create form validation workflow tests
    - Test error handling scenarios
    - Write loading state management tests
    - _Requirements: All requirements_

  - [x] 10.3 Add E2E tests for policy workflows

    - Test complete policy management user journeys
    - Create policy creation from client detail page tests
    - Test policy editing and deletion workflows
    - Verify dashboard statistics updates after policy operations
    - _Requirements: All requirements_
