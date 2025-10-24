"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function PolicyDetailStats({ stats, loading }: PolicyDetailStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Clients with this policy",
    },
    {
      title: "Active Policies",
      value: stats.activeInstances,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Currently active",
    },
    {
      title: "Expired Policies",
      value: stats.expiredInstances,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "No longer active",
    },
    {
      title: "Total Premium",
      value: formatCurrency(stats.totalPremium),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Combined premium value",
    },
    {
      title: "Total Commission",
      value: formatCurrency(stats.totalCommission),
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Total commission earned",
    },
    {
      title: "Expiring This Month",
      value: stats.expiringThisMonth,
      icon: AlertTriangle,
      color: stats.expiringThisMonth > 0 ? "text-amber-600" : "text-gray-600",
      bgColor: stats.expiringThisMonth > 0 ? "bg-amber-50" : "bg-gray-50",
      description: "Require attention",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}