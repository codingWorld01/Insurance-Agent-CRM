'use client';

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
  bgColor: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
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
  bgColor, 
  borderColor, 
  iconBg, 
  iconColor, 
  textColor,
  onClick,
  formatter 
}: StatCardProps) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    return formatter ? formatter(val) : val.toLocaleString();
  };

  const getChangeIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

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
    <div 
      className={`${bgColor} p-4 rounded-lg border ${borderColor} ${onClick ? 'hover:bg-opacity-80 cursor-pointer' : ''}`}
      onClick={onClick}
      role="region"
      aria-labelledby={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <div className={`text-2xl font-bold ${textColor}`}>
            {formatValue(value)}
          </div>
          <div className={`text-sm font-medium ${textColor}`}>
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">
              {subtitle}
            </div>
          )}
          {change !== undefined && (
            <div className="flex items-center text-xs text-gray-500 mt-1">
              {getChangeIcon()}
              <span className="ml-1">
                {Math.abs(change)}% from last month
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function PolicyTemplateStats({ stats, isLoading }: PolicyTemplateStatsProps) {
  const topProvider = stats?.topProviders?.[0];

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      role="region"
      aria-label="Policy template statistics"
    >
      <StatCard
        title="Total Templates"
        value={stats?.totalTemplates ?? 0}
        subtitle="Policy templates created"
        isLoading={isLoading}
        icon={FileText}
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
        textColor="text-blue-600"
      />
      
      <StatCard
        title="Total Instances"
        value={stats?.totalInstances ?? 0}
        subtitle={`${stats?.activeInstances ?? 0} active`}
        isLoading={isLoading}
        icon={CheckCircle}
        bgColor="bg-green-50"
        borderColor="border-green-200"
        iconBg="bg-green-100"
        iconColor="text-green-600"
        textColor="text-green-600"
      />
      
      <StatCard
        title="Total Clients"
        value={stats?.totalClients ?? 0}
        subtitle="Clients with policies"
        isLoading={isLoading}
        icon={Users}
        bgColor="bg-purple-50"
        borderColor="border-purple-200"
        iconBg="bg-purple-100"
        iconColor="text-purple-600"
        textColor="text-purple-600"
      />
      
      <StatCard
        title="Top Provider"
        value={topProvider?.provider ?? 'None'}
        subtitle={topProvider ? `${topProvider.templateCount} templates` : 'No providers yet'}
        isLoading={isLoading}
        icon={Building2}
        bgColor="bg-orange-50"
        borderColor="border-orange-200"
        iconBg="bg-orange-100"
        iconColor="text-orange-600"
        textColor="text-orange-600"
      />
    </div>
  );
}