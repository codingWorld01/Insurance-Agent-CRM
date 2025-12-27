'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StatsCards from '@/components/dashboard/StatsCards';
import LeadsChart from '@/components/dashboard/LeadsChart';
import RecentActivities from '@/components/dashboard/RecentActivities';
import PolicyTemplateInsights from '@/components/dashboard/PolicyTemplateInsights';
import { useDashboardContext } from '@/context/DashboardContext';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { stats, chartData, activities, isLoading, error } = useDashboardContext();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleAddNewLead = () => {
    router.push('/dashboard/leads');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleAddNewLead} className="flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            Add New Lead
          </Button>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Welcome back, {user?.name}!</p>
        </div>
        <Button 
          onClick={handleAddNewLead} 
          className="flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
          aria-label="Add new lead"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="sm:inline">Add New Lead</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Charts and Activities */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <LeadsChart data={chartData} isLoading={isLoading} />
        <RecentActivities activities={activities} isLoading={isLoading} />
        <PolicyTemplateInsights stats={stats} isLoading={isLoading} />
      </div>
    </div>
  );
}