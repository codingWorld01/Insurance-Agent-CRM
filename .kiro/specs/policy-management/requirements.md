# Requirements Document

## Introduction

This document outlines the requirements for adding comprehensive policy management functionality to the Insurance Agent CRM system. This feature will enable insurance agents to add, edit, and manage insurance policies for their clients, providing a complete view of each client's insurance portfolio and enabling better service and upselling opportunities.

## Requirements

### Requirement 1

**User Story:** As an insurance agent, I want to add new policies to existing clients, so that I can maintain accurate records of their insurance coverage.

#### Acceptance Criteria

1. WHEN I am on a client detail page THEN the system SHALL display an "Add Policy" button in the policies section
2. WHEN I click "Add Policy" THEN the system SHALL open a modal with required fields: Policy Number, Policy Type, Provider, Premium Amount, Start Date, Expiry Date, Commission Amount
3. WHEN I submit a valid policy form THEN the system SHALL create the policy, associate it with the client, and display a success message
4. WHEN I enter a duplicate policy number THEN the system SHALL display a validation error
5. WHEN I enter invalid dates (start date after expiry date) THEN the system SHALL display a validation error
6. WHEN I enter negative amounts THEN the system SHALL display a validation error
7. WHEN form validation fails THEN the system SHALL display inline error messages

### Requirement 2

**User Story:** As an insurance agent, I want to edit existing policies, so that I can keep policy information up to date when changes occur.

#### Acceptance Criteria

1. WHEN I view a policy in the client detail page THEN the system SHALL display an "Edit" action button for each policy
2. WHEN I click "Edit Policy" THEN the system SHALL open a modal with pre-filled policy information
3. WHEN I update policy information THEN the system SHALL validate the changes and save them
4. WHEN I change the policy status to "Expired" THEN the system SHALL update the policy and reflect the change in client statistics
5. WHEN I update premium or commission amounts THEN the system SHALL recalculate relevant dashboard statistics
6. WHEN I save changes THEN the system SHALL display a success message and refresh the policy list

### Requirement 3

**User Story:** As an insurance agent, I want to delete policies when they are cancelled or no longer valid, so that I maintain accurate client records.

#### Acceptance Criteria

1. WHEN I view a policy THEN the system SHALL display a "Delete" action button
2. WHEN I click "Delete Policy" THEN the system SHALL show a confirmation dialog with policy details
3. WHEN I confirm deletion THEN the system SHALL remove the policy and update client statistics
4. WHEN I cancel deletion THEN the system SHALL close the dialog without making changes
5. WHEN a policy is deleted THEN the system SHALL log the activity for audit purposes
6. WHEN the last policy is deleted THEN the system SHALL update the client's policy count to zero

### Requirement 4

**User Story:** As an insurance agent, I want to view comprehensive policy details, so that I can provide informed service to my clients.

#### Acceptance Criteria

1. WHEN I view a client's policies THEN the system SHALL display Policy Number, Type, Provider, Premium, Status, Start Date, Expiry Date, and Commission in a clear table format
2. WHEN a policy is near expiry (within 30 days) THEN the system SHALL highlight it with a warning indicator
3. WHEN a policy has expired THEN the system SHALL display it with an "Expired" status badge
4. WHEN I click on a policy row THEN the system SHALL show expanded details including all policy information
5. WHEN policies are loading THEN the system SHALL display loading indicators
6. WHEN a client has no policies THEN the system SHALL show an appropriate empty state with an "Add Policy" call-to-action

### Requirement 5

**User Story:** As an insurance agent, I want to track policy-related activities, so that I can maintain an audit trail of policy changes.

#### Acceptance Criteria

1. WHEN I add a new policy THEN the system SHALL log the activity with description "Added new policy: [Policy Number] for [Client Name]"
2. WHEN I update a policy THEN the system SHALL log the activity with description "Updated policy: [Policy Number] for [Client Name]"
3. WHEN I delete a policy THEN the system SHALL log the activity with description "Deleted policy: [Policy Number] for [Client Name]"
4. WHEN a policy status changes THEN the system SHALL log the activity with description "Policy [Policy Number] status changed to [New Status]"
5. WHEN policy activities are displayed THEN the system SHALL show relative timestamps and include relevant policy details
6. WHEN I view recent activities THEN the system SHALL include policy-related activities in the dashboard feed

### Requirement 6

**User Story:** As an insurance agent, I want policy data to integrate with dashboard statistics, so that I can track my business performance accurately.

#### Acceptance Criteria

1. WHEN policies are added or updated THEN the system SHALL recalculate the "Total Active Policies" statistic
2. WHEN commission amounts change THEN the system SHALL update the "Total Commission This Month" calculation
3. WHEN I view dashboard statistics THEN the system SHALL include policy-related metrics in percentage change calculations
4. WHEN policies expire THEN the system SHALL automatically update the active policy count
5. WHEN I add policies with future start dates THEN the system SHALL not count them as active until the start date
6. WHEN calculating monthly commission THEN the system SHALL only include policies created or renewed in the current month

### Requirement 7

**User Story:** As an insurance agent, I want proper validation and error handling for policy management, so that I can trust the data integrity.

#### Acceptance Criteria

1. WHEN I enter policy information THEN the system SHALL validate all required fields and display inline errors
2. WHEN I enter a policy number THEN the system SHALL ensure it's unique across all policies
3. WHEN I select dates THEN the system SHALL ensure start date is before expiry date
4. WHEN I enter amounts THEN the system SHALL validate they are positive numbers with appropriate decimal precision
5. WHEN network errors occur during policy operations THEN the system SHALL display appropriate error messages
6. WHEN I try to add a policy to a non-existent client THEN the system SHALL handle the error gracefully
7. WHEN database constraints are violated THEN the system SHALL provide user-friendly error messages

### Requirement 8

**User Story:** As an insurance agent, I want the policy management interface to be intuitive and responsive, so that I can efficiently manage policies on any device.

#### Acceptance Criteria

1. WHEN I view policies on mobile devices THEN the system SHALL provide a responsive layout that's easy to use
2. WHEN I interact with policy forms THEN the system SHALL provide clear visual feedback and loading states
3. WHEN I perform policy actions THEN the system SHALL provide immediate feedback through toast notifications
4. WHEN policy data is loading THEN the system SHALL display appropriate loading skeletons
5. WHEN I use keyboard navigation THEN the system SHALL support tab navigation through policy forms
6. WHEN I use the policy interface THEN the system SHALL maintain consistent styling with the rest of the application
7. WHEN errors occur THEN the system SHALL display them in a user-friendly manner with clear next steps