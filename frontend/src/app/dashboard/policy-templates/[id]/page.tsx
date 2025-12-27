"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, ArrowLeft } from "lucide-react";
import { PolicyTemplateCreateModal } from "@/components/policies/PolicyTemplateCreateModal";
// import { PolicyInstanceModal } from "@/components/policies/PolicyInstanceModal";
import { PolicyInstanceEditModal } from "@/components/policies/PolicyInstanceEditModal";  
import { PolicyInstanceDeleteDialog } from "@/components/policies/PolicyInstanceDeleteDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EnhancedErrorMessage } from "@/components/common/EnhancedErrorMessage";
import { NetworkStatusIndicator } from "@/components/common/NetworkStatusIndicator";
import { AssociatedClientsTable } from "@/components/policies/AssociatedClientsTable";
import { PolicyDetailStats } from "@/components/policies/PolicyDetailStats";

import {
  PolicyTemplate,
  PolicyInstanceWithClient,
  PolicyDetailStats as PolicyDetailStatsType,
  CreatePolicyTemplateRequest,
  UpdatePolicyInstanceRequest,
  InsuranceType,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useOfflineDetection } from "@/hooks/useOfflineDetection";
import { Breadcrumb, createBreadcrumbs } from "@/components/common/Breadcrumb";
import { useAuthErrorHandler } from "@/hooks/useAuthErrorHandler";

export default function PolicyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const { toast } = useToast();
  const { isOffline } = useOfflineDetection();
  const { handleAuthError } = useAuthErrorHandler();

  // State
  const [template, setTemplate] = useState<PolicyTemplate | null>(null);
  const [instances, setInstances] = useState<PolicyInstanceWithClient[]>([]);
  const [stats, setStats] = useState<PolicyDetailStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [showInstanceDeleteDialog, setShowInstanceDeleteDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<PolicyInstanceWithClient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInstanceSubmitting, setIsInstanceSubmitting] = useState(false);
  const [isInstanceDeleting, setIsInstanceDeleting] = useState(false);

  // Fetch policy template details
  const fetchPolicyDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/policy-templates/${templateId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Policy template not found");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch policy template details");
      }

      const result = await response.json();

      if (result.success) {
        setTemplate(result.data.template);
        setInstances(result.data.instances || []);
        setStats(result.data.stats || null);
      } else {
        throw new Error(result.message || "Failed to fetch policy template details");
      }
    } catch (error) {
      console.error("Error fetching policy template details:", error);
      
      // Handle authentication errors
      if (!handleAuthError(error)) {
        setError(error instanceof Error ? error.message : "Failed to fetch policy template details");
      }
    } finally {
      setLoading(false);
    }
  }, [templateId, handleAuthError]);

  // Initial load
  useEffect(() => {
    if (templateId) {
      fetchPolicyDetails();
    }
  }, [templateId, fetchPolicyDetails]);

  // Update document title
  useEffect(() => {
    if (template) {
      document.title = `Policy Template - ${template.policyNumber} | Insurance CRM`;
    } else {
      document.title = "Policy Template | Insurance CRM";
    }
  }, [template]);

  // Log page access
  const logPageAccess = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token || !template) return;

      await fetch("/api/dashboard/activities", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "policy_template_detail_viewed",
          description: `Viewed policy template details: ${template.policyNumber}`,
        }),
      });
    } catch (error) {
      console.warn("Failed to log page access:", error);
    }
  }, [template]);

  useEffect(() => {
    if (template) {
      logPageAccess();
    }
  }, [template, logPageAccess]);

  const handleEditTemplate = () => {
    setShowEditModal(true);
  };

  const handleTemplateSubmit = async (data: CreatePolicyTemplateRequest) => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/policy-templates/${templateId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update policy template");
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Template Updated",
          description: `Policy template ${data.policyNumber} has been updated successfully.`,
        });

        // Log activity
        try {
          await fetch("/api/dashboard/activities", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "policy_template_updated",
              description: `Updated policy template ${data.policyNumber}`,
            }),
          });
        } catch (activityError) {
          console.warn("Failed to log activity:", activityError);
        }

        // Refresh data
        await fetchPolicyDetails();
        setShowEditModal(false);
      } else {
        throw new Error(result.message || "Failed to update policy template");
      }
    } catch (error) {
      console.error("Error updating policy template:", error);
      
      // Handle authentication errors
      if (!handleAuthError(error)) {
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleDeleteConfirm = async () => {
    if (!template) return;

    setIsDeleting(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/policy-templates/${templateId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete policy template");
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Template Deleted",
          description: `Policy template ${template.policyNumber} has been deleted successfully.`,
        });

        // Log activity
        try {
          await fetch("/api/dashboard/activities", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "policy_template_deleted",
              description: `Deleted policy template ${template.policyNumber}`,
            }),
          });
        } catch (activityError) {
          console.warn("Failed to log activity:", activityError);
        }

        // Navigate back to policy templates page
        router.push("/dashboard/policy-templates");
      } else {
        throw new Error(result.message || "Failed to delete policy template");
      }
    } catch (error) {
      console.error("Error deleting policy template:", error);
      
      // Handle authentication errors
      if (!handleAuthError(error)) {
        toast({
          title: "Delete Failed",
          description: error instanceof Error ? error.message : "Failed to delete policy template. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setShowDeleteDialog(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      setShowEditModal(false);
    }
  };

  const handleBackToTemplates = () => {
    router.push("/dashboard/policy-templates");
  };

  const handleAddClient = () => {
    // This would open a client search modal - placeholder for now
    toast({
      title: "Feature Coming Soon",
      description: "Client addition functionality will be implemented in a future task.",
    });
  };

  const handleClientClick = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`);
  };

  const handleEditInstance = (instance: PolicyInstanceWithClient) => {
    setSelectedInstance(instance);
    setShowInstanceModal(true);
  };

  const handleDeleteInstance = (instance: PolicyInstanceWithClient) => {
    setSelectedInstance(instance);
    setShowInstanceDeleteDialog(true);
  };

  const handleInstanceSubmit = async (data: UpdatePolicyInstanceRequest) => {
    if (!selectedInstance) return;

    setIsInstanceSubmitting(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/policy-instances/${selectedInstance.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update policy instance");
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Policy Instance Updated",
          description: `Policy instance for ${selectedInstance.client.firstName} ${selectedInstance.client.lastName} has been updated successfully.`,
        });

        // Log activity
        try {
          await fetch("/api/dashboard/activities", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "policy_instance_updated",
              description: `Updated policy instance for client ${selectedInstance.client.firstName} ${selectedInstance.client.lastName}`,
            }),
          });
        } catch (activityError) {
          console.warn("Failed to log activity:", activityError);
        }

        // Refresh data
        await fetchPolicyDetails();
        setShowInstanceModal(false);
        setSelectedInstance(null);
      } else {
        throw new Error(result.message || "Failed to update policy instance");
      }
    } catch (error) {
      console.error("Error updating policy instance:", error);
      
      // Handle authentication errors
      if (!handleAuthError(error)) {
        throw error;
      }
    } finally {
      setIsInstanceSubmitting(false);
    }
  };

  const handleInstanceDeleteConfirm = async () => {
    if (!selectedInstance) return;

    setIsInstanceDeleting(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/policy-instances/${selectedInstance.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete policy instance");
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Policy Instance Deleted",
          description: `Policy instance for ${selectedInstance.client.firstName} ${selectedInstance.client.lastName} has been deleted successfully.`,
        });

        // Log activity
        try {
          await fetch("/api/dashboard/activities", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "policy_instance_deleted",
              description: `Deleted policy instance for client ${selectedInstance.client.firstName} ${selectedInstance.client.lastName}`,
            }),
          });
        } catch (activityError) {
          console.warn("Failed to log activity:", activityError);
        }

        // Refresh data
        await fetchPolicyDetails();
        setShowInstanceDeleteDialog(false);
        setSelectedInstance(null);
      } else {
        throw new Error(result.message || "Failed to delete policy instance");
      }
    } catch (error) {
      console.error("Error deleting policy instance:", error);
      
      // Handle authentication errors
      if (!handleAuthError(error)) {
        toast({
          title: "Delete Failed",
          description: error instanceof Error ? error.message : "Failed to delete policy instance. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsInstanceDeleting(false);
    }
  };

  const handleInstanceModalClose = () => {
    if (!isInstanceSubmitting) {
      setShowInstanceModal(false);
      setSelectedInstance(null);
    }
  };

  const handleInstanceDeleteCancel = () => {
    if (!isInstanceDeleting) {
      setShowInstanceDeleteDialog(false);
      setSelectedInstance(null);
    }
  };

  const handleRetryPageLoad = () => {
    fetchPolicyDetails();
  };

  // Show error state if there's a critical page error
  if (error && !template) {
    return (
      <div className="min-h-screen">
        <EnhancedErrorMessage
          error={new Error(error)}
          onRetry={handleRetryPageLoad}
          showDetails={true}
          showSupportInfo={true}
        />
      </div>
    );
  }

  // Show loading state
  if (loading && !template) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Policy Template Not Found</h2>
          <p className="text-gray-600 mb-4">The requested policy template could not be found.</p>
          <Button onClick={handleBackToTemplates}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Policy Templates
          </Button>
        </div>
      </div>
    );
  }

  const getPolicyTypeIcon = (type: InsuranceType) => {
    const icons = {
      Life: "👤",
      Health: "🏥",
      Auto: "🚗",
      Home: "🏠",
      Business: "🏢",
    };
    return icons[type] || "📋";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Network Status Indicator */}
      {isOffline && (
        <NetworkStatusIndicator
          position="relative"
          showDetails={true}
          onRetry={handleRetryPageLoad}
        />
      )}

      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        createBreadcrumbs.dashboard(),
        { 
          label: "Policy Templates", 
          href: "/dashboard/policy-templates" 
        },
        { 
          label: template.policyNumber, 
          current: true 
        }
      ]} />

      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleBackToTemplates}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Button>
      </div>

      {/* Policy Template Information */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                <span className="text-2xl" role="img" aria-label={template.policyType}>
                  {getPolicyTypeIcon(template.policyType)}
                </span>
                <span className="truncate">{template.policyNumber}</span>
              </CardTitle>
              <div className="mt-2 text-base text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{template.policyType}</Badge>
                  <span className="text-gray-400">•</span>
                  <span>{template.provider}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleEditTemplate}
                className="flex items-center gap-2"
                disabled={isOffline}
              >
                <Edit className="h-4 w-4" />
                Edit Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {template.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{template.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created</span>
                <p className="font-medium">
                  {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Last Updated</span>
                <p className="font-medium">
                  {new Date(template.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Total Clients</span>
                <p className="font-medium">{stats?.totalClients || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Active Policies</span>
                <p className="font-medium">{stats?.activeInstances || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Statistics */}
      {stats && <PolicyDetailStats stats={stats} loading={loading} />}

      {/* Associated Clients Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Associated Clients</CardTitle>
              <CardDescription>
                Clients who have this policy with their specific details
              </CardDescription>
            </div>
            <div className="text-sm text-gray-500">
              {instances.length} client{instances.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AssociatedClientsTable
            instances={instances}
            loading={loading}
            onEditInstance={handleEditInstance}
            onDeleteInstance={handleDeleteInstance}
            onClientClick={handleClientClick}
          />
        </CardContent>
      </Card>

      {/* Edit Template Modal */}
      <PolicyTemplateCreateModal
        open={showEditModal}
        onClose={handleModalClose}
        onSubmit={handleTemplateSubmit}
        template={template ? {
          ...template,
          instanceCount: stats?.totalClients || 0,
          activeInstanceCount: stats?.activeInstances || 0
        } : undefined}
        loading={isSubmitting}
      />

      {/* Policy Instance Modal */}
      <PolicyInstanceEditModal
        open={showInstanceModal}
        onClose={handleInstanceModalClose}
        onSubmit={handleInstanceSubmit}
        instance={selectedInstance}
        loading={isInstanceSubmitting}
      />

      {/* Policy Instance Delete Dialog */}
      <PolicyInstanceDeleteDialog
        open={showInstanceDeleteDialog}
        onClose={handleInstanceDeleteCancel}
        onConfirm={handleInstanceDeleteConfirm}
        instance={selectedInstance}
        loading={isInstanceDeleting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Policy Template"
        description={
          `Are you sure you want to delete policy template "${template.policyNumber}"? This will also delete all associated policy instances for clients (${stats?.totalClients || 0} clients affected). This action cannot be undone.`
        }
        confirmText="Delete Template"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}