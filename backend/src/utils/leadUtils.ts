// Utility function to calculate age from date of birth
export function calculateAge(dateOfBirth: Date | string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Validation function for date of birth
export function validateDateOfBirth(dateOfBirth: string): boolean {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const minAge = 0; // Minimum age (newborn)
  const maxAge = 120; // Maximum reasonable age
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return false;
  }
  
  // Check if date is not in future
  if (birthDate > today) {
    return false;
  }
  
  // Check if age is within reasonable range
  const age = calculateAge(birthDate);
  if (age < minAge || age > maxAge) {
    return false;
  }
  
  return true;
}

// Validation function for WhatsApp number
export function validateWhatsAppNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits for international numbers)
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return false;
  }
  
  // Check if all characters are digits
  return /^\d+$/.test(cleanPhone);
}

// Format WhatsApp number for storage
export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
}
