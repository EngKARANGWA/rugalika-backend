import { Router } from 'express';
import { database } from '../utils';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import newsRoutes from './news.routes';
import feedbackRoutes from './feedback.routes';
import helpRequestRoutes from './helpRequest.routes';
import analyticsRoutes from './analytics.routes';
import settingsRoutes from './settings.routes';
import uploadRoutes from './upload.routes';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const dbHealth = await database.healthCheck();
  const overallHealthy = dbHealth.status === 'healthy';

  res.status(overallHealthy ? 200 : 503).json({
    success: overallHealthy,
    message: overallHealthy ? 'Rugalika News API is healthy' : 'Service degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbHealth
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/news', newsRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/help-requests', helpRequestRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/settings', settingsRoutes);
router.use('/upload', uploadRoutes);

export default router;
