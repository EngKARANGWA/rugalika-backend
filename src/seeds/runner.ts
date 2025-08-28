#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { seedRunner } from './index';

// Load environment variables
dotenv.config();

/**
 * Seed runner script
 * Usage: npm run seed or npm run seed:admin
 */
async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'admin':
        await seedRunner.runAdminSeed();
        break;
      case 'all':
      default:
        await seedRunner.runAllSeeds();
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the seeder
main();
