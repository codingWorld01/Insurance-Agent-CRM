import { Badge } from '@/components/ui/badge';
import { Policy } from '@/types';
import { isPolicyExpiringSoon, isPolicyExpired } from '@/utils/policyValidation';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface PolicyStatusBadgeProps {
  policy: Policy;
  showExpiryWarning?: boolean;
  className?: string;
}

export function PolicyStatusBadge({ 
  policy, 
  showExpiryWarning = true, 
  className 
}: PolicyStatusBadgeProps) {
  // Handle undefined policy
  if (!policy) {
    return (
      <Badge 
        variant="outline" 
        className={className}
        aria-label="Policy status: Unknown"
      >
        Unknown
      </Badge>
    );
  }

  const isExpired = isPolicyExpired(policy.expiryDate);
  const isExpiringSoon = showExpiryWarning && isPolicyExpiringSoon(policy.expiryDate, 30);

  // Determine badge variant and content based on policy status and expiry
  if (isExpired || policy.status === 'Expired') {
    return (
      <Badge 
        variant="destructive" 
        className={className}
        aria-label={`Policy status: Expired`}
      >
        <XCircle className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  if (policy.status === 'Cancelled') {
    return (
      <Badge 
        variant="secondary" 
        className={`border-gray-500 text-gray-700 bg-gray-50 hover:bg-gray-100 ${className || ''}`}
        aria-label={`Policy status: Cancelled`}
      >
        <XCircle className="h-3 w-3" />
        Cancelled
      </Badge>
    );
  }

  if (isExpiringSoon && policy.status === 'Active') {
    return (
      <Badge 
        variant="outline" 
        className={`border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100 ${className || ''}`}
        aria-label={`Policy status: Active but expiring soon`}
      >
        <AlertTriangle className="h-3 w-3" />
        Expiring Soon
      </Badge>
    );
  }

  if (policy.status === 'Active') {
    return (
      <Badge 
        variant="secondary" 
        className={`border-green-500 text-green-700 bg-green-50 hover:bg-green-100 ${className || ''}`}
        aria-label={`Policy status: Active`}
      >
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    );
  }

  // Fallback for any other status
  return (
    <Badge 
      variant="outline" 
      className={className}
      aria-label={`Policy status: ${policy.status}`}
    >
      {policy.status}
    </Badge>
  );
}

/**
 * Get the expiry warning text for a policy
 */
export function getExpiryWarningText(policy: Policy): string | null {
  const isExpired = isPolicyExpired(policy.expiryDate);
  const isExpiringSoon = isPolicyExpiringSoon(policy.expiryDate, 30);

  if (isExpired) {
    return 'This policy has expired';
  }

  if (isExpiringSoon) {
    const expiryDate = new Date(policy.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry === 1) {
      return 'Expires tomorrow';
    } else if (daysUntilExpiry <= 7) {
      return `Expires in ${daysUntilExpiry} days`;
    } else {
      return `Expires in ${daysUntilExpiry} days`;
    }
  }

  return null;
}