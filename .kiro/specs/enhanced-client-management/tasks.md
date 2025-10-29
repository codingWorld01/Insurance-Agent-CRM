# Implementation Plan

- [x] 1. Update database schema for unified client model

  - Modify Prisma schema to use single Client model with all fields
  - Remove ClientType enum and separate detail models
  - Add all optional fields directly to Client model
  - Generate and run database migrations
  - _Requirements: 1.1, 1.2, 2.1_

- [x] 2. Update backend API for unified client model

- [x] 2.1 Modify client CRUD operations

  - Update client routes to handle unified client model
  - Modify ClientController to work with single client structure
  - Update validation middleware for unified form fields
  - _Requirements: 1.5, 2.4_

- [x] 2.2 Update validation middleware

  - Modify validation to handle optional fields properly
  - Ensure only mandatory fields (firstName, lastName, DOB, phoneNumber, whatsappNumber) are required
  - Keep existing PAN, GST, email, and phone format validation for optional fields
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Create unified client form components

- [x] 3.1 Build UnifiedClientForm component

  - Create single comprehensive form with all possible fields
  - Organize fields into logical sections (Personal, Corporate, Family/Employee)
  - Implement form with only 5 mandatory fields (firstName, lastName, DOB, phoneNumber, whatsappNumber)
  - Add automatic age calculation from DOB
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3.2 Create form section components

  - Build PersonalDetailsSection with personal information fields
  - Create CorporateDetailsSection with company-related fields
  - Implement FamilyEmployeeSection with relationship fields
  - Make all sections collapsible for better UX
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.3 Update validation for unified form

  - Modify useClientValidation hook for unified schema
  - Update validation to only require 5 mandatory fields
  - Keep optional field validation (PAN, GST, email, phone formats)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Update client management interface

- [x] 4.1 Modify client creation routing

  - Remove client type selection page
  - Update /clients/create route to show unified form directly
  - Remove separate routes for personal/corporate/family-employee
  - _Requirements: 8.1, 8.2_

- [x] 4.2 Update client list and display

  - Modify ClientsTable to show all clients uniformly
  - Remove any client type indicators or categorization
  - Update search to work across all fields regardless of type
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 5. Update client detail and edit functionality

- [x] 5.1 Modify client detail view

  - Update ClientDetailView to show only filled fields
  - Display all filled fields in a clean, organized layout
  - Hide empty optional fields for cleaner display
  - _Requirements: 6.1, 6.2_

- [x] 5.2 Update client edit functionality

  - Modify edit modal to use unified form
  - Pre-populate all existing client data
  - Allow editing of all fields including mandatory ones
  - _Requirements: 6.3, 6.5, 6.6_

- [x] 6. Update testing for unified form approach


- [x] 6.1 Update component tests

  - Modify tests for UnifiedClientForm component
  - Test that only 5 fields are mandatory
  - Test optional field validation
  - Test form section collapsing/expanding
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6.2 Update integration tests

  - Test unified client creation workflow
  - Test that clients can be created with minimal data
  - Test that optional fields are properly saved when filled
  - Test client display with various field combinations
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6.3 Update E2E tests

  - Test complete user journey with unified form
  - Test mobile responsiveness of unified form
  - Test form persistence across page refreshes
  - Test error handling for mandatory vs optional fields
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
