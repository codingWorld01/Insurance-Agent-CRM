"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ArrowLeft,
  Edit,
  Trash2,
  Home,
  ChevronRight,
  Plus,
  FileText,
  TrendingUp,
  DollarSign,
  Shield,
} from "lucide-react";
import {
  PolicyInstanceWithTemplate,
  UpdatePolicyInstanceRequest,
} from "@/types";
import { ClientDetailView } from "@/components/clients/ClientDetailView";
import { ClientEditModal } from "@/components/clients/ClientEditModal";
import { ClientDeleteDialog } from "@/components/clients/ClientDeleteDialog";

import { PolicyTemplateSearchModal } from "@/components/policies/PolicyTemplateSearchModal";
import { PolicyInstancesTable } from "@/components/policies/PolicyInstancesTable";
import { PolicyInstanceEditModal } from "@/components/policies/PolicyInstanceEditModal";
import { PolicyInstanceDeleteDialog } from "@/components/policies/PolicyInstanceDeleteDialog";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import { usePolicyInstances } from "@/hooks/usePolicyInstances";

import { formatCurrency } from "@/utils/currencyUtils";
import Link from "next/link";
import { Breadcrumb, createBreadcrumbs } from "@/components/common/Breadcrumb";
import { useAuthErrorHandler } from "@/hooks/useAuthErrorHandler";

// Import the UnifiedClient type from ClientDetailView
import type { UnifiedClient } from "@/components/clients/ClientDetailView";


export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showSuccess, showError } = useToastNotifications();
  const { handleAuthError } = useAuthErrorHandler();
  const [client, setClient] = useState<UnifiedClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Policy instance management state
  const [showPolicyTemplateSearchModal, setShowPolicyTemplateSearchModal] =
    useState(false);
  const [showInstanceEditModal, setShowInstanceEditModal] = useState(false);
  const [editingInstance, setEditingInstance] =
    useState<PolicyInstanceWithTemplate | null>(null);
  const [showInstanceDeleteDialog, setShowInstanceDeleteDialog] =
    useState(false);
  const [deletingInstance, setDeletingInstance] =
    useState<PolicyInstanceWithTemplate | null>(null);

  const clientId = params.id as string;

  // Initialize policy instances hook for this client
  const {
    instances,
    loading: instancesLoading,
    operationLoading,
    updateInstance,
    deleteInstance,
    calculateStats,
  } = usePolicyInstances({ clientId: clientId, autoFetch: true });

  useEffect(() => {
    fetchClient();
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update page title when client data is loaded
  useEffect(() => {
    if (client) {
      const clientName = getClientName(client);
      document.title = `${clientName} - Client Details | Insurance CRM`;
    } else {
      document.title = "Client Details | Insurance CRM";
    }

    // Cleanup: Reset title when component unmounts
    return () => {
      document.title = "Insurance CRM";
    };
  }, [client]);

  const getClientName = (client: UnifiedClient): string => {
    if (client.companyName) {
      return client.companyName;
    }
    const fullName = `${client.firstName} ${client.lastName}`.trim();
    return fullName || "Unnamed Client";
  };

  const fetchClient = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          notFound();
        } else {
          throw new Error("Failed to fetch client");
        }
        return;
      }

      const result = await response.json();
      if (result.success) {
        setClient(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch client");
      }
    } catch (err) {
      // Handle authentication errors
      if (!handleAuthError(err)) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Policy instance management handlers
  const handleAddPolicy = () => {
    setShowPolicyTemplateSearchModal(true);
  };

  const handleEditInstance = (instance: PolicyInstanceWithTemplate) => {
    setEditingInstance(instance);
    setShowInstanceEditModal(true);
  };

  const handleDeleteInstance = (instance: PolicyInstanceWithTemplate) => {
    setDeletingInstance(instance);
    setShowInstanceDeleteDialog(true);
  };

  const handleInstanceSubmit = async (
    instanceData: UpdatePolicyInstanceRequest
  ) => {
    if (editingInstance) {
      await updateInstance(editingInstance.id, instanceData);
      setShowInstanceEditModal(false);
      setEditingInstance(null);
      // Refresh client data to update statistics
      await fetchClient();
    }
  };

  const handleConfirmInstanceDelete = async () => {
    if (deletingInstance) {
      await deleteInstance(deletingInstance.id);
      setShowInstanceDeleteDialog(false);
      setDeletingInstance(null);
      // Refresh client data to update statistics
      await fetchClient();
    }
  };

  const handlePolicyTemplateSearchSuccess = async () => {
    // Refresh both client data and policy instances when a new policy is added
    await Promise.all([
      fetchClient(),
      // Force refresh policy instances by calling fetchInstances if it exists
      // or let the usePolicyInstances hook handle the refresh
      new Promise(resolve => setTimeout(resolve, 500)) // Small delay to ensure backend has processed the new policy
    ]);
  };

  // Calculate policy statistics for the client using the hook
  const policyStats = calculateStats();

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = async () => {
    showSuccess("Client updated successfully");
    await fetchClient(); // Refresh client data
    setShowEditModal(false);
  };

  const handleEditError = (error: string) => {
    showError(`Failed to update client: ${error}`);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete client");
      }

      const result = await response.json();
      if (result.success) {
        showSuccess("Client and associated policies deleted successfully");
        router.push("/dashboard/clients");
      } else {
        throw new Error(result.message || "Failed to delete client");
      }
    } catch (error) {
      // Handle authentication errors
      if (!handleAuthError(error)) {
        showError(
          error instanceof Error ? error.message : "Failed to delete client."
        );
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Loading Client Details */}
        <Card>
          <CardHeader>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading Policies Section */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        {/* Error State Breadcrumb */}
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/clients")}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>

          <nav
            aria-label="Breadcrumb"
            className="flex items-center space-x-1 text-sm text-gray-500"
          >
            <Link
              href="/dashboard"
              className="hover:text-gray-700 transition-colors"
              aria-label="Go to Dashboard"
            >
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/dashboard/clients"
              className="hover:text-gray-700 transition-colors"
            >
              Clients
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium" aria-current="page">
              Client Details
            </span>
          </nav>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error || "Client not found"}</p>
              <div className="mt-4 space-x-2">
                <Button onClick={() => router.push("/dashboard/clients")}>
                  Go to Clients
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/clients")}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>

          {/* Breadcrumb Trail */}
          <Breadcrumb
            items={[
              createBreadcrumbs.dashboard(),
              createBreadcrumbs.clients(),
              createBreadcrumbs.client(getClientName(client)),
            ]}
          />
        </div>
      </div>

      {/* Enhanced Client Detail View */}
      <ClientDetailView
        client={client}
        onEdit={handleEdit}
        onDelete={() => setShowDeleteDialog(true)}
        onAddPolicy={handleAddPolicy}
        policyStats={policyStats}
      />

      {/* Policies Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Policies
                <span className="text-sm font-normal text-gray-500">
                  ({policyStats.totalPolicies})
                </span>
              </CardTitle>
              {policyStats.totalPolicies > 0 && (
                <Link
                  href={`/dashboard/policy-templates?client=${
                    client.id
                  }&clientName=${encodeURIComponent(getClientName(client))}`}
                  className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  View Policy Templates
                </Link>
              )}
            </div>
            <Button
              onClick={handleAddPolicy}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Policy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {policyStats.totalPolicies > 0 ? (
            <div className="space-y-6">
              {/* Policy Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {policyStats.totalPolicies}
                      </div>
                      <div className="text-sm text-blue-600 font-medium">
                        Total{" "}
                        {policyStats.totalPolicies === 1
                          ? "Policy"
                          : "Policies"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {policyStats.activePolicies}
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        Active{" "}
                        {policyStats.activePolicies === 1
                          ? "Policy"
                          : "Policies"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(policyStats.totalPremium)}
                      </div>
                      <div className="text-sm text-purple-600 font-medium">
                        Total Premium
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(policyStats.totalCommission)}
                      </div>
                      <div className="text-sm text-orange-600 font-medium">
                        Total Commission
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy Instances Table */}
              <PolicyInstancesTable
                instances={instances}
                loading={instancesLoading}
                operationLoading={operationLoading}
                onEdit={handleEditInstance}
                onDelete={handleDeleteInstance}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-12 w-12 text-gray-400" />
              </div>
              <div className="text-gray-900 text-lg font-medium mb-2">
                No policies found
              </div>
              <div className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                This client doesn&apos;t have any insurance policies yet. Add
                their first policy to get started.
              </div>
              <Button
                onClick={handleAddPolicy}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add First Policy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Enhanced Edit Modal */}
      {client && (
        <ClientEditModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          client={client}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
        />
      )}

      {/* Enhanced Delete Confirmation Dialog */}
      <ClientDeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        client={client}
        loading={deleteLoading}
      />

      {/* Policy Template Search Modal */}
      <PolicyTemplateSearchModal
        open={showPolicyTemplateSearchModal}
        onClose={() => setShowPolicyTemplateSearchModal(false)}
        clientId={clientId}
        clientName={getClientName(client)}
        onSuccess={handlePolicyTemplateSearchSuccess}
      />

      {/* Policy Instance Edit Modal */}
      <PolicyInstanceEditModal
        open={showInstanceEditModal}
        onClose={() => {
          setShowInstanceEditModal(false);
          setEditingInstance(null);
        }}
        onSubmit={handleInstanceSubmit}
        instance={editingInstance}
        loading={operationLoading.update}
      />

      {/* Policy Instance Delete Confirmation Dialog */}
      <PolicyInstanceDeleteDialog
        open={showInstanceDeleteDialog}
        onClose={() => setShowInstanceDeleteDialog(false)}
        onConfirm={handleConfirmInstanceDelete}
        instance={deletingInstance}
        loading={operationLoading.delete}
      />
    </div>
  );
}
