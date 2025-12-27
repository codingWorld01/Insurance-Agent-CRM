"use client";

import React, { useState, useCallback, useRef } from "react";
import { useEnhancedToast } from "./useEnhancedToast";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface UploadError extends Error {
  code?: string;
  retryable?: boolean;
  status?: number;
}

interface UseEnhancedFileUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (url: string, fileName: string) => void;
  onError?: (error: UploadError, fileName: string) => void;
  retryConfig?: Partial<RetryConfig>;
  showToasts?: boolean;
  validateFile?: (file: File) => string | null;
}

interface UseEnhancedFileUploadReturn {
  upload: (file: File, documentType?: string) => Promise<string>;
  uploadProgress: UploadProgress | null;
  isUploading: boolean;
  error: UploadError | null;
  reset: () => void;
  cancel: () => void;
  retry: () => void;
  canRetry: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

const DEFAULT_FILE_VALIDATION = (file: File): string | null => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    return "File type not supported. Please upload PDF, DOC, DOCX, JPG, PNG, or GIF files.";
  }

  if (file.size > maxSize) {
    return "File size too large. Maximum size is 10MB.";
  }

  return null;
};

export function useEnhancedFileUpload({
  onProgress,
  onSuccess,
  onError,
  retryConfig = {},
  showToasts = true,
  validateFile = DEFAULT_FILE_VALIDATION,
}: UseEnhancedFileUploadOptions = {}): UseEnhancedFileUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const [lastUploadParams, setLastUploadParams] = useState<{
    file: File;
    documentType?: string;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const toastIdRef = useRef<string | number | null>(null);
  const config = React.useMemo(
    () => ({ ...DEFAULT_RETRY_CONFIG, ...retryConfig }),
    [retryConfig]
  );
  const toast = useEnhancedToast();

  const createUploadError = (
    message: string,
    options: {
      code?: string;
      status?: number;
      retryable?: boolean;
      cause?: Error;
    } = {}
  ): UploadError => {
    const error = new Error(message) as UploadError;
    error.code = options.code;
    error.status = options.status;
    error.retryable =
      options.retryable ??
      (options.status
        ? options.status >= 500 ||
          options.status === 408 ||
          options.status === 429
        : false);
    if (options.cause) {
      error.cause = options.cause;
    }
    return error;
  };

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (showToasts && toastIdRef.current) {
      toast.dismissAll();
      toast.showInfo("Upload cancelled", "Cancelled");
    }

    setIsUploading(false);
    setUploadProgress(null);
  }, [showToasts, toast]);

  const updateProgress = useCallback(
    (loaded: number, total: number) => {
      const percentage = Math.round((loaded / total) * 100);
      const progress = { loaded, total, percentage };
      setUploadProgress(progress);
      onProgress?.(progress);
    },
    [onProgress]
  );

  const performUpload = useCallback(
    async (
      file: File,
      documentType?: string,
      attempt: number = 1
    ): Promise<string> => {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        throw createUploadError(validationError, {
          code: "VALIDATION_ERROR",
          retryable: false,
        });
      }

      // Create abort controller for this attempt
      abortControllerRef.current = new AbortController();

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (documentType) {
          formData.append("documentType", documentType);
        }

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (!prev) return { loaded: 0, total: file.size, percentage: 0 };
            const newLoaded = Math.min(
              prev.loaded + file.size * 0.1,
              file.size * 0.9
            );
            const newPercentage = Math.round((newLoaded / file.size) * 100);
            const newProgress = {
              loaded: newLoaded,
              total: file.size,
              percentage: newPercentage,
            };
            onProgress?.(newProgress);

        

            return newProgress;
          });
        }, 200);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
          signal: abortControllerRef.current.signal,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          let errorMessage = "Upload failed";
          let errorCode = "UPLOAD_ERROR";

          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
            errorCode = errorData.code || errorCode;
          } catch {
            // Use status-based error messages
            switch (response.status) {
              case 413:
                errorMessage = "File too large";
                errorCode = "FILE_TOO_LARGE";
                break;
              case 415:
                errorMessage = "File type not supported";
                errorCode = "UNSUPPORTED_FILE_TYPE";
                break;
              case 429:
                errorMessage =
                  "Too many upload requests. Please wait and try again.";
                errorCode = "RATE_LIMITED";
                break;
              case 500:
                errorMessage = "Server error. Please try again.";
                errorCode = "SERVER_ERROR";
                break;
              default:
                errorMessage = `Upload failed (${response.status})`;
            }
          }

          throw createUploadError(errorMessage, {
            code: errorCode,
            status: response.status,
          });
        }

        const data = await response.json();
        const cloudinaryUrl = data.url;

        if (!cloudinaryUrl) {
          throw createUploadError("Invalid response from server", {
            code: "INVALID_RESPONSE",
            retryable: true,
          });
        }

        // Complete progress
        updateProgress(file.size, file.size);

        return cloudinaryUrl;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          throw createUploadError("Upload cancelled", {
            code: "CANCELLED",
            retryable: false,
          });
        }

        if (err instanceof Error && err.message.includes("fetch")) {
          throw createUploadError(
            "Network error. Please check your connection.",
            {
              code: "NETWORK_ERROR",
              retryable: true,
              cause: err,
            }
          );
        }

        if (err instanceof Error && (err as UploadError).code) {
          throw err;
        }

        throw createUploadError("An unexpected error occurred", {
          code: "UNKNOWN_ERROR",
          retryable: false,
          cause: err instanceof Error ? err : new Error(String(err)),
        });
      }
    },
    [validateFile, updateProgress, onProgress, showToasts, toast, cancel]
  );

  const upload = useCallback(
    async (file: File, documentType?: string): Promise<string> => {
      setIsUploading(true);
      setError(null);
      setLastUploadParams({ file, documentType });
      updateProgress(0, file.size);


      let lastError: UploadError;

      for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
          const cloudinaryUrl = await performUpload(
            file,
            documentType,
            attempt
          );

          // Success
          if (showToasts && toastIdRef.current) {
            toast.dismissAll();
            toast.showUploadSuccess(file.name);
          }

          setIsUploading(false);
          onSuccess?.(cloudinaryUrl, file.name);
          return cloudinaryUrl;
        } catch (err) {
          const uploadError = err as UploadError;
          lastError = uploadError;

          // If not retryable or last attempt, break
          if (!uploadError.retryable || attempt === config.maxAttempts) {
            break;
          }

          // Calculate delay for next attempt
          const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
            config.maxDelay
          );

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // All attempts failed
      setIsUploading(false);
      setError(lastError!);

      if (showToasts && toastIdRef.current) {
        toast.dismissAll();
        toast.showUploadError(
          file.name,
          lastError!.message,
          undefined, // Remove retry callback to avoid circular dependency
          () => {
            // Report error functionality could be added here
            console.error("Upload error reported:", lastError!);
          }
        );
      }

      onError?.(lastError!, file.name);
      throw lastError!;
    },
    [
      config,
      onSuccess,
      onError,
      showToasts,
      toast,
      updateProgress,
      performUpload,
    ]
  );

  const retry = useCallback(() => {
    if (lastUploadParams && !isUploading) {
      setIsUploading(true);
      setError(null);
      updateProgress(0, lastUploadParams.file.size);

      

      performUpload(lastUploadParams.file, lastUploadParams.documentType)
        .then((cloudinaryUrl) => {
          // Success
          if (showToasts && toastIdRef.current) {
            toast.dismissAll();
            toast.showUploadSuccess(lastUploadParams.file.name);
          }
          setIsUploading(false);
          onSuccess?.(cloudinaryUrl, lastUploadParams.file.name);
        })
        .catch((err) => {
          const uploadError = err as UploadError;
          setIsUploading(false);
          setError(uploadError);

          if (showToasts && toastIdRef.current) {
            toast.dismissAll();
            toast.showUploadError(
              lastUploadParams.file.name,
              uploadError.message,
              undefined, // Remove retry callback to avoid circular dependency
              () => {
                console.error("Upload error reported:", uploadError);
              }
            );
          }
          onError?.(uploadError, lastUploadParams.file.name);
        });
    }
  }, [
    lastUploadParams,
    isUploading,
    performUpload,
    showToasts,
    toast,
    updateProgress,
    onSuccess,
    onError,
  ]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (showToasts && toastIdRef.current) {
      toast.dismissAll();
    }

    setIsUploading(false);
    setUploadProgress(null);
    setError(null);
    setLastUploadParams(null);
    toastIdRef.current = null;
  }, [showToasts, toast]);

  const canRetry = Boolean(
    lastUploadParams && !isUploading && error?.retryable
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    upload,
    uploadProgress,
    isUploading,
    error,
    reset,
    cancel,
    retry,
    canRetry,
  };
}

// Hook for multiple file uploads with enhanced error handling
export function useEnhancedMultipleFileUpload({
  onProgress,
  onSuccess,
  onError,
  retryConfig = {},
  showToasts = true,
  validateFile = DEFAULT_FILE_VALIDATION,
}: UseEnhancedFileUploadOptions = {}) {
  const [uploads, setUploads] = useState<
    Map<
      string,
      {
        progress: UploadProgress;
        error: UploadError | null;
        status: "pending" | "uploading" | "success" | "error" | "cancelled";
        url?: string;
      }
    >
  >(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const toast = useEnhancedToast();
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  const uploadMultiple = useCallback(
    async (
      files: Array<{ file: File; id: string; documentType?: string }>
    ): Promise<Array<{ id: string; url: string; error?: UploadError }>> => {
      setIsUploading(true);

      // Initialize upload states
      const initialUploads = new Map();
      files.forEach(({ id, file }) => {
        initialUploads.set(id, {
          progress: { loaded: 0, total: file.size, percentage: 0 },
          error: null,
          status: "pending" as const,
        });
      });
      setUploads(initialUploads);

      const results: Array<{ id: string; url: string; error?: UploadError }> =
        [];

      // Upload files sequentially to avoid hook issues
      for (const { file, id, documentType } of files) {
        try {
          // Update status to uploading
          setUploads((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(id);
            if (current) {
              newMap.set(id, { ...current, status: "uploading" });
            }
            return newMap;
          });

          // Perform upload using fetch directly to avoid hook issues
          const formData = new FormData();
          formData.append("file", file);
          if (documentType) {
            formData.append("documentType", documentType);
          }

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
          }

          const data = await response.json();
          const url = data.url;

          if (!url) {
            throw new Error("Invalid response from server");
          }

          // Update success status
          setUploads((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(id);
            if (current) {
              newMap.set(id, {
                ...current,
                status: "success",
                url,
                progress: {
                  loaded: file.size,
                  total: file.size,
                  percentage: 100,
                },
              });
            }
            return newMap;
          });

          results.push({ id, url });
        } catch (error) {
          const uploadError = error as UploadError;

          // Update error status
          setUploads((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(id);
            if (current) {
              newMap.set(id, {
                ...current,
                status: "error",
                error: uploadError,
              });
            }
            return newMap;
          });

          results.push({ id, url: "", error: uploadError });
        }
      }

      const successful = results.filter((r) => !r.error);
      const failed = results.filter((r) => r.error);

      if (showToasts) {
        if (successful.length > 0) {
          toast.showSuccess(
            `${successful.length} file${
              successful.length > 1 ? "s" : ""
            } uploaded successfully`,
            "Upload Complete"
          );
        }

        if (failed.length > 0) {
          toast.showError(
            `${failed.length} file${
              failed.length > 1 ? "s" : ""
            } failed to upload`,
            "Upload Errors"
          );
        }
      }

      setIsUploading(false);
      return results;
    },
    [showToasts, toast]
  );

  const getUploadState = useCallback(
    (id: string) => {
      return uploads.get(id) || null;
    },
    [uploads]
  );

  const retryUpload = useCallback(
    (id: string, file: File, documentType?: string) => {
      // Implementation for retrying individual uploads
      // This would need to be implemented based on specific requirements
    },
    []
  );

  const reset = useCallback(() => {
    setUploads(new Map());
    setIsUploading(false);
  }, []);

  return {
    uploadMultiple,
    isUploading,
    getUploadState,
    retryUpload,
    reset,
  };
}
