"use client";

import { useState, memo, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash, 
  AlertTriangle, 
  Mail, 
  Phone,
  ExternalLink 
} from "lucide-react";
import { PolicyInstanceWithClient } from "@/types";
import { formatCurrency } from "@/utils/currencyUtils";

interface AssociatedClientsTableProps {
  instances: PolicyInstanceWithClient[];
  loading: boolean;
  onEditInstance: (instance: PolicyInstanceWithClient) => void;
  onDeleteInstance: (instance: PolicyInstanceWithClient) => void;
  onClientClick: (clientId: string) => void;
}

export const AssociatedClientsTable = memo(function AssociatedClientsTable({
  instances,
  loading,
  onEditInstance,
  onDeleteInstance,
  onClientClick,
}: AssociatedClientsTableProps) {
  const [sortField, setSortField] = useState<keyof PolicyInstanceWithClient | 'clientName'>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const isExpiringSoon = useCallback((expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry > now;
  }, []);

  const isExpired = useCallback((expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  }, []);

  const calculateDuration = useCallback((startDate: string, expiryDate: string) => {
    const start = new Date(startDate);
    const end = new Date(expiryDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.round(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.round(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  }, []);

  const handleSort = useCallback((field: keyof PolicyInstanceWithClient | 'clientName') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const sortedInstances = useMemo(() => [...instances].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    if (sortField === 'clientName') {
      aValue = `${a.client.firstName} ${a.client.lastName}`.toLowerCase();
      bValue = `${b.client.firstName} ${b.client.lastName}`.toLowerCase();
    } else {
      const aFieldValue = a[sortField as keyof PolicyInstanceWithClient];
      const bFieldValue = b[sortField as keyof PolicyInstanceWithClient];
      aValue = aFieldValue as string | number;
      bValue = bFieldValue as string | number;
    }

    // Handle date sorting
    if (sortField === 'startDate' || sortField === 'expiryDate' || sortField === 'createdAt' || sortField === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Handle numeric sorting
    if (sortField === 'premiumAmount' || sortField === 'commissionAmount') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  }), [instances, sortField, sortDirection]);

  const getSortIcon = useCallback((field: keyof PolicyInstanceWithClient | 'clientName') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  }, [sortField, sortDirection]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Mail className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Associated Clients</h3>
        <p className="text-gray-600 mb-4">
          This policy template hasn&apos;t been assigned to any clients yet.
        </p>
        <p className="text-sm text-gray-500">
          Use the &quot;Add Client&quot; button above to associate clients with this policy template.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('clientName')}
              >
                <div className="flex items-center gap-1">
                  Client {getSortIcon('clientName')}
                </div>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('startDate')}
              >
                <div className="flex items-center gap-1">
                  Start Date {getSortIcon('startDate')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('expiryDate')}
              >
                <div className="flex items-center gap-1">
                  Expiry Date {getSortIcon('expiryDate')}
                </div>
              </TableHead>
              <TableHead>Duration</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('premiumAmount')}
              >
                <div className="flex items-center gap-1">
                  Premium {getSortIcon('premiumAmount')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('commissionAmount')}
              >
                <div className="flex items-center gap-1">
                  Commission {getSortIcon('commissionAmount')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInstances.map((instance) => (
              <TableRow key={instance.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="link"
                      onClick={() => onClientClick(instance.client.id)}
                      className="font-medium p-0 h-auto text-left justify-start"
                    >
                      {`${instance.client.firstName} ${instance.client.lastName}`}
                    </Button>
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{instance.client.email}</span>
                    </div>
                    {instance.client?.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{instance.client.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(instance.startDate)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{formatDate(instance.expiryDate)}</span>
                    {isExpiringSoon(instance.expiryDate) && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    {isExpired(instance.expiryDate) && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {calculateDuration(instance.startDate, instance.expiryDate)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{formatCurrency(instance.premiumAmount)}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{formatCurrency(instance.commissionAmount)}</span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      instance.status === 'Active' 
                        ? isExpired(instance.expiryDate) 
                          ? 'destructive' 
                          : isExpiringSoon(instance.expiryDate)
                            ? 'secondary'
                            : 'default'
                        : 'secondary'
                    }
                  >
                    {isExpired(instance.expiryDate) ? 'Expired' : instance.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditInstance(instance)}
                      className="h-8 w-8 p-0"
                      title="Edit policy instance"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteInstance(instance)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete policy instance"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <div className="flex flex-wrap gap-4">
          <span>
            <strong>{instances.length}</strong> total client{instances.length !== 1 ? 's' : ''}
          </span>
          <span>
            <strong>{instances.filter(i => i.status === 'Active' && !isExpired(i.expiryDate)).length}</strong> active
          </span>
          <span>
            <strong>{instances.filter(i => isExpired(i.expiryDate)).length}</strong> expired
          </span>
          <span>
            <strong>{instances.filter(i => isExpiringSoon(i.expiryDate)).length}</strong> expiring soon
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          <span>
            Total Premium: <strong>{formatCurrency(instances.reduce((sum, i) => sum + i.premiumAmount, 0))}</strong>
          </span>
          <span>
            Total Commission: <strong>{formatCurrency(instances.reduce((sum, i) => sum + i.commissionAmount, 0))}</strong>
          </span>
        </div>
      </div>
    </div>
  );
});