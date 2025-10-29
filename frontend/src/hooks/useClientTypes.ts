"use client"

import { useState, useCallback, useMemo } from "react"
import type { ClientType } from "@/schemas/clientSchemas"

export interface ClientTypeInfo {
  value: ClientType
  label: string
  description: string
  icon: string
  fields: {
    required: string[]
    optional: string[]
  }
}

const CLIENT_TYPE_INFO: Record<ClientType, ClientTypeInfo> = {
  PERSONAL: {
    value: "PERSONAL",
    label: "Personal Client",
    description: "Individual client with comprehensive personal information",
    icon: "👤",
    fields: {
      required: ["firstName", "lastName", "mobileNumber", "birthDate"],
      optional: [
        "middleName", "email", "state", "city", "address", "birthPlace",
        "gender", "height", "weight", "education", "maritalStatus",
        "businessJob", "nameOfBusiness", "typeOfDuty", "annualIncome",
        "panNumber", "gstNumber"
      ]
    }
  },
  FAMILY_EMPLOYEE: {
    value: "FAMILY_EMPLOYEE",
    label: "Family/Employee Client",
    description: "Family member or employee with relationship tracking",
    icon: "👥",
    fields: {
      required: ["firstName", "lastName", "phoneNumber", "whatsappNumber", "dateOfBirth"],
      optional: [
        "middleName", "age", "height", "weight", "gender", "relationship", "panNumber"
      ]
    }
  },
  CORPORATE: {
    value: "CORPORATE",
    label: "Corporate Client",
    description: "Business entity with company-specific information",
    icon: "🏢",
    fields: {
      required: ["companyName"],
      optional: [
        "mobile", "email", "state", "city", "address", "annualIncome",
        "panNumber", "gstNumber"
      ]
    }
  }
}

interface UseClientTypesReturn {
  clientTypes: ClientTypeInfo[]
  selectedType: ClientType | null
  setSelectedType: (type: ClientType | null) => void
  getClientTypeInfo: (type: ClientType) => ClientTypeInfo
  isValidClientType: (type: string) => type is ClientType
  getRequiredFields: (type: ClientType) => string[]
  getOptionalFields: (type: ClientType) => string[]
  getAllFields: (type: ClientType) => string[]
}

export function useClientTypes(initialType?: ClientType): UseClientTypesReturn {
  const [selectedType, setSelectedType] = useState<ClientType | null>(initialType || null)

  const clientTypes = useMemo(() => Object.values(CLIENT_TYPE_INFO), [])

  const getClientTypeInfo = useCallback((type: ClientType): ClientTypeInfo => {
    return CLIENT_TYPE_INFO[type]
  }, [])

  const isValidClientType = useCallback((type: string): type is ClientType => {
    return type in CLIENT_TYPE_INFO
  }, [])

  const getRequiredFields = useCallback((type: ClientType): string[] => {
    return CLIENT_TYPE_INFO[type].fields.required
  }, [])

  const getOptionalFields = useCallback((type: ClientType): string[] => {
    return CLIENT_TYPE_INFO[type].fields.optional
  }, [])

  const getAllFields = useCallback((type: ClientType): string[] => {
    const info = CLIENT_TYPE_INFO[type]
    return [...info.fields.required, ...info.fields.optional]
  }, [])

  return {
    clientTypes,
    selectedType,
    setSelectedType,
    getClientTypeInfo,
    isValidClientType,
    getRequiredFields,
    getOptionalFields,
    getAllFields,
  }
}

// Hook for client type validation and conversion
export function useClientTypeValidation() {
  const validateClientData = useCallback((data: Record<string, unknown>, clientType: ClientType): string[] => {
    const errors: string[] = []
    const requiredFields = CLIENT_TYPE_INFO[clientType].fields.required

    requiredFields.forEach(field => {
      const fieldValue = data[field]
      if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
        errors.push(`${field} is required for ${CLIENT_TYPE_INFO[clientType].label}`)
      }
    })

    return errors
  }, [])

  const canConvertClientType = useCallback((
    fromType: ClientType,
    toType: ClientType,
    data: Record<string, unknown>
  ): { canConvert: boolean; missingFields: string[] } => {
    const fromFields = new Set([
      ...CLIENT_TYPE_INFO[fromType].fields.required,
      ...CLIENT_TYPE_INFO[fromType].fields.optional
    ])
    const toRequiredFields = CLIENT_TYPE_INFO[toType].fields.required

    const missingFields = toRequiredFields.filter(field => 
      !fromFields.has(field) || !data[field]
    )

    return {
      canConvert: missingFields.length === 0,
      missingFields
    }
  }, [])

  const getFieldMapping = useCallback((
    fromType: ClientType,
    toType: ClientType
  ): Record<string, string> => {
    // Define field mappings between client types
    const mappings: Record<string, Record<string, string>> = {
      'PERSONAL->FAMILY_EMPLOYEE': {
        'mobileNumber': 'phoneNumber',
        'birthDate': 'dateOfBirth',
      },
      'FAMILY_EMPLOYEE->PERSONAL': {
        'phoneNumber': 'mobileNumber',
        'dateOfBirth': 'birthDate',
        'whatsappNumber': 'mobileNumber', // fallback
      },
      'PERSONAL->CORPORATE': {
        'firstName': 'companyName', // might need manual adjustment
      },
      'CORPORATE->PERSONAL': {
        'companyName': 'firstName', // might need manual adjustment
      }
    }

    const key = `${fromType}->${toType}`
    return mappings[key] || {}
  }, [])

  return {
    validateClientData,
    canConvertClientType,
    getFieldMapping,
  }
}