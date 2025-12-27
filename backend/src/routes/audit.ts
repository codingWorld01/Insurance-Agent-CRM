import { Router, Request, Response } from 'express';
import { AuditService } from '../services/auditService';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get audit logs for a specific client
router.get('/clients/:id/audit-logs', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: clientId } = req.params;
    const { 
      page = '1', 
      limit = '20',
      action,
      fieldName,
      startDate,
      endDate
    } = req.query;

    const result = await AuditService.getClientAuditLogs(clientId, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      action: action as string,
      fieldName: fieldName as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    } as any); // Using 'as any' temporarily to bypass type checking

    res.json({
      success: true,
      data: {
        auditLogs: result.logs,
        pagination: {
          page: result.page,
          limit: parseInt(limit as string, 10),
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch audit logs' 
    });
  }
});

export default router;
