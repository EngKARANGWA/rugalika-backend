import jwt, { SignOptions } from 'jsonwebtoken';
import { User, OTPCode, TokenBlacklist } from '../models';
import { IUser, IAuthResponse } from '../types';
import { logger } from '../utils/logger';
// Import will be resolved at runtime to avoid circular dependency
let emailService: any;

class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpire: string;
  private readonly jwtRefreshExpire: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.jwtExpire = process.env.JWT_EXPIRE || '24h';
    this.jwtRefreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d';

    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    // Lazy load email service to avoid circular dependency
    if (!emailService) {
      emailService = require('./email.service').emailService;
    }
  }

  /**
   * Send OTP code to user email
   */
  async sendOTPCode(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists with this email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return {
          success: false,
          message: 'No account found with this email address'
        };
      }

      // Check if user is active
      if (user.status !== 'active') {
        return {
          success: false,
          message: 'Account is inactive. Please contact administrator.'
        };
      }

      // Remove any existing unverified codes for this email
      await OTPCode.deleteMany({ email, verified: false });
      
      // Create new OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      const otpCode = new OTPCode({
        email,
        code,
        expiresAt
      });
      
      await otpCode.save();
      
      // Send email with OTP
      await emailService.sendOTPEmail(email, otpCode.code);

      logger.info(`OTP code sent to ${email}`);
      
      return {
        success: true,
        message: 'OTP code sent to your email address'
      };
    } catch (error) {
      logger.error('Error sending OTP code:', error);
      throw new Error('Failed to send OTP code');
    }
  }

  /**
   * Verify OTP code and return JWT token
   */
  async verifyOTPCode(email: string, code: string): Promise<IAuthResponse> {
    try {
      // Verify the OTP code
      const otpCode = await OTPCode.findOne({
        email,
        code,
        verified: false,
        expiresAt: { $gt: new Date() }
      });
      
      if (!otpCode) {
        return {
          success: false,
          message: 'Invalid or expired OTP code'
        };
      }

      // Get user details
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if user is active
      if (user.status !== 'active') {
        return {
          success: false,
          message: 'Account is inactive'
        };
      }

      // Mark OTP as verified
      otpCode.verified = true;
      await otpCode.save();
      
      // Update user's last login
      user.lastLogin = new Date();
      user.emailVerified = true;
      await user.save();

      // Generate JWT tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info(`User ${email} logged in successfully`);

      return {
        success: true,
        token,
        user: user.toJSON(),
        message: 'Login successful'
      };
    } catch (error) {
      logger.error('Error verifying OTP code:', error);
      return {
        success: false,
        message: 'Failed to verify OTP code'
      };
    }
  }

  /**
   * Generate access token
   */
  generateAccessToken(user: IUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    const options: SignOptions = { 
      expiresIn: this.jwtExpire as any
    };
    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user: IUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      type: 'refresh'
    };

    const options: SignOptions = { 
      expiresIn: this.jwtRefreshExpire as any
    };
    return jwt.sign(payload, this.jwtRefreshSecret, options);
  }

  /**
   * Verify and decode JWT token
   */
  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtRefreshSecret);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Check if refresh token is blacklisted
      const blacklistedToken = await TokenBlacklist.findOne({ 
        token: refreshToken,
        expiresAt: { $gt: new Date() }
      });
      if (blacklistedToken) {
        return {
          success: false,
          message: 'Refresh token is blacklisted'
        };
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);

      return {
        success: true,
        token: newAccessToken,
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      return {
        success: false,
        message: 'Failed to refresh token'
      };
    }
  }

  /**
   * Logout user by blacklisting token
   */
  async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // Decode token to get expiration
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return {
          success: false,
          message: 'Invalid token'
        };
      }

      // Calculate expiration date
      const expiresAt = new Date(decoded.exp * 1000);

      // Add token to blacklist
      const blacklistedToken = new TokenBlacklist({
        token,
        expiresAt
      });
      
      try {
        await blacklistedToken.save();
      } catch (error: any) {
        // If token is already blacklisted, ignore the error
        if (error.code !== 11000) {
          throw error;
        }
      }

      logger.info(`User ${decoded.email} logged out`);

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      logger.error('Error during logout:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await TokenBlacklist.findOne({ 
      token,
      expiresAt: { $gt: new Date() }
    });
    return !!blacklistedToken;
  }

  /**
   * Get user from token
   */
  async getUserFromToken(token: string): Promise<IUser | null> {
    try {
      const decoded = this.verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user has required role
   */
  hasRole(user: IUser, requiredRole: string): boolean {
    if (requiredRole === 'admin') {
      return user.role === 'admin';
    }
    
    // For other roles, check if user has the role or is admin
    return user.role === requiredRole || user.role === 'admin';
  }

  /**
   * Check if user can access resource
   */
  canAccess(user: IUser, resource: string, action: string = 'read'): boolean {
    // Admin can access everything
    if (user.role === 'admin') {
      return true;
    }

    // Define access rules for citizens
    const citizenAccess = {
      news: ['read'],
      feedback: ['read', 'create'],
      'help-request': ['create'],
      profile: ['read', 'update']
    };

    const allowedActions = citizenAccess[resource as keyof typeof citizenAccess];
    return allowedActions ? allowedActions.includes(action) : false;
  }

  /**
   * Clean expired tokens from blacklist
   */
  async cleanExpiredTokens(): Promise<void> {
    try {
      await TokenBlacklist.deleteMany({
        expiresAt: { $lte: new Date() }
      });
      logger.info('Cleaned expired tokens from blacklist');
    } catch (error) {
      logger.error('Error cleaning expired tokens:', error);
    }
  }

  /**
   * Generate password reset token (for future use)
   */
  generatePasswordResetToken(user: IUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      type: 'password_reset'
    };

    const options: SignOptions = { 
      expiresIn: '1h'
    };
    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * Verify password reset token (for future use)
   */
  verifyPasswordResetToken(token: string): any {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired password reset token');
    }
  }
}

export const authService = new AuthService();
