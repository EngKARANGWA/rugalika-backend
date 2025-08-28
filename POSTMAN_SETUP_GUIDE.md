# Rugalika News API - Postman Collection Setup Guide

This guide will help you set up and use the Postman collection for the Rugalika News API.

## Files Included

1. `Rugalika_API_Collection.postman_collection.json` - Complete API collection with all endpoints
2. `Rugalika_Environment.postman_environment.json` - Environment variables for easy configuration
3. `POSTMAN_SETUP_GUIDE.md` - This setup guide

## Quick Setup

### Step 1: Import Collection and Environment

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop both JSON files or click **Upload Files**:
   - `Rugalika_API_Collection.postman_collection.json`
   - `Rugalika_Environment.postman_environment.json`
4. Click **Import**

### Step 2: Select Environment

1. In the top right corner of Postman, click the environment dropdown
2. Select **"Rugalika Development Environment"**

### Step 3: Start Your Server

Make sure your Rugalika backend server is running:
```bash
npm run dev
```

The server should be running on `http://localhost:5000`

## Authentication Flow

### Getting Started with Authentication

1. **Send OTP Code**
   - Navigate to `Authentication > Send OTP Code`
   - Update the email in the request body
   - Send the request
   - Check your email for the OTP code

2. **Verify OTP and Get Tokens**
   - Navigate to `Authentication > Verify OTP Code`
   - Update the email and code in the request body
   - Send the request
   - The access token and refresh token will be automatically saved to environment variables

3. **Use Authenticated Endpoints**
   - All authenticated endpoints will now use the saved access token automatically
   - The token is valid for 24 hours (as configured in your backend)

### Token Management

- **Access Token**: Automatically saved and used for authenticated requests
- **Refresh Token**: Use `Authentication > Refresh Token` when access token expires
- **Logout**: Use `Authentication > Logout` to invalidate the current token

## Collection Structure

### 📁 Health Check
- `GET /health` - Check API status

### 📁 Authentication
- `POST /auth/send-code` - Send OTP to email
- `POST /auth/verify-code` - Verify OTP and get tokens
- `POST /auth/refresh-token` - Refresh access token
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/logout` - Logout user
- `GET /auth/validate-token` - Validate current token
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/reset-password` - Reset password
- `PUT /auth/users/:userId/status` - Change user status (Admin)
- `GET /auth/stats` - Get auth statistics (Admin)
- `POST /auth/clean-expired-tokens` - Clean expired tokens (Admin)

### 📁 Users
- `GET /users` - Get all users with pagination (Admin)
- `POST /users` - Create new user (Admin)
- `GET /users/search` - Search users (Admin)
- `GET /users/stats` - Get user statistics (Admin)
- `GET /users/export` - Export users data (Admin)
- `PUT /users/bulk-update` - Bulk update users (Admin)
- `GET /users/:id` - Get user by ID (Admin)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user (Admin)
- `DELETE /users/:id/permanent` - Permanently delete user (Admin)
- `PUT /users/:id/activate` - Activate user (Admin)
- `PUT /users/:id/deactivate` - Deactivate user (Admin)
- `PUT /users/:id/role` - Update user role (Admin)

### 📁 News
- `GET /news` - Get all news with filtering
- `GET /news/featured` - Get featured news
- `GET /news/latest` - Get latest news
- `GET /news/popular` - Get popular news
- `GET /news/search` - Search news articles
- `GET /news/category/:category` - Get news by category
- `POST /news` - Create news article (Admin)
- `GET /news/admin/stats` - Get news statistics (Admin)
- `PUT /news/admin/bulk-update-status` - Bulk update news status (Admin)
- `GET /news/:id` - Get news by ID
- `PUT /news/:id` - Update news article (Admin)
- `DELETE /news/:id` - Delete news article (Admin)
- `POST /news/:id/view` - Increment view count
- `POST /news/:id/like` - Toggle like

### 📁 Feedback
- `GET /feedback` - Get all feedback
- `POST /feedback` - Submit feedback
- `GET /feedback/:id` - Get feedback by ID
- `POST /feedback/:id/like` - Like feedback
- `PUT /feedback/:id/status` - Update feedback status (Admin)
- `DELETE /feedback/:id` - Delete feedback (Admin)
- `GET /feedback/admin/stats` - Get feedback statistics (Admin)

### 📁 Help Requests
- `POST /help-requests` - Submit help request
- `GET /help-requests` - Get all help requests (Admin)
- `GET /help-requests/stats` - Get help request statistics (Admin)
- `GET /help-requests/:id` - Get help request by ID (Admin)
- `PUT /help-requests/:id` - Update help request (Admin)
- `PUT /help-requests/:id/assign` - Assign help request (Admin)

### 📁 Analytics
- `GET /analytics/overview` - Get overview statistics (Admin)
- `GET /analytics/users` - Get user analytics (Admin)
- `GET /analytics/news` - Get news analytics (Admin)
- `GET /analytics/feedback` - Get feedback analytics (Admin)
- `GET /analytics/help-requests` - Get help request analytics (Admin)

### 📁 Settings
- `GET /settings` - Get system settings
- `PUT /settings` - Update system settings (Admin)

### 📁 Upload
- `POST /upload/image` - Upload single image
- `POST /upload/video` - Upload single video
- `POST /upload/document` - Upload single document
- `POST /upload/multiple` - Upload multiple files
- `GET /upload/stats` - Get upload statistics (Admin)

## Environment Variables

The environment includes these variables:

- `base_url` - API base URL (http://localhost:5000/api)
- `access_token` - JWT access token (auto-populated)
- `refresh_token` - JWT refresh token (auto-populated)
- `user_id` - Current user ID (auto-populated)
- `admin_email` - Admin email for reference

## Usage Tips

### 1. Testing Authentication Flow
```
1. Send OTP Code → Get OTP via email
2. Verify OTP Code → Get access & refresh tokens
3. Test protected endpoints → Use saved tokens automatically
```

### 2. Admin Endpoints
- First authenticate with an admin account
- Admin endpoints are marked with "(Admin)" in the name
- Ensure your user has admin role in the database

### 3. File Uploads
- Use the Upload folder for file upload endpoints
- Select files in the form-data body
- Supported formats: images, videos, documents

### 4. Pagination
- Most list endpoints support pagination
- Use query parameters: `page`, `limit`
- Default: `page=1`, `limit=10`

### 5. Filtering and Search
- Use query parameters for filtering
- Example: `?status=active&category=politics`
- Search endpoints accept `q` parameter

## Error Handling

Common HTTP status codes you might encounter:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- Authentication endpoints: Limited requests per IP
- Upload endpoints: Limited uploads per user
- General endpoints: 100 requests per 15 minutes per IP

## Troubleshooting

### Token Issues
- If you get 401 errors, try refreshing your token
- Use `Authentication > Refresh Token` endpoint
- If refresh fails, re-authenticate with OTP

### Environment Issues
- Ensure "Rugalika Development Environment" is selected
- Check that `base_url` points to your running server
- Verify server is running on http://localhost:5000

### Server Issues
- Ensure MongoDB is running and accessible
- Check server logs for detailed error messages
- Verify all environment variables are set in your `.env` file

## Development vs Production

### For Production Use:
1. Update the `base_url` in environment to your production API URL
2. Use HTTPS URLs for production
3. Update admin email to production admin
4. Consider creating separate environments for staging/production

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify your database connection
3. Ensure all required environment variables are set
4. Check API documentation in the code comments

---

Happy testing! 🚀
