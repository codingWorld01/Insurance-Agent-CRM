import { z } from "zod"
import { 
  validatePAN, 
  validateGST, 
  validateMobileNumber, 
  validatePhoneNumber,
  validateEmail,
  validateBirthDate 
} from "@/utils/validationUtils"

// Base client schema
export const baseClientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  email: z.string().optional().refine((val) => !val || validateEmail(val), "Invalid email format"),
  phone: z.string().optional().refine((val) => !val || validatePhoneNumber(val), "Invalid phone number"),
})

// Personal client schema
export const personalClientSchema = baseClientSchema.extend({
  middleName: z.string().max(50, "Middle name too long").optional(),
  mobileNumber: z.string().min(1, "Mobile number is required").refine(validateMobileNumber, "Invalid mobile number"),
  birthDate: z.date().refine(validateBirthDate, "Birth date must be in the past"),
  age: z.number().min(0).max(150).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  birthPlace: z.string().max(100).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  height: z.number().min(0).max(10).optional(), // in feet
  weight: z.number().min(0).max(1000).optional(), // in kg
  education: z.string().max(100).optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional(),
  businessJob: z.string().max(100).optional(),
  nameOfBusiness: z.string().max(100).optional(),
  typeOfDuty: z.string().max(100).optional(),
  annualIncome: z.number().min(0).optional(),
  panNumber: z.string().optional().refine((val) => !val || validatePAN(val), "Invalid PAN format"),
  gstNumber: z.string().optional().refine((val) => !val || validateGST(val), "Invalid GST format"),
})

// Family/Employee client schema
export const familyEmployeeClientSchema = baseClientSchema.extend({
  middleName: z.string().max(50, "Middle name too long").optional(),
  phoneNumber: z.string().min(1, "Phone number is required").refine(validatePhoneNumber, "Invalid phone number"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required").refine(validatePhoneNumber, "Invalid WhatsApp number"),
  dateOfBirth: z.date().refine(validateBirthDate, "Date of birth must be in the past"),
  age: z.number().min(0).max(150).optional(),
  height: z.number().min(0).max(10).optional(), // in feet
  weight: z.number().min(0).max(1000).optional(), // in kg
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  relationship: z.enum(["SPOUSE", "CHILD", "PARENT", "SIBLING", "EMPLOYEE", "DEPENDENT", "OTHER"]).optional(),
  panNumber: z.string().optional().refine((val) => !val || validatePAN(val), "Invalid PAN format"),
})

// Corporate client schema
export const corporateClientSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200, "Company name too long"),
  mobile: z.string().optional().refine((val) => !val || validatePhoneNumber(val), "Invalid mobile number"),
  email: z.string().optional().refine((val) => !val || validateEmail(val), "Invalid email format"),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  annualIncome: z.number().min(0).optional(),
  panNumber: z.string().optional().refine((val) => !val || validatePAN(val), "Invalid PAN format"),
  gstNumber: z.string().optional().refine((val) => !val || validateGST(val), "Invalid GST format"),
})

// Document schema
export const documentSchema = z.object({
  documentType: z.enum(["IDENTITY_PROOF", "ADDRESS_PROOF", "INCOME_PROOF", "MEDICAL_REPORT", "POLICY_DOCUMENT", "OTHER"]),
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    "File size must be less than 10MB"
  ).refine(
    (file) => [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ].includes(file.type),
    "File type not supported"
  ),
})

// Profile image schema
export const profileImageSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB
    "Image size must be less than 5MB"
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'image/gif'].includes(file.type),
    "Image type not supported"
  ),
})

// Form data types
export type PersonalClientFormData = z.infer<typeof personalClientSchema>
export type FamilyEmployeeClientFormData = z.infer<typeof familyEmployeeClientSchema>
export type CorporateClientFormData = z.infer<typeof corporateClientSchema>
export type DocumentFormData = z.infer<typeof documentSchema>
export type ProfileImageFormData = z.infer<typeof profileImageSchema>

// Client type enum
export const ClientType = z.enum(["PERSONAL", "FAMILY_EMPLOYEE", "CORPORATE"])
export type ClientType = z.infer<typeof ClientType>

// Unified client schema - single form with all possible fields
export const unifiedClientSchema = z.object({
  // Mandatory fields (always required)
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  dateOfBirth: z.date().refine(validateBirthDate, "Date of birth must be in the past"),
  phoneNumber: z.string().min(1, "Phone number is required").refine(validatePhoneNumber, "Invalid phone number"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required").refine(validatePhoneNumber, "Invalid WhatsApp number"),
  
  // Optional personal fields
  middleName: z.string().max(50, "Middle name too long").optional(),
  email: z.string().optional().refine((val) => !val || validateEmail(val), "Invalid email format"),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  birthPlace: z.string().max(100).optional(),
  age: z.number().min(0).max(150).optional(), // Calculated from dateOfBirth
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  height: z.number().min(0).max(10).optional(), // in feet
  weight: z.number().min(0).max(1000).optional(), // in kg
  education: z.string().max(100).optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional(),
  businessJob: z.string().max(100).optional(),
  nameOfBusiness: z.string().max(100).optional(),
  typeOfDuty: z.string().max(100).optional(),
  annualIncome: z.number().min(0).optional(),
  panNumber: z.string().optional().refine((val) => !val || validatePAN(val), "Invalid PAN format"),
  gstNumber: z.string().optional().refine((val) => !val || validateGST(val), "Invalid GST format"),
  additionalInfo: z.string().max(1000, "Additional information too long").optional(),
  
  // Optional corporate fields
  companyName: z.string().max(200, "Company name too long").optional(),
  
  // Optional family/employee fields
  relationship: z.enum(["SPOUSE", "CHILD", "PARENT", "SIBLING", "EMPLOYEE", "DEPENDENT", "OTHER"]).optional(),
})

// Combined client form data
export type ClientFormData = 
  | (PersonalClientFormData & { clientType: "PERSONAL" })
  | (FamilyEmployeeClientFormData & { clientType: "FAMILY_EMPLOYEE" })
  | (CorporateClientFormData & { clientType: "CORPORATE" })

// Unified client form data type
export type UnifiedClientFormData = z.infer<typeof unifiedClientSchema>