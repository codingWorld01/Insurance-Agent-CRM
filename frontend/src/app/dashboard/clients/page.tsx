'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientModal } from '@/components/clients/ClientModal';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { Client, CreateClientRequest } from '@/types';


export default function ClientsPage() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Debounced search
  const searchOptions = useMemo(() => ({
    page: currentPage,
    limit: 50,
    search: search.trim() || undefined
  }), [currentPage, search]);

  const { clients, pagination, loading, error, createClient, updateClient, deleteClient } = useClients(searchOptions);

  const handleView = (client: Client) => {
    router.push(`/dashboard/clients/${client.id}`);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDelete = async (client: Client) => {
    if (window.confirm(`Are you sure you want to delete ${client.name}? This will also delete all associated policies.`)) {
      try {
        await deleteClient(client.id);
      } catch (error) {
        // Error handling is done in the hook
        console.error('Delete failed:', error);
      }
    }
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setShowModal(true);
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
          <div className="flex justify-between items-center">
            <CardTitle>Clients Management</CardTitle>
            <Button onClick={handleAddClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Controls */}
          <div className="flex gap-4 items-center">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search clients by name..."
              className="flex-1 max-w-md"
            />
          </div>

          {/* Results Summary */}
          {!loading && (
            <div className="text-sm text-gray-600">
              Showing {clients.length} of {pagination.total} clients
              {search && ` matching "${search}"`}
            </div>
          )}

          {/* Clients Table */}
          <ClientsTable
            clients={clients}
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