'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, List, LayoutGrid } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientCard } from '@/components/clients/ClientCard';
import { ClientFilters, SortField, SortOrder } from '@/components/clients/ClientFilters';
import { ClientModal } from '@/components/clients/ClientModal';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { Client, CreateClientRequest } from '@/types';


type ViewMode = 'table' | 'cards';

// Use Client type directly from types/index.ts

export default function ClientsPage() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Debounced search and filtering
  const searchOptions = useMemo(() => ({
    page: currentPage,
    limit: 50,
    search: search.trim() || undefined
  }), [currentPage, search]);

  const { clients: rawClients, pagination, loading, error, createClient, updateClient, deleteClient } = useClients(searchOptions);

  // Enhanced clients with sorting (no type filtering in unified model)
  const sortedClients = useMemo(() => {
    const clients = rawClients;

    // Sort clients
    clients.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortField) {
        case 'name':
          // Use company name if available, otherwise use personal name
          aValue = a.companyName || a.name;
          bValue = b.companyName || b.name;
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'age':
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return clients;
  }, [rawClients, sortField, sortOrder]);

  const totalClientsCount = rawClients.length;

  const handleView = (client: Client) => {
    router.push(`/dashboard/clients/${client.id}`);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDelete = async (client: Client) => {
    // Use company name if available, otherwise use personal name
    const clientName = client.companyName || 
      `${client.firstName || ''} ${client.lastName || ''}`.trim() || 
      'Unnamed Client';
      
    if (window.confirm(`Are you sure you want to delete ${clientName}? This will also delete all associated policies.`)) {
      try {
        await deleteClient(client.id);
      } catch (error) {
        // Error handling is done in the hook
        console.error('Delete failed:', error);
      }
    }
  };

  const handleAddClient = () => {
    router.push('/dashboard/clients/create');
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleModalSubmit = async (data: CreateClientRequest) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data);
      } else {
        await createClient(data);
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

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'table' ? 'cards' : 'table');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error loading clients: {error}</p>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Clients Management
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage all your clients with comprehensive information
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleViewMode}
                className="flex items-center gap-2"
              >
                {viewMode === 'table' ? (
                  <>
                    <LayoutGrid className="h-4 w-4" />
                    Cards
                  </>
                ) : (
                  <>
                    <List className="h-4 w-4" />
                    Table
                  </>
                )}
              </Button>
              <Button onClick={handleAddClient}>
                <Plus className="h-4 w-4 mr-2 cursor-pointer" />
                Add Client
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder="Search clients by name, email, phone, company, or any field..."
                className="flex-1 max-w-md"
              />
            </div>

            <ClientFilters
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              totalCount={totalClientsCount}
            />
          </div>

          {/* Results Summary */}
          {!loading && (
            <div className="text-sm text-gray-600">
              Showing {sortedClients.length} clients
              {search && ` matching "${search}"`}
            </div>
          )}

          {/* Clients Display */}
          {viewMode === 'table' ? (
            <ClientsTable
              clients={sortedClients}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                // Loading skeleton for cards
                [...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted/60 rounded-lg animate-pulse" />
                ))
              ) : sortedClients.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground text-lg mb-2">No clients found</div>
                  <div className="text-muted-foreground/70">
                    {search 
                      ? 'Try adjusting your search terms'
                      : 'Start by adding your first client'
                    }
                  </div>
                </div>
              ) : (
                sortedClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              className="mt-6"
            />
          )}
        </CardContent>
      </Card>

      {/* Client Modal */}
      <ClientModal
        open={showModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        client={editingClient}
        loading={loading}
      />
    </div>
  );
}