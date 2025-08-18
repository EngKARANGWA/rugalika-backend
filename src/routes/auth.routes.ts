import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { 
  authenticate, 
  adminOnly,
  otpRateLimit, 
  authRateLimit,
  validate,
  validateObjectId 
} from '../middleware';
import { authValidation } from '../utils/validation';

const router = Router();

/**
 * @route   POST /api/auth/send-code
 * @desc    Send OTP code to user email
 * @access  Public
 */
router.post(
  '/send-code',
  otpRateLimit,
  validate(authValidation.sendCode),
  authController.sendOTPCode
);

/**
 * @route   POST /api/auth/verify-code
 * @desc    Verify OTP code and return JWT token
 * @access  Public
 */
router.post(
  '/verify-code',
  authRateLimit,
  validate(authValidation.verifyCode),
  authController.verifyOTPCode
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh-token',
  authRateLimit,
  authController.refreshAccessToken
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  authController.updateProfile
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (blacklist token)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /api/auth/validate-token
 * @desc    Validate if token is still valid
 * @access  Private
 */
router.get(
  '/validate-token',
  authenticate,
  authController.validateToken
);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset (future implementation)
 * @access  Public
 */
router.post(
  '/request-password-reset',
  authRateLimit,
  authController.requestPasswordReset
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token (future implementation)
 * @access  Public
 */
router.post(
  '/reset-password',
  authRateLimit,
  authController.resetPassword
);

/**
 * Admin only routes
 */

/**
 * @route   PUT /api/auth/users/:userId/status
 * @desc    Change user status
 * @access  Admin
 */
router.put(
  '/users/:userId/status',
  authenticate,
  adminOnly,
  validateObjectId('userId'),
  authController.changeUserStatus
);

/**
 * @route   GET /api/auth/stats
 * @desc    Get authentication statistics
 * @access  Admin
 */
router.get(
  '/stats',
  authenticate,
  adminOnly,
  authController.getAuthStats
);

/**
 * @route   POST /api/auth/clean-expired-tokens
 * @desc    Clean expired tokens from blacklist
 * @access  Admin
 */
router.post(
  '/clean-expired-tokens',
  authenticate,
  adminOnly,
  authController.cleanExpiredTokens
);

export default router;
