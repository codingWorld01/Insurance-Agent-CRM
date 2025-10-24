import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { Policy, CreatePolicyRequest, InsuranceType, Client } from '@/types';
import { validatePolicyForm, formatValidationErrors } from '@/utils/policyValidation';
import { formatCurrencyInput, parseCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePolicyRequest & { clientId?: string }) => Promise<void>;
  policy?: Policy | null;
  loading?: boolean;
  // Global context props
  isGlobalContext?: boolean;
  preselectedClientId?: string;
  preselectedClientName?: string;
}

const insuranceTypes: InsuranceType[] = ['Life', 'Health', 'Auto', 'Home', 'Business'];

export function PolicyModal({ 
  open, 
  onClose, 
  onSubmit, 
  policy, 
  loading = false,
  isGlobalContext = false,
  preselectedClientId,
  preselectedClientName
}: PolicyModalProps) {
  const [formData, setFormData] = useState<CreatePolicyRequest>({
    policyNumber: '',
    policyType: 'Life',
    provider: '',
    premiumAmount: 0,
    startDate: '',
    expiryDate: '',
    commissionAmount: 0
  });

  const [displayValues, setDisplayValues] = useState({
    premiumAmount: '',
    commissionAmount: ''
  });

  // Client selection state for global context
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch clients for global context
  const fetchClients = useCallback(async (search?: string) => {
    if (!isGlobalContext) return;
    
    setClientsLoading(true);
    setClientError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      params.append('limit', '50'); // Limit for dropdown

      const response = await fetch(`/api/clients?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const result = await response.json();
      if (result.success) {
        setClients(result.data?.clients || []);
      } else {
        throw new Error(result.message || 'Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClientError(error instanceof Error ? error.message : 'Failed to fetch clients');
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, [isGlobalContext]);

  // Debounced client search
  useEffect(() => {
    if (!isGlobalContext || !clientSearchOpen) return;
    
    const timeoutId = setTimeout(() => {
      fetchClients(clientSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearchQuery, clientSearchOpen, isGlobalContext, fetchClients]);

  // Reset form when modal opens/closes or policy changes
  useEffect(() => {
    if (open) {
      if (policy) {
        // Edit mode - populate with existing policy data
        setFormData({
          policyNumber: policy.policyNumber,
          policyType: policy.policyType,
          provider: policy.provider,
          premiumAmount: policy.premiumAmount,
          startDate: policy.startDate.split('T')[0], // Convert to YYYY-MM-DD format
          expiryDate: policy.expiryDate.split('T')[0], // Convert to YYYY-MM-DD format
          commissionAmount: policy.commissionAmount
        });
        setDisplayValues({
          premiumAmount: policy.premiumAmount.toString(),
          commissionAmount: policy.commissionAmount.toString()
        });
      } else {
        // Add mode - reset to defaults
        setFormData({
          policyNumber: '',
          policyType: 'Life',
          provider: '',
          premiumAmount: 0,
          startDate: '',
          expiryDate: '',
          commissionAmount: 0
        });
        setDisplayValues({
          premiumAmount: '',
          commissionAmount: ''
        });
      }

      // Handle client selection for global context
      if (isGlobalContext) {
        if (preselectedClientId && preselectedClientName) {
          // Pre-select client if provided
          setSelectedClient({
            id: preselectedClientId,
            name: preselectedClientName,
            email: '',
            phone: '',
            dateOfBirth: '',
            createdAt: '',
            updatedAt: ''
          });
        } else {
          setSelectedClient(null);
        }
        setClientSearchQuery('');
        // Fetch initial clients list
        fetchClients();
      }

      setErrors({});
      setApiError(null);
      setClientError(null);
    }
  }, [open, policy, isGlobalContext, preselectedClientId, preselectedClientName, fetchClients]);

  const validateForm = (): boolean => {
    const validationErrors = validatePolicyForm(formData);
    const formattedErrors = formatValidationErrors(validationErrors);
    
    // Additional client-side validations
    if (!formData.policyNumber.trim()) {
      formattedErrors.policyNumber = 'Policy number is required';
    }
    
    if (!formData.provider.trim()) {
      formattedErrors.provider = 'Provider is required';
    }
    
    if (!formData.startDate) {
      formattedErrors.startDate = 'Start date is required';
    }
    
    if (!formData.expiryDate) {
      formattedErrors.expiryDate = 'Expiry date is required';
    }
    
    if (formData.premiumAmount <= 0) {
      formattedErrors.premiumAmount = 'Premium amount must be greater than 0';
    }
    
    if (formData.commissionAmount <= 0) {
      formattedErrors.commissionAmount = 'Commission amount must be greater than 0';
    }

    // Client validation for global context
    if (isGlobalContext && !selectedClient) {
      formattedErrors.client = 'Please select a client';
    }

    setErrors(formattedErrors);
    setClientError(formattedErrors.client || null);
    return Object.keys(formattedErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setApiError(null);
    setClientError(null);
    
    try {
      const submitData = isGlobalContext && selectedClient 
        ? { ...formData, clientId: selectedClient.id }
        : formData;
      
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      // Handle different types of errors
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        // Check for validation errors that should be displayed inline
        if (errorMessage.includes('Policy number already exists') || 
            errorMessage.includes('duplicate policy number')) {
          setErrors(prev => ({ ...prev, policyNumber: 'This policy number already exists' }));
        } else if (errorMessage.includes('Invalid date range') || 
                   errorMessage.includes('start date') || 
                   errorMessage.includes('expiry date')) {
          setErrors(prev => ({ ...prev, expiryDate: 'Expiry date must be after start date' }));
        } else if (errorMessage.includes('Premium') || errorMessage.includes('premium')) {
          setErrors(prev => ({ ...prev, premiumAmount: 'Invalid premium amount' }));
        } else if (errorMessage.includes('Commission') || errorMessage.includes('commission')) {
          setErrors(prev => ({ ...prev, commissionAmount: 'Invalid commission amount' }));
        } else if (errorMessage.includes('Client not found') || 
                   errorMessage.includes('Invalid client') ||
                   errorMessage.includes('client')) {
          setClientError('Selected client is invalid or no longer exists');
          setSelectedClient(null);
        } else {
          // General API error
          setApiError(errorMessage);
        }
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreatePolicyRequest, value: string | number) => {
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

  const handleDateChange = (field: 'startDate' | 'expiryDate', value: string) => {
    handleInputChange(field, value);
    
    // If both dates are filled, validate the range
    if (field === 'startDate' && formData.expiryDate) {
      const start = new Date(value);
      const expiry = new Date(formData.expiryDate);
      if (start >= expiry) {
        setErrors(prev => ({ ...prev, expiryDate: 'Expiry date must be after start date' }));
      } else {
        setErrors(prev => ({ ...prev, expiryDate: '' }));
      }
    }
    
    if (field === 'expiryDate' && formData.startDate) {
      const start = new Date(formData.startDate);
      const expiry = new Date(value);
      if (start >= expiry) {
        setErrors(prev => ({ ...prev, expiryDate: 'Expiry date must be after start date' }));
      } else {
        setErrors(prev => ({ ...prev, expiryDate: '' }));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle id="policy-modal-title">
            {policy ? 'Edit Policy' : 'Add New Policy'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-labelledby="policy-modal-title">
          {/* API Error Display */}
          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{apiError}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    className="inline-flex text-red-400 hover:text-red-600"
                    onClick={() => setApiError(null)}
                    aria-label="Dismiss error"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Client Selection Field - Only for Global Context */}
          {isGlobalContext && (
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientSearchOpen}
                    className={cn(
                      "w-full justify-between",
                      !selectedClient && "text-muted-foreground",
                      clientError && "border-red-500"
                    )}
                    disabled={clientsLoading}
                  >
                    {selectedClient ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{selectedClient.name}</span>
                        {selectedClient.email && (
                          <span className="text-sm text-muted-foreground">({selectedClient.email})</span>
                        )}
                      </div>
                    ) : (
                      <span>Search and select client...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search clients..."
                      value={clientSearchQuery}
                      onValueChange={setClientSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {clientsLoading ? "Loading clients..." : "No clients found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.id}
                            onSelect={() => {
                              setSelectedClient(client);
                              setClientSearchOpen(false);
                              setClientError(null);
                              if (errors.client) {
                                setErrors(prev => ({ ...prev, client: '' }));
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{client.name}</span>
                              {client.email && (
                                <span className="text-sm text-muted-foreground">{client.email}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {clientError && (
                <p className="text-sm text-red-600" role="alert">
                  {clientError}
                </p>
              )}
            </div>
          )}

          {/* Policy Number Field */}
          <div className="space-y-2">
            <Label htmlFor="policyNumber">Policy Number *</Label>
            <Input
              id="policyNumber"
              value={formData.policyNumber}
              onChange={(e) => handleInputChange('policyNumber', e.target.value)}
              placeholder="Enter policy number"
              className={errors.policyNumber ? 'border-red-500' : ''}
              aria-invalid={!!errors.policyNumber}
              aria-describedby={errors.policyNumber ? 'policy-number-error' : undefined}
              required
            />
            {errors.policyNumber && (
              <p id="policy-number-error" className="text-sm text-red-600" role="alert">
                {errors.policyNumber}
              </p>
            )}
          </div>

          {/* Policy Type Field */}
          <div className="space-y-2">
            <Label htmlFor="policyType">Policy Type *</Label>
            <Select
              value={formData.policyType}
              onValueChange={(value: InsuranceType) => handleInputChange('policyType', value)}
              required
            >
              <SelectTrigger 
                className={errors.policyType ? 'border-red-500' : ''}
                aria-invalid={!!errors.policyType}
                aria-describedby={errors.policyType ? 'policy-type-error' : undefined}
              >
                <SelectValue placeholder="Select policy type" />
              </SelectTrigger>
              <SelectContent>
                {insuranceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.policyType && (
              <p id="policy-type-error" className="text-sm text-red-600" role="alert">
                {errors.policyType}
              </p>
            )}
          </div>

          {/* Provider Field */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider *</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => handleInputChange('provider', e.target.value)}
              placeholder="Enter insurance provider"
              className={errors.provider ? 'border-red-500' : ''}
              aria-invalid={!!errors.provider}
              aria-describedby={errors.provider ? 'provider-error' : undefined}
              required
            />
            {errors.provider && (
              <p id="provider-error" className="text-sm text-red-600" role="alert">
                {errors.provider}
              </p>
            )}
          </div>

          {/* Premium Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="premiumAmount">Premium Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="premiumAmount"
                type="text"
                value={displayValues.premiumAmount}
                onChange={(e) => handleCurrencyChange('premiumAmount', e.target.value)}
                placeholder="0.00"
                className={`pl-8 ${errors.premiumAmount ? 'border-red-500' : ''}`}
                aria-invalid={!!errors.premiumAmount}
                aria-describedby={errors.premiumAmount ? 'premium-error' : undefined}
                required
              />
            </div>
            {errors.premiumAmount && (
              <p id="premium-error" className="text-sm text-red-600" role="alert">
                {errors.premiumAmount}
              </p>
            )}
          </div>

          {/* Commission Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="commissionAmount">Commission Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="commissionAmount"
                type="text"
                value={displayValues.commissionAmount}
                onChange={(e) => handleCurrencyChange('commissionAmount', e.target.value)}
                placeholder="0.00"
                className={`pl-8 ${errors.commissionAmount ? 'border-red-500' : ''}`}
                aria-invalid={!!errors.commissionAmount}
                aria-describedby={errors.commissionAmount ? 'commission-error' : undefined}
                required
              />
            </div>
            {errors.commissionAmount && (
              <p id="commission-error" className="text-sm text-red-600" role="alert">
                {errors.commissionAmount}
              </p>
            )}
          </div>

          {/* Date Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date Field */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
                aria-invalid={!!errors.startDate}
                aria-describedby={errors.startDate ? 'start-date-error' : undefined}
                required
              />
              {errors.startDate && (
                <p id="start-date-error" className="text-sm text-red-600" role="alert">
                  {errors.startDate}
                </p>
              )}
            </div>

            {/* Expiry Date Field */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleDateChange('expiryDate', e.target.value)}
                className={errors.expiryDate ? 'border-red-500' : ''}
                aria-invalid={!!errors.expiryDate}
                aria-describedby={errors.expiryDate ? 'expiry-date-error' : undefined}
                required
              />
              {errors.expiryDate && (
                <p id="expiry-date-error" className="text-sm text-red-600" role="alert">
                  {errors.expiryDate}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
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
              {submitting ? 'Saving...' : (policy ? 'Update Policy' : 'Create Policy')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}