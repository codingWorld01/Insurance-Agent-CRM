import { Policy } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PolicyStatusBadge, getExpiryWarningText } from './PolicyStatusBadge';
import { formatCurrency } from '@/utils/currencyUtils';
import { isPolicyExpiringSoon } from '@/utils/policyValidation';

interface PoliciesTableProps {
  policies: Policy[];
  loading: boolean;
  operationLoading?: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  onEdit: (policy: Policy) => void;
  onDelete: (policy: Policy) => void;
}

export function PoliciesTable({ policies, loading, operationLoading, onEdit, onDelete }: PoliciesTableProps) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading policies">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
        <span className="sr-only">Loading policies...</span>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50" role="status">
        <div className="text-gray-500 text-lg mb-2">No policies found</div>
        <div className="text-gray-400">Add a policy to get started</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Mobile card view for small screens */}
      <div className="block lg:hidden">
        <div className="space-y-4 p-4">
          {policies.map((policy) => {
            const warningText = getExpiryWarningText(policy);
            const isExpiringSoon = isPolicyExpiringSoon(policy.expiryDate, 30);
            
            return (
              <div 
                key={policy.id} 
                className={`bg-white border rounded-lg p-4 shadow-sm ${
                  isExpiringSoon ? 'border-orange-200 bg-orange-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {policy.policyNumber}
                      </h3>
                      {isExpiringSoon && (
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{policy.policyType} • {policy.provider}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <PolicyStatusBadge policy={policy} />
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(policy)}
                      disabled={operationLoading?.update || operationLoading?.delete}
                      aria-label={`Edit policy ${policy.policyNumber}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(policy)}
                      disabled={operationLoading?.update || operationLoading?.delete}
                      className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                      aria-label={`Delete policy ${policy.policyNumber}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {warningText && (
                  <div className="mb-3 p-2 bg-orange-100 border border-orange-200 rounded text-sm text-orange-800">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {warningText}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Premium: {formatCurrency(policy.premiumAmount)}</div>
                    <div>Commission: {formatCurrency(policy.commissionAmount)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Start: {formatDate(policy.startDate)}</div>
                    <div>Expires: {formatDate(policy.expiryDate)}</div>
                  </div>
                  <div>Added {formatDistanceToNow(new Date(policy.createdAt), { addSuffix: true })}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Policy Number</TableHead>
              <TableHead scope="col">Type</TableHead>
              <TableHead scope="col">Provider</TableHead>
              <TableHead scope="col">Premium</TableHead>
              <TableHead scope="col">Commission</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col">Start Date</TableHead>
              <TableHead scope="col">Expiry Date</TableHead>
              <TableHead scope="col" className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => {
              const warningText = getExpiryWarningText(policy);
              const isExpiringSoon = isPolicyExpiringSoon(policy.expiryDate, 30);
              
              return (
                <TableRow 
                  key={policy.id} 
                  className={`hover:bg-gray-50 focus-within:bg-gray-50 ${
                    isExpiringSoon ? 'bg-orange-50 hover:bg-orange-100' : ''
                  }`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="truncate max-w-32">{policy.policyNumber}</div>
                      {isExpiringSoon && (
                        <AlertTriangle 
                          className="h-4 w-4 text-orange-500 flex-shrink-0" 
                          aria-label={warningText || 'Policy expiring soon'}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="truncate max-w-24">{policy.policyType}</div>
                  </TableCell>
                  <TableCell>
                    <div className="truncate max-w-32">{policy.provider}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(policy.premiumAmount)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(policy.commissionAmount)}
                  </TableCell>
                  <TableCell>
                    <PolicyStatusBadge policy={policy} />
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(policy.startDate)}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex flex-col">
                      <span>{formatDate(policy.expiryDate)}</span>
                      {warningText && (
                        <span className="text-xs text-orange-600 font-medium">
                          {warningText}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(policy)}
                        disabled={operationLoading?.update || operationLoading?.delete}
                        aria-label={`Edit policy ${policy.policyNumber}`}
                        className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(policy)}
                        disabled={operationLoading?.update || operationLoading?.delete}
                        className="text-red-600 hover:text-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:text-gray-400 disabled:opacity-50"
                        aria-label={`Delete policy ${policy.policyNumber}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}