import { Request, Response } from 'express';
import { SystemSettings } from '../models';
import { createResponse, asyncHandler } from '../middleware/error.middleware';

/**
 * Get system settings
 */
export const getSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = new SystemSettings({
      updatedBy: '000000000000000000000000' // Default ObjectId
    });
    await settings.save();
  }

  res.status(200).json(createResponse(
    true,
    { settings },
    'System settings retrieved successfully'
  ));
});

/**
 * Update system settings (Admin only)
 */
export const updateSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const updates = req.body;
  const user = req.user;

  if (!user) {
    res.status(401).json(createResponse(
      false,
      null,
      'Authentication required'
    ));
    return;
  }

  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = new SystemSettings({ updatedBy: user._id });
  }
  
  Object.assign(settings, updates, { updatedBy: user._id });
  await settings.save();

  res.status(200).json(createResponse(
    true,
    { settings },
    'System settings updated successfully'
  ));
});
