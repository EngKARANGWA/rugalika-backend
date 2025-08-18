import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authenticate, adminOnly, validate } from '../middleware';
import { systemSettingsValidation } from '../utils/validation';

const router = Router();

/**
 * @route   GET /api/settings
 * @desc    Get system settings
 * @access  Public
 */
router.get(
  '/',
  settingsController.getSettings
);

/**
 * @route   PUT /api/settings
 * @desc    Update system settings
 * @access  Admin
 */
router.put(
  '/',
  authenticate,
  adminOnly,
  validate(systemSettingsValidation.update),
  settingsController.updateSettings
);

export default router;
