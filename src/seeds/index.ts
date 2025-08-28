import { database } from '../utils/database';
import { logger } from '../utils/logger';
import { seedAdmin } from './admin.seed';

export class SeedRunner {
  private static instance: SeedRunner;

  private constructor() {}

  public static getInstance(): SeedRunner {
    if (!SeedRunner.instance) {
      SeedRunner.instance = new SeedRunner();
    }
    return SeedRunner.instance;
  }

  public async runAllSeeds(): Promise<void> {
    try {
      logger.info('Starting database seeding...');

      // Connect to database
      await database.connect();

      // Run individual seeds
      await this.runSeed('Admin User', seedAdmin);

      logger.info('Database seeding completed successfully!');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  public async runAdminSeed(): Promise<void> {
    try {
      logger.info('Starting admin user seeding...');

      // Connect to database
      await database.connect();

      // Run admin seed
      await this.runSeed('Admin User', seedAdmin);

      logger.info('Admin user seeding completed successfully!');
    } catch (error) {
      logger.error('Admin user seeding failed:', error);
      throw error;
    }
  }

  private async runSeed(name: string, seedFunction: () => Promise<void>): Promise<void> {
    try {
      logger.info(`Seeding ${name}...`);
      await seedFunction();
      logger.info(`✓ ${name} seeded successfully`);
    } catch (error) {
      logger.error(`✗ Failed to seed ${name}:`, error);
      throw error;
    }
  }
}

export const seedRunner = SeedRunner.getInstance();
