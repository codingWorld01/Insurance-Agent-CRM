# Requirements Document

## Introduction

This document outlines the requirements for a minimal viable product (MVP) of a personal Insurance Agent CRM system designed for a single user. The system will provide core functionality for managing leads, clients, and basic policy information with a clean, modern web interface. The MVP focuses on essential features that enable an insurance agent to track prospects through the sales funnel and manage existing client relationships.

## Requirements

### Requirement 1

**User Story:** As an insurance agent, I want to securely log into the CRM system, so that I can access my leads and client data.

#### Acceptance Criteria

1. WHEN I navigate to the login page THEN the system SHALL display email and password input fields
2. WHEN I enter valid credentials THEN the system SHALL authenticate me using JWT tokens
3. WHEN authentication is successful THEN the system SHALL redirect me to the dashboard
4. WHEN I enter invalid credentials THEN the system SHALL display an error message
5. WHEN I am already logged in THEN the system SHALL automatically redirect me to the dashboard
6. WHEN my session expires THEN the system SHALL redirect me to the login page

### Requirement 2

**User Story:** As an insurance agent, I want to view a comprehensive dashboard, so that I can quickly understand my business performance and recent activities.

#### Acceptance Criteria

1. WHEN I access the dashboard THEN the system SHALL display four key statistics: Total Leads, Total Clients, Total Active Policies, and Total Commission This Month
2. WHEN viewing statistics THEN the system SHALL show percentage changes from the previous month
3. WHEN I view the dashboard THEN the system SHALL display a bar chart showing leads by status
4. WHEN I access the dashboard THEN the system SHALL show the last 5 recent activities
5. WHEN I want to add a new lead THEN the system SHALL provide a quick "Add New Lead" button
6. WHEN statistics are loading THEN the system SHALL display loading skeletons

### Requirement 3

**User Story:** As an insurance agent, I want to manage my leads effectively, so that I can track prospects through the sales process.

#### Acceptance Criteria

1. WHEN I access the leads page THEN the system SHALL display a searchable table with Name, Email, Phone, Insurance Interest, Status, Priority, Date Added, and Actions columns
2. WHEN I search by name THEN the system SHALL filter leads in real-time
3. WHEN I filter by status THEN the system SHALL show only leads matching the selected status
4. WHEN I click "Add Lead" THEN the system SHALL open a modal with required fields: Full Name, Email, Phone, Insurance Interest, and optional fields: Status, Priority, Notes
5. WHEN I submit a valid lead form THEN the system SHALL create the lead and display a success message
6. WHEN I click on a lead row THEN the system SHALL navigate to the lead detail page
7. WHEN form validation fails THEN the system SHALL display inline error messages
8. WHEN I have more than 50 leads THEN the system SHALL provide pagination

### Requirement 4

**User Story:** As an insurance agent, I want to view and manage individual lead details, so that I can track progress and take appropriate actions.

#### Acceptance Criteria

1. WHEN I access a lead detail page THEN the system SHALL display all lead information including contact details, insurance interest, status, priority, and notes
2. WHEN I click "Edit" THEN the system SHALL open a modal with pre-filled lead information
3. WHEN I click "Delete" THEN the system SHALL show a confirmation dialog before deletion
4. WHEN I confirm deletion THEN the system SHALL remove the lead and redirect to the leads list
5. WHEN I click "Convert to Client" THEN the system SHALL show a confirmation dialog
6. WHEN I confirm conversion THEN the system SHALL create a new client record, mark the lead as "Won", and redirect to the new client page

### Requirement 5

**User Story:** As an insurance agent, I want to manage my clients, so that I can maintain relationships and track their policies.

#### Acceptance Criteria

1. WHEN I access the clients page THEN the system SHALL display a searchable table with Name, Email, Phone, Date of Birth, Number of Policies, Date Added, and Actions columns
2. WHEN I search by name THEN the system SHALL filter clients in real-time
3. WHEN I click "Add Client" THEN the system SHALL open a modal with required fields: Full Name, Email, Phone, Date of Birth, and optional Address field
4. WHEN I submit a valid client form THEN the system SHALL create the client and display a success message
5. WHEN I enter a duplicate email THEN the system SHALL display a validation error
6. WHEN I click on a client row THEN the system SHALL navigate to the client detail page
7. WHEN form validation fails THEN the system SHALL display inline error messages

### Requirement 6

**User Story:** As an insurance agent, I want to view individual client details and their policies, so that I can understand their insurance portfolio.

#### Acceptance Criteria

1. WHEN I access a client detail page THEN the system SHALL display all client information including personal details and calculated age
2. WHEN I view a client THEN the system SHALL show a list of their associated policies with policy number, type, provider, premium, and status
3. WHEN I click "Edit" THEN the system SHALL open a modal with pre-filled client information
4. WHEN I click "Delete" THEN the system SHALL show a confirmation dialog before deletion
5. WHEN I confirm client deletion THEN the system SHALL remove the client and all associated policies, then redirect to the clients list

### Requirement 7

**User Story:** As an insurance agent, I want the system to track my activities, so that I can see a history of recent actions.

#### Acceptance Criteria

1. WHEN I create a new lead THEN the system SHALL log the activity with description "Created new lead: [Name]"
2. WHEN I convert a lead to client THEN the system SHALL log the activity with description "Converted lead to client: [Name]"
3. WHEN I add a new client THEN the system SHALL log the activity with description "Added new client: [Name]"
4. WHEN I update a lead status THEN the system SHALL log the activity with description "Updated lead status: [Name]"
5. WHEN I delete a lead THEN the system SHALL log the activity with description "Deleted lead: [Name]"
6. WHEN activities are displayed THEN the system SHALL show relative timestamps (e.g., "2 hours ago")

### Requirement 8

**User Story:** As an insurance agent, I want a responsive and intuitive interface, so that I can use the system effectively on different devices.

#### Acceptance Criteria

1. WHEN I access the system THEN the system SHALL display a fixed sidebar with navigation for Dashboard, Leads, and Clients
2. WHEN I view any page THEN the system SHALL show a header with page title and logout functionality
3. WHEN I perform any action THEN the system SHALL provide appropriate feedback through toast notifications
4. WHEN data is loading THEN the system SHALL display loading skeletons or indicators
5. WHEN I access the system on mobile devices THEN the system SHALL provide a responsive layout
6. WHEN I encounter errors THEN the system SHALL display user-friendly error messages
7. WHEN lists are empty THEN the system SHALL show appropriate empty state messages

### Requirement 9

**User Story:** As an insurance agent, I want proper data validation and error handling, so that I can trust the system's data integrity.

#### Acceptance Criteria

1. WHEN I submit forms THEN the system SHALL validate all required fields and display inline errors
2. WHEN I enter an email THEN the system SHALL validate the email format
3. WHEN I enter a phone number THEN the system SHALL validate it follows the 10-digit format
4. WHEN I enter a date of birth THEN the system SHALL ensure it's in the past
5. WHEN network errors occur THEN the system SHALL display appropriate error messages
6. WHEN I encounter 404 errors THEN the system SHALL show a "Not Found" page
7. WHEN server errors occur THEN the system SHALL show a "Something went wrong" message