'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowLeft, Shield, FileText, AlertCircle } from 'lucide-react';
import { CreatePolicyInstanceRequest, InsuranceType } from '@/types';
import { formatCurrencyInput, parseCurrency } from '@/utils/currencyUtils';
import { useToastNotifications } from '@/hooks/useToastNotifications';
import { usePolicyTemplateRefresh } from '@/utils/dashboardRefresh';

interface PolicyTemplateSearchModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

interface PolicyTemplateSearchResult {
  id: string;
  policyNumber: string;
  policyType: InsuranceType;
  provider: string;
  description?: string;
  instanceCount: number;
}

interface InstanceFormData {
  premiumAmount: number;
  startDate: string;
  durationMonths: number;
  commissionAmount: number;
}

const durationOptions = [
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
  { value: 18, label: '18 months' },
  { value: 24, label: '2 years' },
  { value: 36, label: '3 years' },
  { value: 48, label: '4 years' },
  { value: 60, label: '5 years' }
];

export function PolicyTemplateSearchModal({
  open,
  onClose,
  clientId,
  clientName,
  onSuccess
}: PolicyTemplateSearchModalProps) {
  const { showSuccess } = useToastNotifications();
  const { refreshAfterPolicyInstanceOperation } = usePolicyTemplateRefresh();
  
  // Search phase state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PolicyTemplateSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplateSearchResult | null>(null);
  
  // Instance creation form state
  const [formData, setFormData] = useState<InstanceFormData>({
    premiumAmount: 0,
    startDate: '',
    durationMonths: 12,
    commissionAmount: 0
  });
  
  const [displayValues, setDisplayValues] = useState({
    premiumAmount: '',
    commissionAmount: ''
  });
  
  const [calculatedExpiryDate, setCalculatedExpiryDate] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedTemplate(null);
      setFormData({
        premiumAmount: 0,
        startDate: '',
        durationMonths: 12,
        commissionAmount: 0
      });
      setDisplayValues({
        premiumAmount: '',
        commissionAmount: ''
      });
      setCalculatedExpiryDate(null);
      setErrors({});
      setApiError(null);
      setSearchError(null);
    }
  }, [open]);

  const calculateExpiryDate = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/policy-instances/calculate-expiry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: formData.startDate,
          durationMonths: formData.durationMonths
        }),
      });

      const result = await response.json();
      if (result.success && result.data?.expiryDate) {
        setCalculatedExpiryDate(result.data.expiryDate);
      } else {
        setCalculatedExpiryDate(null);
      }
    } catch (error) {
      console.error('Error calculating expiry date:', error);
      setCalculatedExpiryDate(null);
    }
  }, [formData.startDate, formData.durationMonths]);

  // Calculate expiry date when start date or duration changes
  useEffect(() => {
    if (formData.startDate && formData.durationMonths) {
      calculateExpiryDate();
    } else {
      setCalculatedExpiryDate(null);
    }
  }, [formData.startDate, formData.durationMonths, calculateExpiryDate]);

  const searchTemplates = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        q: query.trim(),
        excludeClientId: clientId // Exclude templates already associated with this client
      });

      const response = await fetch(`/api/policy-templates/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search policy templates');
      }

      const result = await response.json();
      if (result.success) {
        setSearchResults(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to search policy templates');
      }
    } catch (error) {
      console.error('Error searching templates:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search policy templates');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [clientId]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchTemplates(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchTemplates]);

  const handleTemplateSelect = (template: PolicyTemplateSearchResult) => {
    setSelectedTemplate(template);
    setApiError(null);
    setErrors({});
  };

  const handleBackToSearch = () => {
    setSelectedTemplate(null);
    setApiError(null);
    setErrors({});
  };

  const handleInputChange = (field: keyof InstanceFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCurrencyChange = (field: 'premiumAmount' | 'commissionAmount', value: string) => {
    const formattedValue = formatCurrencyInput(value);
    setDisplayValues(prev => ({ ...prev, [field]: formattedValue }));
    
    // Update the actual numeric value
    const numericValue = parseCurrency(formattedValue);
    if (!isNaN(numericValue)) {
      handleInputChange(field, numericValue);
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const validationErrors: Record<string, string> = {};
    
    if (!formData.startDate) {
      validationErrors.startDate = 'Start date is required';
    }
    
    if (formData.premiumAmount <= 0) {
      validationErrors.premiumAmount = 'Premium amount must be greater than 0';
    }
    
    if (formData.commissionAmount <= 0) {
      validationErrors.commissionAmount = 'Commission amount must be greater than 0';
    }
    
    if (!calculatedExpiryDate) {
      validationErrors.duration = 'Unable to calculate expiry date';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate || !validateForm()) {
      return;
    }

    setSubmitting(true);
    setApiError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const requestData: CreatePolicyInstanceRequest = {
        policyTemplateId: selectedTemplate.id,
        premiumAmount: formData.premiumAmount,
        startDate: formData.startDate,
        expiryDate: calculatedExpiryDate!,
        commissionAmount: formData.commissionAmount,
        durationMonths: formData.durationMonths
      };

      const response = await fetch(`/api/clients/${clientId}/policy-instances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create policy instance');
      }

      if (result.success) {
        showSuccess(`Policy ${selectedTemplate.policyNumber} added to ${clientName} successfully`);
        
        // Refresh dashboard statistics
        await refreshAfterPolicyInstanceOperation('create');
        
        onSuccess?.();
        onClose();
      } else {
        throw new Error(result.message || 'Failed to create policy instance');
      }
    } catch (error) {
      console.error('Error creating policy instance:', error);
      
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        // Check for specific validation errors
        if (errorMessage.includes('already has this policy') || 
            errorMessage.includes('duplicate association')) {
          setApiError(`${clientName} already has this policy template. Please select a different template.`);
        } else if (errorMessage.includes('Invalid date') || 
                   errorMessage.includes('start date') || 
                   errorMessage.includes('expiry date')) {
          setErrors(prev => ({ ...prev, startDate: 'Invalid date range' }));
        } else if (errorMessage.includes('Premium') || errorMessage.includes('premium')) {
          setErrors(prev => ({ ...prev, premiumAmount: 'Invalid premium amount' }));
        } else if (errorMessage.includes('Commission') || errorMessage.includes('commission')) {
          setErrors(prev => ({ ...prev, commissionAmount: 'Invalid commission amount' }));
        } else {
          setApiError(errorMessage);
        }
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Add Policy to {clientName}
          </DialogTitle>
        </DialogHeader>

        {!selectedTemplate ? (
          // Template Search Phase
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="search">Search Policy Templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by policy number or provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-600">
                Search for existing policy templates to add to this client
              </p>
            </div>

            {searchError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-800">{searchError}</p>
              </div>
            )}

            {searchLoading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchResults.length > 0 && !searchLoading && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">
                  Found {searchResults.length} policy template{searchResults.length !== 1 ? 's' : ''}
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((template) => (
                    <Card 
                      key={template.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{template.policyNumber}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {template.policyType}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {template.provider}
                            </p>
                            {template.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {template.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-xs">
                              {template.instanceCount} client{template.instanceCount !== 1 ? 's' : ''}
                            </Badge>
                            <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700">
                              Select
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {searchQuery.trim() && !searchLoading && searchResults.length === 0 && !searchError && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600 mb-4">
                  No policy templates match your search criteria.
                </p>
                <p className="text-sm text-gray-500">
                  Try searching with different keywords or create a new policy template first.
                </p>
              </div>
            )}

            {!searchQuery.trim() && (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Search for Policy Templates</h3>
                <p className="text-gray-600">
                  Enter a policy number or provider name to find existing templates
                </p>
              </div>
            )}
          </div>
        ) : (
          // Instance Creation Phase
          <div className="space-y-6">
            {/* Selected Template Display */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-blue-900">{selectedTemplate.policyNumber}</h4>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {selectedTemplate.policyType}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700">
                      {selectedTemplate.provider}
                    </p>
                    {selectedTemplate.description && (
                      <p className="text-sm text-blue-600">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleBackToSearch}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Change Policy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Error Display */}
            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{apiError}</p>
                </div>
                <button
                  type="button"
                  className="text-red-400 hover:text-red-600"
                  onClick={() => setApiError(null)}
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}

            {/* Instance Creation Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={errors.startDate ? 'border-red-500' : ''}
                    required
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-600">{errors.startDate}</p>
                  )}
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="durationMonths">Duration (months) *</Label>
                  <div className="relative">
                    <Input
                      id="durationMonths"
                      type="number"
                      min="1"
                      max="1200" // 100 years in months
                      value={formData.durationMonths}
                      onChange={(e) => handleInputChange('durationMonths', Math.max(1, parseInt(e.target.value) || 1))}
                      className={`${errors.durationMonths ? 'border-red-500' : ''} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      required
                    />
                  </div>
                  {errors.durationMonths && (
                    <p className="text-sm text-red-600">{errors.durationMonths}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Premium Amount */}
                <div className="space-y-2">
                  <Label htmlFor="premium">Premium Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <Input
                      id="premium"
                      type="text"
                      value={displayValues.premiumAmount}
                      onChange={(e) => handleCurrencyChange('premiumAmount', e.target.value)}
                      placeholder="0.00"
                      className={`pl-8 ${errors.premiumAmount ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {errors.premiumAmount && (
                    <p className="text-sm text-red-600">{errors.premiumAmount}</p>
                  )}
                </div>

                {/* Commission Amount */}
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <Input
                      id="commission"
                      type="text"
                      value={displayValues.commissionAmount}
                      onChange={(e) => handleCurrencyChange('commissionAmount', e.target.value)}
                      placeholder="0.00"
                      className={`pl-8 ${errors.commissionAmount ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {errors.commissionAmount && (
                    <p className="text-sm text-red-600">{errors.commissionAmount}</p>
                  )}
                </div>
              </div>

              {/* Calculated Expiry Date Display */}
              {calculatedExpiryDate && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Calculated Expiry Date
                      </p>
                      <p className="text-sm text-green-700">
                        {formatDate(calculatedExpiryDate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !calculatedExpiryDate}
                >
                  {submitting ? 'Adding Policy...' : 'Add Policy'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}