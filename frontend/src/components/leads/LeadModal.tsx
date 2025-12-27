import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead, CreateLeadRequest, InsuranceType, LeadStatus, Priority } from '@/types';

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadRequest) => Promise<void>;
  lead?: Lead | null;
  loading?: boolean;
}

const insuranceTypes: InsuranceType[] = ['Life', 'Health', 'Auto', 'Home', 'Business'];
const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
const priorities: Priority[] = ['Hot', 'Warm', 'Cold'];

export function LeadModal({ open, onClose, onSubmit, lead, loading = false }: LeadModalProps) {
  const [formData, setFormData] = useState<CreateLeadRequest>({
    name: '',
    phone: '',
    insuranceInterest: 'Life',
    status: 'New',
    priority: 'Warm',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens/closes or lead changes
  useEffect(() => {
    if (open) {
      if (lead) {
        // Edit mode - populate with existing lead data
        setFormData({
          name: lead.name,
          phone: lead.phone,
          insuranceInterest: lead.insuranceInterest,
          status: lead.status,
          priority: lead.priority,
          notes: lead.notes || ''
        });
      } else {
        // Add mode - reset to defaults
        setFormData({
          name: '',
          phone: '',
          insuranceInterest: 'Life',
          status: 'New',
          priority: 'Warm',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [open, lead]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be a valid 10-digit Indian mobile number';
    }

    if (!formData.insuranceInterest) {
      newErrors.insuranceInterest = 'Insurance interest is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Clean phone number (remove non-digits)
      const cleanedData = {
        ...formData,
        phone: formData.phone.replace(/\D/g, '')
      };
      
      await onSubmit(cleanedData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error submitting lead:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateLeadRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits and limit to 10 characters
    const digits = value.replace(/\D/g, '').slice(0, 10);
    handleInputChange('phone', digits);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle id="lead-modal-title">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-labelledby="lead-modal-title">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter full name"
              className={errors.name ? 'border-red-500' : ''}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              required
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600" role="alert">{errors.name}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="8600777024"
              maxLength={10}
              className={errors.phone ? 'border-red-500' : ''}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              required
            />
            {errors.phone && (
              <p id="phone-error" className="text-sm text-red-600" role="alert">{errors.phone}</p>
            )}
            <p className="text-xs text-gray-500">Enter 10-digit mobile number</p>
          </div>

          {/* Insurance Interest Field */}
          <div className="space-y-2">
            <Label htmlFor="insuranceInterest">Insurance Interest *</Label>
            <Select
              value={formData.insuranceInterest}
              onValueChange={(value: InsuranceType) => handleInputChange('insuranceInterest', value)}
              required
            >
              <SelectTrigger 
                className={errors.insuranceInterest ? 'border-red-500' : ''}
                aria-invalid={!!errors.insuranceInterest}
                aria-describedby={errors.insuranceInterest ? 'insurance-error' : undefined}
              >
                <SelectValue placeholder="Select insurance type" />
              </SelectTrigger>
              <SelectContent>
                {insuranceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.insuranceInterest && (
              <p id="insurance-error" className="text-sm text-red-600" role="alert">{errors.insuranceInterest}</p>
            )}
          </div>

          {/* Status Field */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: LeadStatus) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {leadStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Field */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: Priority) => handleInputChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority === 'Hot' && '🔥'} 
                    {priority === 'Warm' && '☀️'} 
                    {priority === 'Cold' && '❄️'} 
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this lead..."
              rows={3}
            />
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
              {submitting ? 'Saving...' : (lead ? 'Update Lead' : 'Create Lead')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}