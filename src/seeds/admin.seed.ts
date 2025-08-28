import { User } from '../models/User.model';
import { logger } from '../utils/logger';

/**
 * Seed admin user
 */
export const seedAdmin = async (): Promise<void> => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      logger.info('Admin user already exists, skipping seed');
      return;
    }

    // Create default admin user
    const adminData = {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'karangwacyrille@gmail.com',
      phone: '+250788000000',
      nationalId: '1234567890123456', // Default 16-digit national ID
      role: 'admin' as const,
      status: 'active' as const,
      mutualStatus: 'registered' as const,
      employmentStatus: 'leader' as const,
      emailVerified: true,
      joinDate: new Date(),
    };

    const admin = new User(adminData);
    await admin.save();

    logger.info('✓ Admin user created successfully');
    logger.info(`  Email: ${adminData.email}`);
    logger.info(`  Phone: ${adminData.phone}`);
    logger.info(`  National ID: ${adminData.nationalId}`);
    logger.info('  Note: This system uses OTP-based authentication. Admin can login using the email above.');

  } catch (error: any) {
    if (error.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      logger.warn(`Admin user with ${field}: ${value} already exists`);
      return;
    }
    
    logger.error('Error seeding admin user:', error);
    throw error;
  }
};
