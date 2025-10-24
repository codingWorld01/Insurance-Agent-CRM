"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PolicyInstanceWithClient, UpdatePolicyInstanceRequest } from '@/types';
import { AlertCircle, Calendar, DollarSign, Loader2, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';

interface PolicyInstanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpdatePolicyInstanceRequest) => Promise<void>;
  instance: PolicyInstanceWithClient | null;
  loading?: boolean;
}

const statusOptions = [
  { value: 'Active', label: 'Active', description: 'Policy is currently active' },
  { value: 'Expired', label: 'Expired', description: 'Policy has expired' },
  { value: 'Cancelled', label: 'Cancelled', description: 'Policy has been cancelled' },
];

const durationOptions = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
  { value: 18, label: '18 months' },
  { value: 24, label: '2 years' },
  { value: 36, label: '3 years' },
  { value: 48, label: '4 years' },
  { value: 60, label: '5 years' },
];

export function PolicyInstanceModal({ 
  open, 
  onClose, 
  onSubmit, 
  instance, 
  loading = false 
}: PolicyInstanceModalProps) {
  const [formData, setFormData] = useState<UpdatePolicyInstanceRequest & {
    premiumAmount: number;
    commissionAmount: number;
    startDate: string;
    status: 'Active' | 'Expired' | 'Cancelled';
  }>({
    premiumAmount: 0,
    startDate: '',
    commissionAmount: 0,
    status: 'Active'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [calculatedExpiryDate, setCalculatedExpiryDate] = useState<string>('');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [useCustomExpiry, setUseCustomExpiry] = useState(false);

  // Calculate expiry date from start date and duration
  const calculateExpiryDate = useCallback((startDate: string, months: number): string => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + months);
    
    return expiry.toISOString().split('T')[0];
  }, []);

  // Update calculated expiry date when start date or duration changes
  useEffect(() => {
    if (formData.startDate && durationMonths && !useCustomExpiry) {
      const newExpiryDate = calculateExpiryDate(formData.startDate, durationMonths);
      setCalculatedExpiryDate(newExpiryDate);
      setFormData(prev => ({ ...prev, expiryDate: newExpiryDate }));
    }
  }, [formData.startDate, durationMonths, useCustomExpiry, calculateExpiryDate]);

  // Calculate duration from existing dates when modal opens
  const calculateDurationFromDates = useCallback((startDate: string, expiryDate: string): number => {
    if (!startDate || !expiryDate) return 12;
    
    const start = new Date(startDate);
    const end = new Date(expiryDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.round(diffDays / 30.44); // Average days per month
    
    // Find the closest duration option
    const closestDuration = durationOptions.reduce((prev, curr) => 
      Math.abs(curr.value - months) < Math.abs(prev.value - months) ? curr : prev
    );
    
    return closestDuration.value;
  }, []);

  // Reset form when modal opens/closes or instance changes
  useEffect(() => {
    if (open && instance) {
      const calculatedDuration = calculateDurationFromDates(instance.startDate, instance.expiryDate);
      const calculatedExpiry = calculateExpiryDate(instance.startDate, calculatedDuration);
      
      // Check if the existing expiry date matches the calculated one (within 1 day tolerance)
      const existingExpiry = new Date(instance.expiryDate);
      const calculatedExpiryObj = new Date(calculatedExpiry);
      const daysDiff = Math.abs(existingExpiry.getTime() - calculatedExpiryObj.getTime()) / (1000 * 60 * 60 * 24);
      const isCustomExpiry = daysDiff > 1;
      
      setFormData({
        premiumAmount: instance.premiumAmount,
        startDate: instance.startDate.split('T')[0],
        expiryDate: instance.expiryDate.split('T')[0],
        commissionAmount: instance.commissionAmount,
        status: instance.status
      });
      
      setDurationMonths(calculatedDuration);
      setUseCustomExpiry(isCustomExpiry);
      setCalculatedExpiryDate(isCustomExpiry ? '' : calculatedExpiry);
      setErrors({});
    } else if (open && !instance) {
      // Reset for new instance (shouldn't happen in this modal, but good to have)
      setFormData({
        premiumAmount: 0,
        startDate: '',
        commissionAmount: 0,
        status: 'Active'
      });
      setDurationMonths(12);
      setUseCustomExpiry(false);
      setCalculatedExpiryDate('');
      setErrors({});
    }
  }, [open, instance, calculateDurationFromDates, calculateExpiryDate]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Start date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Allow past dates but warn if too far in the past
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (startDate < oneYearAgo) {
        newErrors.startDate = 'Start date seems unusually old. Please verify.';
      }
    }

    // Expiry date validation
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const expiryDate = new Date(formData.expiryDate);
      
      if (expiryDate <= startDate) {
        newErrors.expiryDate = 'Expiry date must be after start date';
      }
      
      // Check for reasonable duration (not more than 10 years)
      const maxExpiry = new Date(startDate);
      maxExpiry.setFullYear(maxExpiry.getFullYear() + 10);
      
      if (expiryDate > maxExpiry) {
        newErrors.expiryDate = 'Expiry date cannot be more than 10 years from start date';
      }
    }

    // Premium amount validation
    if (formData.premiumAmount === undefined || formData.premiumAmount === null || isNaN(formData.premiumAmount)) {
      newErrors.premiumAmount = 'Premium amount is required';
    } else if (formData.premiumAmount <= 0) {
      newErrors.premiumAmount = 'Premium amount must be greater than 0';
    } else if (formData.premiumAmount > 1000000) {
      newErrors.premiumAmount = 'Premium amount seems unusually high. Please verify.';
    }

    // Commission amount validation
    if (formData.commissionAmount === undefined || formData.commissionAmount === null || isNaN(formData.commissionAmount)) {
      newErrors.commissionAmount = 'Commission amount is required';
    } else if (formData.commissionAmount < 0) {
      newErrors.commissionAmount = 'Commission amount cannot be negative';
    } else if (formData.commissionAmount > formData.premiumAmount) {
      newErrors.commissionAmount = 'Commission cannot be greater than premium amount';
    }

    // Status validation
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        premiumAmount: formData.premiumAmount,
        startDate: formData.startDate,
        expiryDate: formData.expiryDate,
        commissionAmount: formData.commissionAmount,
        status: formData.status
      });
      onClose();
    } catch (error) {
      console.error('Error updating policy instance:', error);
      // Error handling is done in the parent component
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input change
  const handleInputChange = (field: keyof UpdatePolicyInstanceRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle duration change
  const handleDurationChange = (months: number) => {
    setDurationMonths(months);
    setUseCustomExpiry(false);
    
    if (formData.startDate) {
      const newExpiryDate = calculateExpiryDate(formData.startDate, months);
      setCalculatedExpiryDate(newExpiryDate);
      setFormData(prev => ({ ...prev, expiryDate: newExpiryDate }));
    }
  };

  // Handle custom expiry toggle
  const handleCustomExpiryToggle = () => {
    setUseCustomExpiry(!useCustomExpiry);
    
    if (!useCustomExpiry && formData.startDate) {
      // Switching to custom, keep current expiry date
      setCalculatedExpiryDate('');
    } else {
      // Switching to duration-based, recalculate
      const newExpiryDate = calculateExpiryDate(formData.startDate, durationMonths);
      setCalculatedExpiryDate(newExpiryDate);
      setFormData(prev => ({ ...prev, expiryDate: newExpiryDate }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!instance) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Policy Instance</DialogTitle>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Client:</strong> {instance.client.name}
            </p>
            <p>
              <strong>Policy:</strong> {instance.policyTemplate?.policyNumber || 'Unknown Policy'}
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <div className="relative">
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
                disabled={submitting || loading}
                required
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.startDate && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.startDate}
              </p>
            )}
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Duration</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCustomExpiryToggle}
                className="text-xs"
              >
                {useCustomExpiry ? 'Use Duration' : 'Set Custom Date'}
              </Button>
            </div>
            
            {!useCustomExpiry && (
              <Select
                value={durationMonths.toString()}
                onValueChange={(value) => handleDurationChange(parseInt(value))}
                disabled={submitting || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date *</Label>
            <div className="relative">
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                className={errors.expiryDate ? 'border-red-500' : ''}
                disabled={submitting || loading || !useCustomExpiry}
                required
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.expiryDate && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.expiryDate}
              </p>
            )}
            {!useCustomExpiry && calculatedExpiryDate && (
              <p className="text-sm text-blue-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Calculated: {formatDate(calculatedExpiryDate)}
              </p>
            )}
          </div>

          {/* Premium Amount */}
          <div className="space-y-2">
            <Label htmlFor="premiumAmount">Premium Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="premiumAmount"
                type="number"
                step="0.01"
                min="0"
                max="1000000"
                value={formData.premiumAmount || ''}
                onChange={(e) => handleInputChange('premiumAmount', parseFloat(e.target.value) || 0)}
                className={`pl-10 ${errors.premiumAmount ? 'border-red-500' : ''}`}
                placeholder="0.00"
                disabled={submitting || loading}
                required
              />
            </div>
            {errors.premiumAmount && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.premiumAmount}
              </p>
            )}
            {formData.premiumAmount > 0 && !isNaN(formData.premiumAmount) && (
              <p className="text-sm text-gray-500">
                Formatted: {formatCurrency(formData.premiumAmount)}
              </p>
            )}
          </div>

          {/* Commission Amount */}
          <div className="space-y-2">
            <Label htmlFor="commissionAmount">Commission Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="commissionAmount"
                type="number"
                step="0.01"
                min="0"
                max={formData.premiumAmount || 1000000}
                value={formData.commissionAmount || ''}
                onChange={(e) => handleInputChange('commissionAmount', parseFloat(e.target.value) || 0)}
                className={`pl-10 ${errors.commissionAmount ? 'border-red-500' : ''}`}
                placeholder="0.00"
                disabled={submitting || loading}
                required
              />
            </div>
            {errors.commissionAmount && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.commissionAmount}
              </p>
            )}
            {formData.commissionAmount > 0 && !isNaN(formData.commissionAmount) && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Formatted: {formatCurrency(formData.commissionAmount)}</span>
                {formData.premiumAmount > 0 && !isNaN(formData.premiumAmount) && (
                  <span>
                    {((formData.commissionAmount / formData.premiumAmount) * 100).toFixed(1)}% of premium
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              disabled={submitting || loading}
            >
              <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.status}
              </p>
            )}
          </div>

          {/* Summary */}
          {formData.startDate && formData.expiryDate && formData.premiumAmount > 0 && !isNaN(formData.premiumAmount) && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Policy Period:</span>
                  <p className="font-medium">
                    {formatDate(formData.startDate)} - {formatDate(formData.expiryDate)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <p className="font-medium">
                    {Math.ceil((new Date(formData.expiryDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Total Premium:</span>
                  <p className="font-medium">{formatCurrency(formData.premiumAmount || 0)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total Commission:</span>
                  <p className="font-medium">{formatCurrency(formData.commissionAmount || 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
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
              disabled={submitting || loading}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Policy Instance'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}