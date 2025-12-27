'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  change: number;
  isLoading: boolean;
  formatter?: (value: number) => string;
}

const StatCard = ({ title, value, change, isLoading, formatter }: StatCardProps) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    return formatter ? formatter(val) : val.toLocaleString();
  };

  const getChangeIcon = () => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />;
    return <Minus className="h-4 w-4 text-gray-400" aria-hidden="true" />;
  };

  const getChangeColor = () => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  const getChangeDescription = () => {
    if (change > 0) return 'increased';
    if (change < 0) return 'decreased';
    return 'unchanged';
  };

  if (isLoading) {
    return (
      <Card role="status" aria-label={`Loading ${title} statistic`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-20" aria-hidden="true"></div>
          </div>
          <span className="sr-only">Loading {title}...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card role="region" aria-labelledby={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle 
          id={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="text-sm font-medium text-muted-foreground"
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold" aria-describedby={`change-${title.replace(/\s+/g, '-').toLowerCase()}`}>
          {formatValue(value)}
        </div>
        <div 
          id={`change-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className={`flex items-center text-xs ${getChangeColor()}`}
          aria-label={`${title} has ${getChangeDescription()} by ${Math.abs(change)} percent from last month`}
        >
          {getChangeIcon()}
          <span className="ml-1">
            {Math.abs(change)}% from last month
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div 
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      role="region"
      aria-label="Dashboard statistics"
    >
      <StatCard
        title="Total Leads"
        value={stats?.totalLeads ?? 0}
        change={stats?.leadsChange ?? 0}
        isLoading={isLoading}
      />
      <StatCard
        title="Total Clients"
        value={stats?.totalClients ?? 0}
        change={stats?.clientsChange ?? 0}
        isLoading={isLoading}
      />
      <StatCard
        title="Active Policies"
        value={stats?.activePolices ?? 0}
        change={stats?.policiesChange ?? 0}
        isLoading={isLoading}
      />
      <StatCard
        title="Commission This Month"
        value={stats?.commissionThisMonth ?? 0}
        change={stats?.commissionChange ?? 0}
        isLoading={isLoading}
        formatter={formatCurrency}
      />
    </div>
  );
}