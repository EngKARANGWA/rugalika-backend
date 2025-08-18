# Rugalika News Backend API

A comprehensive Node.js backend system for the Rugalika News platform - a digital portal for local government services, news distribution, and citizen engagement in Rugalika Sector, Rwanda.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with email OTP verification
- **News Management**: Full CRUD operations for news articles with categories and media support
- **User Management**: Complete user management system with role-based access control
- **Feedback System**: Citizen feedback collection and management
- **Help Request System**: Department-based help request routing and tracking
- **File Upload**: Support for images, videos, and documents with validation
- **Analytics**: Comprehensive statistics and reporting
- **Email Notifications**: Automated email notifications in Kinyarwanda and English
- **Rate Limiting**: Protection against abuse and spam
- **Input Validation**: Comprehensive request validation and sanitization

## 🛠 Technical Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with email-based OTP verification
- **File Storage**: Multer for file uploads
- **Validation**: Joi for request validation
- **Email**: Nodemailer with SMTP support
- **Logging**: Winston for application logging
- **Testing**: Jest for unit and integration tests

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v4.4 or higher)
- SMTP email service (Gmail, etc.)

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rugalika-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
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

4. **Build the application**
   ```bash
   npm run build
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /api/auth/send-code` - Send OTP code to email
- `POST /api/auth/verify-code` - Verify OTP and get JWT token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### News Endpoints
- `GET /api/news` - Get all news (public: published only)
- `GET /api/news/:id` - Get single news article
- `POST /api/news` - Create news article (Admin only)
- `PUT /api/news/:id` - Update news article (Admin only)
- `DELETE /api/news/:id` - Delete news article (Admin only)
- `POST /api/news/:id/view` - Increment view count
- `POST /api/news/:id/like` - Like/unlike news article

### User Management Endpoints (Admin only)
- `GET /api/users` - Get all users with pagination
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Feedback Endpoints
- `GET /api/feedback` - Get feedback (public: approved only)
- `POST /api/feedback` - Submit feedback
- `PUT /api/feedback/:id/status` - Update feedback status (Admin only)

### Help Request Endpoints
- `POST /api/help-requests` - Submit help request
- `GET /api/help-requests` - Get help requests (Admin only)
- `PUT /api/help-requests/:id` - Update help request (Admin only)

### Upload Endpoints
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/video` - Upload single video
- `POST /api/upload/document` - Upload single document

### Analytics Endpoints (Admin only)
- `GET /api/analytics/overview` - Dashboard overview statistics
- `GET /api/analytics/users` - User statistics
- `GET /api/analytics/news` - News statistics

## 📁 Project Structure

```
rugalika-backend/
├── src/
│   ├── controllers/        # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── app.ts             # Application entry point
├── uploads/               # File upload directory
├── tests/                 # Test files
├── logs/                  # Application logs
├── docs/                  # Documentation
└── README.md
```

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Email OTP verification system
- Role-based authorization
- Input validation and sanitization
- Rate limiting on sensitive endpoints
- CORS configuration
- File upload validation
- XSS and injection attack prevention

## 📧 Email System

The system supports bilingual email notifications in Kinyarwanda and English:
- OTP verification emails
- Welcome emails for new users
- Feedback response notifications
- Help request status updates

## 📊 Analytics & Monitoring

- Comprehensive dashboard statistics
- User activity tracking
- News performance metrics
- System health monitoring
- Error logging and tracking

## 🌍 Internationalization

The system supports multiple languages:
- **Kinyarwanda**: Primary language for local users
- **English**: Secondary language for broader accessibility
- **French**: Planned for future implementation

## 🚀 Deployment

### Production Checklist
- [ ] Set up production MongoDB database
- [ ] Configure email service (SMTP)
- [ ] Set up file storage (local or cloud)
- [ ] Configure environment variables
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Implement backup strategy

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- **Email**: info@rugalika.gov.rw
- **Phone**: +250 788 000 000
- **Address**: Rugalika Sector, Rwanda

## 🙏 Acknowledgments

- Rugalika Sector Administration
- Rwanda Government Digital Transformation Initiative
- Local community members and stakeholders

---

**Rugalika News Backend** - Empowering local governance through digital innovation 🇷🇼
