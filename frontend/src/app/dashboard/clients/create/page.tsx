"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { UnifiedClientForm } from "@/components/clients/UnifiedClientForm";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import { useAuth } from "@/context/AuthContext";

export default function CreateClientPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToastNotifications();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    router.push("/dashboard/clients");
  };

  const handleSubmit = async (data: unknown) => {
    if (!token) {
      showError("Authentication required. Please log in again.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    try {

      console.log("just before submitting ", data)
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create client");
      }

      const result = await response.json();
      // console.log("result ", result);
      showSuccess("Client created successfully!");
      router.push(`/dashboard/clients/${result.data.id}`);
    } catch (error) {
      showError(
        `Failed to create client: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div className="flex items-center gap-4"> */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create New Client</h1>
            <p className="text-gray-600">
              Fill in the relevant information for your client
            </p>
          </div>
        </div>
      {/* </div> */}

      {/* Unified Form */}




























      

      <UnifiedClientForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}
