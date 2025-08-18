import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { 
  authenticate, 
  adminOnly,
  validate,
  validateObjectId,
  validatePagination 
} from '../middleware';
import { userValidation } from '../utils/validation';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin
 */
router.get(
  '/',
  authenticate,
  adminOnly,
  validatePagination,
  validate(userValidation.query, 'query'),
  userController.getAllUsers
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  validate(userValidation.create),
  userController.createUser
);

/**
 * @route   GET /api/users/search
 * @desc    Search users by various criteria
 * @access  Admin
 */
router.get(
  '/search',
  authenticate,
  adminOnly,
  validatePagination,
  userController.searchUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Admin
 */
router.get(
  '/stats',
  authenticate,
  adminOnly,
  userController.getUserStats
);

/**
 * @route   GET /api/users/export
 * @desc    Export users data
 * @access  Admin
 */
router.get(
  '/export',
  authenticate,
  adminOnly,
  userController.exportUsers
);

/**
 * @route   PUT /api/users/bulk-update
 * @desc    Bulk update users
 * @access  Admin
 */
router.put(
  '/bulk-update',
  authenticate,
  adminOnly,
  userController.bulkUpdateUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Admin
 */
router.get(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (own profile) / Admin (any profile)
 */
router.put(
  '/:id',
  authenticate,
  validateObjectId('id'),
  validate(userValidation.update),
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete - set status to inactive)
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  userController.deleteUser
);

/**
 * @route   DELETE /api/users/:id/permanent
 * @desc    Permanently delete user
 * @access  Admin
 */
router.delete(
  '/:id/permanent',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  userController.permanentlyDeleteUser
);

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Activate user
 * @access  Admin
 */
router.put(
  '/:id/activate',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  userController.activateUser
);

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Admin
 */
router.put(
  '/:id/deactivate',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  userController.deactivateUser
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Admin
 */
router.put(
  '/:id/role',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  userController.updateUserRole
);

export default router;
