'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  Calendar,
  FileText,
  MapPin
} from 'lucide-react';
import { formatDistanceToNow, differenceInYears } from 'date-fns';

import { Client } from '@/types';

interface ClientCardProps {
  client: Client;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  showActions?: boolean;
}

export function ClientCard({ 
  client, 
  onView, 
  onEdit, 
  onDelete, 
  showActions = true 
}: ClientCardProps) {
  const getClientName = (client: Client): string => {
    // Use company name if available, otherwise use personal name
    if (client.companyName) {
      return client.companyName;
    }
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    return fullName || client.name || 'Unnamed Client';
  };

  const getClientPhone = (client: Client): string => {
    // Use whatsappNumber or phoneNumber from unified model
    return client.whatsappNumber || client.phoneNumber || client.phone || '';
  };

  const getAge = (client: Client): number => {
    return client.age || differenceInYears(new Date(), new Date(client.dateOfBirth));
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const clientName = getClientName(client);
  const clientPhone = getClientPhone(client);
  const policyCount = client.policies?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Client Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage 
                src={client.profileImage} 
                alt={`${clientName} profile`} 
              />
              <AvatarFallback className="bg-blue-100 text-blue-800">
                {getInitials(clientName)}
              </AvatarFallback>
            </Avatar>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">
                  {clientName}
                </h3>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-sm text-gray-600">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {clientPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{clientPhone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1 flex-shrink-0 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(client)}
                aria-label={`View details for ${clientName}`}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(client)}
                aria-label={`Edit ${clientName}`}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(client)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                aria-label={`Delete ${clientName}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {/* Show age only if not a corporate client (no company name) */}
          {!client.companyName && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Age: {getAge(client)} years</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>
              {policyCount} {policyCount === 1 ? 'policy' : 'policies'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              Added {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Special Info from Unified Model */}
        <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
          {client.relationship && (
            <Badge variant="outline" className="text-xs">
              Relationship: {client.relationship}
            </Badge>
          )}

          {client.businessJob && (
            <Badge variant="outline" className="text-xs">
              Occupation: {client.businessJob}
            </Badge>
          )}

          {client.gstNumber && (
            <Badge variant="outline" className="text-xs">
              GST: {client.gstNumber}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ClientCard;