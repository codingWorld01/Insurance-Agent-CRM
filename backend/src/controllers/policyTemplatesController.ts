import { Request, Response } from 'express';
import { PolicyTemplateService } from '../services/policyTemplateService';
import { PolicyInstanceService } from '../services/policyInstanceService';
import { PolicyTemplateStatsService } from '../services/policyTemplateStatsService';
import { ExpiryTrackingService } from '../services/expiryTrackingService';
import { ActivityService } from '../services/activityService';
import { 
  sendErrorResponse, 
  ValidationError
} from '../utils/errorHandler';

export class PolicyTemplatesController {
  /**
   * GET /api/policy-templates/search
   * Search policy templates by policy number or provider
   */
  static async searchPolicyTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, excludeClientId, limit = 20 } = req.query;
      
      if (!query || typeof query !== 'string') {
        throw new ValidationError('Search query is required', [
          { field: 'q', message: 'Search query parameter is required' }
        ]);
      }

      const searchTerm = query.trim();
      const limitNum = Math.min(Number(limit) || 20, 50);
      
      const searchResults = await PolicyTemplateService.searchTemplates(
        searchTerm,
        excludeClientId as string,
        limitNum
      );

      // Log search activity
      await ActivityService.logPolicyTemplateSearch(searchTerm, searchResults.length);

      res.json({
        success: true,
        data: searchResults
      });
    } catch (error) {
      console.error('Error searching policy templates:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates
   * Get all policy templates with advanced filtering and statistics
   */
  static async getPolicyTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 50, 
        search,
        policyTypes,
        providers,
        hasInstances,
        sortField = 'policyNumber',
        sortDirection = 'asc',
        includeStats = 'false'
      } = req.query;
      
      // Validate pagination parameters
      const pageNum = Number(page);
      const limitNum = Number(limit);
      
      if (pageNum < 1) {
        throw new ValidationError('Invalid pagination', [
          { field: 'page', message: 'Page must be greater than 0' }
        ]);
      }
      
      if (limitNum < 1 || limitNum > 100) {
        throw new ValidationError('Invalid pagination', [
          { field: 'limit', message: 'Limit must be between 1 and 100' }
        ]);
      }

      // Build filters
      const filters = {
        search: search ? String(search) : undefined,
        policyTypes: policyTypes ? String(policyTypes).split(',').filter(Boolean) : undefined,
        providers: providers ? String(providers).split(',').filter(Boolean) : undefined,
        hasInstances: hasInstances !== undefined ? hasInstances === 'true' : undefined
      };

      // Build pagination options
      const pagination = {
        page: pageNum,
        limit: limitNum,
        sortField: String(sortField),
        sortDirection: sortDirection as 'asc' | 'desc'
      };

      // Get templates using service
      const result = await PolicyTemplateService.getTemplatesWithFilters(filters, pagination);

      // Get available filters if stats are requested
      let availableFilters = undefined;
      if (includeStats === 'true') {
        availableFilters = await PolicyTemplateService.getAvailableFilters();
      }

      res.json({
        success: true,
        data: {
          templates: result.templates,
          pagination: result.pagination,
          ...(includeStats === 'true' && { stats: result.stats }),
          ...(availableFilters && { filters: availableFilters })
        }
      });
    } catch (error) {
      console.error('Error fetching policy templates:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * POST /api/policy-templates
   * Create a new policy template
   */
  static async createPolicyTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { policyNumber, policyType, provider, description } = req.body;

      // Validate required fields
      if (!policyNumber || !policyType || !provider) {
        throw new ValidationError('Missing required fields', [
          { field: 'policyNumber', message: 'Policy number is required' },
          { field: 'policyType', message: 'Policy type is required' },
          { field: 'provider', message: 'Provider is required' }
        ]);
      }

      const policyTemplate = await PolicyTemplateService.createTemplate({
        policyNumber,
        policyType,
        provider,
        description
      });

      res.status(201).json({
        success: true,
        data: policyTemplate,
        message: 'Policy template created successfully'
      });
    } catch (error) {
      console.error('Error creating policy template:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/:id
   * Get a specific policy template with details
   */
  static async getPolicyTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await PolicyTemplateService.getTemplateById(id);

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching policy template:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * PUT /api/policy-templates/:id
   * Update a policy template
   */
  static async updatePolicyTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { policyNumber, policyType, provider, description } = req.body;

      const updatedTemplate = await PolicyTemplateService.updateTemplate(id, {
        policyNumber,
        policyType,
        provider,
        description
      });

      res.json({
        success: true,
        data: updatedTemplate,
        message: 'Policy template updated successfully'
      });
    } catch (error) {
      console.error('Error updating policy template:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * DELETE /api/policy-templates/:id
   * Delete a policy template and all associated instances
   */
  static async deletePolicyTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await PolicyTemplateService.deleteTemplate(id);

      res.json({
        success: true,
        message: 'Policy template deleted successfully',
        affectedClients: result.affectedClients
      });
    } catch (error) {
      console.error('Error deleting policy template:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/:id/clients
   * Get all clients associated with a policy template
   */
  static async getPolicyTemplateClients(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await PolicyTemplateService.getTemplateClients(id);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching policy template clients:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/:id/instances
   * Get all instances for a policy template
   */
  static async getPolicyTemplateInstances(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const instances = await PolicyInstanceService.getInstancesByTemplate(id);

      res.json({
        success: true,
        data: instances
      });
    } catch (error) {
      console.error('Error fetching policy template instances:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/stats/overview
   * Get comprehensive policy template statistics
   */
  static async getPolicyTemplateStats(req: Request, res: Response): Promise<void> {
    try {
      const { 
        search,
        policyTypes,
        providers,
        hasInstances
      } = req.query;

      // Build filters for statistics calculation
      const filters: any = {};
      
      if (search) {
        const searchTerm = String(search).trim();
        filters.OR = [
          { policyNumber: { contains: searchTerm, mode: 'insensitive' } },
          { provider: { contains: searchTerm, mode: 'insensitive' } },
          { policyType: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      if (policyTypes) {
        filters.policyType = { in: String(policyTypes).split(',').filter(Boolean) };
      }

      if (providers) {
        filters.provider = { in: String(providers).split(',').filter(Boolean) };
      }

      if (hasInstances !== undefined) {
        if (hasInstances === 'true') {
          filters.instances = { some: {} };
        } else {
          filters.instances = { none: {} };
        }
      }

      const stats = await PolicyTemplateStatsService.calculatePolicyTemplateStats(filters);

      // Log statistics access
      const filterCount = Object.keys(filters).length;
      await ActivityService.logPolicyTemplateStatsAccessed(filterCount > 0 ? filterCount : undefined);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching policy template stats:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/:id/stats
   * Get detailed statistics for a specific policy template
   */
  static async getPolicyTemplateDetailStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const stats = await PolicyTemplateStatsService.calculatePolicyDetailStats(id);

      // Get template info for logging
      const template = await PolicyTemplateService.getTemplateById(id);
      await ActivityService.logPolicyDetailStatsAccessed(template.policyNumber);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching policy template detail stats:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/stats/expiry-tracking
   * Get expiry tracking statistics across all policy instances
   */
  static async getExpiryTrackingStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await PolicyTemplateStatsService.getExpiryTrackingStats();

      // Log expiry tracking access
      await ActivityService.logExpiryTrackingAccessed();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching expiry tracking stats:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/stats/system-metrics
   * Get comprehensive system-level metrics
   */
  static async getSystemLevelMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await PolicyTemplateStatsService.getSystemLevelMetrics();

      // Log system metrics access
      await ActivityService.logSystemMetricsAccessed();

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error fetching system level metrics:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/stats/provider-performance
   * Get provider performance metrics
   */
  static async getProviderPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await PolicyTemplateStatsService.getProviderPerformanceMetrics();

      // Log provider performance access
      await ActivityService.logProviderPerformanceAccessed();

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error fetching provider performance metrics:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/stats/policy-type-performance
   * Get policy type performance metrics
   */
  static async getPolicyTypePerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await PolicyTemplateStatsService.getPolicyTypePerformanceMetrics();

      // Log policy type performance access
      await ActivityService.logPolicyTypePerformanceAccessed();

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error fetching policy type performance metrics:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/expiry/warnings
   * Get expiring policies with warning levels
   */
  static async getExpiryWarnings(req: Request, res: Response): Promise<void> {
    try {
      const { 
        criticalDays = 7, 
        warningDays = 30, 
        infoDays = 60,
        level 
      } = req.query;

      const config = {
        criticalDays: Number(criticalDays),
        warningDays: Number(warningDays),
        infoDays: Number(infoDays)
      };

      if (level && !['critical', 'warning', 'info'].includes(String(level))) {
        throw new ValidationError('Invalid warning level', [
          { field: 'level', message: 'Level must be one of: critical, warning, info' }
        ]);
      }

      const warnings = await ExpiryTrackingService.getExpiringPoliciesByLevel(config);

      // Filter by level if specified
      let result = warnings;
      if (level) {
        const levelKey = String(level) as 'critical' | 'warning' | 'info';
        result = {
          ...warnings,
          [levelKey]: warnings[levelKey],
          // Only return the requested level
          critical: levelKey === 'critical' ? warnings.critical : [],
          warning: levelKey === 'warning' ? warnings.warning : [],
          info: levelKey === 'info' ? warnings.info : []
        };
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching expiry warnings:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/expiry/summary
   * Get expiry summary statistics
   */
  static async getExpirySummary(req: Request, res: Response): Promise<void> {
    try {
      const { 
        criticalDays = 7, 
        warningDays = 30, 
        infoDays = 60 
      } = req.query;

      const config = {
        criticalDays: Number(criticalDays),
        warningDays: Number(warningDays),
        infoDays: Number(infoDays)
      };

      const summary = await ExpiryTrackingService.getExpirySummary(config);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching expiry summary:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * POST /api/policy-templates/expiry/update-expired
   * Automatically update expired policy statuses
   */
  static async updateExpiredPolicies(req: Request, res: Response): Promise<void> {
    try {
      const result = await ExpiryTrackingService.updateExpiredPolicyStatuses();

      res.json({
        success: true,
        data: result,
        message: `Updated ${result.updatedCount} expired policies`
      });
    } catch (error) {
      console.error('Error updating expired policies:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/policy-templates/:id/expiry/warnings
   * Get expiring policies for a specific template
   */
  static async getTemplateExpiryWarnings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        criticalDays = 7, 
        warningDays = 30, 
        infoDays = 60 
      } = req.query;

      const config = {
        criticalDays: Number(criticalDays),
        warningDays: Number(warningDays),
        infoDays: Number(infoDays)
      };

      const warnings = await ExpiryTrackingService.getTemplateExpiringPolicies(id, config);

      res.json({
        success: true,
        data: warnings
      });
    } catch (error) {
      console.error('Error fetching template expiry warnings:', error);
      sendErrorResponse(res, error as Error);
    }
  }
}