# Policy Template Statistics and Aggregation Services

This document outlines the implementation of comprehensive statistics and aggregation services for the policy template system.

## Implemented Services

### 1. PolicyTemplateStatsService

**Location**: `backend/src/services/policyTemplateStatsService.ts`

**Purpose**: Provides comprehensive statistics calculation for policy templates and instances.

**Key Methods**:
- `calculatePolicyTemplateStats()` - Calculate overview statistics with filtering
- `calculatePolicyDetailStats()` - Get detailed stats for a specific template
- `getSystemLevelMetrics()` - System-wide performance metrics
- `getProviderPerformanceMetrics()` - Provider-specific performance data
- `getPolicyTypePerformanceMetrics()` - Policy type performance analysis
- `getExpiryTrackingStats()` - Expiry tracking and warnings

**Features**:
- Template and instance count aggregations
- Provider and policy type distribution analysis
- Revenue and commission calculations
- Client retention and renewal rate metrics
- Top performing templates identification
- Growth rate calculations

### 2. ExpiryTrackingService

**Location**: `backend/src/services/expiryTrackingService.ts`

**Purpose**: Manages policy expiry tracking and warning systems.

**Key Methods**:
- `getExpiringPolicies()` - Get policies expiring with warning levels
- `getExpiringPoliciesByLevel()` - Group expiring policies by urgency
- `getExpirySummary()` - Summary statistics for expiry tracking
- `getClientExpiringPolicies()` - Client-specific expiry warnings
- `getTemplateExpiringPolicies()` - Template-specific expiry warnings
- `updateExpiredPolicyStatuses()` - Automatically update expired policies
- `generateExpiryWarnings()` - Generate and log expiry warnings

**Features**:
- Configurable warning levels (critical, warning, info)
- Revenue at risk calculations
- Automatic expiry status updates
- Client and template-specific expiry tracking
- Activity logging for expiry events

## API Endpoints

### Statistics Endpoints

**Base URL**: `/api/policy-templates/stats/`

1. **GET /overview** - Get comprehensive policy template statistics
2. **GET /expiry-tracking** - Get expiry tracking statistics
3. **GET /system-metrics** - Get system-level metrics
4. **GET /provider-performance** - Get provider performance metrics
5. **GET /policy-type-performance** - Get policy type performance metrics

### Template-Specific Endpoints

1. **GET /api/policy-templates/:id/stats** - Get detailed stats for a specific template
2. **GET /api/policy-templates/:id/expiry/warnings** - Get expiry warnings for a template

### Expiry Management Endpoints

**Base URL**: `/api/policy-templates/expiry/`

1. **GET /warnings** - Get expiring policies with warning levels
2. **GET /summary** - Get expiry summary statistics
3. **POST /update-expired** - Automatically update expired policy statuses

## Data Types

### Statistics Types

```typescript
interface PolicyTemplateStats {
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

interface SystemLevelMetrics {
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
```

### Expiry Tracking Types

```typescript
interface ExpiryWarning {
  id: string;
  clientName: string;
  policyNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  warningLevel: 'critical' | 'warning' | 'info';
}

interface ExpiryTrackingConfig {
  criticalDays: number; // Default: 7
  warningDays: number;  // Default: 30
  infoDays: number;     // Default: 60
}
```

## Integration Points

### Dashboard Integration

- Enhanced dashboard statistics include policy template metrics
- Expiry warnings integrated into dashboard alerts
- Real-time statistics updates after policy operations

### Activity Logging

All statistics operations are logged with appropriate activity entries:
- Statistics access logging
- Expiry warning generation
- Automatic expiry updates
- Performance metrics access

### Error Handling

- Comprehensive error handling with fallback values
- Database connection error resilience
- Graceful degradation when data is unavailable

## Usage Examples

### Get Policy Template Statistics

```typescript
// Get overview statistics with filtering
const stats = await PolicyTemplateStatsService.calculatePolicyTemplateStats({
  policyType: { in: ['Life', 'Health'] },
  provider: { in: ['Provider A'] }
});

// Get system-level metrics
const metrics = await PolicyTemplateStatsService.getSystemLevelMetrics();
```

### Expiry Tracking

```typescript
// Get expiring policies with custom configuration
const warnings = await ExpiryTrackingService.getExpiringPoliciesByLevel({
  criticalDays: 5,
  warningDays: 15,
  infoDays: 45
});

// Update expired policies automatically
const result = await ExpiryTrackingService.updateExpiredPolicyStatuses();
```

## Performance Considerations

- Efficient database queries with proper indexing
- Aggregation queries optimized for large datasets
- Caching strategies for frequently accessed statistics
- Pagination support for large result sets

## Requirements Fulfilled

This implementation addresses all requirements from task 3:

✅ **7.1** - Policy template statistics calculation
✅ **7.2** - Template-level and system-level metrics aggregation
✅ **7.3** - Provider and policy type distribution calculations
✅ **7.4** - Expiry tracking and warning systems
✅ **7.5** - Revenue and commission aggregations
✅ **7.6** - Performance metrics and insights
✅ **7.7** - Activity logging and audit trails