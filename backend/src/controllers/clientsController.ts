import { Request, Response } from 'express';
import { prisma } from '../services/database';
import { ActivityService } from '../services/activityService';
import { PolicyInstanceService } from '../services/policyInstanceService';
import { Prisma } from '@prisma/client';
import { sendErrorResponse } from '../utils/errorHandler';

export class ClientsController {
  /**
   * GET /api/clients
   * Get all clients with optional search
   */
  static async getClients(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 50, search } = req.query;
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
            companyName: {
              contains: String(search),
              mode: 'insensitive'
            }
          }
        ];
      }

      // Get clients with pagination and policy count
      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          include: {
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
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: Number(limit)
        }),
        prisma.client.count({ where })
      ]);

      // Transform data to include policy count and computed fields
      const clientsWithPolicyCount = clients.map(client => {
        // Calculate age from dateOfBirth if not already set
        const calculatedAge = client.age || Math.floor((new Date().getTime() - client.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        
        return {
          ...client,
          age: calculatedAge,
          policyCount: client.policies.length + client.policyInstances.length,
          policies: undefined, // Remove policies array, only keep count
          policyInstances: undefined // Remove policy instances array, only keep count
        };
      });

      res.json({
        success: true,
        data: {
          clients: clientsWithPolicyCount,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch clients',
        statusCode: 500
      });
    }
  }

  /**
   * POST /api/clients
   * Create a new client
   */
  static async createClient(req: Request, res: Response): Promise<void> {
    try {
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

      const client = await prisma.client.create({
        data: clientData
      });

      // Log activity using firstName and lastName
      const clientName = `${client.firstName} ${client.lastName}`;
      await ActivityService.logClientCreated(clientName);

      res.status(201).json({
        success: true,
        data: client,
        message: 'Client created successfully'
      });
    } catch (error) {
      console.error('Error creating client:', error);
      
      // Handle unique constraint violation for email
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        res.status(400).json({
          success: false,
          message: 'A client with this email already exists',
          statusCode: 400
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create client',
        statusCode: 500
      });
    }
  }

  /**
   * GET /api/clients/:id
   * Get a specific client by ID with their policy instances
   */
  static async getClientById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          // Include legacy policies for backward compatibility
          policies: {
            orderBy: {
              createdAt: 'desc'
            }
          },
          // Include policy instances with template information
          policyInstances: {
            include: {
              policyTemplate: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          // Include documents and audit logs
          documents: {
            orderBy: {
              uploadedAt: 'desc'
            }
          },
          auditLogs: {
            orderBy: {
              changedAt: 'desc'
            },
            take: 10 // Limit to recent 10 audit entries
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
      console.error('Error fetching client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client',
        statusCode: 500
      });
    }
  }

  /**
   * PUT /api/clients/:id
   * Update a specific client
   */
  static async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

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

      const updatedClient = await prisma.client.update({
        where: { id },
        data: updateData
      });

      // Log activity for client update using firstName and lastName
      const clientName = `${updatedClient.firstName} ${updatedClient.lastName}`;
      await ActivityService.logClientUpdated(clientName);

      res.json({
        success: true,
        data: updatedClient,
        message: 'Client updated successfully'
      });
    } catch (error) {
      console.error('Error updating client:', error);
      
      // Handle unique constraint violation for email
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        res.status(400).json({
          success: false,
          message: 'A client with this email already exists',
          statusCode: 400
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update client',
        statusCode: 500
      });
    }
  }

  /**
   * DELETE /api/clients/:id
   * Delete a specific client and cascade delete their policies
   */
  static async deleteClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if client exists
      const existingClient = await prisma.client.findUnique({
        where: { id },
        include: {
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

      // Delete client (policies will be cascade deleted due to schema configuration)
      await prisma.client.delete({
        where: { id }
      });

      // Log activity (include both legacy policies and policy instances)
      const totalPolicies = existingClient.policies.length + existingClient.policyInstances.length;
      const clientName = `${existingClient.firstName} ${existingClient.lastName}`;
      await ActivityService.logClientDeleted(clientName, totalPolicies);

      res.json({
        success: true,
        message: 'Client and associated policies deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete client',
        statusCode: 500
      });
    }
  }

  /**
   * POST /api/clients/:id/policy-instances
   * Create a new policy instance for a client
   */
  static async createPolicyInstance(req: Request, res: Response): Promise<void> {
    try {
      const { id: clientId } = req.params;
      const { 
        policyTemplateId, 
        premiumAmount, 
        startDate, 
        durationMonths, 
        commissionAmount 
      } = req.body;

      const instance = await PolicyInstanceService.createInstance(clientId, {
        policyTemplateId,
        premiumAmount: Number(premiumAmount),
        startDate,
        durationMonths: Number(durationMonths),
        commissionAmount: Number(commissionAmount)
      });

      res.status(201).json({
        success: true,
        data: instance,
        message: 'Policy instance created successfully'
      });
    } catch (error) {
      console.error('Error creating policy instance:', error);
      sendErrorResponse(res, error as Error);
    }
  }

  /**
   * GET /api/clients/:id/policy-instances
   * Get all policy instances for a client
   */
  static async getClientPolicyInstances(req: Request, res: Response): Promise<void> {
    try {
      const { id: clientId } = req.params;

      const instances = await PolicyInstanceService.getInstancesByClient(clientId);

      res.json({
        success: true,
        data: instances
      });
    } catch (error) {
      console.error('Error fetching client policy instances:', error);
      sendErrorResponse(res, error as Error);
    }
  }
}