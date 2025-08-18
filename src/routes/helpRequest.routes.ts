import { Router } from 'express';
import * as helpRequestController from '../controllers/helpRequest.controller';
import { 
  authenticate, 
  adminOnly,
  validate,
  validateObjectId,
  validatePagination,
  helpRequestRateLimit
} from '../middleware';
import { helpRequestValidation } from '../utils/validation';

const router = Router();

/**
 * @route   POST /api/help-requests
 * @desc    Submit help request
 * @access  Public
 */
router.post(
  '/',
  helpRequestRateLimit,
  validate(helpRequestValidation.create),
  helpRequestController.submitHelpRequest
);

/**
 * Admin only routes
 */

/**
 * @route   GET /api/help-requests
 * @desc    Get help requests
 * @access  Admin
 */
router.get(
  '/',
  authenticate,
  adminOnly,
  validatePagination,
  validate(helpRequestValidation.query, 'query'),
  helpRequestController.getAllHelpRequests
);

/**
 * @route   GET /api/help-requests/stats
 * @desc    Get help request statistics
 * @access  Admin
 */
router.get(
  '/stats',
  authenticate,
  adminOnly,
  helpRequestController.getHelpRequestStats
);

/**
 * @route   GET /api/help-requests/:id
 * @desc    Get specific help request
 * @access  Admin
 */
router.get(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  helpRequestController.getHelpRequestById
);

/**
 * @route   PUT /api/help-requests/:id
 * @desc    Update help request
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  validate(helpRequestValidation.update),
  helpRequestController.updateHelpRequest
);

/**
 * @route   PUT /api/help-requests/:id/assign
 * @desc    Assign help request to admin
 * @access  Admin
 */
router.put(
  '/:id/assign',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  helpRequestController.assignHelpRequest
);

export default router;
