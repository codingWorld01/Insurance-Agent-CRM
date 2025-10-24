import { useState, useCallback } from 'react';
import {
  validatePolicyTemplate,
  validatePolicyInstance,
  validateSearchQuery,
  ValidationResult,
  PolicyTemplateValidationError,
  PolicyInstanceValidationError,
  debounceValidation
} from '@/utils/policyTemplateErrorHandling';

/**
 * Hook for policy template validation with real-time feedback
 */
export function usePolicyTemplateValidation() {
  const [validationState, setValidationState] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: {}
  });
  const [isValidating, setIsValidating] = useState(false);

  const validateTemplate = useCallback((data: {
    policyNumber: string;
    policyType: string;
    provider: string;
    description?: string;
  }) => {
    setIsValidating(true);
    
    try {
      const result = validatePolicyTemplate(data);
      setValidationState(result);
      return result;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationState({
        isValid: false,
        errors: { general: 'Validation failed' },
        warnings: {}
      });
      return {
        isValid: false,
        errors: { general: 'Validation failed' },
        warnings: {}
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const debouncedValidate = useCallback((data: {
    policyNumber: string;
    policyType: string;
    provider: string;
    description?: string;
  }) => {
    const debouncedFn = debounceValidation(validateTemplate, 300);
    debouncedFn(data);
  }, [validateTemplate]);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: {},
      warnings: {}
    });
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      const newWarnings = { ...prev.warnings };
      delete newErrors[field];
      delete newWarnings[field];
      
      return {
        ...prev,
        errors: newErrors,
        warnings: newWarnings,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, []);

  return {
    validationState,
    isValidating,
    validateTemplate,
    debouncedValidate,
    clearValidation,
    clearFieldError
  };
}

/**
 * Hook for policy instance validation with real-time feedback
 */
export function usePolicyInstanceValidation() {
  const [validationState, setValidationState] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: {}
  });
  const [isValidating, setIsValidating] = useState(false);

  const validateInstance = useCallback((data: {
    policyTemplateId: string;
    premiumAmount: number;
    startDate: string;
    durationMonths?: number;
    expiryDate?: string;
    commissionAmount: number;
  }) => {
    setIsValidating(true);
    
    try {
      const result = validatePolicyInstance(data);
      setValidationState(result);
      return result;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationState({
        isValid: false,
        errors: { general: 'Validation failed' },
        warnings: {}
      });
      return {
        isValid: false,
        errors: { general: 'Validation failed' },
        warnings: {}
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const debouncedValidate = useCallback((data: {
    policyTemplateId: string;
    premiumAmount: number;
    startDate: string;
    durationMonths?: number;
    expiryDate?: string;
    commissionAmount: number;
  }) => {
    const debouncedFn = debounceValidation(validateInstance, 300);
    debouncedFn(data);
  }, [validateInstance]);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: {},
      warnings: {}
    });
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      const newWarnings = { ...prev.warnings };
      delete newErrors[field];
      delete newWarnings[field];
      
      return {
        ...prev,
        errors: newErrors,
        warnings: newWarnings,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, []);

  return {
    validationState,
    isValidating,
    validateInstance,
    debouncedValidate,
    clearValidation,
    clearFieldError
  };
}

/**
 * Hook for policy number uniqueness validation
 */
export function usePolicyNumberValidation(excludeTemplateId?: string) {
  const [validationState, setValidationState] = useState<{
    isChecking: boolean;
    isValid: boolean | null;
    message: string;
    error?: string;
  }>({
    isChecking: false,
    isValid: null,
    message: ''
  });

  const validateUniqueness = useCallback(async (policyNumber: string) => {
    if (!policyNumber.trim() || policyNumber.length < 3) {
      setValidationState({
        isChecking: false,
        isValid: null,
        message: ''
      });
      return null;
    }

    setValidationState(prev => ({
      ...prev,
      isChecking: true,
      error: undefined
    }));

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/policy-templates/search?q=${encodeURIComponent(policyNumber)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new PolicyTemplateValidationError(
          'Failed to validate policy number',
          'policyNumber',
          `HTTP_${response.status}`,
          response.status >= 500
        );
      }

      const result = await response.json();
      
      if (result.success) {
        const exactMatch = result.data.find((template: { id: string; policyNumber: string }) => 
          template.policyNumber.toLowerCase() === policyNumber.toLowerCase() &&
          template.id !== excludeTemplateId
        );
        
        if (exactMatch) {
          setValidationState({
            isChecking: false,
            isValid: false,
            message: 'Policy number already exists'
          });
          return false;
        } else {
          setValidationState({
            isChecking: false,
            isValid: true,
            message: 'Policy number is available'
          });
          return true;
        }
      } else {
        throw new PolicyTemplateValidationError(
          result.message || 'Failed to validate policy number',
          'policyNumber',
          'VALIDATION_FAILED'
        );
      }
    } catch (error) {
      console.error('Error validating policy number:', error);
      
      let errorMessage = 'Unable to validate policy number';
      if (error instanceof PolicyTemplateValidationError) {
        errorMessage = error.message;
      }
      
      setValidationState({
        isChecking: false,
        isValid: null,
        message: '',
        error: errorMessage
      });
      return null;
    }
  }, [excludeTemplateId]);

  const debouncedValidate = useCallback((policyNumber: string) => {
    const debouncedFn = debounceValidation(validateUniqueness, 500);
    debouncedFn(policyNumber);
  }, [validateUniqueness]);

  const clearValidation = useCallback(() => {
    setValidationState({
      isChecking: false,
      isValid: null,
      message: '',
      error: undefined
    });
  }, []);

  return {
    validationState,
    validateUniqueness,
    debouncedValidate,
    clearValidation
  };
}

/**
 * Hook for client-template association validation
 */
export function useAssociationValidation() {
  const [validationState, setValidationState] = useState<{
    isChecking: boolean;
    isValid: boolean | null;
    message: string;
    error?: string;
  }>({
    isChecking: false,
    isValid: null,
    message: ''
  });

  const validateAssociation = useCallback(async (
    clientId: string,
    policyTemplateId: string,
    excludeInstanceId?: string
  ) => {
    if (!clientId || !policyTemplateId) {
      setValidationState({
        isChecking: false,
        isValid: null,
        message: ''
      });
      return null;
    }

    setValidationState(prev => ({
      ...prev,
      isChecking: true,
      error: undefined
    }));

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/policy-instances/validate-association', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId,
          policyTemplateId,
          excludeInstanceId
        })
      });

      if (!response.ok) {
        throw new PolicyInstanceValidationError(
          'Failed to validate association',
          'association',
          `HTTP_${response.status}`,
          response.status >= 500
        );
      }

      const result = await response.json();
      
      if (result.success) {
        setValidationState({
          isChecking: false,
          isValid: result.data.isUnique,
          message: result.data.message
        });
        return result.data.isUnique;
      } else {
        throw new PolicyInstanceValidationError(
          result.message || 'Failed to validate association',
          'association',
          'VALIDATION_FAILED'
        );
      }
    } catch (error) {
      console.error('Error validating association:', error);
      
      let errorMessage = 'Unable to validate association';
      if (error instanceof PolicyInstanceValidationError) {
        errorMessage = error.message;
      }
      
      setValidationState({
        isChecking: false,
        isValid: null,
        message: '',
        error: errorMessage
      });
      return null;
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationState({
      isChecking: false,
      isValid: null,
      message: '',
      error: undefined
    });
  }, []);

  return {
    validationState,
    validateAssociation,
    clearValidation
  };
}

/**
 * Hook for search query validation
 */
export function useSearchValidation() {
  const [validationState, setValidationState] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: {}
  });

  const validateSearch = useCallback((query: string) => {
    const result = validateSearchQuery(query);
    setValidationState(result);
    return result;
  }, []);

  const debouncedValidate = useCallback((query: string) => {
    const debouncedFn = debounceValidation(validateSearch, 200);
    debouncedFn(query);
  }, [validateSearch]);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: {},
      warnings: {}
    });
  }, []);

  return {
    validationState,
    validateSearch,
    debouncedValidate,
    clearValidation
  };
}

/**
 * Hook for expiry date calculation and validation
 */
export function useExpiryCalculation() {
  const [calculationState, setCalculationState] = useState<{
    isCalculating: boolean;
    expiryDate: string | null;
    error?: string;
  }>({
    isCalculating: false,
    expiryDate: null
  });

  const calculateExpiry = useCallback(async (startDate: string, durationMonths: number) => {
    if (!startDate || !durationMonths) {
      setCalculationState({
        isCalculating: false,
        expiryDate: null
      });
      return null;
    }

    // Validate inputs first
    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
      setCalculationState({
        isCalculating: false,
        expiryDate: null,
        error: 'Invalid start date'
      });
      return null;
    }

    if (durationMonths < 1 || durationMonths > 120) {
      setCalculationState({
        isCalculating: false,
        expiryDate: null,
        error: 'Invalid duration'
      });
      return null;
    }

    setCalculationState(prev => ({
      ...prev,
      isCalculating: true,
      error: undefined
    }));

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/policy-instances/calculate-expiry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate,
          durationMonths
        })
      });

      if (!response.ok) {
        throw new PolicyInstanceValidationError(
          'Failed to calculate expiry date',
          'expiryDate',
          `HTTP_${response.status}`,
          response.status >= 500
        );
      }

      const result = await response.json();
      
      if (result.success && result.data?.expiryDate) {
        setCalculationState({
          isCalculating: false,
          expiryDate: result.data.expiryDate
        });
        return result.data.expiryDate;
      } else {
        throw new PolicyInstanceValidationError(
          result.message || 'Failed to calculate expiry date',
          'expiryDate',
          'CALCULATION_FAILED'
        );
      }
    } catch (error) {
      console.error('Error calculating expiry date:', error);
      
      let errorMessage = 'Unable to calculate expiry date';
      if (error instanceof PolicyInstanceValidationError) {
        errorMessage = error.message;
      }
      
      setCalculationState({
        isCalculating: false,
        expiryDate: null,
        error: errorMessage
      });
      return null;
    }
  }, []);

  const clearCalculation = useCallback(() => {
    setCalculationState({
      isCalculating: false,
      expiryDate: null,
      error: undefined
    });
  }, []);

  return {
    calculationState,
    calculateExpiry,
    clearCalculation
  };
}