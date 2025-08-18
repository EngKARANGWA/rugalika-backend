import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { User } from '../models';
import { IUser } from '../types';
import { logger } from '../utils/logger';
import { createResponse } from './error.middleware';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(createResponse(false, null, 'Access token required'));
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json(createResponse(false, null, 'Token has been revoked'));
      return;
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json(createResponse(false, null, 'User not found'));
      return;
    }

    // Check if user is active
    if (user.status !== 'active') {
      res.status(401).json(createResponse(false, null, 'Account is inactive'));
      return;
    }

    // Attach user to request
    req.user = user.toObject();
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json(createResponse(false, null, 'Invalid or expired token'));
  }
};

/**
 * Authorization middleware - checks user role
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(createResponse(false, null, 'Authentication required'));
      return;
    }

    const hasRole = roles.some(role => authService.hasRole(req.user!, role));
    
    if (!hasRole) {
      res.status(403).json(createResponse(false, null, 'Insufficient permissions'));
      return;
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json(createResponse(false, null, 'Authentication required'));
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json(createResponse(false, null, 'Admin access required'));
    return;
  }

  next();
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      next();
      return;
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (user && user.status === 'active') {
      req.user = user.toObject();
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Resource ownership middleware - checks if user owns the resource
 */
export const checkOwnership = (resourceParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json(createResponse(false, null, 'Authentication required'));
      return;
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    const resourceId = req.params[resourceParam];
    const userId = req.user._id.toString();

    // For user resources, check if accessing own profile
    if (req.baseUrl.includes('/users')) {
      if (resourceId !== userId) {
        res.status(403).json(createResponse(false, null, 'Access denied'));
        return;
      }
    }

    next();
  };
};

/**
 * Check system maintenance mode
 */
export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Skip maintenance check for health endpoints and admin users
    if (req.path.includes('/health') || (req.user && req.user.role === 'admin')) {
      next();
      return;
    }

    // Check system settings for maintenance mode
    const { SystemSettings } = await import('../models');
    const settings = await SystemSettings.findOne() || { maintenanceMode: false };
    
    if (settings.maintenanceMode) {
      res.status(503).json(createResponse(
        false,
        null,
        'System is currently under maintenance. Please try again later.'
      ));
      return;
    }

    next();
  } catch (error) {
    logger.error('Error checking maintenance mode:', error);
    next(); // Continue if unable to check
  }
};

/**
 * Check if user can perform action on resource
 */
export const checkPermission = (resource: string, action: string = 'read') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(createResponse(false, null, 'Authentication required'));
      return;
    }

    const canAccess = authService.canAccess(req.user, resource, action);
    
    if (!canAccess) {
      res.status(403).json(createResponse(false, null, `Permission denied for ${action} on ${resource}`));
      return;
    }

    next();
  };
};

/**
 * Rate limiting by user
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next();
      return;
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const userLimit = userRequests.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (userLimit.count >= maxRequests) {
      res.status(429).json(createResponse(
        false,
        null,
        'Too many requests. Please try again later.'
      ));
      return;
    }

    userLimit.count++;
    next();
  };
};

/**
 * Validate email verification status
 */
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json(createResponse(false, null, 'Authentication required'));
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json(createResponse(
      false,
      null,
      'Email verification required. Please verify your email address.'
    ));
    return;
  }

  next();
};

/**
 * Log user activity
 */
export const logActivity = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user) {
      logger.info(`User ${req.user.email} performed ${action}`, {
        userId: req.user._id,
        action,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    next();
  };
};

/**
 * Refresh token middleware
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json(createResponse(false, null, 'Refresh token required'));
      return;
    }

    const result = await authService.refreshAccessToken(refreshToken);
    
    if (!result.success) {
      res.status(401).json(createResponse(false, null, result.message));
      return;
    }

    res.json(createResponse(true, { token: result.token }, 'Token refreshed successfully'));
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
};
