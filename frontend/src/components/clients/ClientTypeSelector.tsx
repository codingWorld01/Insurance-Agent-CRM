'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Users, 
  Building2, 
  ArrowRight,
  FileText,
  Calendar
} from 'lucide-react';

export type ClientType = 'PERSONAL' | 'FAMILY_EMPLOYEE' | 'CORPORATE';

interface ClientTypeOption {
  type: ClientType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  mandatoryFields: string[];
  route: string;
}

const clientTypeOptions: ClientTypeOption[] = [
  {
    type: 'PERSONAL',
    title: 'Personal Client',
    description: 'Individual client with comprehensive personal information',
    icon: User,
    features: [
      'Complete personal details',
      'Profile image upload',
      'Document management',
      'Age auto-calculation'
    ],
    mandatoryFields: ['First Name', 'Last Name', 'Mobile Number', 'Birth Date'],
    route: '/dashboard/clients/create/personal'
  },
  {
    type: 'FAMILY_EMPLOYEE',
    title: 'Family/Employee Client',
    description: 'Family member or employee with relationship tracking',
    icon: Users,
    features: [
      'Relationship tracking',
      'Family connections',
      'Employee details',
      'Dual phone numbers'
    ],
    mandatoryFields: ['First Name', 'Last Name', 'Phone Number', 'WhatsApp Number', 'Date of Birth'],
    route: '/dashboard/clients/create/family-employee'
  },
  {
    type: 'CORPORATE',
    title: 'Corporate Client',
    description: 'Business entity with company-specific information',
    icon: Building2,
    features: [
      'Company information',
      'GST validation',
      'Business documents',
      'Corporate structure'
    ],
    mandatoryFields: ['Company Name'],
    route: '/dashboard/clients/create/corporate'
  }
];

interface ClientTypeSelectorProps {
  onSelect?: (type: ClientType) => void;
  selectedType?: ClientType;
  showNavigation?: boolean;
}

export function ClientTypeSelector({ 
  onSelect, 
  selectedType, 
  showNavigation = true 
}: ClientTypeSelectorProps) {
  const router = useRouter();
  const [hoveredType, setHoveredType] = useState<ClientType | null>(null);

  const handleTypeSelect = (option: ClientTypeOption) => {
    if (onSelect) {
      onSelect(option.type);
    }
    
    if (showNavigation) {
      router.push(option.route);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Client Type</h2>
        <p className="text-gray-600">
          Choose the type of client you want to create to access the appropriate form
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clientTypeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.type;
          const isHovered = hoveredType === option.type;

          return (
            <Card
              key={option.type}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-blue-500 border-blue-200' 
                  : 'hover:border-gray-300'
              } ${isHovered ? 'transform scale-105' : ''}`}
              onMouseEnter={() => setHoveredType(option.type)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => handleTypeSelect(option)}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  <div className={`p-3 rounded-full ${
                    isSelected 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {option.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Key Features
                  </h4>
                  <ul className="space-y-1">
                    {option.features.map((feature, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-center">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mandatory Fields */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Required Fields
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {option.mandatoryFields.map((field, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs px-2 py-1"
                      >
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                {showNavigation && (
                  <Button 
                    className="w-full mt-4" 
                    variant={isSelected ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTypeSelect(option);
                    }}
                  >
                    Create {option.title}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation Breadcrumb */}
      {!showNavigation && selectedType && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Selected: <span className="font-medium">
              {clientTypeOptions.find(opt => opt.type === selectedType)?.title}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default ClientTypeSelector;