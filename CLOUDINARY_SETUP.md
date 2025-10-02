# Cloudinary Setup Guide for Rugalika Backend

This guide will help you set up Cloudinary for file uploads in your Rugalika backend.

## What is Cloudinary?

Cloudinary is a cloud-based service that provides solutions for image and video management. It offers:
- **Image & Video Upload**: Direct upload to cloud storage
- **Automatic Optimization**: Resize, compress, and format conversion
- **CDN Delivery**: Fast global content delivery
- **Transformations**: On-the-fly image/video modifications
- **Secure Storage**: Enterprise-grade security

## Setup Steps

### 1. Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click "Sign Up For Free"
3. Fill in your details and create an account
4. Verify your email address

### 2. Get Your Credentials

After logging in to Cloudinary:

1. Go to **Dashboard**
2. Copy your credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Configure Environment Variables

Create a `.env` file in your project root with these variables:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# File Upload Limits
MAX_FILE_SIZE=100MB
```

### 4. Test the Setup

#### Test Image Upload:
```bash
POST /api/upload/image
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body:
- image: [select image file]
```

#### Test Video Upload:
```bash
POST /api/upload/video
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body:
- video: [select video file]
```

#### Test Document Upload:
```bash
POST /api/upload/document
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body:
- document: [select document file]
```

## File Upload Endpoints

### Single File Uploads
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/video` - Upload single video
- `POST /api/upload/document` - Upload single document

### Multiple File Uploads
- `POST /api/upload/multiple` - Upload multiple files (max 10)

### File Management
- `DELETE /api/upload/:publicId` - Delete file from Cloudinary
- `GET /api/upload/stats` - Get upload statistics

## News Article Upload

For news articles, use the news endpoint with these field names:

```bash
POST /api/news
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body:
- title: "News Title"
- content: "News content..."
- category: "Ubuzima"
- summary: "Brief summary"
- tags: "tag1,tag2,tag3"
- featured: "false"
- mainImage: [select main image file]
- subImages: [select additional image files]
- videos: [select video files]
- documents: [select document files]
```

## File Type Support

### Images
- **Formats**: JPG, JPEG, PNG, GIF, WebP
- **Max Size**: 5MB
- **Folder**: `rugalika/images`
- **Transformations**: Auto-resize, quality optimization

### Videos
- **Formats**: MP4, WebM, AVI, MOV
- **Max Size**: 100MB
- **Folder**: `rugalika/videos`
- **Transformations**: Auto-format, quality optimization

### Documents
- **Formats**: PDF, DOC, DOCX, TXT
- **Max Size**: 25MB
- **Folder**: `rugalika/documents`

## Benefits of Cloudinary

1. **No Local Storage**: Files are stored in the cloud, not on your server
2. **Automatic Optimization**: Images and videos are automatically optimized
3. **CDN Delivery**: Fast global content delivery
4. **Scalability**: Handle unlimited file uploads
5. **Security**: Enterprise-grade security and access control
6. **Transformations**: On-the-fly image/video modifications
7. **Analytics**: Track file usage and performance

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Check your Cloudinary credentials in `.env`
   - Ensure credentials are correct and not expired

2. **"File too large" error**
   - Check `MAX_FILE_SIZE` in your `.env`
   - Cloudinary has different limits for different account types

3. **"Invalid file type" error**
   - Check the allowed file formats for each endpoint
   - Ensure file extension matches allowed types

4. **Upload fails**
   - Check your internet connection
   - Verify Cloudinary service status
   - Check file size and type restrictions

### Getting Help

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Support](https://support.cloudinary.com)
- [Cloudinary Community](https://community.cloudinary.com)

## Security Notes

1. **API Keys**: Keep your API keys secure and never commit them to version control
2. **Access Control**: All upload endpoints require admin authentication
3. **File Validation**: Files are validated for type and size before upload
4. **Secure URLs**: Cloudinary provides secure HTTPS URLs for all files

## Cost Considerations

- **Free Tier**: 25 GB storage, 25 GB bandwidth/month
- **Paid Plans**: Start at $89/month for higher limits
- **Pay-as-you-go**: Additional usage billed per GB

For production use, consider upgrading to a paid plan for better performance and support.
