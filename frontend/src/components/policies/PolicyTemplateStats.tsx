'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PolicyTemplateStats as PolicyTemplateStatsType } from '@/types';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Building2,
  TrendingUp, 
  TrendingDown, 
  Minus 
} from 'lucide-react';

interface PolicyTemplateStatsProps {
  stats: PolicyTemplateStatsType | null;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  change?: number;
  isLoading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'info';
  onClick?: () => void;
  formatter?: (value: number) => string;
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  change, 
  isLoading, 
  icon: Icon, 
  variant = 'default',
  onClick,
  formatter 
}: StatCardProps) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    return formatter ? formatter(val) : val.toLocaleString();
  };

  const getChangeIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" aria-hidden="true" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" aria-hidden="true" />;
    return <Minus className="h-3 w-3 text-gray-400" aria-hidden="true" />;
  };

  const getChangeColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'info':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      default:
        return onClick ? 'hover:bg-gray-50 cursor-pointer' : '';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card 
        role="status" 
        aria-label={`Loading ${title} statistic`}
        className={getVariantStyles()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            {subtitle && (
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20" aria-hidden="true"></div>
            )}
            {change !== undefined && (
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24" aria-hidden="true"></div>
            )}
          </div>
          <span className="sr-only">Loading {title}...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      role="region" 
      aria-labelledby={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}
      className={getVariantStyles()}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle 
          id={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="text-sm font-medium text-muted-foreground"
        >
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${getIconColor()}`} aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold">
          {formatValue(value)}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {change !== undefined && (
          <div 
            className={`flex items-center text-xs mt-1 ${getChangeColor()}`}
            aria-label={`${title} change from last month`}
          >
            {getChangeIcon()}
            <span className="ml-1">
              {Math.abs(change)}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function PolicyTemplateStats({ stats, isLoading }: PolicyTemplateStatsProps) {
  const topProvider = stats?.topProviders?.[0];

  return (
    <div 
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      role="region"
      aria-label="Policy template statistics"
    >
      <StatCard
        title="Total Templates"
        value={stats?.totalTemplates ?? 0}
        subtitle="Policy templates created"
        isLoading={isLoading}
        icon={FileText}
      />
      
      <StatCard
        title="Total Instances"
        value={stats?.totalInstances ?? 0}
        subtitle={`${stats?.activeInstances ?? 0} active`}
        isLoading={isLoading}
        icon={CheckCircle}
      />
      
      <StatCard
        title="Total Clients"
        value={stats?.totalClients ?? 0}
        subtitle="Clients with policies"
        isLoading={isLoading}
        icon={Users}
      />
      
      <StatCard
        title="Top Provider"
        value={topProvider?.provider ?? 'None'}
        subtitle={topProvider ? `${topProvider.templateCount} templates` : 'No providers yet'}
        isLoading={isLoading}
        icon={Building2}
      />
    </div>
  );
}