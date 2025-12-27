'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadModal } from '@/components/leads/LeadModal';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { Lead, LeadStatus, CreateLeadRequest } from '@/types';


const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];

export default function LeadsPage() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);


  // Debounced search and filters
  const searchOptions = useMemo(() => ({
    page: currentPage,
    limit: 50,
    search: search.trim() || undefined,
    status: statusFilter || undefined
  }), [currentPage, search, statusFilter]);

  const { leads, pagination, loading, error, createLead, updateLead, deleteLead } = useLeads(searchOptions);

  const handleView = (lead: Lead) => {
    router.push(`/dashboard/leads/${lead.id}`);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setShowModal(true);
  };

  const handleDelete = async (lead: Lead) => {
    if (window.confirm(`Are you sure you want to delete ${lead.name}?`)) {
      try {
        await deleteLead(lead.id);
      } catch (error) {
        // Error handling is done in the hook
        console.error('Delete failed:', error);
      }
    }
  };

  const handleAddLead = () => {
    router.push('/dashboard/leads/create');
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingLead(null);
  };

  const handleModalSubmit = async (data: CreateLeadRequest) => {
    try {
      if (editingLead) {
        await updateLead(editingLead.id, data);
      } else {
        await createLead(data);
      }
    } catch (error) {
      // Error handling is done in the hook
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error loading leads: {error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="text-xl sm:text-2xl">Leads Management</CardTitle>
            <Button 
              onClick={handleAddLead}
              className="w-full sm:w-auto cursor-pointer"
              aria-label="Add new lead"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Lead
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search leads by name..."
              className="flex-1 sm:max-w-md"
              id="leads-search"
              aria-label="Search leads by name"
            />
            <Select value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Filter leads by status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {leadStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          {!loading && (
            <div className="text-sm text-gray-600" role="status" aria-live="polite">
              Showing {leads.length} of {pagination.total} leads
              {search && ` matching "${search}"`}
              {statusFilter && ` with status "${statusFilter}"`}
            </div>
          )}

          {/* Leads Table */}
          <LeadsTable
            leads={leads}
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              className="mt-4 sm:mt-6"
            />
          )}
        </CardContent>
      </Card>

      {/* Lead Modal */}
      <LeadModal
        open={showModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        lead={editingLead}
        loading={loading}
      />
    </div>
  );
}