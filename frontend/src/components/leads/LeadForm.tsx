import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead, CreateLeadRequest, InsuranceType, LeadStatus, Priority } from '@/types';

interface LeadFormProps {
  onSubmit: (data: CreateLeadRequest) => Promise<void>;
  onCancel: () => void;
  lead?: Lead | null;
  loading?: boolean;
}

const insuranceTypes: InsuranceType[] = ['Life', 'Health', 'Auto', 'Home', 'Business'];
const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
const priorities: Priority[] = ['Hot', 'Warm', 'Cold'];

// Utility function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Utility function to validate WhatsApp number
const validateWhatsAppNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15 && /^\d+$/.test(cleanPhone);
};

// Utility function to format WhatsApp number
const formatWhatsAppNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export function LeadForm({ onSubmit, onCancel, lead, loading = false }: LeadFormProps) {
  const [formData, setFormData] = useState<CreateLeadRequest>({
    name: '',
    email: '',
    phone: '',
    insuranceInterest: 'Life',
    status: 'New',
    priority: 'Warm',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form data when lead changes
  useEffect(() => {
    if (lead) {
      // Edit mode - populate with existing lead data
      setFormData({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone,
        whatsappNumber: lead.whatsappNumber || '',
        dateOfBirth: lead.dateOfBirth ? new Date(lead.dateOfBirth).toISOString().split('T')[0] : '',
        insuranceInterest: lead.insuranceInterest,
        status: lead.status,
        priority: lead.priority,
        notes: lead.notes || ''
      });
    } else {
      // Add mode - reset to defaults
      setFormData({
        name: '',
        email: '',
        phone: '',
        whatsappNumber: '',
        dateOfBirth: '',
        insuranceInterest: 'Life',
        status: 'New',
        priority: 'Warm',
        notes: ''
      });
    }
    setErrors({});
  }, [lead]);

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

    // Email validation (optional but if provided must be valid)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // WhatsApp number validation (optional but if provided must be valid)
    if (formData.whatsappNumber && !validateWhatsAppNumber(formData.whatsappNumber)) {
      newErrors.whatsappNumber = 'WhatsApp number must be valid (10-15 digits)';
    }

    // Date of birth validation (optional but if provided must be valid)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      
      if (isNaN(birthDate.getTime())) {
        newErrors.dateOfBirth = 'Please enter a valid date';
      } else if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      } else {
        const age = calculateAge(formData.dateOfBirth);
        if (age < 0 || age > 120) {
          newErrors.dateOfBirth = 'Please enter a valid date of birth';
        }
      }
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
      // Clean phone numbers (remove non-digits)
      const cleanedData = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''),
        whatsappNumber: formData.whatsappNumber ? formatWhatsAppNumber(formData.whatsappNumber) : undefined
      };
      
      await onSubmit(cleanedData);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter email address"
            className={errors.email ? 'border-red-500' : ''}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600" role="alert">{errors.email}</p>
          )}
          <p className="text-xs text-gray-500">Optional: For email notifications</p>
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

        {/* WhatsApp Number Field */}
        <div className="space-y-2">
          <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
          <Input
            id="whatsappNumber"
            type="tel"
            value={formData.whatsappNumber || ''}
            onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
            placeholder="8600777024"
            className={errors.whatsappNumber ? 'border-red-500' : ''}
            aria-invalid={!!errors.whatsappNumber}
            aria-describedby={errors.whatsappNumber ? 'whatsapp-error' : undefined}
          />
          {errors.whatsappNumber && (
            <p id="whatsapp-error" className="text-sm text-red-600" role="alert">{errors.whatsappNumber}</p>
          )}
          <p className="text-xs text-gray-500">Optional: Enter WhatsApp number for notifications</p>
        </div>

        {/* Date of Birth Field */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={errors.dateOfBirth ? 'border-red-500' : ''}
            aria-invalid={!!errors.dateOfBirth}
            aria-describedby={errors.dateOfBirth ? 'dob-error' : undefined}
          />
          {errors.dateOfBirth && (
            <p id="dob-error" className="text-sm text-red-600" role="alert">{errors.dateOfBirth}</p>
          )}
          {formData.dateOfBirth && !errors.dateOfBirth && (
            <p className="text-xs text-gray-500">Age: {calculateAge(formData.dateOfBirth)} years</p>
          )}
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
      </div>

      {/* Notes Field - Full Width */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Additional notes about this lead..."
          rows={4}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
  );
}