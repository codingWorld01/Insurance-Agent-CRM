'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LeadForm } from '@/components/leads/LeadForm';
import { CreateLeadRequest } from '@/types';
import { useToastNotifications } from '@/hooks/useToastNotifications';

export default function CreateLeadPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToastNotifications();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateLeadRequest) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create lead');
      }

      const result = await response.json();
      if (result.success) {
        showSuccess("Lead created successfully");
        router.push('/dashboard/leads');
      } else {
        throw new Error(result.message || 'Failed to create lead');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to create lead.");
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/leads');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leads
        </Button>
        <div className="text-sm text-gray-500">
          Leads / Create New Lead
        </div>
      </div>

      {/* Create Lead Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            lead={null}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}