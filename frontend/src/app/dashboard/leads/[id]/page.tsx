'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Lead, CreateLeadRequest } from '@/types';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { LeadModal } from '@/components/leads/LeadModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToastNotifications } from '@/hooks/useToastNotifications';
import { formatDistanceToNow } from 'date-fns';



export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showSuccess, showError } = useToastNotifications();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const leadId = params.id as string;

  useEffect(() => {
    fetchLead();
  }, [leadId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLead = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/leads/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          notFound();
        } else {
          throw new Error('Failed to fetch lead');
        }
        return;
      }

      const result = await response.json();
      if (result.success) {
        setLead(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch lead');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSubmit = async (data: CreateLeadRequest) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update lead');
      }

      const result = await response.json();
      if (result.success) {
        setLead(result.data);
        showSuccess("Lead updated successfully");
      } else {
        throw new Error(result.message || 'Failed to update lead');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to update lead.");
      throw error;
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete lead');
      }

      const result = await response.json();
      if (result.success) {
        showSuccess("Lead deleted successfully");
        router.push('/dashboard/leads');
      } else {
        throw new Error(result.message || 'Failed to delete lead');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to delete lead.");
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error || 'Lead not found'}</p>
              <Button onClick={() => router.push('/dashboard/leads')} className="mt-4">
                Go to Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          <div className="text-sm text-gray-500">
            Leads / {lead.name}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label={`Actions for ${lead.name}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Lead
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lead Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{lead.name}</CardTitle>
            <div className="flex gap-2">
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-sm">{lead.phone}</p>
              </div>
              {lead.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm">{lead.email}</p>
                </div>
              )}
              {lead.whatsappNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-500">WhatsApp Number</label>
                  <p className="text-sm">{lead.whatsappNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lead.dateOfBirth && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-sm">{new Date(lead.dateOfBirth).toLocaleDateString()}</p>
                </div>
              )}
              {lead.age !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Age</label>
                  <p className="text-sm">{lead.age} years</p>
                </div>
              )}
            </div>
          </div>

          {/* Lead Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Lead Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Insurance Interest</label>
                <p className="text-sm">{lead.insuranceInterest}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date Added</label>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <LeadModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        lead={lead}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        description={`Are you sure you want to delete ${lead.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleteLoading}
      />
    </div>
  );
}