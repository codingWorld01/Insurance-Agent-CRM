import { Request, Response } from 'express';
import { prisma } from '../services/database';
import { ActivityService } from '../services/activityService';
import { Prisma } from '@prisma/client';

export class LeadsController {
  /**
   * GET /api/leads
   * Get all leads with optional search and filtering
   */
  static async getLeads(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 50, search, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause for filtering
      const where: Prisma.LeadWhereInput = {};
      
      if (search) {
        where.name = {
          contains: String(search),
          mode: 'insensitive'
        };
      }

      if (status) {
        where.status = String(status);
      }

      // Get leads with pagination
      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: Number(limit)
        }),
        prisma.lead.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          leads,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leads',
        statusCode: 500
      });
    }
  }

  /**
   * POST /api/leads
   * Create a new lead
   */
  static async createLead(req: Request, res: Response): Promise<void> {
    try {
      const leadData = {
        ...req.body,
        status: req.body.status || 'New',
        priority: req.body.priority || 'Warm'
      };

      const lead = await prisma.lead.create({
        data: leadData
      });

      // Log activity
      await ActivityService.logLeadCreated(lead.name);

      res.status(201).json({
        success: true,
        data: lead,
        message: 'Lead created successfully'
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create lead',
        statusCode: 500
      });
    }
  }

  /**
   * GET /api/leads/:id
   * Get a specific lead by ID
   */
  static async getLeadById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const lead = await prisma.lead.findUnique({
        where: { id }
      });

      if (!lead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found',
          statusCode: 404
        });
        return;
      }

      res.json({
        success: true,
        data: lead
      });
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lead',
        statusCode: 500
      });
    }
  }

  /**
   * PUT /api/leads/:id
   * Update a specific lead
   */
  static async updateLead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if lead exists
      const existingLead = await prisma.lead.findUnique({
        where: { id }
      });

      if (!existingLead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found',
          statusCode: 404
        });
        return;
      }

      const updatedLead = await prisma.lead.update({
        where: { id },
        data: req.body
      });

      // Log activity for status changes
      if (req.body.status && req.body.status !== existingLead.status) {
        await ActivityService.logLeadStatusUpdated(
          updatedLead.name, 
          existingLead.status, 
          req.body.status
        );
      } else {
        // Log general update if not a status change
        await ActivityService.logLeadUpdated(updatedLead.name);
      }

      res.json({
        success: true,
        data: updatedLead,
        message: 'Lead updated successfully'
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update lead',
        statusCode: 500
      });
    }
  }

  /**
   * DELETE /api/leads/:id
   * Delete a specific lead
   */
  static async deleteLead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if lead exists
      const existingLead = await prisma.lead.findUnique({
        where: { id }
      });

      if (!existingLead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found',
          statusCode: 404
        });
        return;
      }

      await prisma.lead.delete({
        where: { id }
      });

      // Log activity
      await ActivityService.logLeadDeleted(existingLead.name);

      res.json({
        success: true,
        message: 'Lead deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete lead',
        statusCode: 500
      });
    }
  }

  /**
   * POST /api/leads/:id/convert
   * Convert a lead to a client
   */
  static async convertLeadToClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if lead exists
      const lead = await prisma.lead.findUnique({
        where: { id }
      });

      if (!lead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found',
          statusCode: 404
        });
        return;
      }

      // Check if lead is already converted
      if (lead.status === 'Won') {
        res.status(400).json({
          success: false,
          message: 'Lead is already converted',
          statusCode: 400
        });
        return;
      }

      // Check if client with same email already exists
      const existingClient = await prisma.client.findUnique({
        where: { email: lead.email }
      });

      if (existingClient) {
        res.status(400).json({
          success: false,
          message: 'A client with this email already exists',
          statusCode: 400
        });
        return;
      }

      // Use transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // Create client from lead data
        const client = await tx.client.create({
          data: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            dateOfBirth: new Date('1990-01-01'), // Default date - should be updated by user
            address: lead.notes || undefined
          }
        });

        // Update lead status to Won
        const updatedLead = await tx.lead.update({
          where: { id },
          data: { status: 'Won' }
        });

        return { client, lead: updatedLead };
      });

      // Log activity
      await ActivityService.logLeadConverted(lead.name);

      res.json({
        success: true,
        data: {
          client: result.client,
          lead: result.lead
        },
        message: 'Lead converted to client successfully'
      });
    } catch (error) {
      console.error('Error converting lead to client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to convert lead to client',
        statusCode: 500
      });
    }
  }
}