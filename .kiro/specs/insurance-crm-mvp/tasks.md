# Implementation Plan

- [x] 1. Set up project structure and dependencies

  - Initialize Next.js 14 project with TypeScript and App Router
  - Initialize Express.js backend project with TypeScript
  - Install and configure all required dependencies (Tailwind CSS, ShadCN UI, Prisma, etc.)
  - Set up basic folder structure for both frontend and backend
  - Configure TypeScript configurations for both projects
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Configure database and authentication foundation

  - Set up PostgreSQL database connection with Prisma
  - Create Prisma schema with all models (Settings, Lead, Client, Policy, Activity)
  - Generate Prisma client and run initial migration
  - Implement JWT authentication utilities and middleware
  - Create password hashing utilities with bcrypt
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 3. Implement backend API foundation

  - Create Express.js server with TypeScript configuration
  - Set up CORS, body parsing, and error handling middleware
  - Implement authentication middleware for protected routes
  - Create standardized error response format and global error handler
  - Set up route structure for auth, dashboard, leads, clients, and policies
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.6, 8.7, 9.6, 9.7_

- [x] 4. Build authentication system

  - [x] 4.1 Create authentication API endpoints

    - Implement POST /api/auth/login endpoint with credential validation
    - Implement GET /api/auth/verify endpoint for token validation
    - Add request validation middleware for login requests
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2_

  - [x] 4.2 Create login page frontend

    - Build login form component with email and password fields
    - Implement form validation with inline error messages
    - Add JWT token storage and authentication context
    - Implement automatic redirect logic for authenticated users
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.6, 9.1, 9.2_

- [x] 5. Create protected layout and navigation

  - Build sidebar component with navigation links (Dashboard, Leads, Clients)
  - Create header component with page title and logout functionality
  - Implement protected route wrapper with authentication checks
  - Add responsive design for mobile devices
  - Create logout functionality with token cleanup
  - _Requirements: 1.6, 8.1, 8.2, 8.5_

- [x] 6. Implement dashboard functionality

  - [x] 6.1 Create dashboard statistics API

    - Implement GET /api/dashboard/stats endpoint for four key metrics
    - Calculate percentage changes from previous month
    - Implement GET /api/dashboard/chart-data for leads by status
    - Implement GET /api/dashboard/activities for recent activities
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 6.2 Build dashboard frontend components

    - Create statistics cards component displaying four key metrics
    - Implement bar chart component using Recharts for leads by status
    - Build recent activities list component with relative timestamps
    - Add "Add New Lead" quick action button
    - Implement loading skeletons for dashboard data
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.4_

- [x] 7. Build leads management system

  - [x] 7.1 Create leads API endpoints

    - Implement GET /api/leads with search and filter parameters
    - Implement POST /api/leads for creating new leads
    - Implement GET /api/leads/:id for individual lead retrieval
    - Implement PUT /api/leads/:id for updating leads
    - Implement DELETE /api/leads/:id for lead deletion
    - Implement POST /api/leads/:id/convert for lead to client conversion
    - Add request validation for all lead operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.4, 4.5, 4.6, 9.1, 9.2, 9.3_

  - [x] 7.2 Build leads list page

    - Create leads table component with all required columns
    - Implement real-time search functionality by name
    - Add status filter dropdown with all lead statuses
    - Create "Add Lead" button and modal integration
    - Implement pagination for more than 50 leads
    - Add loading states and empty state messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.8, 8.4, 8.7_

  - [x] 7.3 Create lead modal and forms

    - Build add/edit lead modal with all required and optional fields
    - Implement form validation with inline error messages
    - Add dropdown components for Insurance Interest, Status, and Priority
    - Create form submission handling with success/error feedback
    - _Requirements: 3.4, 3.5, 3.7, 8.3, 9.1, 9.2_

  - [x] 7.4 Build lead detail page

    - Create lead detail view displaying all lead information
    - Implement edit functionality with pre-filled modal
    - Add delete functionality with confirmation dialog
    - Create "Convert to Client" feature with confirmation
    - Add breadcrumb navigation and proper routing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.6_

- [x] 8. Build clients management system

  - [x] 8.1 Create clients API endpoints

    - Implement GET /api/clients with search parameters
    - Implement POST /api/clients for creating new clients
    - Implement GET /api/clients/:id for individual client retrieval with policies
    - Implement PUT /api/clients/:id for updating clients
    - Implement DELETE /api/clients/:id for client deletion with cascade
    - Add email uniqueness validation and error handling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 6.4, 6.5, 9.1, 9.2, 9.4_

  - [x] 8.2 Build clients list page

    - Create clients table component with all required columns including calculated age
    - Implement real-time search functionality by name
    - Create "Add Client" button and modal integration
    - Add loading states and empty state messages
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 8.4, 8.7_

  - [x] 8.3 Create client modal and forms

    - Build add/edit client modal with all required and optional fields
    - Implement form validation including email uniqueness and date validation
    - Add date picker component for date of birth
    - Create form submission handling with proper error feedback
    - _Requirements: 5.3, 5.4, 5.5, 5.7, 8.3, 9.1, 9.2, 9.4, 9.5_

  - [x] 8.4 Build client detail page

    - Create client detail view displaying all client information and calculated age
    - Display associated policies in a read-only table format
    - Implement edit functionality with pre-filled modal
    - Add delete functionality with confirmation dialog and cascade deletion
    - Add breadcrumb navigation and proper routing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Implement activity logging system

  - Create activity logging service for all CRUD operations
  - Integrate activity logging into all lead and client operations
  - Implement relative timestamp formatting for activity display
  - Add activity creation for lead conversion, status updates, and deletions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 10. Add UI polish and user experience enhancements

  - [x] 10.1 Implement status and priority badges

    - Create reusable badge components with proper color coding
    - Add status badges: New (blue), Contacted (purple), Qualified (yellow), Won (green), Lost (red)
    - Add priority badges: Hot 🔥 (red), Warm ☀️ (orange), Cold ❄️ (blue)
    - _Requirements: 8.1, 8.2_

  - [x] 10.2 Add toast notifications and feedback

    - Implement toast notification system for all CRUD operations
    - Add success messages for create, update, delete operations
    - Add error toast notifications for failed operations
    - Implement loading states throughout the application

    - _Requirements: 8.3, 8.4, 8.6_

  - [x] 10.3 Create confirmation dialogs and error handling

    - Build reusable confirmation dialog component for delete operations
    - Implement 404 error page for not found resources
    - Create 500 error page for server errors
    - Add proper error boundaries for React components
    - _Requirements: 8.6, 8.7, 9.6, 9.7_

- [x] 11. Implement responsive design and accessibility

  - Ensure all components work properly on mobile devices
  - Add proper ARIA labels and accessibility attributes
  - Test keyboard navigation throughout the application
  - Optimize loading performance with proper code splitting
  - _Requirements: 8.5_

- [-] 12. Add comprehensive testing

  - [x] 12.1 Write unit tests for components

    - Create unit tests for all major React components
    - Test form validation logic and user interactions
    - Test utility functions for date formatting and calculations
    - _Requirements: All requirements benefit from proper testing_

  - [x] 12.2 Write API integration tests

    - Create integration tests for all API endpoints
    - Test authentication middleware and error handling
    - Test database operations and data integrity
    - _Requirements: All requirements benefit from proper testing_

  - [x] 12.3 Add end-to-end tests

    - Create E2E tests for critical user flows (login, lead creation, conversion)
    - Test cross-browser compatibility
    - Validate mobile responsiveness
    - _Requirements: All requirements benefit from proper testing_

- [x] 13. Environment setup and deployment preparation


  - Create environment variable configuration for both frontend and backend
  - Set up database seeding script with sample data
  - Create README documentation with setup instructions
  - Add Docker configuration files for containerization
  - Configure build scripts and deployment processes
  - _Requirements: All requirements depend on proper deployment setup_
