import express from 'express';
import cors from 'cors';
import DatabaseService from './services/database';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';

// Import route modules
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import leadsRoutes from './routes/leads';
import clientsRoutes from './routes/clients';
import policiesRoutes from './routes/policies';
import policyTemplatesRoutes from './routes/policyTemplates';
import policyInstancesRoutes from './routes/policyInstances';
import settingsRoutes from './routes/settings';
import healthRoutes from './routes/health';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check routes
app.use('/', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/policies', policiesRoutes);
app.use('/api/policy-templates', policyTemplatesRoutes);
app.use('/api/policy-instances', policyInstancesRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;