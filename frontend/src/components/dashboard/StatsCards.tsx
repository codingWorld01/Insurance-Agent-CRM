'use client';

import { DashboardStats } from '@/types';
import { Users, Building2, Shield, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  change, 
  isLoading, 
  formatter, 
  icon: Icon, 
  bgColor, 
  borderColor, 
  iconBg, 
  iconColor, 
  textColor 
}: StatCardProps) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    return formatter ? formatter(val) : val.toLocaleString();
  };

  const getChangeIcon = () => {
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
            <div className="h-4 bg-gray-300 rounded animate-pulse w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgColor} p-4 rounded-lg border ${borderColor}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <div className={`text-2xl font-bold ${textColor}`}>
            {formatValue(value)}
          </div>
          <div className="flex items-center gap-1">
            <div className={`text-sm font-medium ${textColor}`}>
              {title}
            </div>
            
          </div>
        </div>
      </div>
    </div>
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      role="region"
      aria-label="Dashboard statistics"
    >
      <StatCard
        title="Total Leads"
        value={stats?.totalLeads ?? 0}
        change={stats?.leadsChange ?? 0}
        isLoading={isLoading}
        icon={Users}
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
        textColor="text-blue-600"
      />
      <StatCard
        title="Total Clients"
        value={stats?.totalClients ?? 0}
        change={stats?.clientsChange ?? 0}
        isLoading={isLoading}
        icon={Building2}
        bgColor="bg-green-50"
        borderColor="border-green-200"
        iconBg="bg-green-100"
        iconColor="text-green-600"
        textColor="text-green-600"
      />
      <StatCard
        title="Active Policies"
        value={stats?.activePolices ?? 0}
        change={stats?.policiesChange ?? 0}
        isLoading={isLoading}
        icon={Shield}
        bgColor="bg-purple-50"
        borderColor="border-purple-200"
        iconBg="bg-purple-100"
        iconColor="text-purple-600"
        textColor="text-purple-600"
      />
      <StatCard
        title="Commission This Month"
        value={stats?.commissionThisMonth ?? 0}
        change={stats?.commissionChange ?? 0}
        isLoading={isLoading}
        formatter={formatCurrency}
        icon={DollarSign}
        bgColor="bg-orange-50"
        borderColor="border-orange-200"
        iconBg="bg-orange-100"
        iconColor="text-orange-600"
        textColor="text-orange-600"
      />
    </div>
  );
}