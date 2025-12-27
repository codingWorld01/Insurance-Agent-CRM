import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendErrorResponse } from '../utils/errorHandler';

const prisma = new PrismaClient();

/**
 * Get current settings
 */
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get settings (there should only be one record)
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.settings.create({
        data: {
          passwordHash: '', // This will be set during login
          agentName: 'Agent',
          agentEmail: 'amitulhe@gmail.com',
        }
      });
    }

    // Return settings without password hash
    const settingsData = {
      id: settings.id,
      agentName: settings.agentName,
      agentEmail: settings.agentEmail,
      updatedAt: settings.updatedAt,
    };

    res.json({
      success: true,
      data: settingsData,
      message: 'Settings retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    sendErrorResponse(res, new Error('Failed to fetch settings'));
  }
};

/**
 * Update settings (agent name and email)
 */
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentName, agentEmail } = req.body;

    // Get existing settings
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create new settings if none exist
      settings = await prisma.settings.create({
        data: {
          passwordHash: '', // This will be set during login
          agentName,
          agentEmail,
        }
      });
    } else {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          agentName,
          agentEmail,
        }
      });
    }

    // Return updated settings without password hash
    const settingsData = {
      id: settings.id,
      agentName: settings.agentName,
      agentEmail: settings.agentEmail,
      updatedAt: settings.updatedAt,
    };

    res.json({
      success: true,
      data: settingsData,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    sendErrorResponse(res, new Error('Failed to update settings'));
  }
};

/**
 * Update password
 */
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current settings
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      res.status(404).json({
        success: false,
        message: 'Settings not found',
        statusCode: 404
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, settings.passwordHash);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        statusCode: 400
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updatedSettings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        passwordHash: newPasswordHash,
      }
    });

    res.json({
      success: true,
      data: { updatedAt: updatedSettings.updatedAt },
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    sendErrorResponse(res, new Error('Failed to update password'));
  }
};