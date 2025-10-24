"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import { CheckCircle, AlertCircle, Info, Zap } from "lucide-react";

export function ToastDemo() {
  const { showSuccess, showError, showInfo } = useToastNotifications();

  const handleSuccessToast = () => {
    showSuccess("This is a success message with white description text!", "Success");
  };

  const handleErrorToast = () => {
    showError("This is an error message with white description text!", "Error");
  };

  const handleInfoToast = () => {
    showInfo("This is an info message with white description text!", "Information");
  };



  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Toast Demo
        </CardTitle>
        <CardDescription>
          Test toast notifications with white descriptions in both light and dark themes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={handleSuccessToast}
          variant="default"
          className="w-full justify-start"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Show Success Toast
        </Button>
        
        <Button 
          onClick={handleErrorToast}
          variant="destructive"
          className="w-full justify-start"
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Show Error Toast
        </Button>
        
        <Button 
          onClick={handleInfoToast}
          variant="outline"
          className="w-full justify-start"
        >
          <Info className="mr-2 h-4 w-4" />
          Show Info Toast
        </Button>
        

        
        <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted rounded">
          <strong>Note:</strong> All toast descriptions display in white text regardless of the current theme (light or dark mode).
        </div>
      </CardContent>
    </Card>
  );
}