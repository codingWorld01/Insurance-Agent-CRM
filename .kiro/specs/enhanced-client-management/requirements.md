# Requirements Document

## Introduction

This document outlines the requirements for an enhanced client management system that supports comprehensive client data collection through a single unified form. The system will present all available fields in one form, allowing users to fill in only the information that is relevant to their specific client, whether individual, family member, employee, or corporate entity. The system includes document management and Cloudinary integration for image uploads, with all data being editable after submission.

## Glossary

- **Client_Management_System**: The enhanced client data collection and management application
- **Unified_Client_Form**: Single comprehensive form containing all possible client fields
- **Cloudinary_Service**: Third-party image and document storage service
- **Document_Upload**: File attachment functionality for client records
- **Mandatory_Field**: Required data field that must be completed before form submission (First Name, Last Name, DOB, Phone Number, WhatsApp Phone Number)
- **Optional_Field**: Data field that can be left empty during form submission

## Requirements

### Requirement 1

**User Story:** As an insurance agent, I want to create client profiles using a single comprehensive form, so that I can collect all relevant information regardless of client type in one unified interface.

#### Acceptance Criteria

1. WHEN I access the client creation form, THE Client_Management_System SHALL display a single Unified_Client_Form containing all available fields
2. WHEN I access the Unified_Client_Form, THE Client_Management_System SHALL mark only First Name, Last Name, DOB, Phone Number, and WhatsApp Phone Number as mandatory fields
3. WHEN I access the Unified_Client_Form, THE Client_Management_System SHALL display all other fields as optional including Middle Name, Email, State, City, Address, Birth Place, Age, Gender, Height, Weight, Education, Marital Status, Business/Job, Name of Business/Job, Type of Duty, Annual Income, PAN Number, GST Number, Company Name, and Relationship
4. WHEN I enter a Birth Date, THE Client_Management_System SHALL automatically calculate and display the Age
5. WHEN I submit the form with missing mandatory fields, THE Client_Management_System SHALL display validation errors and prevent submission

### Requirement 2

**User Story:** As an insurance agent, I want to fill in only the fields that are relevant to my specific client, so that I can efficiently capture appropriate information without being forced to complete irrelevant sections.

#### Acceptance Criteria

1. WHEN I use the Unified_Client_Form for an individual client, THE Client_Management_System SHALL allow me to fill personal fields and leave corporate fields empty
2. WHEN I use the Unified_Client_Form for a corporate client, THE Client_Management_System SHALL allow me to fill company fields and leave personal fields empty
3. WHEN I use the Unified_Client_Form for a family member or employee, THE Client_Management_System SHALL allow me to fill relationship and personal fields as needed
4. WHEN I save a client record, THE Client_Management_System SHALL store only the fields that contain data and ignore empty optional fields
5. WHEN I view a saved client record, THE Client_Management_System SHALL display only the fields that contain data in a clean, organized layout

### Requirement 3

**User Story:** As an insurance agent, I want proper validation for all fields in the unified form, so that I can ensure data quality regardless of which fields I choose to fill.

#### Acceptance Criteria

1. WHEN I enter an email address, THE Client_Management_System SHALL validate the email format and display errors for invalid formats
2. WHEN I enter phone numbers, THE Client_Management_System SHALL validate the format and ensure proper length
3. WHEN I enter a PAN number, THE Client_Management_System SHALL validate the PAN format according to Indian standards
4. WHEN I enter a GST number, THE Client_Management_System SHALL validate the GST format according to Indian GST standards
5. WHEN I enter dates, THE Client_Management_System SHALL ensure dates are valid and birth dates are in the past

### Requirement 4

**User Story:** As an insurance agent, I want to upload and manage documents for all client types, so that I can maintain complete client files with supporting documentation.

#### Acceptance Criteria

1. WHEN I access any client form, THE Client_Management_System SHALL provide document upload functionality using Cloudinary_Service
2. WHEN I select "Add Additional Document", THE Client_Management_System SHALL allow me to choose document types from a predefined list
3. WHEN I click "Upload Document", THE Client_Management_System SHALL open a file selection dialog
4. WHEN I select a file for upload, THE Client_Management_System SHALL upload the file to Cloudinary_Service and store the URL reference
5. WHEN upload is successful, THE Client_Management_System SHALL display the uploaded document name and provide options to view or remove it
6. WHEN I remove a document, THE Client_Management_System SHALL delete the file from Cloudinary_Service and remove the reference

### Requirement 5

**User Story:** As an insurance agent, I want to upload profile images for clients, so that I can visually identify clients and maintain professional records.

#### Acceptance Criteria

1. WHEN I access the personal client form, THE Client_Management_System SHALL provide a "Profile Image" upload section
2. WHEN I click "Choose File" for profile image, THE Client_Management_System SHALL open a file selection dialog restricted to image formats
3. WHEN I select an image file, THE Client_Management_System SHALL upload the image to Cloudinary_Service and display a preview
4. WHEN the image upload is successful, THE Client_Management_System SHALL store the Cloudinary URL reference with the client record
5. WHEN I want to change the profile image, THE Client_Management_System SHALL allow me to replace the existing image

### Requirement 6

**User Story:** As an insurance agent, I want to edit all client information after initial submission, so that I can keep client records current and accurate over time.

#### Acceptance Criteria

1. WHEN I view any existing client record, THE Client_Management_System SHALL provide an "Edit" option
2. WHEN I click "Edit", THE Client_Management_System SHALL open the appropriate form type with all current data pre-populated
3. WHEN I modify any field in edit mode, THE Client_Management_System SHALL allow changes to both mandatory and optional fields
4. WHEN I save edited information, THE Client_Management_System SHALL update the client record and maintain an audit trail of changes
5. WHEN I edit document attachments, THE Client_Management_System SHALL allow me to add new documents or remove existing ones
6. WHEN I update a profile image, THE Client_Management_System SHALL replace the old image in Cloudinary_Service

### Requirement 7

**User Story:** As an insurance agent, I want proper data validation across all client forms, so that I can ensure data quality and consistency.

#### Acceptance Criteria

1. WHEN I enter an email address, THE Client_Management_System SHALL validate the email format and display errors for invalid formats
2. WHEN I enter phone numbers, THE Client_Management_System SHALL validate the format and ensure proper length
3. WHEN I enter a PAN number, THE Client_Management_System SHALL validate the PAN format according to Indian standards
4. WHEN I enter a GST number, THE Client_Management_System SHALL validate the GST format according to Indian GST standards
5. WHEN I enter dates, THE Client_Management_System SHALL ensure dates are valid and birth dates are in the past
6. WHEN validation fails, THE Client_Management_System SHALL display clear error messages next to the relevant fields

### Requirement 8

**User Story:** As an insurance agent, I want to access one unified client creation interface, so that I can efficiently create any type of client without navigating between different forms.

#### Acceptance Criteria

1. WHEN I access the client management section, THE Client_Management_System SHALL provide a single "Create Client" option that opens the Unified_Client_Form
2. WHEN I create a new client, THE Client_Management_System SHALL present all available fields in one form without requiring me to pre-select a client type
3. WHEN I view the client list, THE Client_Management_System SHALL automatically categorize clients based on which fields contain data (personal vs corporate information)
4. WHEN I search for clients, THE Client_Management_System SHALL allow searching across all field types regardless of how the client was originally categorized
5. WHEN I export client data, THE Client_Management_System SHALL include all filled fields for each client record

### Requirement 9

**User Story:** As an insurance agent, I want secure integration with Cloudinary for document and image storage, so that client files are safely stored and easily accessible.

#### Acceptance Criteria

1. WHEN the system uploads files to Cloudinary_Service, THE Client_Management_System SHALL use the provided API credentials securely
2. WHEN files are uploaded, THE Client_Management_System SHALL generate secure URLs that are not publicly accessible without authentication
3. WHEN I delete a client record, THE Client_Management_System SHALL also remove associated files from Cloudinary_Service to prevent orphaned files
4. WHEN file uploads fail, THE Client_Management_System SHALL display appropriate error messages and allow retry
5. WHEN I view uploaded documents, THE Client_Management_System SHALL provide secure access through the application interface

### Requirement 10

**User Story:** As an insurance agent, I want responsive forms that work on different devices, so that I can collect client information during field visits or office meetings.

#### Acceptance Criteria

1. WHEN I access client forms on mobile devices, THE Client_Management_System SHALL display forms in a mobile-optimized layout
2. WHEN I use touch devices, THE Client_Management_System SHALL provide appropriate input controls for date selection and dropdowns
3. WHEN I access forms on tablets, THE Client_Management_System SHALL utilize the available screen space efficiently
4. WHEN I switch between devices, THE Client_Management_System SHALL maintain form state and allow continuation of data entry
5. WHEN I upload files on mobile devices, THE Client_Management_System SHALL provide access to device camera and photo gallery