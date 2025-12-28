"use client";

import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle 
} from "lucide-react";
import { PolicyDetailStats as PolicyDetailStatsType } from "@/types";
import { formatCurrency } from "@/utils/currencyUtils";

interface PolicyDetailStatsProps {
  stats: PolicyDetailStatsType;
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  isLoading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  isLoading, 
  icon: Icon, 
  bgColor, 
  borderColor, 
  iconBg, 
  iconColor, 
  textColor 
}: StatCardProps) => {
  if (isLoading) {
    return (
      <div className={`${bgColor} p-4 rounded-lg border ${borderColor}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBg} rounded-lg`}>
            <div className="h-5 w-5 bg-gray-300 rounded animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-6 bg-gray-300 rounded animate-pulse w-20 mb-2" />
            <div className="h-4 bg-gray-300 rounded animate-pulse w-16 mb-1" />
            {subtitle && (
              <div className="h-3 bg-gray-300 rounded animate-pulse w-24" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgColor} p-4 rounded-lg border ${borderColor}`}>
      <div className="flex items-center gap-3">
      
        <div>
          <div className={`text-2xl font-bold ${textColor}`}>
            {value}
          </div>
          <div className={`text-sm font-medium ${textColor}`}>
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function PolicyDetailStats({ stats, loading }: PolicyDetailStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <StatCard
            key={i}
            title=""
            value={0}
            isLoading={true}
            icon={Users}
            bgColor="bg-gray-50"
            borderColor="border-gray-200"
            iconBg="bg-gray-100"
            iconColor="text-gray-600"
            textColor="text-gray-600"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          subtitle="Clients with this policy"
          isLoading={loading}
          icon={Users}
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          textColor="text-blue-600"
        />
        
        <StatCard
          title="Active Policies"
          value={stats.activeInstances}
          subtitle="Currently active"
          isLoading={loading}
          icon={CheckCircle}
          bgColor="bg-green-50"
          borderColor="border-green-200"
          iconBg="bg-green-100"
          iconColor="text-green-600"
          textColor="text-green-600"
        />
        
        <StatCard
          title="Expired Policies"
          value={stats.expiredInstances}
          subtitle="No longer active"
          isLoading={loading}
          icon={XCircle}
          bgColor="bg-red-50"
          borderColor="border-red-200"
          iconBg="bg-red-100"
          iconColor="text-red-600"
          textColor="text-red-600"
        />
        
        <StatCard
          title="Total Premium"
          value={formatCurrency(stats.totalPremium)}
          subtitle="Combined premium value"
          isLoading={loading}
          icon={DollarSign}
          bgColor="bg-purple-50"
          borderColor="border-purple-200"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          textColor="text-purple-600"
        />
        
        <StatCard
          title="Total Commission"
          value={formatCurrency(stats.totalCommission)}
          subtitle="Total commission earned"
          isLoading={loading}
          icon={TrendingUp}
          bgColor="bg-emerald-50"
          borderColor="border-emerald-200"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          textColor="text-emerald-600"
        />
        
        <StatCard
          title="Expiring This Month"
          value={stats.expiringThisMonth}
          subtitle="Require attention"
          isLoading={loading}
          icon={AlertTriangle}
          bgColor={stats.expiringThisMonth > 0 ? "bg-amber-50" : "bg-gray-50"}
          borderColor={stats.expiringThisMonth > 0 ? "border-amber-200" : "border-gray-200"}
          iconBg={stats.expiringThisMonth > 0 ? "bg-amber-100" : "bg-gray-100"}
          iconColor={stats.expiringThisMonth > 0 ? "text-amber-600" : "text-gray-600"}
          textColor={stats.expiringThisMonth > 0 ? "text-amber-600" : "text-gray-600"}
        />
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Summary */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Premium</span>
              <span className="font-medium">{formatCurrency(stats.averagePremium)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Rate</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {stats.totalClients > 0 
                    ? Math.round((stats.activeInstances / stats.totalClients) * 100)
                    : 0}%
                </span>
                <Badge 
                  variant={
                    stats.totalClients > 0 && (stats.activeInstances / stats.totalClients) >= 0.8
                      ? "default"
                      : (stats.activeInstances / stats.totalClients) >= 0.5
                        ? "secondary"
                        : "destructive"
                  }
                  className="text-xs"
                >
                  {stats.totalClients > 0 && (stats.activeInstances / stats.totalClients) >= 0.8
                    ? "Excellent"
                    : (stats.activeInstances / stats.totalClients) >= 0.5
                      ? "Good"
                      : "Needs Attention"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Commission Rate</span>
              <span className="font-medium">
                {stats.totalPremium > 0 
                  ? Math.round((stats.totalCommission / stats.totalPremium) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Alerts & Notifications</h3>
          <div className="space-y-3">
            {stats.expiringThisMonth > 0 ? (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">
                    {stats.expiringThisMonth} polic{stats.expiringThisMonth !== 1 ? 'ies' : 'y'} expiring this month
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Contact clients to discuss renewal options
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">
                    No policies expiring this month
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    All policies are in good standing
                  </p>
                </div>
              </div>
            )}

            {stats.expiredInstances > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-800">
                    {stats.expiredInstances} expired polic{stats.expiredInstances !== 1 ? 'ies' : 'y'}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Consider reaching out for renewal opportunities
                  </p>
                </div>
              </div>
            )}

            {stats.totalClients === 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800">
                    No clients associated yet
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Start by adding clients to this policy template
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}