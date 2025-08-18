import { Router } from 'express';
import * as feedbackController from '../controllers/feedback.controller';
import { 
  authenticate, 
  adminOnly,
  optionalAuth,
  validate,
  validateObjectId,
  validatePagination,
  feedbackRateLimit
} from '../middleware';
import { feedbackValidation } from '../utils/validation';

const router = Router();

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback
 * @access  Public (approved only) / Admin (all)
 */
router.get(
  '/',
  optionalAuth,
  validatePagination,
  validate(feedbackValidation.query, 'query'),
  feedbackController.getAllFeedback
);

/**
 * @route   POST /api/feedback
 * @desc    Submit new feedback
 * @access  Public
 */
router.post(
  '/',
  feedbackRateLimit,
  validate(feedbackValidation.create),
  feedbackController.submitFeedback
);

/**
 * @route   GET /api/feedback/:id
 * @desc    Get single feedback by ID
 * @access  Public (approved only) / Admin (all)
 */
router.get(
  '/:id',
  optionalAuth,
  validateObjectId('id'),
  feedbackController.getFeedbackById
);

/**
 * @route   POST /api/feedback/:id/like
 * @desc    Like feedback
 * @access  Public
 */
router.post(
  '/:id/like',
  validateObjectId('id'),
  feedbackController.likeFeedback
);

/**
 * Admin only routes
 */

/**
 * @route   PUT /api/feedback/:id/status
 * @desc    Update feedback status
 * @access  Admin
 */
router.put(
  '/:id/status',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  validate(feedbackValidation.updateStatus),
  feedbackController.updateFeedbackStatus
);

/**
 * @route   DELETE /api/feedback/:id
 * @desc    Delete feedback
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  feedbackController.deleteFeedback
);

/**
 * @route   GET /api/feedback/admin/stats
 * @desc    Get feedback statistics
 * @access  Admin
 */
router.get(
  '/admin/stats',
  authenticate,
  adminOnly,
  feedbackController.getFeedbackStats
);

export default router;
