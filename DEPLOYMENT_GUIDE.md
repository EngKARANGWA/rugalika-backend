# Rugalika Backend Deployment Guide

## Deployment Issues & Solutions

### Current Issue: Module Not Found Error
```
Error: Cannot find module '/opt/render/project/src/dist/app.js'
```

### Root Cause
The deployment is failing because:
1. TypeScript compilation (`tsc`) isn't running during build
2. The build output directory structure doesn't match expectations
3. Missing proper deployment configuration

### Solutions Implemented

#### 1. Updated package.json
- Added `postinstall` script to ensure build runs after npm install
- Added deployment-specific scripts
- Improved build process

#### 2. Created render.yaml
- Proper build command: `npm ci && npm run build`
- Correct start command: `npm start`
- Health check endpoint: `/api/health`
- Auto-deploy enabled

#### 3. Added Deployment Scripts
- `deploy.sh` - Manual deployment script
- `.dockerignore` - Exclude unnecessary files
- Better error handling and logging

### Deployment Steps

#### For Render.com:
1. Connect your repository to Render
2. Use the `render.yaml` configuration
3. Set environment variables in Render dashboard
4. Deploy

#### Manual Deployment:
```bash
# Clone repository
git clone <your-repo>

# Install dependencies
npm install

# Build the project
npm run build

# Start the application
npm start
```

### Environment Variables Required
Make sure these are set in your deployment environment:
- `NODE_ENV=production`
- `PORT=10000` (or your preferred port)
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration

### Troubleshooting

#### Build Fails
1. Check TypeScript compilation: `npm run build`
2. Verify `dist/app.js` exists after build
3. Check for TypeScript errors in source files

#### Runtime Errors
1. Verify all environment variables are set
2. Check database connectivity
3. Review application logs

#### Module Not Found
1. Ensure build completed successfully
2. Check file paths in imports
3. Verify `dist/` directory structure

### Health Check Endpoint
The application provides a health check at `/api/health` that returns:
```json
{
  "success": true,
  "message": "Rugalika News API is running",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Monitoring
- Application logs are available in Render dashboard
- Health check endpoint for monitoring
- Graceful shutdown handling implemented
- Error logging with Winston

### Next Steps
1. Deploy using the updated configuration
2. Monitor logs for any remaining issues
3. Test all API endpoints
4. Set up proper monitoring and alerting
