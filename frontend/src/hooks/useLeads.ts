import { useState, useEffect, useCallback } from "react";
import { Lead, CreateLeadRequest, Client } from "@/types";
import { useToastNotifications } from "./useToastNotifications";
import { isAuthError, handleAuthError } from "@/utils/authErrorHandler";
import { useRouter } from "next/navigation";

interface UseLeadsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export function useLeads(options: UseLeadsOptions = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToastNotifications();
  const router = useRouter();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.page) params.append("page", options.page.toString());
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.search) params.append("search", options.search);
      if (options.status) params.append("status", options.status);

      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/leads?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch leads");
      }

      const result = await response.json();
      if (result.success) {
        setLeads(result.data.leads);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.message || "Failed to fetch leads");
      }
    } catch (err) {
      // Handle authentication errors
      if (isAuthError(err)) {
        handleAuthError(err, router);
        return;
      }
      
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      showError(errorMessage, "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit, options.search, options.status, showError, router]);

  const createLead = async (leadData: CreateLeadRequest): Promise<Lead> => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create lead");
      }

      const result = await response.json();
      if (result.success) {
        // Refresh the leads list
        await fetchLeads();
        showSuccess(`Lead "${result.data.name}" has been created successfully`);
        return result.data;
      } else {
        throw new Error(result.message || "Failed to create lead");
      }
    } catch (error) {
      // Handle authentication errors
      if (isAuthError(error)) {
        handleAuthError(error, router);
        throw new Error("Authentication required. Please log in again.");
      }
      throw error;
    }
  };

  const updateLead = async (
    id: string,
    leadData: Partial<CreateLeadRequest>
  ): Promise<Lead> => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || "Failed to update lead";
        showError(errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        // Refresh the leads list
        await fetchLeads();
        showSuccess(`Lead "${result.data.name}" has been updated successfully`);
        return result.data;
      } else {
        const errorMessage = result.message || "Failed to update lead";
        showError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Handle authentication errors
      if (isAuthError(error)) {
        handleAuthError(error, router);
        throw new Error("Authentication required. Please log in again.");
      }
      throw error;
    }
  };

  const deleteLead = async (id: string): Promise<void> => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || "Failed to delete lead";
        showError(errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        // Refresh the leads list
        await fetchLeads();
        showSuccess("Lead has been deleted successfully");
      } else {
        const errorMessage = result.message || "Failed to delete lead";
        showError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Handle authentication errors
      if (isAuthError(error)) {
        handleAuthError(error, router);
        throw new Error("Authentication required. Please log in again.");
      }
      throw error;
    }
  };

  const convertLead = async (
    id: string
  ): Promise<{ client: Client; lead: Lead }> => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/leads/${id}/convert`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || "Failed to convert lead";
        showError(errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        // Refresh the leads list
        await fetchLeads();
        showSuccess(
          `Lead "${result.data.client.name}" has been converted to client successfully`
        );
        return result.data;
      } else {
        const errorMessage = result.message || "Failed to convert lead";
        showError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Handle authentication errors
      if (isAuthError(error)) {
        handleAuthError(error, router);
        throw new Error("Authentication required. Please log in again.");
      }
      throw error;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    pagination,
    loading,
    error,
    refetch: fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    convertLead,
  };
}
