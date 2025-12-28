"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreatePolicyTemplateRequest, PolicyTemplateWithStats, InsuranceType } from '@/types';
import { Shield, Heart, Car, Home, Building2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface PolicyTemplateCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePolicyTemplateRequest) => Promise<void>;
  template?: PolicyTemplateWithStats | null;
  loading?: boolean;
}

const policyTypeOptions = [
  { value: 'Life' as InsuranceType, label: 'Life Insurance', icon: Heart },
  { value: 'Health' as InsuranceType, label: 'Health Insurance', icon: Shield },
  { value: 'Auto' as InsuranceType, label: 'Auto Insurance', icon: Car },
  { value: 'Home' as InsuranceType, label: 'Home Insurance', icon: Home },
  { value: 'Business' as InsuranceType, label: 'Business Insurance', icon: Building2 },
];

export function PolicyTemplateCreateModal({ 
  open, 
  onClose, 
  onSubmit, 
  template = null, 
  loading = false 
}: PolicyTemplateCreateModalProps) {
  const [formData, setFormData] = useState<CreatePolicyTemplateRequest>({
    policyNumber: '',
    policyType: 'Life',
    provider: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [policyNumberValidation, setPolicyNumberValidation] = useState<{
    isChecking: boolean;
    isValid: boolean | null;
    message: string;
  }>({
    isChecking: false,
    isValid: null,
    message: ''
  });

  const isEditing = !!template;

  // Debounced policy number validation
  const validatePolicyNumberUniqueness = useCallback(
    async (policyNumber: string) => {
      if (!policyNumber.trim() || policyNumber.length < 3) {
        setPolicyNumberValidation({
          isChecking: false,
          isValid: null,
          message: ''
        });
        return;
      }

      // Skip validation if editing and policy number hasn't changed
      if (isEditing && template && policyNumber === template.policyNumber) {
        setPolicyNumberValidation({
          isChecking: false,
          isValid: true,
          message: 'Current policy number'
        });
        return;
      }

      setPolicyNumberValidation(prev => ({
        ...prev,
        isChecking: true
      }));

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/policy-templates/search?q=${encodeURIComponent(policyNumber)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const exactMatch = result.data.find((t: { policyNumber: string }) => 
              t.policyNumber.toLowerCase() === policyNumber.toLowerCase()
            );
            
            if (exactMatch) {
              setPolicyNumberValidation({
                isChecking: false,
                isValid: false,
                message: 'Policy number already exists'
              });
            } else {
              setPolicyNumberValidation({
                isChecking: false,
                isValid: true,
                message: 'Policy number is available'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error validating policy number:', error);
        setPolicyNumberValidation({
          isChecking: false,
          isValid: null,
          message: 'Unable to validate policy number'
        });
      }
    },
    [isEditing, template]
  );

  // Debounce policy number validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.policyNumber) {
        validatePolicyNumberUniqueness(formData.policyNumber);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.policyNumber, validatePolicyNumberUniqueness]);

  // Reset form when modal opens/closes or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        setFormData({
          policyNumber: template.policyNumber,
          policyType: template.policyType,
          provider: template.provider,
          description: template.description || ''
        });
      } else {
        setFormData({
          policyNumber: '',
          policyType: 'Life',
          provider: '',
          description: ''
        });
      }
      setErrors({});
      setPolicyNumberValidation({
        isChecking: false,
        isValid: null,
        message: ''
      });
    }
  }, [open, template]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Policy number validation
    if (!formData.policyNumber.trim()) {
      newErrors.policyNumber = 'Policy number is required';
    } else if (formData.policyNumber.length < 3) {
      newErrors.policyNumber = 'Policy number must be at least 3 characters';
    } else if (formData.policyNumber.length > 50) {
      newErrors.policyNumber = 'Policy number must be less than 50 characters';
    } else if (!/^[A-Za-z0-9\-_]+$/.test(formData.policyNumber)) {
      newErrors.policyNumber = 'Policy number can only contain letters, numbers, hyphens, and underscores';
    } else if (policyNumberValidation.isValid === false) {
      newErrors.policyNumber = 'Policy number already exists';
    }

    // Policy type validation
    if (!formData.policyType) {
      newErrors.policyType = 'Policy type is required';
    }

    // Provider validation
    if (!formData.provider.trim()) {
      newErrors.provider = 'Provider is required';
    } else if (formData.provider.length < 2) {
      newErrors.provider = 'Provider name must be at least 2 characters';
    } else if (formData.provider.length > 100) {
      newErrors.provider = 'Provider name must be less than 100 characters';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Wait for any pending policy number validation
    if (policyNumberValidation.isChecking) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    // Final check for policy number uniqueness
    if (!isEditing && policyNumberValidation.isValid !== true) {
      setErrors(prev => ({
        ...prev,
        policyNumber: 'Please wait for policy number validation to complete'
      }));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        policyNumber: formData.policyNumber.trim(),
        policyType: formData.policyType,
        provider: formData.provider.trim(),
        description: formData.description?.trim() || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error saving policy template:', error);
      // Check if it's a validation error from the backend
      if (error instanceof Error && error.message.includes('already exists')) {
        setErrors(prev => ({
          ...prev,
          policyNumber: 'Policy number already exists'
        }));
        setPolicyNumberValidation({
          isChecking: false,
          isValid: false,
          message: 'Policy number already exists'
        });
      }
      // Other error handling is done in the parent component
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input change
  const handleInputChange = (field: keyof CreatePolicyTemplateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Reset policy number validation when policy number changes
    if (field === 'policyNumber') {
      setPolicyNumberValidation({
        isChecking: false,
        isValid: null,
        message: ''
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isEditing ? 'Edit Policy Template' : 'Create Policy Template'}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {isEditing 
              ? 'Update the policy template information. Changes will affect all associated client policies.'
              : 'Create a new policy template that can be used to add policies to multiple clients.'
            }
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Policy Number */}
            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <div className="relative">
                <Input
                  id="policyNumber"
                  value={formData.policyNumber}
                  onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                  placeholder="e.g., POL-2024-001"
                  className={`pr-10 ${
                    errors.policyNumber 
                      ? 'border-red-500' 
                      : policyNumberValidation.isValid === true 
                        ? 'border-green-500' 
                        : policyNumberValidation.isValid === false 
                          ? 'border-red-500' 
                          : ''
                  }`}
                  disabled={submitting || loading}
                  required
                  maxLength={50}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {policyNumberValidation.isChecking && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {!policyNumberValidation.isChecking && policyNumberValidation.isValid === true && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {!policyNumberValidation.isChecking && policyNumberValidation.isValid === false && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              {errors.policyNumber && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.policyNumber}
                </p>
              )}
              {!errors.policyNumber && policyNumberValidation.message && (
                <p className={`text-sm flex items-center gap-1 ${
                  policyNumberValidation.isValid === true 
                    ? 'text-green-600' 
                    : policyNumberValidation.isValid === false 
                      ? 'text-red-600' 
                      : 'text-gray-500'
                }`}>
                  {policyNumberValidation.isValid === true && <CheckCircle2 className="h-3 w-3" />}
                  {policyNumberValidation.isValid === false && <AlertCircle className="h-3 w-3" />}
                  {policyNumberValidation.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Only letters, numbers, hyphens, and underscores allowed (3-50 characters)
              </p>
            </div>

            {/* Policy Type */}
            <div className="space-y-2">
              <Label htmlFor="policyType">Policy Type *</Label>
              <Select
                value={formData.policyType}
                onValueChange={(value) => handleInputChange('policyType', value)}
                disabled={submitting || loading}
              >
                <SelectTrigger className={errors.policyType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select policy type" />
                </SelectTrigger>
                <SelectContent>
                  {policyTypeOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.policyType && (
                <p className="text-sm text-red-600">{errors.policyType}</p>
              )}
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => handleInputChange('provider', e.target.value)}
                placeholder="e.g., State Farm, Allstate, Progressive"
                className={errors.provider ? 'border-red-500' : ''}
                disabled={submitting || loading}
                required
                maxLength={100}
              />
              {errors.provider && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.provider}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formData.provider.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional description of the policy template (e.g., coverage details, special features, target audience)..."
                className={errors.description ? 'border-red-500' : ''}
                disabled={submitting || loading}
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
                <p className={`text-xs ml-auto ${
                  (formData.description?.length || 0) > 450 
                    ? 'text-amber-600' 
                    : (formData.description?.length || 0) > 400 
                      ? 'text-yellow-600' 
                      : 'text-gray-500'
                }`}>
                  {formData.description?.length || 0}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting || loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting || 
                loading || 
                policyNumberValidation.isChecking ||
                (!isEditing && policyNumberValidation.isValid !== true && formData.policyNumber.length >= 3)
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Template' : 'Create Template'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}