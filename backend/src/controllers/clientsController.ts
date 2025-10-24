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
        where.name = {
          contains: String(search),
          mode: 'insensitive'
        };
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

      // Transform data to include policy count (both legacy policies and policy instances)
      const clientsWithPolicyCount = clients.map(client => ({
        ...client,
        policyCount: client.policies.length + client.policyInstances.length,
        policies: undefined, // Remove policies array, only keep count
        policyInstances: undefined // Remove policy instances array, only keep count
      }));

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

      const client = await prisma.client.create({
        data: clientData
      });

      // Log activity
      await ActivityService.logClientCreated(client.name);

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

      res.json({
        success: true,
        data: client
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
      }

      const updatedClient = await prisma.client.update({
        where: { id },
        data: updateData
      });

      // Log activity for client update
      await ActivityService.logClientUpdated(updatedClient.name);

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
      await ActivityService.logClientDeleted(existingClient.name, totalPolicies);

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
        clientId,
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