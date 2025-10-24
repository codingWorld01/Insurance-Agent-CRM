import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  getSettings, 
  updateSettings, 
  updatePassword 
} from '../controllers/settingsController';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const updateSettingsSchema = z.object({
  agentName: z.string().min(1, 'Agent name is required').max(100, 'Agent name must be less than 100 characters'),
  agentEmail: z.string().email('Invalid email format'),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

// Routes
router.get('/', authenticateToken, getSettings);
router.put('/', authenticateToken, validateRequest({ body: updateSettingsSchema }), updateSettings);
router.put('/password', authenticateToken, validateRequest({ body: updatePasswordSchema }), updatePassword);

export default router;