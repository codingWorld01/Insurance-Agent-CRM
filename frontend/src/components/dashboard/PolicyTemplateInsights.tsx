'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats } from '@/types';
import { AlertTriangle, TrendingUp, Users, FileText } from 'lucide-react';
import Link from 'next/link';

interface PolicyTemplateInsightsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export default function PolicyTemplateInsights({ stats, isLoading }: PolicyTemplateInsightsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Policy Template Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const templateStats = stats?.policyTemplateStats;
  const expiryWarnings = stats?.expiryWarnings;

  if (!templateStats && !expiryWarnings) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Policy Template Insights</CardTitle>
        <Link 
          href="/dashboard/policy-templates" 
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All Templates
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Overview */}
        {templateStats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Templates</p>
                <p className="text-lg font-semibold">{templateStats.totalTemplates}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active Instances</p>
                <p className="text-lg font-semibold">{templateStats.activeInstances}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expiry Warnings */}
        {expiryWarnings && (expiryWarnings.expiringThisWeek > 0 || expiryWarnings.expiringThisMonth > 0) && (
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h4 className="font-medium text-sm">Expiry Alerts</h4>
            </div>
            <div className="space-y-2">
              {expiryWarnings.expiringThisWeek > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expiring this week</span>
                  <Badge variant="destructive" className="text-xs">
                    {expiryWarnings.expiringThisWeek}
                  </Badge>
                </div>
              )}
              {expiryWarnings.expiringThisMonth > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expiring this month</span>
                  <Badge variant="secondary" className="text-xs">
                    {expiryWarnings.expiringThisMonth}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Providers */}
        {templateStats && templateStats.topProviders.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <h4 className="font-medium text-sm">Top Providers</h4>
            </div>
            <div className="space-y-2">
              {templateStats.topProviders.slice(0, 3).map((provider, index) => (
                <div key={provider.provider} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                    <span className="text-sm">{provider.provider}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {provider.instanceCount} instances
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Policy Type Distribution */}
        {templateStats && templateStats.policyTypeDistribution.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-2">Policy Types</h4>
            <div className="flex flex-wrap gap-1">
              {templateStats.policyTypeDistribution.slice(0, 4).map((type) => (
                <Badge key={type.type} variant="secondary" className="text-xs">
                  {type.type} ({type.instanceCount})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}