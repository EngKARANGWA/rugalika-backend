import { Request, Response } from 'express';
import { HelpRequest } from '../models';
import { createResponse, asyncHandler } from '../middleware/error.middleware';
import { getPaginationParams, createPaginationMeta } from '../utils/helpers';
import { emailService } from '../services';
import { logger } from '../utils/logger';

/**
 * Get all help requests (Admin only)
 */
export const getAllHelpRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, status, department, priority } = req.query;

  const filter: any = {};
  
  if (status) filter.status = status;
  if (department) filter.department = department;
  if (priority) filter.priority = priority;
  
  if (search) {
    filter.$text = { $search: search };
  }

  const [requests, total] = await Promise.all([
    HelpRequest.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .select('-__v')
      .sort(search ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    HelpRequest.countDocuments(filter)
  ]);

  const pagination = createPaginationMeta(total, page, limit);

  res.status(200).json(createResponse(
    true,
    { 
      requests,
      pagination
    },
    'Help requests retrieved successfully'
  ));
});

/**
 * Get single help request by ID (Admin only)
 */
export const getHelpRequestById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const request = await HelpRequest.findById(id)
    .populate('assignedTo', 'firstName lastName email')
    .select('-__v');
  
  if (!request) {
    res.status(404).json(createResponse(
      false,
      null,
      'Help request not found'
    ));
    return;
  }

  res.status(200).json(createResponse(
    true,
    { request },
    'Help request retrieved successfully'
  ));
});

/**
 * Submit new help request
 */
export const submitHelpRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const requestData = req.body;

  const helpRequest = new HelpRequest(requestData);
  await helpRequest.save();

  res.status(201).json(createResponse(
    true,
    { request: helpRequest },
    'Help request submitted successfully'
  ));
});

/**
 * Update help request (Admin only)
 */
export const updateHelpRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  const request = await HelpRequest.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).populate('assignedTo', 'firstName lastName email');

  if (!request) {
    res.status(404).json(createResponse(
      false,
      null,
      'Help request not found'
    ));
    return;
  }

  // Send email notification if status changed and there's a response
  if (updates.status && updates.adminResponse) {
    try {
      await emailService.sendHelpRequestUpdateEmail(
        request.email,
        request.name,
        request.department,
        request.status,
        request.adminResponse
      );
    } catch (emailError) {
      logger.warn('Failed to send help request update email:', emailError);
    }
  }

  res.status(200).json(createResponse(
    true,
    { request },
    'Help request updated successfully'
  ));
});

/**
 * Assign help request to admin (Admin only)
 */
export const assignHelpRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  const request = await HelpRequest.findById(id);
  
  if (!request) {
    res.status(404).json(createResponse(
      false,
      null,
      'Help request not found'
    ));
    return;
  }

  request.assignedTo = assignedTo;
  request.status = 'in_progress';
  await request.save();

  await request.populate('assignedTo', 'firstName lastName email');

  res.status(200).json(createResponse(
    true,
    { request },
    'Help request assigned successfully'
  ));
});

/**
 * Get help request statistics (Admin only)
 */
export const getHelpRequestStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = {
    total: await HelpRequest.countDocuments(),
    pending: await HelpRequest.countDocuments({ status: 'pending' }),
    inProgress: await HelpRequest.countDocuments({ status: 'in_progress' }),
    completed: await HelpRequest.countDocuments({ status: 'completed' }),
    cancelled: await HelpRequest.countDocuments({ status: 'cancelled' }),
    departmentStats: await HelpRequest.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    priorityStats: await HelpRequest.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    recentRequests: await HelpRequest.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name department status priority createdAt')
  };

  res.status(200).json(createResponse(
    true,
    { stats },
    'Help request statistics retrieved successfully'
  ));
});
