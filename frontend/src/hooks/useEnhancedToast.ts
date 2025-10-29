import React, { useCallback } from "react";
import { toast } from "sonner";

export interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  persistent?: boolean;
}

export interface ErrorToastOptions extends ToastOptions {
  retryAction?: () => void;
  reportAction?: () => void;
  showDetails?: boolean;
  errorCode?: string;
}

export function useEnhancedToast() {
  const showSuccess = useCallback((message: string, title?: string, options: ToastOptions = {}) => {
    return toast.success(title || "Success", {
      description: message,
      duration: options.duration || 4000,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options.onDismiss,
      style: {
        "--description-color": "#ffffff",
      } as React.CSSProperties,
      descriptionClassName: "text-white",
    });
  }, []);

  const showError = useCallback((
    message: string, 
    title?: string, 
    options: ErrorToastOptions = {}
  ) => {
    const actions = [];
    
    if (options.retryAction) {
      actions.push({
        label: "Retry",
        onClick: options.retryAction,
      });
    }
    
    if (options.reportAction) {
      actions.push({
        label: "Report",
        onClick: options.reportAction,
      });
    }

    const errorMessage = options.errorCode 
      ? `${message} (Error: ${options.errorCode})`
      : message;

    return toast.error(title || "Error", {
      description: errorMessage,
      duration: options.persistent ? Infinity : (options.duration || 6000),
      action: actions.length > 0 ? actions[0] : options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options.onDismiss,
      style: {
        "--description-color": "#ffffff",
      } as React.CSSProperties,
      descriptionClassName: "text-white",
    });
  }, []);

  const showWarning = useCallback((message: string, title?: string, options: ToastOptions = {}) => {
    return toast.warning(title || "Warning", {
      description: message,
      duration: options.duration || 5000,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options.onDismiss,
      style: {
        "--description-color": "#ffffff",
      } as React.CSSProperties,
      descriptionClassName: "text-white",
    });
  }, []);

  const showInfo = useCallback((message: string, title?: string, options: ToastOptions = {}) => {
    return toast.info(title || "Info", {
      description: message,
      duration: options.duration || 4000,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
      onDismiss: options.onDismiss,
      style: {
        "--description-color": "#ffffff",
      } as React.CSSProperties,
      descriptionClassName: "text-white",
    });
  }, []);

  const showUploadProgress = useCallback((
    fileName: string, 
    progress: number,
    onCancel?: () => void
  ) => {
    return toast.loading(`Uploading ${fileName}...`, {
      description: `${progress}% complete`,
      action: onCancel ? {
        label: "Cancel",
        onClick: onCancel,
      } : undefined,
    });
  }, []);

  const showUploadSuccess = useCallback((fileName: string, onView?: () => void) => {
    return toast.success("Upload Complete", {
      description: `${fileName} uploaded successfully`,
      action: onView ? {
        label: "View",
        onClick: onView,
      } : undefined,
      duration: 4000,
    });
  }, []);

  const showUploadError = useCallback((
    fileName: string, 
    error: string,
    onRetry?: () => void,
    onReport?: () => void
  ) => {
    return showError(
      `Failed to upload ${fileName}: ${error}`,
      "Upload Failed",
      {
        retryAction: onRetry,
        reportAction: onReport,
        duration: 8000,
      }
    );
  }, [showError]);

  const showNetworkError = useCallback((
    action: string,
    onRetry?: () => void,
    isOffline: boolean = false
  ) => {
    const message = isOffline 
      ? "You appear to be offline. Please check your internet connection."
      : `Network error while ${action}. Please check your connection and try again.`;
    
    return showError(message, "Connection Error", {
      retryAction: onRetry,
      errorCode: isOffline ? "OFFLINE" : "NETWORK_ERROR",
      persistent: isOffline,
    });
  }, [showError]);

  const showValidationError = useCallback((
    field: string,
    error: string,
    onFocus?: () => void
  ) => {
    return showError(
      `${field}: ${error}`,
      "Validation Error",
      {
        action: onFocus ? {
          label: "Fix",
          onClick: onFocus,
        } : undefined,
        duration: 5000,
      }
    );
  }, [showError]);

  const showFormSaveSuccess = useCallback((formType: string) => {
    return showSuccess(
      `${formType} information saved successfully`,
      "Saved",
      { duration: 3000 }
    );
  }, [showSuccess]);

  const showFormSaveError = useCallback((
    formType: string,
    error: string,
    onRetry?: () => void
  ) => {
    return showError(
      `Failed to save ${formType}: ${error}`,
      "Save Failed",
      {
        retryAction: onRetry,
        duration: 6000,
      }
    );
  }, [showError]);

  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showUploadProgress,
    showUploadSuccess,
    showUploadError,
    showNetworkError,
    showValidationError,
    showFormSaveSuccess,
    showFormSaveError,
    dismissAll,
  };
}