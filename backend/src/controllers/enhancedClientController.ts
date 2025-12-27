import { Request, Response } from 'express';
import { prisma } from '../services/database';
import { ActivityService } from '../services/activityService';
import { DocumentService } from '../services/documentService';
import { AuditService } from '../services/auditService';
import { Prisma } from '@prisma/client';
import { sendErrorResponse } from '../utils/errorHandler';

export class EnhancedClientController {
  /**
   * GET /api/enhanced-clients
   * Get all clients with enhanced filtering and search
   */
  static async getClients(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 50, 
        search, 
        clientType, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause for filtering
      const where: Prisma.ClientWhereInput = {};
      
      if (search) {
        where.OR = [
          {
            firstName: {
              contains: String(search),
              mode: 'insensitive'
            }
          },
          {
            lastName: {
              contains: String(search),
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: String(search),
              mode: 'insensitive'
            }
          },
          {
            phoneNumber: {
              contains: String(search),
              mode: 'insensitive'
            }
          },
          {
            companyName: {
              contains: String(search),
              mode: 'insensitive'
            }
          }
        ];
      }

      // Build order by clause
      const orderBy: Prisma.ClientOrderByWithRelationInput = {};
      if (sortBy === 'firstName' || sortBy === 'lastName' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
        orderBy[sortBy] = sortOrder as 'asc' | 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Get clients with their details and document counts
      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          include: {
            documents: {
              select: {
                id: true,
                documentType: true
              }
            },
            policies: {
              select: {
                id: true
              }
            },
            policyInstances: {
              select: {
                id: true
              }
            }
          },
          orderBy,
          skip,
          take: Number(limit)
        }),
        prisma.client.count({ where })
      ]);

      // Transform data to include counts and calculated fields
      const clientsWithCounts = clients.map(client => {
        // Calculate age from dateOfBirth if not already set
        const calculatedAge = client.age || Math.floor((new Date().getTime() - client.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        
        return {
          ...client,
          age: calculatedAge,
          documentCount: client.documents.length,
          policyCount: client.policies.length + client.policyInstances.length,
          documentTypes: Array.from(new Set(client.documents.map(doc => doc.documentType))),
          // Remove the documents array to keep response clean
          documents: undefined,
          policies: undefined,
          policyInstances: undefined
        };
      });

      res.json({
        success: true,
        data: {
          clients: clientsWithCounts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching enhanced clients:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * POST /api/enhanced-clients
   * Create a new enhanced client using unified model
   */
  static async createClient(req: Request, res: Response): Promise<void> {
    try {
      // Log incoming data for debugging
      console.log('📥 Received client data:', JSON.stringify(req.body, null, 2));
      console.log('📝 additionalInfo field:', req.body.additionalInfo);
      
      const clientData = {
        ...req.body,
        dateOfBirth: new Date(req.body.dateOfBirth)
      };

      // Calculate age from dateOfBirth if not provided
      if (!clientData.age) {
        const birthDate = new Date(clientData.dateOfBirth);
        const today = new Date();
        clientData.age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      }

      // Create client with unified model
      const client = await prisma.client.create({
        data: clientData,
        include: {
          documents: true,
          auditLogs: {
            orderBy: {
              changedAt: 'desc'
            },
            take: 5
          }
        }
      });

      // Log activity
      const clientName = `${client.firstName} ${client.lastName}`;
      await ActivityService.logClientCreated(clientName);

      // Log audit entry for client creation
      await AuditService.logClientCreation(client.id, clientData);

      res.status(201).json({
        success: true,
        data: client,
        message: 'Client created successfully'
      });
    } catch (error) {
      console.error('Error creating enhanced client:', error);
      
      // Handle unique constraint violations
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        res.status(400).json({
          success: false,
          message: 'A client with this email already exists',
          statusCode: 400
        });
        return;
      }

      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/enhanced-clients/:id
   * Get a specific enhanced client by ID using unified model
   */
  static async getClientById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          documents: {
            orderBy: {
              uploadedAt: 'desc'
            }
          },
          policies: {
            orderBy: {
              createdAt: 'desc'
            }
          },
          policyInstances: {
            include: {
              policyTemplate: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          auditLogs: {
            orderBy: {
              changedAt: 'desc'
            },
            take: 50 // Limit audit logs to recent 50 entries
          }
        }
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
          statusCode: 404
        });
        return;
      }

      // Calculate age from dateOfBirth if not already set
      const calculatedAge = client.age || Math.floor((new Date().getTime() - client.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      res.json({
        success: true,
        data: {
          ...client,
          age: calculatedAge
        }
      });
    } catch (error) {
      console.error('Error fetching enhanced client:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * PUT /api/enhanced-clients/:id
   * Update a specific enhanced client using unified model
   */
  static async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Log incoming data for debugging
      console.log('📥 Update client data:', JSON.stringify(req.body, null, 2));
      console.log('📝 additionalInfo field:', req.body.additionalInfo);

      // Check if client exists
      const existingClient = await prisma.client.findUnique({
        where: { id }
      });

      if (!existingClient) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
          statusCode: 404
        });
        return;
      }

      // Prepare update data
      const updateData: any = { ...req.body };
      if (req.body.dateOfBirth) {
        updateData.dateOfBirth = new Date(req.body.dateOfBirth);
        
        // Recalculate age if dateOfBirth is being updated
        const birthDate = new Date(updateData.dateOfBirth);
        const today = new Date();
        updateData.age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      }

      // Log audit trail for changes
      await AuditService.logClientUpdate(id, existingClient, updateData, 'client');

      // Update client
      const updatedClient = await prisma.client.update({
        where: { id },
        data: updateData,
        include: {
          documents: true,
          auditLogs: {
            orderBy: {
              changedAt: 'desc'
            },
            take: 10
          }
        }
      });

      // Log activity
      const clientName = `${updatedClient.firstName} ${updatedClient.lastName}`;
      await ActivityService.logClientUpdated(clientName);

      res.json({
        success: true,
        data: updatedClient,
        message: 'Client updated successfully'
      });
    } catch (error) {
      console.error('Error updating enhanced client:', error);
      
      // Handle unique constraint violations
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        res.status(400).json({
          success: false,
          message: 'A client with this email already exists',
          statusCode: 400
        });
        return;
      }

      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * DELETE /api/enhanced-clients/:id
   * Delete a specific enhanced client and cleanup associated files
   */
  static async deleteClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if client exists and get associated data
      const existingClient = await prisma.client.findUnique({
        where: { id },
        include: {
          documents: true,
          policies: {
            select: { id: true }
          },
          policyInstances: {
            select: { id: true }
          }
        }
      });

      if (!existingClient) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
          statusCode: 404
        });
        return;
      }

      // Clean up Cloudinary files
      const cleanupPromises: Promise<any>[] = [];

      // Delete profile image
      if (existingClient.profileImage) {
        try {
          const urlParts = existingClient.profileImage.split('/');
          const publicIdWithExtension = urlParts.slice(-2).join('/');
          const publicId = publicIdWithExtension.split('.')[0];
          cleanupPromises.push(DocumentService.deleteDocument(publicId, 'image'));
        } catch (error) {
          console.warn('Failed to parse profile image URL for deletion:', error);
        }
      }

      // Delete all documents
      existingClient.documents.forEach(doc => {
        const resourceType = doc.mimeType.startsWith('image/') ? 'image' : 'raw';
        cleanupPromises.push(DocumentService.deleteDocument(doc.cloudinaryId, resourceType));
      });

      // Execute cleanup (don't wait for completion to avoid blocking)
      Promise.allSettled(cleanupPromises).then(results => {
        const failures = results.filter(result => result.status === 'rejected');
        if (failures.length > 0) {
          console.warn(`Failed to delete ${failures.length} files from Cloudinary for client ${id}`);
        }
      });

      // Log audit trail for client deletion before deleting
      await AuditService.logClientDeletion(id, existingClient);

      // Delete client (cascade will handle related records)
      await prisma.client.delete({
        where: { id }
      });

      // Log activity
      const clientName = `${existingClient.firstName} ${existingClient.lastName}`;
      const totalPolicies = existingClient.policies.length + existingClient.policyInstances.length;
      await ActivityService.logClientDeleted(clientName, totalPolicies);

      res.json({
        success: true,
        message: 'Client and associated data deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting enhanced client:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/enhanced-clients/:id/audit-logs
   * Get audit logs for a specific client
   */
  static async getClientAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
          statusCode: 404
        });
        return;
      }

      const result = await AuditService.getClientAuditLogs(id, {
        page: Number(page),
        limit: Number(limit)
      });

      res.json({
        success: true,
        data: {
          auditLogs: result.logs,
          pagination: {
            page: result.page,
            limit: Number(limit),
            total: result.total,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      console.error('Error fetching client audit logs:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/enhanced-clients/:id/audit-stats
   * Get audit statistics for a specific client
   */
  static async getClientAuditStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
          statusCode: 404
        });
        return;
      }

      const stats = await AuditService.getClientAuditStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching client audit stats:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/enhanced-clients/audit-report
   * Generate audit report for a date range
   */
  static async generateAuditReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, clientId } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
          statusCode: 400
        });
        return;
      }

      const start = new Date(String(startDate));
      const end = new Date(String(endDate));

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format',
          statusCode: 400
        });
        return;
      }

      if (start > end) {
        res.status(400).json({
          success: false,
          message: 'Start date must be before end date',
          statusCode: 400
        });
        return;
      }

      const report = await AuditService.generateAuditReport(
        start,
        end,
        clientId ? String(clientId) : undefined
      );

      res.json({
        success: true,
        data: {
          ...report,
          dateRange: {
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error generating audit report:', error);
      sendErrorResponse(res, error as Error);
    }
  }
}