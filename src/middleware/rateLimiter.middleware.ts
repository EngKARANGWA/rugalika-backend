import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { createResponse, getClientIp } from '../utils/helpers';

/**
 * Create custom rate limit message
 */
const createRateLimitMessage = (req: Request): string => {
  const ip = getClientIp(req);
  const endpoint = req.originalUrl;
  logger.warn(`Rate limit exceeded for IP ${ip} on endpoint ${endpoint}`);
  
  return 'Too many requests. Please try again later.';
};

/**
 * General API rate limiter
 */
export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: (req: Request) => createResponse(
    false,
    null,
    createRateLimitMessage(req)
  ),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json(createResponse(
      false,
      null,
      createRateLimitMessage(req)
    ));
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: (req: Request) => createResponse(
    false,
    null,
    'Too many authentication attempts. Please try again in 15 minutes.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    const ip = getClientIp(req);
    logger.warn(`Authentication rate limit exceeded for IP ${ip}`);
    
    res.status(429).json(createResponse(
      false,
      null,
      'Too many authentication attempts. Please try again in 15 minutes.'
    ));
  }
});

/**
 * Rate limiter for OTP requests
 */
export const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per 5 minutes
  message: (req: Request) => createResponse(
    false,
    null,
    'Too many OTP requests. Please wait before requesting another code.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by email if provided in body, otherwise by IP
    return req.body?.email || getClientIp(req);
  },
  handler: (req: Request, res: Response) => {
    const identifier = req.body?.email || getClientIp(req);
    logger.warn(`OTP rate limit exceeded for ${identifier}`);
    
    res.status(429).json(createResponse(
      false,
      null,
      'Too many OTP requests. Please wait 5 minutes before requesting another code.'
    ));
  }
});

/**
 * Rate limiter for file uploads
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: (req: Request) => createResponse(
    false,
    null,
    'Upload limit exceeded. Please try again later.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const ip = getClientIp(req);
    logger.warn(`Upload rate limit exceeded for IP ${ip}`);
    
    res.status(429).json(createResponse(
      false,
      null,
      'Too many file uploads. Please try again in an hour.'
    ));
  }
});

/**
 * Rate limiter for feedback submissions
 */
export const feedbackRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 feedback submissions per hour
  message: (req: Request) => createResponse(
    false,
    null,
    'Feedback submission limit exceeded. Please try again later.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const ip = getClientIp(req);
    logger.warn(`Feedback rate limit exceeded for IP ${ip}`);
    
    res.status(429).json(createResponse(
      false,
      null,
      'Too many feedback submissions. Please try again in an hour.'
    ));
  }
});

/**
 * Rate limiter for help request submissions
 */
export const helpRequestRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 help requests per day
  message: (req: Request) => createResponse(
    false,
    null,
    'Help request limit exceeded. Please try again tomorrow.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by email if provided, otherwise by IP
    return req.body?.email || getClientIp(req);
  },
  handler: (req: Request, res: Response) => {
    const identifier = req.body?.email || getClientIp(req);
    logger.warn(`Help request rate limit exceeded for ${identifier}`);
    
    res.status(429).json(createResponse(
      false,
      null,
      'Too many help requests. Please try again tomorrow.'
    ));
  }
});

/**
 * Rate limiter for search endpoints
 */
export const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: (req: Request) => createResponse(
    false,
    null,
    'Search limit exceeded. Please slow down.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const ip = getClientIp(req);
    logger.warn(`Search rate limit exceeded for IP ${ip}`);
    
    res.status(429).json(createResponse(
      false,
      null,
      'Too many search requests. Please wait a moment.'
    ));
  }
});

/**
 * Rate limiter for password reset (future use)
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: (req: Request) => createResponse(
    false,
    null,
    'Password reset limit exceeded. Please try again later.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.body?.email || getClientIp(req);
  },
  handler: (req: Request, res: Response) => {
    const identifier = req.body?.email || getClientIp(req);
    logger.warn(`Password reset rate limit exceeded for ${identifier}`);
    
    res.status(429).json(createResponse(
      false,
      null,
      'Too many password reset attempts. Please try again in an hour.'
    ));
  }
});

/**
 * Create custom rate limiter
 */
export const createCustomRateLimit = (options: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: (req: Request) => createResponse(false, null, options.message),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req: Request) => getClientIp(req)),
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req: Request, res: Response) => {
      const identifier = options.keyGenerator ? options.keyGenerator(req) : getClientIp(req);
      logger.warn(`Custom rate limit exceeded for ${identifier}: ${options.message}`);
      
      res.status(429).json(createResponse(false, null, options.message));
    }
  });
};

/**
 * Dynamic rate limiter based on user role
 */
export const dynamicRateLimit = (
  citizenLimits: { windowMs: number; max: number },
  adminLimits: { windowMs: number; max: number }
) => {
  const citizenLimiter = rateLimit({
    ...citizenLimits,
    message: (req: Request) => createResponse(
      false,
      null,
      'Rate limit exceeded. Please try again later.'
    ),
    standardHeaders: true,
    legacyHeaders: false
  });

  const adminLimiter = rateLimit({
    ...adminLimits,
    message: (req: Request) => createResponse(
      false,
      null,
      'Rate limit exceeded. Please try again later.'
    ),
    standardHeaders: true,
    legacyHeaders: false
  });

  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (user && user.role === 'admin') {
      return adminLimiter(req, res, next);
    } else {
      return citizenLimiter(req, res, next);
    }
  };
};

/**
 * Rate limiter that excludes certain IPs (for trusted sources)
 */
export const trustedIPRateLimit = (
  trustedIPs: string[],
  normalLimits: { windowMs: number; max: number },
  trustedLimits: { windowMs: number; max: number }
) => {
  const normalLimiter = rateLimit({
    ...normalLimits,
    message: (req: Request) => createResponse(
      false,
      null,
      'Rate limit exceeded. Please try again later.'
    ),
    standardHeaders: true,
    legacyHeaders: false
  });

  const trustedLimiter = rateLimit({
    ...trustedLimits,
    message: (req: Request) => createResponse(
      false,
      null,
      'Rate limit exceeded. Please try again later.'
    ),
    standardHeaders: true,
    legacyHeaders: false
  });

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = getClientIp(req);
    
    if (trustedIPs.includes(clientIP)) {
      return trustedLimiter(req, res, next);
    } else {
      return normalLimiter(req, res, next);
    }
  };
};
