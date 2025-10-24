import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchInput } from '@/components/common/SearchInput';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PolicyTemplate, CreatePolicyInstanceRequest } from '@/types';
import { Search } from 'lucide-react';

interface PolicyTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePolicyInstanceRequest) => Promise<void>;
  clientId: string;
  clientName: string;
  loading?: boolean;
}

export function PolicyTemplateModal({ 
  open, 
  onClose, 
  onSubmit, 
  clientId, 
  clientName, 
  loading = false 
}: PolicyTemplateModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [policyTemplates, setPolicyTemplates] = useState<PolicyTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate | null>(null);
  const [formData, setFormData] = useState<CreatePolicyInstanceRequest>({
    policyTemplateId: '',
    premiumAmount: 0,
    startDate: '',
    expiryDate: '',
    commissionAmount: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSelectedTemplate(null);
      setFormData({
        policyTemplateId: '',
        premiumAmount: 0,
        startDate: '',
        expiryDate: '',
        commissionAmount: 0
      });
      setErrors({});
    }
  }, [open]);

  // Search for policy templates
  const searchPolicyTemplates = async (query: string) => {
    if (!query.trim()) {
      setPolicyTemplates([]);
      return;
    }

    setSearchLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/policy-templates/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPolicyTemplates(result.data);
        }
      }
    } catch (error) {
      console.error('Error searching policy templates:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    searchPolicyTemplates(value);
  };

  // Select a policy template
  const handleTemplateSelect = (template: PolicyTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      policyTemplateId: template.id
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedTemplate) {
      newErrors.template = 'Please select a policy template';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (formData.startDate && new Date(formData.expiryDate) <= new Date(formData.startDate)) {
      newErrors.expiryDate = 'Expiry date must be after start date';
    }

    if (formData.premiumAmount <= 0) {
      newErrors.premiumAmount = 'Premium amount must be greater than 0';
    }

    if (formData.commissionAmount < 0) {
      newErrors.commissionAmount = 'Commission amount cannot be negative';
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
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error creating policy instance:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input change
  const handleInputChange = (field: keyof CreatePolicyInstanceRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Policy for {clientName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Policy Template Search */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Policy by Number or Provider</Label>
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by policy number or provider name..."
                className="w-full"
              />
              {errors.template && (
                <p className="text-sm text-red-600">{errors.template}</p>
              )}
            </div>

            {/* Search Results */}
            {searchLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Searching policies...</p>
              </div>
            )}

            {policyTemplates.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <Label className="text-sm font-medium">Available Policies</Label>
                {policyTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium">{template.policyNumber}</div>
                          <div className="text-sm text-gray-600">{template.provider}</div>
                          <Badge variant="outline" className="text-xs">
                            {template.policyType}
                          </Badge>
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <div className="text-blue-600">
                            <Search className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-xs text-gray-500 mt-2">{template.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchTerm && !searchLoading && policyTemplates.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No policies found matching &quot;{searchTerm}&quot;</p>
                <p className="text-sm">Try searching by policy number or provider name</p>
              </div>
            )}
          </div>

          {/* Policy Instance Details */}
          {selectedTemplate && (
            <div className="space-y-4 border-t pt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900">Selected Policy</h4>
                <p className="text-sm text-blue-700">{selectedTemplate.policyNumber} - {selectedTemplate.provider}</p>
                <Badge variant="outline" className="mt-1">{selectedTemplate.policyType}</Badge>
              </div>

              {/* Duration */}
              <div className="grid grid-cols-2 gap-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className={errors.expiryDate ? 'border-red-500' : ''}
                    required
                  />
                  {errors.expiryDate && (
                    <p className="text-sm text-red-600">{errors.expiryDate}</p>
                  )}
                </div>
              </div>

              {/* Premium and Commission */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="premiumAmount">Premium Amount *</Label>
                  <Input
                    id="premiumAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.premiumAmount || ''}
                    onChange={(e) => handleInputChange('premiumAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={errors.premiumAmount ? 'border-red-500' : ''}
                    required
                  />
                  {errors.premiumAmount && (
                    <p className="text-sm text-red-600">{errors.premiumAmount}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="commissionAmount">Commission Amount *</Label>
                  <Input
                    id="commissionAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.commissionAmount || ''}
                    onChange={(e) => handleInputChange('commissionAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={errors.commissionAmount ? 'border-red-500' : ''}
                    required
                  />
                  {errors.commissionAmount && (
                    <p className="text-sm text-red-600">{errors.commissionAmount}</p>
                  )}
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
              disabled={submitting || loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || loading || !selectedTemplate}
            >
              {submitting ? 'Adding Policy...' : 'Add Policy'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}