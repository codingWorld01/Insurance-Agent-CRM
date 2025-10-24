import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getDashboardStats, getLeadsChartData, getRecentActivities, getPolicyTemplateSystemStats } from '../controllers/dashboardController';

const router = Router();

// All dashboard routes require authentication
router.use(authenticateToken);

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics (total leads, clients, policies, commission)
 */
router.get('/stats', asyncHandler(getDashboardStats));

/**
 * GET /api/dashboard/chart-data
 * Get leads by status for chart visualization
 */
router.get('/chart-data', asyncHandler(getLeadsChartData));

/**
 * GET /api/dashboard/activities
 * Get recent activities for dashboard
 */
router.get('/activities', asyncHandler(getRecentActivities));

/**
 * GET /api/dashboard/policy-template-stats
 * Get comprehensive policy template system statistics
 */
router.get('/policy-template-stats', asyncHandler(getPolicyTemplateSystemStats));

export default router;