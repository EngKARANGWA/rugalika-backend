import { Request, Response } from 'express';
import { Feedback, Comment } from '../models';
import { createResponse, asyncHandler } from '../middleware/error.middleware';
import { getPaginationParams, createPaginationMeta } from '../utils/helpers';
import { emailService } from '../services';
import { logger } from '../utils/logger';

/**
 * Get all feedback with filtering and pagination
 */
export const getAllFeedback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, status } = req.query;
  const user = req.user;

  // Build filter object
  const filter: any = {};
  
  // Non-admin users can only see approved feedback
  if (!user || user.role !== 'admin') {
    filter.status = 'approved';
  } else if (status) {
    filter.status = status;
  }
  
  if (search) {
    filter.$text = { $search: search };
  }

  const [feedback, total] = await Promise.all([
    Feedback.find(filter)
      .populate('comments')
      .select('-__v')
      .sort(search ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Feedback.countDocuments(filter)
  ]);

  const pagination = createPaginationMeta(total, page, limit);

  res.status(200).json(createResponse(
    true,
    { 
      feedback,
      pagination
    },
    'Feedback retrieved successfully'
  ));
});

/**
 * Get single feedback by ID
 */
export const getFeedbackById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user;

  const filter: any = { _id: id };
  
  // Non-admin users can only see approved feedback
  if (!user || user.role !== 'admin') {
    filter.status = 'approved';
  }

  const feedback = await Feedback.findOne(filter)
    .populate('comments')
    .select('-__v');
  
  if (!feedback) {
    res.status(404).json(createResponse(
      false,
      null,
      'Feedback not found'
    ));
    return;
  }

  res.status(200).json(createResponse(
    true,
    { feedback },
    'Feedback retrieved successfully'
  ));
});

/**
 * Submit new feedback
 */
export const submitFeedback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const feedbackData = req.body;

  const feedback = new Feedback(feedbackData);
  await feedback.save();

  res.status(201).json(createResponse(
    true,
    { feedback },
    'Feedback submitted successfully'
  ));
});

/**
 * Update feedback status (Admin only)
 */
export const updateFeedbackStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, adminResponse } = req.body;

  const feedback = await Feedback.findById(id);
  
  if (!feedback) {
    res.status(404).json(createResponse(
      false,
      null,
      'Feedback not found'
    ));
    return;
  }

  feedback.status = status;
  if (adminResponse) {
    feedback.adminResponse = adminResponse;
  }
  
  await feedback.save();

  // Send email notification if there's an admin response
  if (adminResponse) {
    try {
      // Note: We don't have user email in feedback, so this would need to be enhanced
      // await emailService.sendFeedbackResponseEmail(userEmail, feedback.title, adminResponse, status);
    } catch (emailError) {
      logger.warn('Failed to send feedback response email:', emailError);
    }
  }

  res.status(200).json(createResponse(
    true,
    { feedback },
    'Feedback status updated successfully'
  ));
});

/**
 * Like feedback
 */
export const likeFeedback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const feedback = await Feedback.findByIdAndUpdate(
    id,
    { $inc: { likes: 1 } },
    { new: true }
  ).select('likes');

  if (!feedback) {
    res.status(404).json(createResponse(
      false,
      null,
      'Feedback not found'
    ));
    return;
  }

  res.status(200).json(createResponse(
    true,
    { likes: feedback.likes },
    'Feedback liked successfully'
  ));
});

/**
 * Delete feedback (Admin only)
 */
export const deleteFeedback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const feedback = await Feedback.findByIdAndDelete(id);
  
  if (!feedback) {
    res.status(404).json(createResponse(
      false,
      null,
      'Feedback not found'
    ));
    return;
  }

  // Delete associated comments
  await Comment.deleteMany({ itemId: id, itemType: 'feedback' });

  res.status(200).json(createResponse(
    true,
    null,
    'Feedback deleted successfully'
  ));
});

/**
 * Get feedback statistics (Admin only)
 */
export const getFeedbackStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = {
    total: await Feedback.countDocuments(),
    pending: await Feedback.countDocuments({ status: 'pending' }),
    approved: await Feedback.countDocuments({ status: 'approved' }),
    rejected: await Feedback.countDocuments({ status: 'rejected' }),
    priorityStats: await Feedback.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    recentFeedback: await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title author status priority createdAt')
  };

  res.status(200).json(createResponse(
    true,
    { stats },
    'Feedback statistics retrieved successfully'
  ));
});
