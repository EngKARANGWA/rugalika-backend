import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate, adminOnly } from '../middleware';

const router = Router();

/**
 * All analytics routes are admin only
 */

/**
 * @route   GET /api/analytics/overview
 * @desc    Get dashboard overview statistics
 * @access  Admin
 */
router.get(
  '/overview',
  authenticate,
  adminOnly,
  analyticsController.getOverviewStats
);

/**
 * @route   GET /api/analytics/users
 * @desc    Get user statistics
 * @access  Admin
 */
router.get(
  '/users',
  authenticate,
  adminOnly,
  analyticsController.getUserStats
);

/**
 * @route   GET /api/analytics/news
 * @desc    Get news statistics
 * @access  Admin
 */
router.get(
  '/news',
  authenticate,
  adminOnly,
  analyticsController.getNewsStats
);

/**
 * @route   GET /api/analytics/feedback
 * @desc    Get feedback statistics
 * @access  Admin
 */
router.get(
  '/feedback',
  authenticate,
  adminOnly,
  analyticsController.getFeedbackStats
);

/**
 * @route   GET /api/analytics/help-requests
 * @desc    Get help request statistics
 * @access  Admin
 */
router.get(
  '/help-requests',
  authenticate,
  adminOnly,
  analyticsController.getHelpRequestStats
);

export default router;
