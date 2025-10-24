import React, { useCallback } from "react";
import { toast } from "sonner";

export function useToastNotifications() {
  const showSuccess = useCallback((message: string, title?: string) => {
    toast.success(title || "Success", {
      description: message,
      style: {
        "--description-color": "#ffffff",
      } as React.CSSProperties,
      descriptionClassName: "text-white",
    });
  }, []);

  const showError = useCallback((message: string, title?: string) => {
    toast.error(title || "Error", {
      description: message,
      style: {
        "--description-color": "#ffffff",
      } as React.CSSProperties,
      descriptionClassName: "text-white",
    });
  }, []);

  const showInfo = useCallback((message: string, title?: string) => {
    toast.info(title || "Info", {
      description: message,
      style: {
        "--description-color": "#ffffff",
      } as React.CSSProperties,
      descriptionClassName: "text-white",
    });
  }, []);

  return {
    showSuccess,
    showError,
    showInfo,
  };
}
