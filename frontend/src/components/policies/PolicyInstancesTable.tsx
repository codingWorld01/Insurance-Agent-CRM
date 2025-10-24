import { PolicyInstanceWithTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PolicyStatusBadge, getExpiryWarningText } from './PolicyStatusBadge';
import { formatCurrency } from '@/utils/currencyUtils';
import { isPolicyExpiringSoon } from '@/utils/policyValidation';
import Link from 'next/link';

interface PolicyInstancesTableProps {
  instances: PolicyInstanceWithTemplate[];
  loading: boolean;
  operationLoading?: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  onEdit: (instance: PolicyInstanceWithTemplate) => void;
  onDelete: (instance: PolicyInstanceWithTemplate) => void;
}

export function PolicyInstancesTable({ 
  instances, 
  loading, 
  operationLoading, 
  onEdit, 
  onDelete 
}: PolicyInstancesTableProps) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Create a policy object for compatibility with existing components
  const createPolicyFromInstance = (instance: PolicyInstanceWithTemplate) => ({
    id: instance.id,
    policyNumber: instance.policyTemplate?.policyNumber || 'Unknown',
    policyType: instance.policyTemplate?.policyType || 'Life',
    provider: instance.policyTemplate?.provider || 'Unknown',
    description: instance.policyTemplate?.description,
    premiumAmount: instance.premiumAmount,
    status: instance.status,
    startDate: instance.startDate,
    expiryDate: instance.expiryDate,
    commissionAmount: instance.commissionAmount,
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
    clientId: instance.clientId,
    client: instance.client || { id: instance.clientId, name: 'Unknown', email: '' }
  });

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading policy instances">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
        <span className="sr-only">Loading policy instances...</span>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50" role="status">
        <div className="text-gray-500 text-lg mb-2">No policy instances found</div>
        <div className="text-gray-400">Add a policy to get started</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Mobile card view for small screens */}
      <div className="block lg:hidden">
        <div className="space-y-4 p-4">
          {instances.map((instance) => {
            const policy = createPolicyFromInstance(instance);
            const warningText = getExpiryWarningText(policy);
            const isExpiringSoon = isPolicyExpiringSoon(instance.expiryDate, 30);
            
            return (
              <div 
                key={instance.id} 
                className={`bg-white border rounded-lg p-4 shadow-sm ${
                  isExpiringSoon ? 'border-orange-200 bg-orange-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {instance.policyTemplate?.policyNumber || 'Unknown Policy'}
                      </h3>
                      {isExpiringSoon && (
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      )}
                      {instance.policyTemplate && (
                        <Link
                          href={`/dashboard/policy-templates/${instance.policyTemplate.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {instance.policyTemplate?.policyType || 'Unknown'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {instance.policyTemplate?.provider || 'Unknown Provider'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <PolicyStatusBadge policy={policy} />
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(instance)}
                      disabled={operationLoading?.update || operationLoading?.delete}
                      aria-label={`Edit policy instance ${instance.policyTemplate?.policyNumber || instance.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(instance)}
                      disabled={operationLoading?.update || operationLoading?.delete}
                      className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                      aria-label={`Delete policy instance ${instance.policyTemplate?.policyNumber || instance.id}`}
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
                    <div>Premium: {formatCurrency(instance.premiumAmount)}</div>
                    <div>Commission: {formatCurrency(instance.commissionAmount)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Start: {formatDate(instance.startDate)}</div>
                    <div>Expires: {formatDate(instance.expiryDate)}</div>
                  </div>
                  <div>Added {formatDistanceToNow(new Date(instance.createdAt), { addSuffix: true })}</div>
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
              <TableHead scope="col">Policy Template</TableHead>
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
            {instances.map((instance) => {
              const policy = createPolicyFromInstance(instance);
              const warningText = getExpiryWarningText(policy);
              const isExpiringSoon = isPolicyExpiringSoon(instance.expiryDate, 30);
              
              return (
                <TableRow 
                  key={instance.id} 
                  className={`hover:bg-gray-50 focus-within:bg-gray-50 ${
                    isExpiringSoon ? 'bg-orange-50 hover:bg-orange-100' : ''
                  }`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-32">
                            {instance.policyTemplate?.policyNumber || 'Unknown Policy'}
                          </span>
                          {instance.policyTemplate && (
                            <Link
                              href={`/dashboard/policy-templates/${instance.policyTemplate.id}`}
                              className="text-blue-600 hover:text-blue-700"
                              title="View policy template details"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                        {instance.policyTemplate?.description && (
                          <span className="text-xs text-gray-500 truncate max-w-40">
                            {instance.policyTemplate.description}
                          </span>
                        )}
                      </div>
                      {isExpiringSoon && (
                        <AlertTriangle 
                          className="h-4 w-4 text-orange-500 flex-shrink-0" 
                          aria-label={warningText || 'Policy expiring soon'}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {instance.policyTemplate?.policyType || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="truncate max-w-32">
                      {instance.policyTemplate?.provider || 'Unknown Provider'}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(instance.premiumAmount)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(instance.commissionAmount)}
                  </TableCell>
                  <TableCell>
                    <PolicyStatusBadge policy={policy} />
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(instance.startDate)}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex flex-col">
                      <span>{formatDate(instance.expiryDate)}</span>
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
                        onClick={() => onEdit(instance)}
                        disabled={operationLoading?.update || operationLoading?.delete}
                        aria-label={`Edit policy instance ${instance.policyTemplate?.policyNumber || instance.id}`}
                        className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(instance)}
                        disabled={operationLoading?.update || operationLoading?.delete}
                        className="text-red-600 hover:text-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:text-gray-400 disabled:opacity-50"
                        aria-label={`Delete policy instance ${instance.policyTemplate?.policyNumber || instance.id}`}
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