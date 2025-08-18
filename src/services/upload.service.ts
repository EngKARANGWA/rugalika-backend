import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { logger } from '../utils/logger';
import { generateUniqueFilename, formatFileSize, getFileExtension, isAllowedFileType } from '../utils/helpers';

interface FileUploadOptions {
  maxSize: number;
  allowedTypes: string[];
  destination: string;
}

class UploadService {
  private uploadPath: string;
  private maxFileSize: number;

  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.maxFileSize = this.parseFileSize(process.env.MAX_FILE_SIZE || '50MB');
    this.ensureUploadDirectories();
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
   * Ensure upload directories exist
   */
  private ensureUploadDirectories(): void {
    const directories = [
      this.uploadPath,
      path.join(this.uploadPath, 'images'),
      path.join(this.uploadPath, 'videos'),
      path.join(this.uploadPath, 'documents'),
      path.join(this.uploadPath, 'temp')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created upload directory: ${dir}`);
      }
    });
  }

  /**
   * Create multer storage configuration
   */
  private createStorage(destination: string): StorageEngine {
    return multer.diskStorage({
      destination: (req: Request, file: Express.Multer.File, cb: Function) => {
        const fullPath = path.join(this.uploadPath, destination);
        cb(null, fullPath);
      },
      filename: (req: Request, file: Express.Multer.File, cb: Function) => {
        const uniqueFilename = generateUniqueFilename(file.originalname);
        cb(null, uniqueFilename);
      }
    });
  }

  /**
   * Create file filter function
   */
  private createFileFilter(allowedTypes: string[]) {
    return (req: Request, file: Express.Multer.File, cb: Function) => {
      const isAllowed = isAllowedFileType(file.originalname, allowedTypes);
      
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
   * Create multer upload middleware
   */
  private createUploadMiddleware(options: FileUploadOptions) {
    return multer({
      storage: this.createStorage(options.destination),
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
      destination: 'images'
    };

    return this.createUploadMiddleware(options);
  }

  /**
   * Get video upload middleware
   */
  getVideoUploadMiddleware() {
    const options: FileUploadOptions = {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['mp4', 'webm', 'avi', 'mov'],
      destination: 'videos'
    };

    return this.createUploadMiddleware(options);
  }

  /**
   * Get document upload middleware
   */
  getDocumentUploadMiddleware() {
    const options: FileUploadOptions = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['pdf', 'doc', 'docx', 'txt'],
      destination: 'documents'
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
      destination: 'temp'
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
    path: string;
    url: string;
    mimeType: string;
    extension: string;
  } {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const relativePath = path.relative(this.uploadPath, file.path);
    
    return {
      filename: file.filename,
      originalName: file.originalname,
      size: formatFileSize(file.size),
      path: file.path,
      url: `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`,
      mimeType: file.mimetype,
      extension: getFileExtension(file.originalname)
    };
  }

  /**
   * Process multiple uploaded files
   */
  processUploadedFiles(files: Express.Multer.File[]) {
    return files.map(file => this.processUploadedFile(file));
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Ensure the file is within the upload directory for security
      const fullPath = path.resolve(filePath);
      const uploadDir = path.resolve(this.uploadPath);
      
      if (!fullPath.startsWith(uploadDir)) {
        logger.warn(`Attempted to delete file outside upload directory: ${filePath}`);
        return false;
      }

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`Deleted file: ${filePath}`);
        return true;
      } else {
        logger.warn(`File not found for deletion: ${filePath}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error deleting file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(filePaths: string[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const filePath of filePaths) {
      const success = await this.deleteFile(filePath);
      if (success) {
        deleted++;
      } else {
        failed++;
      }
    }

    return { deleted, failed };
  }

  /**
   * Get file info without processing
   */
  getFileInfo(filePath: string): {
    exists: boolean;
    size?: string;
    extension?: string;
    mimeType?: string;
    createdAt?: Date;
  } {
    try {
      if (!fs.existsSync(filePath)) {
        return { exists: false };
      }

      const stats = fs.statSync(filePath);
      const extension = getFileExtension(filePath);
      
      // Basic MIME type detection
      const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain'
      };

      return {
        exists: true,
        size: formatFileSize(stats.size),
        extension,
        mimeType: mimeTypes[extension] || 'application/octet-stream',
        createdAt: stats.birthtime
      };
    } catch (error) {
      logger.error(`Error getting file info for ${filePath}:`, error);
      return { exists: false };
    }
  }

  /**
   * Clean up temporary files older than specified hours
   */
  async cleanupTempFiles(hoursOld: number = 24): Promise<number> {
    const tempDir = path.join(this.uploadPath, 'temp');
    let cleanedCount = 0;

    try {
      if (!fs.existsSync(tempDir)) {
        return 0;
      }

      const files = fs.readdirSync(tempDir);
      const cutoffTime = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);

        if (stats.birthtime < cutoffTime) {
          fs.unlinkSync(filePath);
          cleanedCount++;
          logger.info(`Cleaned up temp file: ${file}`);
        }
      }

      logger.info(`Cleaned up ${cleanedCount} temporary files`);
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up temp files:', error);
      return cleanedCount;
    }
  }

  /**
   * Get upload statistics
   */
  getUploadStats(): {
    totalFiles: number;
    totalSize: string;
    byType: { [key: string]: { count: number; size: string } };
  } {
    const stats = {
      totalFiles: 0,
      totalSize: '0 B',
      byType: {} as { [key: string]: { count: number; size: string } }
    };

    try {
      const directories = ['images', 'videos', 'documents'];
      let totalSizeBytes = 0;

      directories.forEach(dir => {
        const dirPath = path.join(this.uploadPath, dir);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          let dirSizeBytes = 0;

          files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const fileStats = fs.statSync(filePath);
            dirSizeBytes += fileStats.size;
          });

          stats.byType[dir] = {
            count: files.length,
            size: formatFileSize(dirSizeBytes)
          };

          stats.totalFiles += files.length;
          totalSizeBytes += dirSizeBytes;
        }
      });

      stats.totalSize = formatFileSize(totalSizeBytes);
      return stats;
    } catch (error) {
      logger.error('Error getting upload stats:', error);
      return stats;
    }
  }
}

export const uploadService = new UploadService();
