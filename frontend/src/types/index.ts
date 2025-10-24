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

export interface User {
  id: string;
  email: string;
  name: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
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

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  insuranceInterest: InsuranceType;
  status: LeadStatus;
  priority: Priority;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone: string;
  insuranceInterest: InsuranceType;
  status?: LeadStatus;
  priority?: Priority;
  notes?: string;
}

// Client types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age?: number;
  address?: string;
  createdAt: string;
  updatedAt: string;
  policies?: Policy[];
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age?: number;
  address?: string;
}

export interface ClientWithPolicies extends Client {
  policies: Policy[];
  totalPolicies: number;
  activePolicies: number;
  totalPremium: number;
  totalCommission: number;
}

// Policy Template - Master policy information
export interface PolicyTemplate {
  id: string;
  policyNumber: string;
  policyType: InsuranceType;
  provider: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  instances?: PolicyInstance[];
}

// Policy Instance - Client-specific policy details
export interface PolicyInstance {
  id: string;
  policyTemplateId: string;
  clientId: string;
  premiumAmount: number;
  status: 'Active' | 'Expired' | 'Cancelled';
  startDate: string;
  expiryDate: string;
  commissionAmount: number;
  createdAt: string;
  updatedAt: string;
  policyTemplate?: PolicyTemplate;
  client?: Client;
}

// Combined view for display purposes
export interface PolicyWithClientInfo {
  id: string;
  policyNumber: string;
  policyType: InsuranceType;
  provider: string;
  description?: string;
  premiumAmount: number;
  status: 'Active' | 'Expired' | 'Cancelled';
  startDate: string;
  expiryDate: string;
  commissionAmount: number;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface CreatePolicyTemplateRequest {
  policyNumber: string;
  policyType: InsuranceType;
  provider: string;
  description?: string;
}

export interface CreatePolicyInstanceRequest {
  policyTemplateId: string;
  premiumAmount: number;
  startDate: string;
  expiryDate: string;
  commissionAmount: number;
}

export interface UpdatePolicyInstanceRequest extends Partial<CreatePolicyInstanceRequest> {
  status?: 'Active' | 'Expired' | 'Cancelled';
}

// Legacy Policy interface for backward compatibility
export interface Policy {
  id: string;
  policyNumber: string;
  policyType: InsuranceType;
  provider: string;
  description?: string;
  premiumAmount: number;
  status: 'Active' | 'Expired' | 'Cancelled';
  startDate: string;
  expiryDate: string;
  commissionAmount: number;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreatePolicyRequest extends CreatePolicyTemplateRequest {
  premiumAmount: number;
  startDate: string;
  expiryDate: string;
  commissionAmount: number;
}

export interface UpdatePolicyRequest extends Partial<CreatePolicyRequest> {
  status?: 'Active' | 'Expired' | 'Cancelled';
}

export interface PolicyStats {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  cancelledPolicies: number;
  totalPremium: number;
  totalCommission: number;
  policiesByType: Record<InsuranceType, number>;
  expiringPolicies: PolicyWithClientInfo[]; // Expiring within 30 days
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
  // Policy template system statistics
  policyTemplateStats?: {
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
  };
  // Expiry warnings for dashboard alerts
  expiryWarnings?: {
    expiringThisWeek: number;
    expiringThisMonth: number;
    expiredLastMonth: number;
  };
}

export interface ChartData {
  status: string;
  count: number;
}

// Activity types
export interface Activity {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

// Policy Page specific types
export interface PolicyPageFilters {
  search?: string;
  policyTypes?: InsuranceType[];
  status?: 'Active' | 'Expired' | 'Cancelled' | 'All';
  providers?: string[];
  expiryDateRange?: {
    start?: string;
    end?: string;
  };
  premiumRange?: {
    min?: number;
    max?: number;
  };
  commissionRange?: {
    min?: number;
    max?: number;
  };
}

export interface PolicyPageSort {
  field: 'policyNumber' | 'clientName' | 'policyType' | 'provider' | 'premiumAmount' | 'commissionAmount' | 'status' | 'startDate' | 'expiryDate' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface PolicyWithClientInfo extends Policy {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface BulkPolicyOperation {
  type: 'delete' | 'updateStatus' | 'export';
  policyIds: string[];
  data?: {
    status?: 'Active' | 'Expired' | 'Cancelled';
    exportFormat?: 'csv';
  };
}

export interface BulkOperationResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  failures?: {
    policyId: string;
    error: string;
  }[];
  message?: string;
}

export interface PolicyPageStats extends PolicyStats {
  topProviders: {
    provider: string;
    count: number;
    totalPremium: number;
    totalCommission: number;
  }[];
  monthlyTrends: {
    month: string;
    newPolicies: number;
    expiredPolicies: number;
    totalPremium: number;
    totalCommission: number;
  }[];
  expiringThisMonth: number;
  expiringNext30Days: number;
}

export interface PolicyPageQuery {
  page?: number;
  limit?: number;
  filters?: PolicyPageFilters;
  sort?: PolicyPageSort;
  includeClient?: boolean;
  includeStats?: boolean;
}

export interface PolicyPageResponse {
  policies: PolicyWithClientInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: PolicyPageStats;
}

// Policy Template specific types
export interface PolicyTemplateWithStats extends PolicyTemplate {
  instanceCount: number;
  activeInstanceCount: number;
}

export interface PolicyTemplateFilters {
  search?: string;
  policyTypes?: InsuranceType[];
  providers?: string[];
  hasInstances?: boolean;
}

export interface PolicyTemplateSort {
  field: 'policyNumber' | 'policyType' | 'provider' | 'instanceCount' | 'activeInstanceCount' | 'createdAt';
  direction: 'asc' | 'desc';
}

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
    type: InsuranceType;
    templateCount: number;
    instanceCount: number;
  }>;
}

export interface PolicyTemplateQuery {
  page?: number;
  limit?: number;
  filters?: PolicyTemplateFilters;
  sort?: PolicyTemplateSort;
  includeStats?: boolean;
}

export interface PolicyTemplateResponse {
  templates: PolicyTemplateWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: PolicyTemplateStats;
  filters?: {
    availableProviders: string[];
    availablePolicyTypes: InsuranceType[];
  };
}

// Policy Detail Page types
export interface PolicyInstanceWithClient extends PolicyInstance {
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface PolicyInstanceWithTemplate extends PolicyInstance {
  policyTemplate?: PolicyTemplate;
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
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

export interface PolicyDetailResponse {
  template: PolicyTemplate;
  instances: PolicyInstanceWithClient[];
  stats: PolicyDetailStats;
}