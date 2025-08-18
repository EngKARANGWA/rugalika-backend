import { Request, Response } from 'express';
import { authService, emailService } from '../services';
import { User } from '../models';
import { createResponse, asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

/**
 * Send OTP code to user email
 */
export const sendOTPCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  // Check if user exists and is active
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404).json(createResponse(
      false,
      null,
      'No account found with this email address'
    ));
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json(createResponse(
      false,
      null,
      'Account is inactive. Please contact administrator.'
    ));
    return;
  }

  // Send OTP code
  const result = await authService.sendOTPCode(email);
  
  if (result.success) {
    res.status(200).json(createResponse(
      true,
      null,
      result.message
    ));
  } else {
    res.status(400).json(createResponse(
      false,
      null,
      result.message
    ));
  }
});

/**
 * Verify OTP code and return JWT token
 */
export const verifyOTPCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, code } = req.body;

  const result = await authService.verifyOTPCode(email, code);
  
  if (result.success) {
    res.status(200).json(createResponse(
      true,
      {
        token: result.token,
        user: result.user
      },
      result.message
    ));
  } else {
    res.status(401).json(createResponse(
      false,
      null,
      result.message
    ));
  }
});

/**
 * Get current user profile
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  
  if (!user) {
    res.status(401).json(createResponse(
      false,
      null,
      'User not authenticated'
    ));
    return;
  }

  // Get fresh user data from database
  const currentUser = await User.findById(user._id).select('-__v');
  
  if (!currentUser) {
    res.status(404).json(createResponse(
      false,
      null,
      'User not found'
    ));
    return;
  }

  res.status(200).json(createResponse(
    true,
    { user: currentUser },
    'User profile retrieved successfully'
  ));
});

/**
 * Refresh access token
 */
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json(createResponse(
      false,
      null,
      'Refresh token is required'
    ));
    return;
  }

  const result = await authService.refreshAccessToken(refreshToken);
  
  if (result.success) {
    res.status(200).json(createResponse(
      true,
      { token: result.token },
      result.message
    ));
  } else {
    res.status(401).json(createResponse(
      false,
      null,
      result.message
    ));
  }
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(400).json(createResponse(
      false,
      null,
      'No token provided'
    ));
    return;
  }

  const token = authHeader.substring(7);
  const result = await authService.logout(token);
  
  if (result.success) {
    res.status(200).json(createResponse(
      true,
      null,
      result.message
    ));
  } else {
    res.status(400).json(createResponse(
      false,
      null,
      result.message
    ));
  }
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  const updates = req.body;

  if (!user) {
    res.status(401).json(createResponse(
      false,
      null,
      'User not authenticated'
    ));
    return;
  }

  // Remove sensitive fields that shouldn't be updated via this endpoint
  delete updates.role;
  delete updates.status;
  delete updates.emailVerified;
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updates,
      { 
        new: true, 
        runValidators: true,
        select: '-__v'
      }
    );

    if (!updatedUser) {
      res.status(404).json(createResponse(
        false,
        null,
        'User not found'
      ));
      return;
    }

    res.status(200).json(createResponse(
      true,
      { user: updatedUser },
      'Profile updated successfully'
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
 * Change user status (Admin only)
 */
export const changeUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { status } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json(createResponse(
      false,
      null,
      'User not found'
    ));
    return;
  }

  user.status = status;
  await user.save();

  res.status(200).json(createResponse(
    true,
    { user },
    `User status updated to ${status}`
  ));
});

/**
 * Get authentication statistics (Admin only)
 */
export const getAuthStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = {
    totalUsers: await User.countDocuments(),
    activeUsers: await User.countDocuments({ status: 'active' }),
    inactiveUsers: await User.countDocuments({ status: 'inactive' }),
    adminUsers: await User.countDocuments({ role: 'admin' }),
    citizenUsers: await User.countDocuments({ role: 'citizen' }),
    verifiedUsers: await User.countDocuments({ emailVerified: true }),
    unverifiedUsers: await User.countDocuments({ emailVerified: false }),
    recentLogins: await User.find({ lastLogin: { $exists: true } })
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('firstName lastName email lastLogin')
  };

  res.status(200).json(createResponse(
    true,
    { stats },
    'Authentication statistics retrieved successfully'
  ));
});

/**
 * Validate token (for frontend to check if token is still valid)
 */
export const validateToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  
  if (!user) {
    res.status(401).json(createResponse(
      false,
      null,
      'Invalid token'
    ));
    return;
  }

  res.status(200).json(createResponse(
    true,
    { 
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    },
    'Token is valid'
  ));
});

/**
 * Request password reset (for future implementation)
 */
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if email exists or not for security
    res.status(200).json(createResponse(
      true,
      null,
      'If an account with that email exists, a password reset link has been sent.'
    ));
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json(createResponse(
      false,
      null,
      'Account is inactive. Please contact administrator.'
    ));
    return;
  }

  // Generate password reset token
  const resetToken = authService.generatePasswordResetToken(user);
  
  // TODO: Send password reset email
  // await emailService.sendPasswordResetEmail(email, resetToken);

  logger.info(`Password reset requested for user: ${email}`);

  res.status(200).json(createResponse(
    true,
    null,
    'If an account with that email exists, a password reset link has been sent.'
  ));
});

/**
 * Reset password (for future implementation)
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  try {
    const decoded = authService.verifyPasswordResetToken(token);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(400).json(createResponse(
        false,
        null,
        'Invalid or expired reset token'
      ));
      return;
    }

    // TODO: Hash and update password when password field is added to User model
    // user.password = await bcrypt.hash(newPassword, 12);
    // await user.save();

    logger.info(`Password reset completed for user: ${user.email}`);

    res.status(200).json(createResponse(
      true,
      null,
      'Password has been reset successfully'
    ));
  } catch (error) {
    res.status(400).json(createResponse(
      false,
      null,
      'Invalid or expired reset token'
    ));
  }
});

/**
 * Clean expired tokens (Admin only - for maintenance)
 */
export const cleanExpiredTokens = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await authService.cleanExpiredTokens();
  
  res.status(200).json(createResponse(
    true,
    null,
    'Expired tokens cleaned successfully'
  ));
});
