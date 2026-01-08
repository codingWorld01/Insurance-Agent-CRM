// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Standard API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
  statusCode: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Lead types
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost';
export type Priority = 'Hot' | 'Warm' | 'Cold';
export type InsuranceType = 'Life' | 'Health' | 'Auto' | 'Home' | 'Business';

export interface CreateLeadRequest {
  name: string;
  email?: string;
  phone: string;
  whatsappNumber?: string;
  dateOfBirth?: string;
  insuranceInterest: InsuranceType;
  status?: LeadStatus;
  priority?: Priority;
  notes?: string;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  id: string;
}

// Client types
export interface CreateClientRequest {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO date string
  address?: string;
  additionalInfo?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: string;
}

// Policy types
export interface CreatePolicyRequest {
  policyNumber: string;
  policyType: InsuranceType;
  provider: string;
  premiumAmount: number;
  status?: 'Active' | 'Expired';
  startDate: string; // ISO date string
  expiryDate: string; // ISO date string
  commissionAmount: number;
  clientId: string;
}

// Policy Template types
export interface PolicyTemplate {
  id: string;
  policyNumber: string;
  policyType: InsuranceType;
  provider: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  instanceCount?: number;
  activeInstanceCount?: number;
}

export interface CreatePolicyTemplateRequest {
  policyNumber: string;
  policyType: InsuranceType;
  provider: string;
  description?: string;
}

export interface UpdatePolicyTemplateRequest extends Partial<CreatePolicyTemplateRequest> {}

// Policy Instance types
export interface PolicyInstance {
  id: string;
  policyTemplateId: string;
  clientId: string;
  premiumAmount: number;
  status: 'Active' | 'Expired';
  startDate: string;
  expiryDate: string;
  commissionAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyInstanceRequest {
  policyTemplateId: string;
  premiumAmount: number;
  startDate: string;
  durationMonths: number;
  commissionAmount: number;
}

export interface UpdatePolicyInstanceRequest extends Partial<CreatePolicyInstanceRequest> {
  status?: 'Active' | 'Expired';
  expiryDate?: string;
}

// Dashboard types
export interface DashboardStats {
  totalLeads: number;
  totalClients: number;
  activePolices: number;
  commissionThisMonth: number;
  leadsChange: number;
  clientsChange: number;
  policiesChange: number;
  commissionChange: number;
}

// Policy Template Statistics types
export interface PolicyTemplateStats {
  totalTemplates: number;
  totalInstances: number;
  activeInstances: number;
  totalClients: number;
  topProviders: Array<{
    provider: string;
    templateCount: number;
    instanceCount: number;
  }>;
  policyTypeDistribution: Array<{
    type: string;
    templateCount: number;
    instanceCount: number;
  }>;
}

export interface PolicyDetailStats {
  totalClients: number;
  activeInstances: number;
  expiredInstances: number;
  totalPremium: number;
  totalCommission: number;
  averagePremium: number;
  expiringThisMonth: number;
}

export interface ExpiryTrackingStats {
  expiringThisWeek: number;
  expiringThisMonth: number;
  expiringNextMonth: number;
  expiredLastMonth: number;
  expiringInstances: Array<{
    id: string;
    clientName: string;
    policyNumber: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }>;
}

export interface SystemLevelMetrics {
  totalRevenue: number;
  totalCommission: number;
  averageInstanceValue: number;
  clientRetentionRate: number;
  policyRenewalRate: number;
  monthlyGrowthRate: number;
  topPerformingTemplates: Array<{
    id: string;
    policyNumber: string;
    instanceCount: number;
    totalRevenue: number;
    averageValue: number;
  }>;
}

export interface ProviderPerformanceMetrics {
  provider: string;
  templateCount: number;
  instanceCount: number;
  totalRevenue: number;
  averageInstanceValue: number;
  activeInstancesRatio: number;
  expiryRate: number;
}

export interface PolicyTypePerformanceMetrics {
  policyType: string;
  templateCount: number;
  instanceCount: number;
  totalRevenue: number;
  averageInstanceValue: number;
  popularityRank: number;
  growthRate: number;
}

export interface ChartData {
  status: string;
  count: number;
}

// Activity types
export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  createdAt: Date;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Re-export global types
export type { JWTPayload, AuthenticatedRequest } from './global';