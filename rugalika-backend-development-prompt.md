# Comprehensive Backend Development Prompt for Rugalika News System

## Project Overview
You need to develop a robust Node.js backend with TypeScript and MongoDB for the **Rugalika News** system - a comprehensive news and community management platform for Rugalika Sector in Rwanda. The system serves as a digital portal for local government services, news distribution, and citizen engagement.

## Technical Stack Requirements
- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with email-based OTP verification
- **File Storage**: Multer for file uploads (images, videos, PDFs)
- **Validation**: Joi or Zod for request validation
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Environment**: dotenv for configuration

## Database Schema & Models

### 1. User Model
```typescript
interface User {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  role: 'admin' | 'citizen';
  status: 'active' | 'inactive';
  mutualStatus: 'registered' | 'not_registered';
  employmentStatus: 'employed' | 'unemployed' | 'leader';
  profileImage?: string;
  joinDate: Date;
  lastLogin?: Date;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. News Model
```typescript
interface News {
  _id: ObjectId;
  title: string;
  content: string;
  excerpt: string;
  category: 'UBUREZI' | 'UBUKUNGU' | 'UBUZIMA' | 'AMATANGAZO';
  author: ObjectId; // Reference to User
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  mainImage: string;
  views: number;
  likes: number;
  subContents: SubContent[];
  tags: string[];
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SubContent {
  title: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'pdf';
  mediaUrl?: string;
  explanation?: string;
}
```

### 3. Feedback Model
```typescript
interface Feedback {
  _id: ObjectId;
  author: string; // Name
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  likes: number;
  comments: Comment[];
  category?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. Help Request Model
```typescript
interface HelpRequest {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  department: 'Ubutaka' | 'Ubuvuzi bw\'Amatungo' | 'Imiturire' | 'Irangamimerere' | 'Imibereho Myiza' | 'Amashyamba';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  adminResponse?: string;
  assignedTo?: ObjectId; // Reference to admin user
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. Comment Model
```typescript
interface Comment {
  _id: ObjectId;
  content: string;
  author: string;
  itemId: ObjectId; // Can reference News or Feedback
  itemType: 'news' | 'feedback';
  likes: number;
  createdAt: Date;
}
```

### 6. System Settings Model
```typescript
interface SystemSettings {
  _id: ObjectId;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  logo?: string;
  enableNotifications: boolean;
  enableComments: boolean;
  enableRegistration: boolean;
  maintenanceMode: boolean;
  updatedBy: ObjectId;
  updatedAt: Date;
}
```

## API Endpoints Specification

### Authentication & User Management

#### POST /api/auth/send-code
- **Purpose**: Send OTP to admin email for login
- **Body**: `{ email: string }`
- **Response**: `{ success: boolean, message: string }`

#### POST /api/auth/verify-code
- **Purpose**: Verify OTP and return JWT token
- **Body**: `{ email: string, code: string }`
- **Response**: `{ success: boolean, token: string, user: User }`

#### GET /api/auth/me
- **Purpose**: Get current user profile
- **Headers**: Authorization: Bearer {token}
- **Response**: `{ user: User }`

#### POST /api/auth/logout
- **Purpose**: Logout user (blacklist token)
- **Headers**: Authorization: Bearer {token}

### User Management (Admin Only)

#### GET /api/users
- **Purpose**: Get all users with pagination and filtering
- **Query**: `{ page?, limit?, search?, role?, status? }`
- **Response**: `{ users: User[], total: number, page: number }`

#### POST /api/users
- **Purpose**: Create new user
- **Body**: `User` object
- **Response**: `{ success: boolean, user: User }`

#### PUT /api/users/:id
- **Purpose**: Update user
- **Body**: Partial `User` object
- **Response**: `{ success: boolean, user: User }`

#### DELETE /api/users/:id
- **Purpose**: Delete user
- **Response**: `{ success: boolean }`

### News Management

#### GET /api/news
- **Purpose**: Get news with filtering, pagination, and search
- **Query**: `{ page?, limit?, category?, search?, status?, featured? }`
- **Response**: `{ news: News[], total: number, page: number }`

#### GET /api/news/:id
- **Purpose**: Get single news article with sub-contents
- **Response**: `{ news: News }`

#### POST /api/news
- **Purpose**: Create news article (Admin only)
- **Body**: `News` object + file uploads
- **Content-Type**: `multipart/form-data`
- **Response**: `{ success: boolean, news: News }`

#### PUT /api/news/:id
- **Purpose**: Update news article (Admin only)
- **Body**: Partial `News` object + optional file uploads
- **Response**: `{ success: boolean, news: News }`

#### DELETE /api/news/:id
- **Purpose**: Delete news article (Admin only)
- **Response**: `{ success: boolean }`

#### POST /api/news/:id/view
- **Purpose**: Increment view count
- **Response**: `{ success: boolean, views: number }`

#### POST /api/news/:id/like
- **Purpose**: Like/unlike news article
- **Response**: `{ success: boolean, likes: number }`

### Feedback Management

#### GET /api/feedback
- **Purpose**: Get all feedback (Admin) or public approved feedback
- **Query**: `{ page?, limit?, status?, search? }`
- **Response**: `{ feedback: Feedback[], total: number }`

#### POST /api/feedback
- **Purpose**: Submit new feedback
- **Body**: `{ author: string, title: string, content: string }`
- **Response**: `{ success: boolean, feedback: Feedback }`

#### PUT /api/feedback/:id/status
- **Purpose**: Update feedback status (Admin only)
- **Body**: `{ status: 'approved' | 'rejected', adminResponse?: string }`
- **Response**: `{ success: boolean }`

#### POST /api/feedback/:id/like
- **Purpose**: Like feedback
- **Response**: `{ success: boolean, likes: number }`

### Help Requests

#### GET /api/help-requests
- **Purpose**: Get help requests (Admin only)
- **Query**: `{ page?, limit?, status?, department?, priority? }`
- **Response**: `{ requests: HelpRequest[], total: number }`

#### POST /api/help-requests
- **Purpose**: Submit help request
- **Body**: `HelpRequest` object
- **Response**: `{ success: boolean, request: HelpRequest }`

#### PUT /api/help-requests/:id
- **Purpose**: Update help request (Admin only)
- **Body**: `{ status?, adminResponse?, assignedTo? }`
- **Response**: `{ success: boolean }`

#### GET /api/help-requests/:id
- **Purpose**: Get specific help request (Admin only)
- **Response**: `{ request: HelpRequest }`

### Analytics & Statistics

#### GET /api/analytics/overview
- **Purpose**: Get dashboard statistics (Admin only)
- **Response**: 
```typescript
{
  totalUsers: number;
  totalNews: number;
  totalFeedback: number;
  totalHelpRequests: number;
  recentActivity: Activity[];
  topNews: { title: string, views: number }[];
  categoryStats: { category: string, count: number, percentage: number }[];
}
```

#### GET /api/analytics/news-stats
- **Purpose**: Get news performance statistics
- **Response**: `{ mostViewed: News[], categoryDistribution: object }`

### System Settings

#### GET /api/settings
- **Purpose**: Get system settings
- **Response**: `{ settings: SystemSettings }`

#### PUT /api/settings
- **Purpose**: Update system settings (Admin only)
- **Body**: Partial `SystemSettings`
- **Response**: `{ success: boolean, settings: SystemSettings }`

### File Management

#### POST /api/upload/image
- **Purpose**: Upload images
- **Content-Type**: `multipart/form-data`
- **Response**: `{ success: boolean, url: string }`

#### POST /api/upload/document
- **Purpose**: Upload documents (PDF)
- **Content-Type**: `multipart/form-data`
- **Response**: `{ success: boolean, url: string }`

#### POST /api/upload/video
- **Purpose**: Upload videos
- **Content-Type**: `multipart/form-data`
- **Response**: `{ success: boolean, url: string }`

## Implementation Requirements

### 1. Security Features
- JWT-based authentication with refresh tokens
- Email OTP verification system (6-digit codes, 5-minute expiry)
- Role-based authorization middleware
- Input validation and sanitization
- Rate limiting on sensitive endpoints
- CORS configuration for frontend domain
- File upload validation (type, size limits)
- XSS and injection attack prevention

### 2. Email System
- Configure nodemailer or similar service
- Email templates for OTP codes
- Support for SMTP configuration via environment variables
- Email queue system for better performance

### 3. File Upload System
- Support for images (JPG, PNG, WebP) up to 5MB
- Support for videos (MP4, WebM) up to 50MB
- Support for PDFs up to 10MB
- Generate thumbnails for images
- Store files in organized folder structure
- Option to integrate with cloud storage (AWS S3, Cloudinary)

### 4. Database Optimization
- Proper indexing on frequently queried fields
- Aggregation pipelines for analytics
- Database connection pooling
- Soft delete implementation for important data

### 5. API Features
- Pagination with configurable limits
- Advanced search functionality
- Sorting options
- Response caching for public endpoints
- Comprehensive error handling
- Request logging
- API versioning support

### 6. Monitoring & Logging
- Request/response logging
- Error tracking
- Performance monitoring
- Database query logging
- Health check endpoints

## Environment Configuration
```env
# Application
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/rugalika_news

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@rugalika.gov.rw

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50MB

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Admin Configuration
ADMIN_EMAIL=karangwacyrille@gmail.com
```

## Project Structure
```
rugalika-backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── news.controller.ts
│   │   ├── user.controller.ts
│   │   ├── feedback.controller.ts
│   │   ├── helpRequest.controller.ts
│   │   ├── analytics.controller.ts
│   │   ├── settings.controller.ts
│   │   └── upload.controller.ts
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── News.model.ts
│   │   ├── Feedback.model.ts
│   │   ├── HelpRequest.model.ts
│   │   ├── Comment.model.ts
│   │   └── SystemSettings.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── news.routes.ts
│   │   ├── user.routes.ts
│   │   ├── feedback.routes.ts
│   │   ├── helpRequest.routes.ts
│   │   ├── analytics.routes.ts
│   │   ├── settings.routes.ts
│   │   └── upload.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── upload.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── error.middleware.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── upload.service.ts
│   │   └── analytics.service.ts
│   ├── utils/
│   │   ├── database.ts
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   ├── types/
│   │   └── index.ts
│   └── app.ts
├── uploads/
├── tests/
├── docs/
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Package.json Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.4",
    "joi": "^17.9.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "dotenv": "^16.3.1",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "winston": "^3.10.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.5.0",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/bcryptjs": "^2.4.2",
    "@types/multer": "^1.4.7",
    "@types/nodemailer": "^6.4.9",
    "@types/cors": "^2.8.13",
    "@types/compression": "^1.7.2",
    "@types/morgan": "^1.9.4",
    "@types/jest": "^29.5.4",
    "typescript": "^5.1.6",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3"
  }
}
```

## Key Implementation Guidelines

### 1. Authentication Flow
1. User requests OTP by providing email
2. System generates 6-digit code, stores with expiry (5 minutes)
3. Code sent via email
4. User submits code for verification
5. System validates code and returns JWT token
6. Token used for subsequent authenticated requests

### 2. File Upload Handling
- Validate file types using MIME type checking
- Generate unique filenames to prevent conflicts
- Create organized folder structure by date and type
- Implement file size limits per file type
- Generate and store metadata for uploaded files

### 3. Error Handling Strategy
- Use consistent error response format
- Implement global error handler middleware
- Log all errors with appropriate severity levels
- Return appropriate HTTP status codes
- Never expose sensitive information in error messages

### 4. Database Design Considerations
- Use appropriate indexes for query optimization
- Implement soft deletes for important entities
- Use aggregation pipelines for complex analytics
- Implement proper referencing between collections
- Consider data archiving strategy for old records

### 5. Security Best Practices
- Validate and sanitize all inputs
- Implement proper authentication and authorization
- Use HTTPS in production
- Implement rate limiting to prevent abuse
- Store sensitive configuration in environment variables
- Use proper CORS configuration

## Testing Strategy
- Unit tests for all service functions
- Integration tests for API endpoints
- Authentication flow testing
- File upload functionality testing
- Database operation testing
- Error handling testing

## Deployment Checklist
- [ ] Set up production MongoDB database
- [ ] Configure email service (SMTP)
- [ ] Set up file storage (local or cloud)
- [ ] Configure environment variables
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Implement backup strategy
- [ ] Configure CI/CD pipeline

## Performance Considerations
- Implement proper database indexing
- Use connection pooling for database
- Implement response caching where appropriate
- Optimize file upload process
- Use compression for API responses
- Implement pagination for large datasets
- Monitor and optimize slow queries

## Additional Features to Consider
1. **Real-time notifications** using WebSocket or Server-Sent Events
2. **Email newsletters** for news updates
3. **Content moderation** system with automated checks
4. **Audit logging** for all admin actions
5. **Data backup and restore** functionality
6. **Multi-language support** for Kinyarwanda, English, and French
7. **API documentation** with Swagger UI
8. **Performance metrics** and monitoring dashboard
9. **Search functionality** with full-text search
10. **Comment system** for news articles and feedback

This backend should be production-ready, scalable, and maintainable to serve the Rugalika community effectively. Focus on clean architecture, comprehensive error handling, and thorough documentation.
