import { Request, Response } from 'express';
import { User } from '../models';
import { createResponse, asyncHandler } from '../middleware/error.middleware';
import { getPaginationParams, createPaginationMeta } from '../utils/helpers';
import { emailService } from '../services';
import { logger } from '../utils/logger';

/**
 * Get all users with pagination and filtering
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, role, status } = req.query;

  // Build filter object
  const filter: any = {};
  
  if (role) {
    filter.role = role;
  }
  
  if (status) {
    filter.status = status;
  }
  
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { nationalId: { $regex: search, $options: 'i' } }
    ];
  }

  // Get users and total count
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ]);

  const pagination = createPaginationMeta(total, page, limit);

  res.status(200).json(createResponse(
    true,
    { 
      users,
      pagination
    },
    'Users retrieved successfully'
  ));
});

/**
 * Get single user by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await User.findById(id).select('-__v');
  
  if (!user) {
    res.status(404).json(createResponse(
      false,
      null,
      'User not found'
    ));
    return;
  }

  res.status(200).json(createResponse(
    true,
    { user },
    'User retrieved successfully'
  ));
});

/**
 * Create new user (Admin only)
 */
export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userData = req.body;
  
  try {
    // Create new user
    const user = new User(userData);
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      logger.warn(`Failed to send welcome email to ${user.email}:`, emailError);
    }

    res.status(201).json(createResponse(
      true,
      { user },
      'User created successfully'
    ));
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyValue)[0];
      res.status(409).json(createResponse(
        false,
        null,
        `${field} already exists. Please use a different ${field}.`
      ));
      return;
    }
    
    throw error;
  }
});

/**
 * Update user
 */
export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;
  const currentUser = req.user;

  // Check if user can update this profile
  if (currentUser?.role !== 'admin' && currentUser?._id.toString() !== id) {
    res.status(403).json(createResponse(
      false,
      null,
      'You can only update your own profile'
    ));
    return;
  }

  // Non-admin users cannot update certain fields
  if (currentUser?.role !== 'admin') {
    delete updates.role;
    delete updates.status;
    delete updates.emailVerified;
  }

  // Remove fields that shouldn't be updated
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;

  try {
    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { 
        new: true, 
        runValidators: true,
        select: '-__v'
      }
    );

    if (!user) {
      res.status(404).json(createResponse(
        false,
        null,
        'User not found'
      ));
      return;
    }

    res.status(200).json(createResponse(
      true,
      { user },
      'User updated successfully'
    ));
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      res.status(409).json(createResponse(
        false,
        null,
        `${field} already exists. Please use a different ${field}.`
      ));
      return;
    }
    
    throw error;
  }
});

/**
 * Delete user (Admin only)
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const currentUser = req.user;

  // Prevent admin from deleting themselves
  if (currentUser?._id.toString() === id) {
    res.status(400).json(createResponse(
      false,
      null,
      'You cannot delete your own account'
    ));
    return;
  }

  const user = await User.findById(id);
  
  if (!user) {
    res.status(404).json(createResponse(
      false,
      null,
      'User not found'
    ));
    return;
  }

  // Soft delete by setting status to inactive
  user.status = 'inactive';
  await user.save();

  res.status(200).json(createResponse(
    true,
    null,
    'User deactivated successfully'
  ));
});

/**
 * Permanently delete user (Super Admin only)
 */
export const permanentlyDeleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const currentUser = req.user;

  // Prevent admin from deleting themselves
  if (currentUser?._id.toString() === id) {
    res.status(400).json(createResponse(
      false,
      null,
      'You cannot delete your own account'
    ));
    return;
  }

  const user = await User.findByIdAndDelete(id);
  
  if (!user) {
    res.status(404).json(createResponse(
      false,
      null,
      'User not found'
    ));
    return;
  }

  logger.info(`User permanently deleted: ${user.email} by ${currentUser?.email}`);

  res.status(200).json(createResponse(
    true,
    null,
    'User permanently deleted'
  ));
});

/**
 * Activate user (Admin only)
 */
export const activateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await User.findById(id);
  
  if (!user) {
    res.status(404).json(createResponse(
      false,
      null,
      'User not found'
    ));
    return;
  }

  user.status = 'active';
  await user.save();

  res.status(200).json(createResponse(
    true,
    { user },
    'User activated successfully'
  ));
});

/**
 * Deactivate user (Admin only)
 */
export const deactivateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const currentUser = req.user;

  // Prevent admin from deactivating themselves
  if (currentUser?._id.toString() === id) {
    res.status(400).json(createResponse(
      false,
      null,
      'You cannot deactivate your own account'
    ));
    return;
  }

  const user = await User.findById(id);
  
  if (!user) {
    res.status(404).json(createResponse(
      false,
      null,
      'User not found'
    ));
    return;
  }

  user.status = 'inactive';
  await user.save();

  res.status(200).json(createResponse(
    true,
    { user },
    'User deactivated successfully'
  ));
});

/**
 * Update user role (Admin only)
 */
export const updateUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;
  const currentUser = req.user;

  // Prevent admin from changing their own role
  if (currentUser?._id.toString() === id) {
    res.status(400).json(createResponse(
      false,
      null,
      'You cannot change your own role'
    ));
    return;
  }

  const user = await User.findById(id);
  
  if (!user) {
    res.status(404).json(createResponse(
      false,
      null,
      'User not found'
    ));
    return;
  }

  const oldRole = user.role;
  user.role = role;
  await user.save();

  logger.info(`User role changed: ${user.email} from ${oldRole} to ${role} by ${currentUser?.email}`);

  res.status(200).json(createResponse(
    true,
    { user },
    `User role updated to ${role}`
  ));
});

/**
 * Get user statistics (Admin only)
 */
export const getUserStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = {
    total: await User.countDocuments(),
    active: await User.countDocuments({ status: 'active' }),
    inactive: await User.countDocuments({ status: 'inactive' }),
    admins: await User.countDocuments({ role: 'admin' }),
    citizens: await User.countDocuments({ role: 'citizen' }),
    verified: await User.countDocuments({ emailVerified: true }),
    unverified: await User.countDocuments({ emailVerified: false }),
    employmentStats: await User.aggregate([
      { $group: { _id: '$employmentStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    mutualStats: await User.aggregate([
      { $group: { _id: '$mutualStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    recentRegistrations: await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstName lastName email createdAt')
  };

  res.status(200).json(createResponse(
    true,
    { stats },
    'User statistics retrieved successfully'
  ));
});

/**
 * Bulk update users (Admin only)
 */
export const bulkUpdateUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userIds, updates } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    res.status(400).json(createResponse(
      false,
      null,
      'User IDs array is required'
    ));
    return;
  }

  // Remove fields that shouldn't be bulk updated
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;

  const result = await User.updateMany(
    { _id: { $in: userIds } },
    updates,
    { runValidators: true }
  );

  res.status(200).json(createResponse(
    true,
    { 
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    },
    `${result.modifiedCount} users updated successfully`
  ));
});

/**
 * Search users by various criteria
 */
export const searchUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { q, role, status, employmentStatus, mutualStatus } = req.query;

  if (!q) {
    res.status(400).json(createResponse(
      false,
      null,
      'Search query is required'
    ));
    return;
  }

  // Build search filter
  const filter: any = {
    $or: [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { nationalId: { $regex: q, $options: 'i' } }
    ]
  };

  // Add additional filters
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (employmentStatus) filter.employmentStatus = employmentStatus;
  if (mutualStatus) filter.mutualStatus = mutualStatus;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ]);

  const pagination = createPaginationMeta(total, page, limit);

  res.status(200).json(createResponse(
    true,
    { 
      users,
      pagination,
      query: q
    },
    `Found ${total} users matching "${q}"`
  ));
});

/**
 * Export users data (Admin only)
 */
export const exportUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { format = 'json' } = req.query;

  const users = await User.find()
    .select('-__v')
    .sort({ createdAt: -1 })
    .lean();

  if (format === 'csv') {
    // Convert to CSV format
    const csvHeader = 'ID,First Name,Last Name,Email,Phone,National ID,Role,Status,Employment Status,Mutual Status,Email Verified,Join Date,Last Login\n';
    const csvRows = users.map(user => 
      `${user._id},${user.firstName},${user.lastName},${user.email},${user.phone},${user.nationalId},${user.role},${user.status},${user.employmentStatus},${user.mutualStatus},${user.emailVerified},${user.joinDate},${user.lastLogin || ''}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.status(200).send(csvHeader + csvRows);
    return;
  }

  // Default JSON format
  res.status(200).json(createResponse(
    true,
    { 
      users,
      total: users.length,
      exportedAt: new Date()
    },
    'Users data exported successfully'
  ));
});
