/**
 * Currency formatting utilities for the Insurance CRM application
 */

/**
 * Formats a number as currency (INR)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number as currency without decimals for display
 * @param amount - The amount to format
 * @returns Formatted currency string without decimals
 */
export function formatCurrencyCompact(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parses a currency string and returns the numeric value
 * @param currencyString - The currency string to parse (e.g., "₹1,234.56")
 * @returns The numeric value or NaN if invalid
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols, commas, and spaces
  const cleanedString = currencyString.replace(/[₹,\s]/g, '');
  return parseFloat(cleanedString);
}

/**
 * Formats a currency input value for display in form fields
 * @param value - The input value (string or number)
 * @returns Formatted string for input display
 */
export function formatCurrencyInput(value: string | number): string {
  if (typeof value === 'string') {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Handle multiple decimal points
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return numericValue;
  }
  
  return value.toString();
}

/**
 * Validates if a currency input is valid
 * @param value - The currency value to validate
 * @returns True if valid, false otherwise
 */
export function isValidCurrencyInput(value: string): boolean {
  const numericValue = parseCurrency(value);
  return !isNaN(numericValue) && numericValue >= 0;
}