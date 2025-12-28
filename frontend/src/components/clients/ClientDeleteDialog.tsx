'use client';

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { User, Users, Building2, AlertTriangle, FileText, Shield } from 'lucide-react';
import type { Client as UnifiedClient } from '@/types';

interface ClientDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  client: UnifiedClient | null;
  loading?: boolean;
}

export function ClientDeleteDialog({ 
  open, 
  onClose, 
  onConfirm, 
  client, 
  loading = false 
}: ClientDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!client) return null;

  // Helper function to determine client type based on filled fields
  const getClientType = (): { 
    type: string; 
    icon: React.ComponentType<{ className?: string }>; 
    variant: 'outline' | 'secondary' | 'default'; 
    color: string 
  } => {
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

  const getClientName = (): string => {
    if (client.companyName) {
      return client.companyName;
    }
    return `${client.firstName} ${client.lastName}`.trim();
  };

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const typeInfo = getClientType();
  const TypeIcon = typeInfo.icon;
  const clientName = getClientName();
  const documentCount = client.documents?.length || 0;
  const policyCount = client.policies?.length || 0;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                Delete Client
              </AlertDialogTitle>
            </div>
          </div>
          
          <AlertDialogDescription className="text-left">
            Are you sure you want to delete this client? This action cannot be undone.
          </AlertDialogDescription>
          
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className={`p-1 rounded ${typeInfo.color}`}>
                <TypeIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{clientName}</div>
                <Badge variant={typeInfo.variant} className="text-xs mt-1">
                  {typeInfo.type}
                </Badge>
              </div>
            </div>

            {(documentCount > 0 || policyCount > 0) && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900">
                  The following will also be permanently deleted:
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {policyCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      <span>{policyCount} {policyCount === 1 ? 'policy' : 'policies'}</span>
                    </div>
                  )}
                  {documentCount > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      <span>{documentCount} {documentCount === 1 ? 'document' : 'documents'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <div className="font-medium">Warning</div>
                  <div>This action is permanent and cannot be undone. All client data, policies, and documents will be lost.</div>
                </div>
              </div>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting || loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting || loading ? 'Deleting...' : 'Delete Client'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ClientDeleteDialog;