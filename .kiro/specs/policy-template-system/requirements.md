# Requirements Document

## Introduction

This document outlines the requirements for implementing a Policy Template System in the Insurance Agent CRM. This system separates policy templates (master policy information) from policy instances (client-specific policy data), allowing multiple clients to be associated with the same policy template while maintaining individual policy details like start dates, premiums, and commissions.

## Requirements

### Requirement 1

**User Story:** As an insurance agent, I want to view policy templates without client-specific details, so that I can manage master policy information efficiently.

#### Acceptance Criteria

1. WHEN I navigate to the policies page THEN the system SHALL display policy templates showing only Policy Number, Policy Type, Provider, and Description
2. WHEN I view policy templates THEN the system SHALL NOT display start date, expiry date, status, premium, or commission as these are client-specific
3. WHEN I view a policy template THEN the system SHALL show the number of clients associated with that template
4. WHEN I search policy templates THEN the system SHALL search by policy number, provider, and policy type
5. WHEN I filter policy templates THEN the system SHALL filter by policy type and provider only
6. WHEN policy templates are loading THEN the system SHALL display appropriate loading states
7. WHEN I have no policy templates THEN the system SHALL show an empty state with guidance to add templates

### Requirement 2

**User Story:** As an insurance agent, I want to click on a policy template to see all clients associated with it, so that I can view client-specific policy details.

#### Acceptance Criteria

1. WHEN I click on a policy template THEN the system SHALL navigate to a policy detail page showing all associated clients
2. WHEN I view the policy detail page THEN the system SHALL display the policy template information at the top (Policy Number, Type, Provider, Description)
3. WHEN I view associated clients THEN the system SHALL show Client Name, Start Date, Expiry Date, Status, Premium Amount, and Commission Amount in a table
4. WHEN a client's policy is near expiry THEN the system SHALL highlight it with a warning indicator
5. WHEN a client's policy has expired THEN the system SHALL display it with an "Expired" status badge
6. WHEN I click on a client name THEN the system SHALL navigate to that client's detail page
7. WHEN no clients are associated with the policy template THEN the system SHALL show an empty state

### Requirement 3

**User Story:** As an insurance agent, I want to add policies to clients by searching for policy templates, so that I can efficiently associate existing policies with clients.

#### Acceptance Criteria

1. WHEN I am on a client detail page and click "Add Policy" THEN the system SHALL open a modal with policy template search functionality
2. WHEN I search for policies THEN the system SHALL search by policy number and provider name
3. WHEN I select a policy template THEN the system SHALL show a form to enter client-specific details: Start Date, Duration (in months/years), Premium Amount, and Commission Amount
4. WHEN I enter duration THEN the system SHALL automatically calculate the expiry date based on start date and duration
5. WHEN I submit the policy instance THEN the system SHALL create the association between client and policy template with the specified details
6. WHEN I add a policy instance THEN the system SHALL validate that the client doesn't already have this policy template
7. WHEN policy instance creation succeeds THEN the system SHALL display success notification and refresh the client's policy list

### Requirement 4

**User Story:** As an insurance agent, I want to create new policy templates, so that I can add new insurance products to the system.

#### Acceptance Criteria

1. WHEN I click "Add Policy Template" on the policies page THEN the system SHALL open a modal with template creation form
2. WHEN I create a policy template THEN the system SHALL require Policy Number, Policy Type, Provider, and Description
3. WHEN I enter a policy number THEN the system SHALL validate that it's unique across all policy templates
4. WHEN I submit a new policy template THEN the system SHALL validate all required fields and create the template
5. WHEN template creation succeeds THEN the system SHALL refresh the policies page and show success notification
6. WHEN template creation fails THEN the system SHALL display validation errors inline
7. WHEN I create a policy template THEN the system SHALL log the activity for audit purposes

### Requirement 5

**User Story:** As an insurance agent, I want to edit and delete policy templates, so that I can maintain accurate master policy information.

#### Acceptance Criteria

1. WHEN I click edit on a policy template THEN the system SHALL open the template edit modal with pre-filled data
2. WHEN I edit a policy template THEN the system SHALL validate changes and update the template
3. WHEN I update a policy template THEN the system SHALL maintain all existing client associations
4. WHEN I click delete on a policy template THEN the system SHALL show a confirmation dialog indicating how many clients will be affected
5. WHEN I confirm template deletion THEN the system SHALL remove the template and all associated policy instances
6. WHEN I delete a policy template THEN the system SHALL log the activity and update affected client statistics
7. WHEN template operations fail THEN the system SHALL display clear error messages

### Requirement 6

**User Story:** As an insurance agent, I want to manage individual policy instances from the policy detail page, so that I can update client-specific policy information.

#### Acceptance Criteria

1. WHEN I view a policy detail page THEN the system SHALL show edit and delete actions for each client's policy instance
2. WHEN I edit a policy instance THEN the system SHALL allow updating Start Date, Duration, Premium Amount, Commission Amount, and Status
3. WHEN I update duration THEN the system SHALL recalculate the expiry date automatically
4. WHEN I delete a policy instance THEN the system SHALL show confirmation dialog with client and policy details
5. WHEN I confirm instance deletion THEN the system SHALL remove only that client's association with the policy template
6. WHEN I update policy instances THEN the system SHALL log activities and update dashboard statistics
7. WHEN instance operations complete THEN the system SHALL show appropriate notifications

### Requirement 7

**User Story:** As an insurance agent, I want policy template statistics and insights, so that I can understand my policy portfolio performance.

#### Acceptance Criteria

1. WHEN I view the policies page THEN the system SHALL display summary cards showing total policy templates, total active instances, and total clients covered
2. WHEN I view policy template statistics THEN the system SHALL show most popular policy types and providers
3. WHEN I view a policy detail page THEN the system SHALL show statistics for that specific policy template (total clients, active instances, total premium value)
4. WHEN I apply filters THEN the system SHALL update statistics to reflect only filtered policy templates
5. WHEN statistics are loading THEN the system SHALL show loading placeholders
6. WHEN I view policy insights THEN the system SHALL highlight policy templates with expiring instances
7. WHEN I click on statistics THEN the system SHALL provide drill-down functionality to view details

### Requirement 8

**User Story:** As an insurance agent, I want comprehensive search and filtering capabilities, so that I can efficiently find policy templates and instances.

#### Acceptance Criteria

1. WHEN I search on the policies page THEN the system SHALL search across policy numbers, providers, and policy types
2. WHEN I filter policy templates THEN the system SHALL filter by policy type, provider, and client association status
3. WHEN I search on the policy detail page THEN the system SHALL search across associated client names and policy instance details
4. WHEN I apply multiple filters THEN the system SHALL combine them with AND logic
5. WHEN I clear filters THEN the system SHALL reset to show all policy templates
6. WHEN I apply filters THEN the system SHALL update the URL to maintain filter state on page refresh
7. WHEN search results are empty THEN the system SHALL show appropriate empty states with suggestions

### Requirement 9

**User Story:** As an insurance agent, I want the policy template system to integrate with existing dashboard and reporting features, so that I maintain comprehensive business insights.

#### Acceptance Criteria

1. WHEN policy instances are added or updated THEN the system SHALL recalculate dashboard statistics including total active policies and commission metrics
2. WHEN I view dashboard activities THEN the system SHALL include policy template and instance activities in the feed
3. WHEN policy instances expire THEN the system SHALL automatically update active policy counts and send notifications
4. WHEN I generate reports THEN the system SHALL include both policy template and instance data as appropriate
5. WHEN calculating monthly commission THEN the system SHALL aggregate commission from all policy instances created or renewed in the current month
6. WHEN I view client statistics THEN the system SHALL reflect policy instance data accurately
7. WHEN policy template changes occur THEN the system SHALL maintain data consistency across all related features

### Requirement 10

**User Story:** As an insurance agent, I want robust error handling and data validation, so that I can trust the integrity of the policy template system.

#### Acceptance Criteria

1. WHEN I create policy templates THEN the system SHALL validate all required fields and ensure policy number uniqueness
2. WHEN I create policy instances THEN the system SHALL validate that start date is before calculated expiry date
3. WHEN I enter amounts THEN the system SHALL validate they are positive numbers with appropriate decimal precision
4. WHEN I associate a client with a policy template THEN the system SHALL prevent duplicate associations
5. WHEN network errors occur THEN the system SHALL display appropriate error messages with retry options
6. WHEN I delete policy templates with associated instances THEN the system SHALL clearly warn about data loss
7. WHEN database constraints are violated THEN the system SHALL provide user-friendly error messages with clear next steps