import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { Request } from 'express';
import { logger } from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface FileUploadOptions {
  maxSize: number;
  allowedTypes: string[];
  folder: string;
  transformation?: any;
}

class CloudinaryService {
  private maxFileSize: number;

  constructor() {
    this.maxFileSize = this.parseFileSize(process.env.MAX_FILE_SIZE || '50MB');
  }

  /**
   * Parse file size string to bytes
   */
  private parseFileSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) {
      throw new Error(`Invalid file size format: ${sizeStr}`);
    }

    const size = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return size * (units[unit] || 1);
  }

  /**
   * Create Cloudinary storage configuration
   */
  private createCloudinaryStorage(folder: string, transformation?: any) {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'avi', 'mov', 'pdf', 'doc', 'docx', 'txt'],
        transformation: transformation,
        resource_type: 'auto',
        format: 'auto',
        quality: 'auto',
      } as any,
    });
  }

  /**
   * Create file filter function
   */
  private createFileFilter(allowedTypes: string[]) {
    return (req: Request, file: Express.Multer.File, cb: Function) => {
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      const isAllowed = fileExtension && allowedTypes.includes(fileExtension);
      
      if (isAllowed) {
        cb(null, true);
      } else {
        const error = new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        error.name = 'INVALID_FILE_TYPE';
        cb(error, false);
      }
    };
  }

  /**
   * Create multer upload middleware with Cloudinary storage
   */
  private createUploadMiddleware(options: FileUploadOptions) {
    const storage = this.createCloudinaryStorage(options.folder, options.transformation);
    
    return multer({
      storage: storage,
      fileFilter: this.createFileFilter(options.allowedTypes),
      limits: {
        fileSize: options.maxSize,
        files: 10 // Maximum 10 files per request
      }
    });
  }

  /**
   * Get image upload middleware
   */
  getImageUploadMiddleware() {
    const options: FileUploadOptions = {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      folder: 'rugalika/images',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    };

    return this.createUploadMiddleware(options);
  }

  /**
   * Get video upload middleware
   */
  getVideoUploadMiddleware() {
    const options: FileUploadOptions = {
      maxSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: ['mp4', 'webm', 'avi', 'mov'],
      folder: 'rugalika/videos',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    };

    return this.createUploadMiddleware(options);
  }

  /**
   * Get document upload middleware
   */
  getDocumentUploadMiddleware() {
    const options: FileUploadOptions = {
      maxSize: 25 * 1024 * 1024, // 25MB
      allowedTypes: ['pdf', 'doc', 'docx', 'txt'],
      folder: 'rugalika/documents'
    };

    return this.createUploadMiddleware(options);
  }

  /**
   * Get general upload middleware
   */
  getGeneralUploadMiddleware() {
    const options: FileUploadOptions = {
      maxSize: this.maxFileSize,
      allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'pdf', 'doc', 'docx', 'txt'],
      folder: 'rugalika/general'
    };

    return this.createUploadMiddleware(options);
  }

  /**
   * Handle single file upload
   */
  async uploadSingleFile(
    fieldName: string,
    fileType: 'image' | 'video' | 'document' | 'general' = 'general'
  ) {
    let middleware;
    
    switch (fileType) {
      case 'image':
        middleware = this.getImageUploadMiddleware();
        break;
      case 'video':
        middleware = this.getVideoUploadMiddleware();
        break;
      case 'document':
        middleware = this.getDocumentUploadMiddleware();
        break;
      default:
        middleware = this.getGeneralUploadMiddleware();
    }

    return middleware.single(fieldName);
  }

  /**
   * Handle multiple files upload
   */
  async uploadMultipleFiles(
    fieldName: string,
    maxCount: number = 5,
    fileType: 'image' | 'video' | 'document' | 'general' = 'general'
  ) {
    let middleware;
    
    switch (fileType) {
      case 'image':
        middleware = this.getImageUploadMiddleware();
        break;
      case 'video':
        middleware = this.getVideoUploadMiddleware();
        break;
      case 'document':
        middleware = this.getDocumentUploadMiddleware();
        break;
      default:
        middleware = this.getGeneralUploadMiddleware();
    }

    return middleware.array(fieldName, maxCount);
  }

  /**
   * Handle mixed files upload
   */
  getMixedUploadMiddleware(fields: Array<{ name: string; maxCount: number }>) {
    return this.getGeneralUploadMiddleware().fields(fields);
  }

  /**
   * Process uploaded file and return file info
   */
  processUploadedFile(file: Express.Multer.File): {
    filename: string;
    originalName: string;
    size: string;
    url: string;
    publicId: string;
    mimeType: string;
    extension: string;
    cloudinaryData: any;
  } {
    // Extract Cloudinary data from the file
    const cloudinaryData = (file as any).cloudinaryData || {};
    
    return {
      filename: file.filename || cloudinaryData.public_id || '',
      originalName: file.originalname,
      size: this.formatFileSize(file.size),
      url: cloudinaryData.secure_url || file.path || '',
      publicId: cloudinaryData.public_id || '',
      mimeType: file.mimetype,
      extension: this.getFileExtension(file.originalname),
      cloudinaryData: cloudinaryData
    };
  }

  /**
   * Process multiple uploaded files
   */
  processUploadedFiles(files: Express.Multer.File[]) {
    return files.map(file => this.processUploadedFile(file));
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'ok') {
        logger.info(`Deleted file from Cloudinary: ${publicId}`);
        return true;
      } else {
        logger.warn(`Failed to delete file from Cloudinary: ${publicId}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error deleting file from Cloudinary ${publicId}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple files from Cloudinary
   */
  async deleteFiles(publicIds: string[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const publicId of publicIds) {
      const success = await this.deleteFile(publicId);
      if (success) {
        deleted++;
      } else {
        failed++;
      }
    }

    return { deleted, failed };
  }

  /**
   * Get file info from Cloudinary
   */
  async getFileInfo(publicId: string): Promise<{
    exists: boolean;
    url?: string;
    size?: string;
    format?: string;
    createdAt?: Date;
  }> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        exists: true,
        url: result.secure_url,
        size: this.formatFileSize(result.bytes),
        format: result.format,
        createdAt: new Date(result.created_at)
      };
    } catch (error) {
      logger.error(`Error getting file info from Cloudinary ${publicId}:`, error);
      return { exists: false };
    }
  }

  /**
   * Upload file directly to Cloudinary (for programmatic uploads)
   */
  async uploadFile(filePath: string, options: {
    folder?: string;
    transformation?: any;
    publicId?: string;
  } = {}): Promise<{
    url: string;
    publicId: string;
    format: string;
    size: number;
  }> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: options.folder || 'rugalika/uploaded',
        transformation: options.transformation,
        public_id: options.publicId,
        resource_type: 'auto'
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes
      };
    } catch (error) {
      logger.error('Error uploading file to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(): Promise<{
    totalFiles: number;
    totalSize: string;
    byType: { [key: string]: { count: number; size: string } };
  }> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        max_results: 1000,
        prefix: 'rugalika/'
      });

      const stats = {
        totalFiles: result.resources.length,
        totalSize: '0 B',
        byType: {} as { [key: string]: { count: number; size: string } }
      };

      let totalSizeBytes = 0;

      result.resources.forEach((resource: any) => {
        const folder = resource.folder?.split('/')[1] || 'general';
        
        if (!stats.byType[folder]) {
          stats.byType[folder] = { count: 0, size: '0 B' };
        }

        stats.byType[folder].count++;
        totalSizeBytes += resource.bytes || 0;
      });

      stats.totalSize = this.formatFileSize(totalSizeBytes);

      // Format individual folder sizes
      for (const folder in stats.byType) {
        const folderSize = result.resources
          .filter((r: any) => r.folder?.split('/')[1] === folder)
          .reduce((sum: number, r: any) => sum + (r.bytes || 0), 0);
        stats.byType[folder].size = this.formatFileSize(folderSize);
      }

      return stats;
    } catch (error) {
      logger.error('Error getting Cloudinary upload stats:', error);
      return {
        totalFiles: 0,
        totalSize: '0 B',
        byType: {}
      };
    }
  }

  /**
   * Helper methods
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }
}

export const cloudinaryService = new CloudinaryService();
