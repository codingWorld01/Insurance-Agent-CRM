"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addMonths, differenceInDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PolicyInstanceWithTemplate, UpdatePolicyInstanceRequest } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, DollarSign, Loader2 } from 'lucide-react';
import Link from 'next/link';

type PolicyStatus = 'Active' | 'Expired';

interface PolicyInstanceEditModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpdatePolicyInstanceRequest) => Promise<void>;
  instance: PolicyInstanceWithTemplate | null;
  loading?: boolean;
}

const PolicyInstanceEditModal = ({ open, onClose, onSubmit, instance, loading = false }: PolicyInstanceEditModalProps) => {
  const [formData, setFormData] = useState<UpdatePolicyInstanceRequest & {
    premiumAmount: number;
    commissionAmount: number;
    startDate: string;
    status: PolicyStatus;
    durationMonths: number;
  }>({
    premiumAmount: 0,
    startDate: '',
    commissionAmount: 0,
    status: 'Active',
    durationMonths: 12
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [calculatedExpiryDate, setCalculatedExpiryDate] = useState<string>('');
  const [useCustomExpiry, setUseCustomExpiry] = useState(false);

  // Calculate duration in months between two dates
  const calculateDurationFromDates = useCallback((startDate: string, expiryDate: string): number => {
    if (!startDate || !expiryDate) return 12;
    
    try {
      const start = new Date(startDate);
      const end = new Date(expiryDate);
      // Add 1 day to make it inclusive of the end date
      end.setDate(end.getDate() + 1);
      
      // Calculate months difference
      const yearDiff = end.getFullYear() - start.getFullYear();
      const monthDiff = end.getMonth() - start.getMonth();
      return yearDiff * 12 + monthDiff;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 12;
    }
  }, []);

  // Calculate expiry date from start date and duration
  const calculateExpiryDate = useCallback((startDate: string, months: number): string => {
    if (!startDate) return '';
    
    try {
      const date = new Date(startDate);
      if (isNaN(date.getTime())) return '';
      
      const expiryDate = addMonths(date, months);
      // Subtract one day to make it inclusive of the last day
      expiryDate.setDate(expiryDate.getDate() - 1);
      return format(expiryDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error calculating expiry date:', error);
      return '';
    }
  }, []);

  // Calculate duration in days for display
  const durationInDays = useMemo(() => {
    if (!formData.startDate || !calculatedExpiryDate) return 0;
    try {
      const start = parseISO(formData.startDate);
      const end = parseISO(calculatedExpiryDate);
      return differenceInDays(end, start) + 1; // +1 to include both start and end dates
    } catch (error) {
      return 0;
    }
  }, [formData.startDate, calculatedExpiryDate]);

  // Format duration for display (e.g., "1 year 3 months" or "6 months")
  const formatDuration = (months: number): string => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0 && remainingMonths > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''} (${months} months)`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} (${months} months)`;
    } else {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  };

  // Update calculated expiry date when start date or duration changes
  useEffect(() => {
    if (formData.startDate) {
      if (!useCustomExpiry && formData.durationMonths) {
        const newExpiryDate = calculateExpiryDate(formData.startDate, formData.durationMonths);
        setCalculatedExpiryDate(newExpiryDate);
        setFormData(prev => ({ ...prev, expiryDate: newExpiryDate }));
      } else if (useCustomExpiry && formData.expiryDate) {
        // Calculate and update duration when in custom date mode and expiry date changes
        const duration = calculateDurationFromDates(formData.startDate, formData.expiryDate);
        setFormData(prev => ({ ...prev, durationMonths: duration }));
      }
    }
  }, [formData.startDate, useCustomExpiry, formData.durationMonths, formData.expiryDate]);

  // Reset form when modal opens or instance changes
  useEffect(() => {
    if (instance) {
      const startDate = instance.startDate ? format(new Date(instance.startDate), 'yyyy-MM-dd') : '';
      const expiryDate = instance.expiryDate ? format(new Date(instance.expiryDate), 'yyyy-MM-dd') : '';
      
      // Calculate duration in months if we have both dates
      let durationMonths = 12; // default
      if (instance.startDate && instance.expiryDate) {
        durationMonths = calculateDurationFromDates(instance.startDate, instance.expiryDate);
        
        // Ensure minimum 1 month duration
        durationMonths = Math.max(1, durationMonths);
      }
      
      // Ensure status is one of the allowed values, default to 'Active' if not
      const status: PolicyStatus = ['Active', 'Expired'].includes(instance.status || '')
        ? instance.status as PolicyStatus
        : 'Active';
      
      setFormData({
        premiumAmount: instance.premiumAmount || 0,
        commissionAmount: instance.commissionAmount || 0,
        startDate,
        status,
        expiryDate,
        durationMonths
      });
      
      if (startDate) {
        const calculatedExpiry = calculateExpiryDate(startDate, durationMonths);
        setCalculatedExpiryDate(calculatedExpiry);
      }
    }
  }, [instance, calculateDurationFromDates, calculateExpiryDate]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Start date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
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

    // Duration validation
    if (formData.durationMonths <= 0) {
      newErrors.duration = 'Duration must be at least 1 month';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    // Calculate expiry date if not using custom date
    const expiryDate = useCustomExpiry 
      ? formData.expiryDate 
      : calculateExpiryDate(formData.startDate, formData.durationMonths);
    
    // Ensure status is properly typed
    const status: PolicyStatus = formData.status || 'Active';
    
    // Prepare the data to submit
    const submitData: UpdatePolicyInstanceRequest = {
      ...formData,
      expiryDate,
      status,
    };
    
    onSubmit(submitData);
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev, 
      [name]: value,
      // If we're changing the expiry date in custom mode, update the duration
      ...(name === 'expiryDate' && useCustomExpiry && formData.startDate && {
        durationMonths: calculateDurationFromDates(formData.startDate, value)
      })
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle duration change
  const handleDurationChange = (months: number) => {
    setFormData(prev => {
      const newDuration = Math.max(1, Math.min(120, months)); // Ensure between 1-120 months
      let newExpiryDate = '';
      
      if (formData.startDate) {
        newExpiryDate = calculateExpiryDate(formData.startDate, newDuration);
      }
      
      return {
        ...prev,
        durationMonths: newDuration,
        expiryDate: newExpiryDate
      };
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
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <strong>Policy Template:</strong> 
              <span>{instance.policyTemplate?.policyNumber || 'Unknown Policy'}</span>
              {instance.policyTemplate && (
                <>
                  <Badge variant="secondary" className="text-xs">
                    {instance.policyTemplate.policyType}
                  </Badge>
                  <Link
                    href={`/dashboard/policy-templates/${instance.policyTemplate.id}`}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="text-xs">View Template</span>
                  </Link>
                </>
              )}
            </div>
            {instance.policyTemplate?.provider && (
              <div className="flex items-center gap-2">
                <strong>Provider:</strong> 
                <span>{instance.policyTemplate.provider}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              className={errors.startDate ? 'border-red-500' : ''}
            />
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="duration">Duration (months)</Label>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="custom-expiry" 
                  checked={useCustomExpiry} 
                  onCheckedChange={setUseCustomExpiry} 
                />
                <Label htmlFor="custom-expiry">Set Custom Date</Label>
              </div>
            </div>
            
            {!useCustomExpiry ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    id="duration"
                    name="durationMonths"
                    min="1"
                    max="120"
                    value={formData.durationMonths}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                  <span>months</span>
                </div>
                <Slider
                  value={[formData.durationMonths]}
                  min={1}
                  max={60}
                  step={1}
                  onValueChange={([value]) => handleDurationChange(value)}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1 month</span>
                  <span>12 months</span>
                  <span>24 months</span>
                  <span>36 months</span>
                  <span>48 months</span>
                  <span>60 months</span>
                </div>
                {calculatedExpiryDate && (
                  <p className="text-sm text-muted-foreground">
                    Expiry: {format(new Date(calculatedExpiryDate), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            ) : (
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={formData.expiryDate || ''}
                onChange={handleChange}
                min={formData.startDate}
                className={errors.expiryDate ? 'border-red-500' : ''}
              />
            )}
            {errors.duration && (
              <p className="text-sm text-red-500">{errors.duration}</p>
            )}
            {errors.expiryDate && (
              <p className="text-sm text-red-500">{errors.expiryDate}</p>
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
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  premiumAmount: parseFloat(e.target.value) || 0
                }))}
                className={`pl-10 ${errors.premiumAmount ? 'border-red-500' : ''}`}
                placeholder="0.00"
              />
            </div>
            {errors.premiumAmount && (
              <p className="text-sm text-red-500">{errors.premiumAmount}</p>
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
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  commissionAmount: parseFloat(e.target.value) || 0
                }))}
                className={`pl-10 ${errors.commissionAmount ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.commissionAmount && (
              <p className="text-sm text-red-500">{errors.commissionAmount}</p>
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
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status}</p>
            )}
          </div>

          {/* Summary */}
          {formData.startDate && formData.expiryDate && formData.premiumAmount > 0 && !isNaN(formData.premiumAmount) && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Policy Period:</p>
                  <p className="font-medium">
                    {formData.startDate 
                      ? format(new Date(formData.startDate), 'MMMM d, yyyy')
                      : 'N/A'} 
                    - 
                    {calculatedExpiryDate 
                      ? format(new Date(calculatedExpiryDate), 'MMMM d, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duration:</p>
                  <p className="font-medium">
                    {formatDuration(formData.durationMonths)}
                    <span className="text-muted-foreground ml-2">({durationInDays} days)</span>
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

export { PolicyInstanceEditModal };