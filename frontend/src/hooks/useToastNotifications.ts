import React, { useCallback } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export function useToastNotifications() {
  const { theme, systemTheme } = useTheme();
  
  // Determine if we're in dark mode
  const isDarkMode = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  
  // Set description color based on theme
  const descriptionColor = isDarkMode ? "#ffffff" : "#000000";
  const descriptionClassName = isDarkMode ? "text-white" : "text-black";

  const showSuccess = useCallback((message: string, title?: string) => {
    toast.success(title || "Success", {
      description: message,
      style: {
        "--description-color": descriptionColor,
      } as React.CSSProperties,
      descriptionClassName,
    });
  }, [descriptionColor, descriptionClassName]);

  const showError = useCallback((message: string, title?: string) => {
    toast.error(title || "Error", {
      description: message,
      style: {
        "--description-color": descriptionColor,
      } as React.CSSProperties,
      descriptionClassName,
    });
  }, [descriptionColor, descriptionClassName]);

  const showInfo = useCallback((message: string, title?: string) => {
    toast.info(title || "Info", {
      description: message,
      style: {
        "--description-color": descriptionColor,
      } as React.CSSProperties,
      descriptionClassName,
    });
  }, [descriptionColor, descriptionClassName]);

  return {
    showSuccess,
    showError,
    showInfo,
  };
}
