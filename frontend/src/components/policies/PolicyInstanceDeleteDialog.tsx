"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { PolicyInstanceWithTemplate } from "@/types";
import { formatCurrency } from "@/utils/currencyUtils";
import { AlertTriangle, User, Calendar, DollarSign, ExternalLink } from "lucide-react";
import Link from "next/link";

interface PolicyInstanceDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  instance: PolicyInstanceWithTemplate | null;
  loading?: boolean;
}

export function PolicyInstanceDeleteDialog({
  open,
  onClose,
  onConfirm,
  instance,
  loading = false,
}: PolicyInstanceDeleteDialogProps) {
  if (!instance) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry > now;
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Policy Instance
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete this policy instance? This action cannot be undone.
              </p>
              
              {/* Policy Instance Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900 text-sm">Policy Instance Details</h4>
                
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {/* Client Information */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{instance.client?.name || 'Unknown Client'}</span>
                  </div>

                  {/* Policy Template */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-600">Policy Template:</span>
                    <span className="font-medium">
                      {instance.policyTemplate?.policyNumber || 'Unknown Policy'}
                    </span>
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

                  {/* Provider */}
                  {instance.policyTemplate?.provider && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Provider:</span>
                      <span className="font-medium">{instance.policyTemplate.provider}</span>
                    </div>
                  )}

                  {/* Policy Period */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Period:</span>
                    <span className="font-medium">
                      {formatDate(instance.startDate)} - {formatDate(instance.expiryDate)}
                    </span>
                    <Badge 
                      variant={
                        isExpired(instance.expiryDate) 
                          ? 'destructive' 
                          : isExpiringSoon(instance.expiryDate)
                            ? 'secondary'
                            : 'default'
                      }
                      className="text-xs"
                    >
                      {isExpired(instance.expiryDate) ? 'Expired' : instance.status}
                    </Badge>
                  </div>

                  {/* Financial Information */}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Premium:</span>
                    <span className="font-medium">{formatCurrency(instance.premiumAmount)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Commission:</span>
                    <span className="font-medium">{formatCurrency(instance.commissionAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800 mb-1">Warning</p>
                    <ul className="text-red-700 space-y-1">
                      <li>• This will remove the policy association from the client</li>
                      <li>• The policy template will remain available for other clients</li>
                      <li>• This action will be logged in the activity history</li>
                      <li>• Dashboard statistics will be updated to reflect this change</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? "Deleting..." : "Delete Policy Instance"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}