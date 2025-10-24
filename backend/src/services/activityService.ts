import { prisma } from './database';

export class ActivityService {
  /**
   * Log an activity to the database
   */
  static async logActivity(action: string, description: string): Promise<void> {
    try {
      await prisma.activity.create({
        data: {
          action,
          description
        }
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to prevent activity logging from breaking main operations
    }
  }

  /**
   * Get recent activities with limit
   */
  static async getRecentActivities(limit: number = 5) {
    return await prisma.activity.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }

  // Lead-specific activity logging methods
  static async logLeadCreated(leadName: string): Promise<void> {
    await this.logActivity('lead_created', `Created new lead: ${leadName}`);
  }

  static async logLeadUpdated(leadName: string): Promise<void> {
    await this.logActivity('lead_updated', `Updated lead: ${leadName}`);
  }

  static async logLeadStatusUpdated(leadName: string, oldStatus: string, newStatus: string): Promise<void> {
    await this.logActivity(
      'lead_status_updated', 
      `Updated lead status: ${leadName} (${oldStatus} → ${newStatus})`
    );
  }

  static async logLeadDeleted(leadName: string): Promise<void> {
    await this.logActivity('lead_deleted', `Deleted lead: ${leadName}`);
  }

  static async logLeadConverted(leadName: string): Promise<void> {
    await this.logActivity('lead_converted', `Converted lead to client: ${leadName}`);
  }

  // Client-specific activity logging methods
  static async logClientCreated(clientName: string): Promise<void> {
    await this.logActivity('client_created', `Added new client: ${clientName}`);
  }

  static async logClientUpdated(clientName: string): Promise<void> {
    await this.logActivity('client_updated', `Updated client: ${clientName}`);
  }

  static async logClientDeleted(clientName: string, policyCount: number): Promise<void> {
    const policyText = policyCount > 0 ? ` (${policyCount} policies removed)` : '';
    await this.logActivity('client_deleted', `Deleted client: ${clientName}${policyText}`);
  }

  // Policy-specific activity logging methods
  static async logPolicyCreated(policyNumber: string, clientName: string): Promise<void> {
    await this.logActivity('policy_created', `Added new policy: ${policyNumber} for ${clientName}`);
  }

  static async logPolicyUpdated(policyNumber: string, clientName: string): Promise<void> {
    await this.logActivity('policy_updated', `Updated policy: ${policyNumber} for ${clientName}`);
  }

  static async logPolicyDeleted(policyNumber: string, clientName: string): Promise<void> {
    await this.logActivity('policy_deleted', `Deleted policy: ${policyNumber} for ${clientName}`);
  }

  static async logPolicyStatusChanged(policyNumber: string, clientName: string, newStatus: string): Promise<void> {
    await this.logActivity('policy_status_updated', `Policy ${policyNumber} status changed to ${newStatus} for ${clientName}`);
  }

  // Policy page specific activity logging methods
  static async logPolicyPageAccessed(filterCount?: number): Promise<void> {
    const filterText = filterCount ? ` with ${filterCount} filters applied` : '';
    await this.logActivity('policy_page_accessed', `Accessed global policies page${filterText}`);
  }

  static async logBulkPolicyOperation(operation: string, count: number, successCount: number): Promise<void> {
    const resultText = successCount === count 
      ? `Successfully ${operation} ${count} policies`
      : `${operation} ${successCount}/${count} policies (${count - successCount} failed)`;
    await this.logActivity('bulk_policy_operation', resultText);
  }

  static async logPolicyExport(count: number, format: string = 'CSV'): Promise<void> {
    await this.logActivity('policy_export', `Exported ${count} policies to ${format} format`);
  }

  static async logPolicySearch(query: string, resultCount: number): Promise<void> {
    await this.logActivity('policy_search', `Searched policies for "${query}" (${resultCount} results)`);
  }

  static async logPolicyFilterApplied(filterType: string, filterValue: string, resultCount: number): Promise<void> {
    await this.logActivity('policy_filter_applied', `Applied ${filterType} filter: ${filterValue} (${resultCount} results)`);
  }

  static async logPolicyCreatedFromGlobalPage(policyNumber: string, clientName: string): Promise<void> {
    await this.logActivity('policy_created_global', `Created policy ${policyNumber} for ${clientName} from policies page`);
  }

  static async logPolicyUpdatedFromGlobalPage(policyNumber: string, clientName: string): Promise<void> {
    await this.logActivity('policy_updated_global', `Updated policy ${policyNumber} for ${clientName} from policies page`);
  }

  static async logPolicyDeletedFromGlobalPage(policyNumber: string, clientName: string): Promise<void> {
    await this.logActivity('policy_deleted_global', `Deleted policy ${policyNumber} for ${clientName} from policies page`);
  }

  // Policy Template-specific activity logging methods
  static async logPolicyTemplateCreated(policyNumber: string, provider: string): Promise<void> {
    await this.logActivity('policy_template_created', `Created policy template: ${policyNumber} (${provider})`);
  }

  static async logPolicyTemplateUpdated(policyNumber: string, provider: string): Promise<void> {
    await this.logActivity('policy_template_updated', `Updated policy template: ${policyNumber} (${provider})`);
  }

  static async logPolicyTemplateDeleted(policyNumber: string, provider: string, affectedClients: number): Promise<void> {
    const clientText = affectedClients > 0 ? ` (${affectedClients} client associations removed)` : '';
    await this.logActivity('policy_template_deleted', `Deleted policy template: ${policyNumber} (${provider})${clientText}`);
  }

  static async logPolicyTemplateSearch(query: string, resultCount: number): Promise<void> {
    await this.logActivity('policy_template_search', `Searched policy templates for "${query}" (${resultCount} results)`);
  }

  // Policy Instance-specific activity logging methods
  static async logPolicyInstanceCreated(policyNumber: string, clientName: string): Promise<void> {
    await this.logActivity('policy_instance_created', `Added policy instance: ${policyNumber} for ${clientName}`);
  }

  static async logPolicyInstanceUpdated(policyNumber: string, clientName: string): Promise<void> {
    await this.logActivity('policy_instance_updated', `Updated policy instance: ${policyNumber} for ${clientName}`);
  }

  static async logPolicyInstanceDeleted(policyNumber: string, clientName: string): Promise<void> {
    await this.logActivity('policy_instance_deleted', `Deleted policy instance: ${policyNumber} for ${clientName}`);
  }

  static async logPolicyInstanceStatusChanged(policyNumber: string, clientName: string, newStatus: string): Promise<void> {
    await this.logActivity('policy_instance_status_updated', `Policy instance ${policyNumber} status changed to ${newStatus} for ${clientName}`);
  }

  // Policy Template Statistics activity logging methods
  static async logPolicyTemplateStatsAccessed(filterCount?: number): Promise<void> {
    const filterText = filterCount ? ` with ${filterCount} filters applied` : '';
    await this.logActivity('policy_template_stats_accessed', `Accessed policy template statistics${filterText}`);
  }

  static async logExpiryTrackingAccessed(): Promise<void> {
    await this.logActivity('expiry_tracking_accessed', 'Accessed policy expiry tracking dashboard');
  }

  static async logSystemMetricsAccessed(): Promise<void> {
    await this.logActivity('system_metrics_accessed', 'Accessed system-level policy metrics');
  }

  static async logProviderPerformanceAccessed(): Promise<void> {
    await this.logActivity('provider_performance_accessed', 'Accessed provider performance metrics');
  }

  static async logPolicyTypePerformanceAccessed(): Promise<void> {
    await this.logActivity('policy_type_performance_accessed', 'Accessed policy type performance metrics');
  }

  static async logPolicyDetailStatsAccessed(policyNumber: string): Promise<void> {
    await this.logActivity('policy_detail_stats_accessed', `Accessed detailed statistics for policy template: ${policyNumber}`);
  }

  static async logExpiryWarningGenerated(count: number, period: string): Promise<void> {
    await this.logActivity('expiry_warning_generated', `Generated expiry warning for ${count} policies expiring ${period}`);
  }

  static async logStatisticsRefresh(type: string): Promise<void> {
    await this.logActivity('statistics_refresh', `Refreshed ${type} statistics`);
  }

  // Dashboard integration activity logging methods
  static async logDashboardStatsRefresh(): Promise<void> {
    await this.logActivity('dashboard_stats_refresh', 'Dashboard statistics refreshed after policy template operation');
  }

  static async logPolicyTemplateSystemStatsAccessed(): Promise<void> {
    await this.logActivity('policy_template_system_stats_accessed', 'Accessed comprehensive policy template system statistics');
  }

  static async logRealTimeStatsUpdate(triggerType: string): Promise<void> {
    await this.logActivity('real_time_stats_update', `Real-time statistics updated after ${triggerType} operation`);
  }
}