import { z } from 'zod';

// Validation utilities for Indian standards
const panNumberRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const gstNumberRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const indianPhoneRegex = /^[6-9]\d{9}$/;

// Common validation schemas for optional fields
export const emailValidation = z.string()
  .email('Invalid email format')
  .optional()
  .or(z.literal(''));

export const phoneValidation = z.string()
  .regex(indianPhoneRegex, 'Phone must be a valid 10-digit Indian mobile number')
  .optional()
  .or(z.literal(''));

export const panNumberValidation = z.string()
  .regex(panNumberRegex, 'PAN number must be in format: ABCDE1234F')
  .optional()
  .or(z.literal(''));

export const gstNumberValidation = z.string()
  .regex(gstNumberRegex, 'GST number must be in valid Indian GST format')
  .optional()
  .or(z.literal(''));

export const dateValidation = z.string()
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Must be a valid date')
  .refine((date) => {
    const parsed = new Date(date);
    return parsed < new Date();
  }, 'Date must be in the past');

// Unified client validation schema - single form with all possible fields
export const unifiedClientValidationSchema = z.object({
  // Mandatory fields (always required)
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  dateOfBirth: dateValidation,
  phoneNumber: z.string().regex(indianPhoneRegex, 'Phone number must be a valid 10-digit Indian mobile number'),
  whatsappNumber: z.string().regex(indianPhoneRegex, 'WhatsApp number must be a valid 10-digit Indian mobile number'),
  
  // Optional personal fields
  middleName: z.string().max(50, 'Middle name must be less than 50 characters').optional().or(z.literal('')),
  email: emailValidation,
  state: z.string().max(50, 'State must be less than 50 characters').optional().or(z.literal('')),
  city: z.string().max(50, 'City must be less than 50 characters').optional().or(z.literal('')),
  address: z.string().max(500, 'Address must be less than 500 characters').optional().or(z.literal('')),
  birthPlace: z.string().max(100, 'Birth place must be less than 100 characters').optional().or(z.literal('')),
  age: z.number().int().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  height: z.number().positive('Height must be positive').max(10, 'Height must be less than 10 feet').optional(),
  weight: z.number().positive('Weight must be positive').max(500, 'Weight must be less than 500 kg').optional(),
  education: z.string().max(100, 'Education must be less than 100 characters').optional().or(z.literal('')),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  businessJob: z.string().max(100, 'Business/Job must be less than 100 characters').optional().or(z.literal('')),
  nameOfBusiness: z.string().max(100, 'Name of business must be less than 100 characters').optional().or(z.literal('')),
  typeOfDuty: z.string().max(100, 'Type of duty must be less than 100 characters').optional().or(z.literal('')),
  annualIncome: z.number().positive('Annual income must be positive').max(100000000, 'Annual income cannot exceed ₹10,00,00,000').optional(),
  panNumber: panNumberValidation,
  gstNumber: gstNumberValidation,
  additionalInfo: z.string().optional(),
  
  // Optional corporate fields
  companyName: z.string().max(200, 'Company name must be less than 200 characters').optional().or(z.literal('')),
  
  // Optional family/employee fields
  relationship: z.enum(['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'EMPLOYEE', 'DEPENDENT', 'OTHER']).optional(),
  
  // System fields (optional for updates)
  profileImage: z.string().url('Profile image must be a valid URL').optional().or(z.literal(''))
});

// Update schema (partial version for PUT requests)
export const updateUnifiedClientSchema = unifiedClientValidationSchema.partial();

// Legacy schemas for backward compatibility
export const personalClientSchema = z.object({
  clientType: z.literal('PERSONAL'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailValidation,
  phone: phoneValidation,
  profileImage: z.string().url('Profile image must be a valid URL').optional().or(z.literal('')),
  personalDetails: z.object({
    middleName: z.string().optional().or(z.literal('')),
    mobileNumber: z.string().regex(indianPhoneRegex, 'Mobile number must be a valid 10-digit Indian mobile number'),
    birthDate: dateValidation,
    age: z.number().int().min(1).max(120).optional(),
    state: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    birthPlace: z.string().optional().or(z.literal('')),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    height: z.number().positive('Height must be positive').optional(),
    weight: z.number().positive('Weight must be positive').optional(),
    education: z.string().optional().or(z.literal('')),
    maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
    businessJob: z.string().optional().or(z.literal('')),
    nameOfBusiness: z.string().optional().or(z.literal('')),
    typeOfDuty: z.string().optional().or(z.literal('')),
    annualIncome: z.number().positive('Annual income must be positive').optional(),
    panNumber: panNumberValidation,
    gstNumber: gstNumberValidation
  })
});

export const familyEmployeeClientSchema = z.object({
  clientType: z.literal('FAMILY_EMPLOYEE'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailValidation,
  phone: phoneValidation,
  profileImage: z.string().url('Profile image must be a valid URL').optional().or(z.literal('')),
  familyDetails: z.object({
    middleName: z.string().optional().or(z.literal('')),
    phoneNumber: z.string().regex(indianPhoneRegex, 'Phone number must be a valid 10-digit Indian mobile number'),
    whatsappNumber: z.string().regex(indianPhoneRegex, 'WhatsApp number must be a valid 10-digit Indian mobile number'),
    dateOfBirth: dateValidation,
    age: z.number().int().min(1).max(120).optional(),
    height: z.number().positive('Height must be positive').optional(),
    weight: z.number().positive('Weight must be positive').optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    relationship: z.enum(['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'EMPLOYEE', 'DEPENDENT', 'OTHER']).optional(),
    panNumber: panNumberValidation
  })
});

export const corporateClientSchema = z.object({
  clientType: z.literal('CORPORATE'),
  firstName: z.string().min(1, 'Company name is required'),
  lastName: z.string().optional().or(z.literal('')),
  email: emailValidation,
  phone: phoneValidation,
  profileImage: z.string().url('Profile image must be a valid URL').optional().or(z.literal('')),
  corporateDetails: z.object({
    companyName: z.string().min(1, 'Company name is required'),
    mobile: phoneValidation,
    email: emailValidation,
    state: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    annualIncome: z.number().positive('Annual income must be positive').optional(),
    panNumber: panNumberValidation,
    gstNumber: gstNumberValidation
  })
});

// Legacy union schema for backward compatibility
export const enhancedClientSchema = z.discriminatedUnion('clientType', [
  personalClientSchema,
  familyEmployeeClientSchema,
  corporateClientSchema
]);

// Legacy update schemas
export const updatePersonalClientSchema = personalClientSchema.partial().extend({
  personalDetails: personalClientSchema.shape.personalDetails.partial().optional()
});

export const updateFamilyEmployeeClientSchema = familyEmployeeClientSchema.partial().extend({
  familyDetails: familyEmployeeClientSchema.shape.familyDetails.partial().optional()
});

export const updateCorporateClientSchema = corporateClientSchema.partial().extend({
  corporateDetails: corporateClientSchema.shape.corporateDetails.partial().optional()
});

export const updateEnhancedClientSchema = z.union([
  updatePersonalClientSchema,
  updateFamilyEmployeeClientSchema,
  updateCorporateClientSchema
]);

// Document validation schema
export const documentSchema = z.object({
  documentType: z.enum(['IDENTITY_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF', 'MEDICAL_REPORT', 'POLICY_DOCUMENT', 'OTHER']),
  fileName: z.string().min(1, 'File name is required'),
  originalName: z.string().min(1, 'Original file name is required'),
  cloudinaryUrl: z.string().url('Cloudinary URL must be valid'),
  cloudinaryId: z.string().min(1, 'Cloudinary ID is required'),
  fileSize: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required')
});

// File upload validation
export const fileUploadSchema = z.object({
  documentType: z.enum(['IDENTITY_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF', 'MEDICAL_REPORT', 'POLICY_DOCUMENT', 'OTHER'])
});

// Query schemas
export const clientQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});