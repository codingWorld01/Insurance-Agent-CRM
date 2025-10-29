"use client"

import { useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  personalClientSchema,
  familyEmployeeClientSchema,
  corporateClientSchema,
  unifiedClientSchema,
  type PersonalClientFormData,
  type FamilyEmployeeClientFormData,
  type CorporateClientFormData,
  type UnifiedClientFormData,
} from "@/schemas/clientSchemas"
import {
  getPANErrorMessage,
  getGSTErrorMessage,
  getMobileErrorMessage,
  getEmailErrorMessage,
} from "@/utils/validationUtils"

interface UseClientValidationOptions {
  enableRealTimeValidation?: boolean
}

// Specific hooks for each client type
export function usePersonalClientValidation(options: UseClientValidationOptions = {}) {
  const form = useForm<PersonalClientFormData>({
    resolver: zodResolver(personalClientSchema),
    mode: options.enableRealTimeValidation ? "onChange" : "onSubmit",
  })

  return {
    form,
    ...form.formState,
  }
}

export function useFamilyEmployeeClientValidation(options: UseClientValidationOptions = {}) {
  const form = useForm<FamilyEmployeeClientFormData>({
    resolver: zodResolver(familyEmployeeClientSchema),
    mode: options.enableRealTimeValidation ? "onChange" : "onSubmit",
  })

  return {
    form,
    ...form.formState,
  }
}

export function useCorporateClientValidation(options: UseClientValidationOptions = {}) {
  const form = useForm<CorporateClientFormData>({
    resolver: zodResolver(corporateClientSchema),
    mode: options.enableRealTimeValidation ? "onChange" : "onSubmit",
  })

  return {
    form,
    ...form.formState,
  }
}

// Utility hook for individual field validation
export function useFieldValidation() {
  const validatePANField = useCallback((pan: string) => {
    return getPANErrorMessage(pan)
  }, [])

  const validateGSTField = useCallback((gst: string) => {
    return getGSTErrorMessage(gst)
  }, [])

  const validateMobileField = useCallback((mobile: string) => {
    return getMobileErrorMessage(mobile)
  }, [])

  const validateEmailField = useCallback((email: string) => {
    return getEmailErrorMessage(email)
  }, [])

  return {
    validatePANField,
    validateGSTField,
    validateMobileField,
    validateEmailField,
  }
}

// Unified client validation hook
export function useUnifiedClientValidation(options: UseClientValidationOptions = {}) {
  const form = useForm<UnifiedClientFormData>({
    resolver: zodResolver(unifiedClientSchema),
    mode: options.enableRealTimeValidation ? "onChange" : "onSubmit",
  })

  return {
    form,
    ...form.formState,
  }
}