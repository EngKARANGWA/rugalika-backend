import { Request, Response } from 'express';
import { analyticsService } from '../services';
import { createResponse, asyncHandler } from '../middleware/error.middleware';

/**
 * Get dashboard overview statistics
 */
export const getOverviewStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await analyticsService.getOverviewStats();

  res.status(200).json(createResponse(
    true,
    { stats },
    'Overview statistics retrieved successfully'
  ));
});

/**
 * Get user statistics
 */
export const getUserStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await analyticsService.getUserStats();

  res.status(200).json(createResponse(
    true,
    { stats },
    'User statistics retrieved successfully'
  ));
});

/**
 * Get news statistics
 */
export const getNewsStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await analyticsService.getNewsStats();

  res.status(200).json(createResponse(
    true,
    { stats },
    'News statistics retrieved successfully'
  ));
});

/**
 * Get feedback statistics
 */
export const getFeedbackStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await analyticsService.getFeedbackStats();

  res.status(200).json(createResponse(
    true,
    { stats },
    'Feedback statistics retrieved successfully'
  ));
});

/**
 * Get help request statistics
 */
export const getHelpRequestStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = await analyticsService.getHelpRequestStats();

  res.status(200).json(createResponse(
    true,
    { stats },
    'Help request statistics retrieved successfully'
  ));
});
