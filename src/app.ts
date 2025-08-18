import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import utilities and middleware
import { database, logger, morganStream } from './utils';
import { 
  globalErrorHandler, 
  notFoundHandler,
  handleUncaughtException,
  handleUnhandledRejection,
  generalRateLimit,
  checkMaintenanceMode,
  sanitizeInput
} from './middleware';

// Import routes
import apiRoutes from './routes';

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

class App {
  public app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '5000');
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Trust proxy (for deployment behind reverse proxy)
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'http://localhost:3000',
          'http://localhost:3001',
          'https://rugalika.gov.rw'
        ];
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
    }));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf.toString());
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Static files middleware (for uploaded files)
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Request logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', { stream: morganStream }));
    }

    // Input sanitization
    this.app.use(sanitizeInput);

    // Rate limiting
    this.app.use(generalRateLimit);

    // Maintenance mode check
    this.app.use(checkMaintenanceMode);
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', apiRoutes);

    // Root route
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to Rugalika News API',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/api/health',
        timestamp: new Date().toISOString()
      });
    });

    // API documentation route (placeholder)
    this.app.get('/api/docs', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'API Documentation',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          news: '/api/news',
          feedback: '/api/feedback',
          helpRequests: '/api/help-requests',
          analytics: '/api/analytics',
          settings: '/api/settings',
          upload: '/api/upload'
        },
        contact: {
          email: 'info@rugalika.gov.rw',
          phone: '+250 788 000 000'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler (must be before global error handler)
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(globalErrorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await database.connect();
      
      // Start server
      this.app.listen(this.port, () => {
        logger.info(`🚀 Rugalika News API server started on port ${this.port}`);
        logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🌐 API URL: http://localhost:${this.port}/api`);
        logger.info(`📚 Documentation: http://localhost:${this.port}/api/docs`);
        logger.info(`❤️  Health Check: http://localhost:${this.port}/api/health`);
        
        if (process.env.NODE_ENV === 'development') {
          logger.info(`🔧 Development mode - detailed logging enabled`);
        }
      });

      // Graceful shutdown handlers
      process.on('SIGTERM', this.gracefulShutdown);
      process.on('SIGINT', this.gracefulShutdown);

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
      // Close database connection
      await database.disconnect();
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  public getApp(): express.Application {
    return this.app;
  }
}

// Create and start the application
const app = new App();

// Start server only if this file is run directly
if (require.main === module) {
  app.start().catch(error => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default app.getApp();
