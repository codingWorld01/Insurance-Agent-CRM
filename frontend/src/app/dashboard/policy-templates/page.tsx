"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { PolicyTemplateCreateModal } from "@/components/policies/PolicyTemplateCreateModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EnhancedErrorMessage } from "@/components/common/EnhancedErrorMessage";
import { NetworkStatusIndicator } from "@/components/common/NetworkStatusIndicator";
import { PolicyTemplateStats } from "@/components/policies/PolicyTemplateStats";
import { PolicyTemplateFilters } from "@/components/policies/PolicyTemplateFilters";
import { PolicyTemplatesTable } from "@/components/policies/PolicyTemplatesTable";
import { VirtualizedPolicyTemplatesTable } from "@/components/policies/VirtualizedPolicyTemplatesTable";
import { usePerformanceMonitor, measureApiCall } from "@/utils/performanceMonitor";

import {
  CreatePolicyTemplateRequest,
  PolicyTemplateWithStats,
  PolicyTemplateFilters as PolicyTemplateFiltersType,
  PolicyTemplateStats as PolicyTemplateStatsType,
  PolicyTemplateSort,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useOfflineDetection } from "@/hooks/useOfflineDetection";
import { Breadcrumb, breadcrumbItems } from "@/components/common/Breadcrumb";
import { usePolicyTemplateRefresh } from "@/utils/dashboardRefresh";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PolicyTemplatesPage() {
  const router = useRouter();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PolicyTemplateWithStats | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<PolicyTemplateWithStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Data state
  const [templates, setTemplates] = useState<PolicyTemplateWithStats[]>([]);
  const [stats, setStats] = useState<PolicyTemplateStatsType | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [currentFilters, setCurrentFilters] = useState<PolicyTemplateFiltersType>({});
  const [sort, setSort] = useState<PolicyTemplateSort>({
    field: 'createdAt',
    direction: 'desc',
  });
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  // Offline detection
  const { isOffline } = useOfflineDetection();

  // Dashboard refresh functionality
  const { refreshAfterPolicyTemplateOperation } = usePolicyTemplateRefresh();

  // Performance monitoring
  const { start: startPerf, end: endPerf } = usePerformanceMonitor();

  // Performance and virtualization settings
  const [enableVirtualization, setEnableVirtualization] = useState(true);
  const [containerHeight, setContainerHeight] = useState(600);

  // Fetch policy templates with performance monitoring
  const fetchTemplates = useCallback(async (
    filters?: PolicyTemplateFiltersType,
    sortOptions?: PolicyTemplateSort,
    page?: number,
    limit?: number
  ) => {
    const fetchOperation = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const params = new URLSearchParams();
      if (page) params.set('page', page.toString());
      if (limit) params.set('limit', limit.toString());
      if (filters?.search) params.set('search', filters.search);
      if (filters?.policyTypes?.length) {
        filters.policyTypes.forEach(type => params.append('policyTypes', type));
      }
      if (filters?.providers?.length) {
        filters.providers.forEach(provider => params.append('providers', provider));
      }
      if (filters?.hasInstances !== undefined) {
        params.set('hasInstances', filters.hasInstances.toString());
      }
      if (sortOptions?.field) params.set('sortField', sortOptions.field);
      if (sortOptions?.direction) params.set('sortDirection', sortOptions.direction);
      // Always include statistics
      params.set('includeStats', 'true');

      const response = await fetch(`/api/policy-templates?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch policy templates");
      }

      const result = await response.json();

      if (result.success) {
        setTemplates(result.data.templates || []);
        setStats(result.data.stats || null);
        setPagination(result.data.pagination || pagination);
        setAvailableProviders(result.data.filters?.availableProviders || []);
      } else {
        throw new Error(result.message || "Failed to fetch policy templates");
      }
    };

    try {
      await measureApiCall('fetch_policy_templates', fetchOperation, {
        filters: JSON.stringify(filters),
        sort: JSON.stringify(sortOptions),
        page,
        limit,
      });
    } catch (error) {
      console.error("Error fetching policy templates:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch policy templates");
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  // Initial load
  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log policy templates page access
  const logPageAccess = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      await fetch("/api/dashboard/activities", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "policy_templates_page_accessed",
          description: "Accessed policy templates page",
        }),
      });
    } catch (error) {
      console.warn("Failed to log page access:", error);
    }
  }, []);

  useEffect(() => {
    logPageAccess();
  }, [logPageAccess]);

  const handleAddTemplate = () => {
    setShowTemplateModal(true);
  };

  const handleTemplateSubmit = async (data: CreatePolicyTemplateRequest) => {
    const isEditing = !!editingTemplate;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      let response;
      let actionDescription;

      if (isEditing) {
        response = await fetch(`/api/policy-templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        actionDescription = `Updated policy template ${data.policyNumber}`;
      } else {
        response = await fetch("/api/policy-templates", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        actionDescription = `Created policy template ${data.policyNumber}`;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? "update" : "create"} policy template`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: isEditing ? "Template Updated" : "Template Created",
          description: `Policy template ${data.policyNumber} has been ${isEditing ? "updated" : "created"} successfully.`,
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
              action: isEditing ? "policy_template_updated" : "policy_template_created",
              description: actionDescription,
            }),
          });
        } catch (activityError) {
          console.warn("Failed to log activity:", activityError);
        }

        // Refresh templates
        await fetchTemplates(currentFilters, sort, pagination.page, pagination.limit);
        
        // Refresh dashboard statistics
        await refreshAfterPolicyTemplateOperation(isEditing ? 'update' : 'create');
        
        setShowTemplateModal(false);
        setEditingTemplate(null);
      } else {
        throw new Error(result.message || `Failed to ${isEditing ? "update" : "create"} policy template`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} policy template:`, error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      setShowTemplateModal(false);
      setEditingTemplate(null);
    }
  };

  const handleEditTemplate = (template: PolicyTemplateWithStats) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = (template: PolicyTemplateWithStats) => {
    setDeletingTemplate(template);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTemplate) return;

    setIsDeleting(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/policy-templates/${deletingTemplate.id}`, {
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
          description: `Policy template ${deletingTemplate.policyNumber} has been deleted successfully.`,
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
              description: `Deleted policy template ${deletingTemplate.policyNumber}`,
            }),
          });
        } catch (activityError) {
          console.warn("Failed to log activity:", activityError);
        }

        // Refresh templates
        await fetchTemplates(currentFilters, sort, pagination.page, pagination.limit);
        
        // Refresh dashboard statistics
        await refreshAfterPolicyTemplateOperation('delete');
        
        setDeletingTemplate(null);
      } else {
        throw new Error(result.message || "Failed to delete policy template");
      }
    } catch (error) {
      console.error("Error deleting policy template:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete policy template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setDeletingTemplate(null);
    }
  };

  const handleViewDetails = (template: PolicyTemplateWithStats) => {
    router.push(`/dashboard/policy-templates/${template.id}`);
  };

  const handleFiltersChange = async (filters: PolicyTemplateFiltersType) => {
    setCurrentFilters(filters);
    await fetchTemplates(filters, sort, 1, pagination.limit);
  };

  const handleSort = (field: PolicyTemplateSort['field']) => {
    const newDirection: 'asc' | 'desc' = sort?.field === field && sort?.direction === "asc" ? "desc" : "asc";
    const newSort: PolicyTemplateSort = { field, direction: newDirection };
    setSort(newSort);
    fetchTemplates(currentFilters, newSort, pagination.page, pagination.limit);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchTemplates(currentFilters, sort, page, pagination.limit);
  };

  // const handlePageSizeChange = (limit: number) => {
  //   setPagination(prev => ({ ...prev, limit, page: 1 }));
  //   fetchTemplates(currentFilters, sort, 1, limit);
  // };

  const handleRetryPageLoad = () => {
    fetchTemplates(currentFilters, sort, pagination.page, pagination.limit);
  };

  // Show error state if there's a critical page error
  if (error && templates.length === 0) {
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
        breadcrumbItems.dashboard,
        { ...breadcrumbItems.policyTemplates, current: true }
      ]} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">
              Policy Templates
            </h1>
           
          </div>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your insurance policy templates
          </p>
        </div>
        <Button
          onClick={handleAddTemplate}
          className="flex items-center gap-2 w-full sm:w-auto justify-center"
          aria-label="Add new policy template"
          disabled={isOffline}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="sm:inline">Add Policy Template</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <PolicyTemplateStats stats={stats} isLoading={loading} />

      {/* Filters */}
      <PolicyTemplateFilters
        filters={currentFilters}
        onFiltersChange={handleFiltersChange}
        availableProviders={availableProviders}
        totalCount={pagination.total}
        filteredCount={templates.length}
        loading={loading}
      />

      {/* Templates Table */}
      {enableVirtualization && templates.length > 50 ? (
        <VirtualizedPolicyTemplatesTable
          templates={templates}
          loading={loading}
          sort={sort}
          onSort={handleSort}
          onEdit={handleEditTemplate}
          onDelete={handleDeleteTemplate}
          onViewDetails={handleViewDetails}
          pagination={pagination}
          onPageChange={handlePageChange}
          containerHeight={containerHeight}
          enableVirtualization={enableVirtualization}
        />
      ) : (
        <PolicyTemplatesTable
          templates={templates}
          loading={loading}
          sort={sort}
          onSort={handleSort}
          onEdit={handleEditTemplate}
          onDelete={handleDeleteTemplate}
          onViewDetails={handleViewDetails}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}

      {/* Policy Template Modal */}
      <PolicyTemplateCreateModal
        open={showTemplateModal}
        onClose={handleModalClose}
        onSubmit={handleTemplateSubmit}
        template={editingTemplate}
        loading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingTemplate}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Policy Template"
        description={
          deletingTemplate
            ? `Are you sure you want to delete policy template "${deletingTemplate.policyNumber}"? This will also delete all associated policy instances for clients. This action cannot be undone.`
            : ""
        }
        confirmText="Delete Template"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}