'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Users, Building2 } from 'lucide-react';
import { UnifiedClientForm } from './UnifiedClientForm';
import type { UnifiedClientFormData } from '@/schemas/clientSchemas';

// Unified client interface matching the backend model
interface UnifiedClient {
  id: string;
  // Mandatory fields
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  whatsappNumber: string;
  
  // Optional personal fields
  middleName?: string;
  email?: string;
  state?: string;
  city?: string;
  address?: string;
  birthPlace?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  height?: number;
  weight?: number;
  education?: string;
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  businessJob?: string;
  nameOfBusiness?: string;
  typeOfDuty?: string;
  annualIncome?: number;
  panNumber?: string;
  gstNumber?: string;
  
  // Optional corporate fields
  companyName?: string;
  
  // Optional family/employee fields
  relationship?: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'EMPLOYEE' | 'DEPENDENT' | 'OTHER';
  
  // System fields
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientEditModalProps {
  open: boolean;
  onClose: () => void;
  client: UnifiedClient;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function ClientEditModal({ 
  open, 
  onClose, 
  client, 
  onSuccess, 
  onError 
}: ClientEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to determine client type based on filled fields
  const getClientType = (): { type: string; icon: any; variant: any; color: string } => {
    if (client.companyName) {
      return {
        type: 'Corporate Client',
        icon: Building2,
        variant: 'outline' as const,
        color: 'bg-purple-100 text-purple-800'
      };
    }
    if (client.relationship) {
      return {
        type: 'Family/Employee Client',
        icon: Users,
        variant: 'secondary' as const,
        color: 'bg-green-100 text-green-800'
      };
    }
    return {
      type: 'Personal Client',
      icon: User,
      variant: 'default' as const,
      color: 'bg-blue-100 text-blue-800'
    };
  };

  const handleFormSubmit = async (data: UnifiedClientFormData & { profileImage?: string; documents?: Array<unknown> }) => {
    setIsSubmitting(true);
    try {
      // Prepare the update data
      const updateData = {
        ...data,
        // Convert dateOfBirth to ISO string if it's a Date object
        dateOfBirth: data.dateOfBirth instanceof Date ? data.dateOfBirth.toISOString() : data.dateOfBirth,
      };

      // Call the API to update the client
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update client');
      }

      const result = await response.json();
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(result.message || 'Failed to update client');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeInfo = getClientType();
  const TypeIcon = typeInfo.icon;

  // Prepare initial data for the unified form
  const initialData = {
    firstName: client.firstName,
    lastName: client.lastName,
    middleName: client.middleName || '',
    phoneNumber: client.phoneNumber,
    whatsappNumber: client.whatsappNumber,
    dateOfBirth: new Date(client.dateOfBirth), // Convert string to Date
    email: client.email || '',
    state: client.state || '',
    city: client.city || '',
    address: client.address || '',
    birthPlace: client.birthPlace || '',
    age: client.age,
    gender: client.gender,
    height: client.height,
    weight: client.weight,
    education: client.education || '',
    maritalStatus: client.maritalStatus,
    businessJob: client.businessJob || '',
    nameOfBusiness: client.nameOfBusiness || '',
    typeOfDuty: client.typeOfDuty || '',
    annualIncome: client.annualIncome,
    panNumber: client.panNumber || '',
    gstNumber: client.gstNumber || '',
    companyName: client.companyName || '',
    relationship: client.relationship,
    profileImage: client.profileImage,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeInfo.color}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                Edit Client
                <Badge variant={typeInfo.variant} className="text-xs">
                  {typeInfo.type}
                </Badge>
              </div>
              <div className="text-sm font-normal text-gray-600 mt-1">
                Update client information and documents
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          <UnifiedClientForm
            initialData={initialData}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ClientEditModal;