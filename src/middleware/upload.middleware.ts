import { Request, Response, NextFunction } from 'express';
import { uploadService } from '../services';
import { createResponse } from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * Handle single image upload
 */
export const uploadSingleImage = (fieldName: string = 'image') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uploadMiddleware = await uploadService.uploadSingleFile(fieldName, 'image');
      uploadMiddleware(req, res, (error: any) => {
        if (error) {
          if (error.name === 'INVALID_FILE_TYPE') {
            res.status(400).json(createResponse(
              false,
              null,
              'Invalid file type. Please upload a valid image file (JPG, PNG, GIF, WebP).'
            ));
            return;
          }
          
          if (error.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json(createResponse(
              false,
              null,
              'File too large. Maximum image size is 5MB.'
            ));
            return;
          }
          
          logger.error('Image upload error:', error);
          res.status(500).json(createResponse(
            false,
            null,
            'File upload failed. Please try again.'
          ));
          return;
        }
        
        next();
      });
    } catch (error) {
      logger.error('Upload middleware error:', error);
      res.status(500).json(createResponse(
        false,
        null,
        'Upload service error'
      ));
    }
  };
};

/**
 * Handle single video upload
 */
export const uploadSingleVideo = (fieldName: string = 'video') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uploadMiddleware = await uploadService.uploadSingleFile(fieldName, 'video');
      uploadMiddleware(req, res, (error: any) => {
        if (error) {
          if (error.name === 'INVALID_FILE_TYPE') {
            res.status(400).json(createResponse(
              false,
              null,
              'Invalid file type. Please upload a valid video file (MP4, WebM, AVI, MOV).'
            ));
            return;
          }
          
          if (error.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json(createResponse(
              false,
              null,
              'File too large. Maximum video size is 50MB.'
            ));
            return;
          }
          
          logger.error('Video upload error:', error);
          res.status(500).json(createResponse(
            false,
            null,
            'File upload failed. Please try again.'
          ));
          return;
        }
        
        next();
      });
    } catch (error) {
      logger.error('Upload middleware error:', error);
      res.status(500).json(createResponse(
        false,
        null,
        'Upload service error'
      ));
    }
  };
};

/**
 * Handle single document upload
 */
export const uploadSingleDocument = (fieldName: string = 'document') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uploadMiddleware = await uploadService.uploadSingleFile(fieldName, 'document');
      uploadMiddleware(req, res, (error: any) => {
        if (error) {
          if (error.name === 'INVALID_FILE_TYPE') {
            res.status(400).json(createResponse(
              false,
              null,
              'Invalid file type. Please upload a valid document (PDF, DOC, DOCX, TXT).'
            ));
            return;
          }
          
          if (error.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json(createResponse(
              false,
              null,
              'File too large. Maximum document size is 10MB.'
            ));
            return;
          }
          
          logger.error('Document upload error:', error);
          res.status(500).json(createResponse(
            false,
            null,
            'File upload failed. Please try again.'
          ));
          return;
        }
        
        next();
      });
    } catch (error) {
      logger.error('Upload middleware error:', error);
      res.status(500).json(createResponse(
        false,
        null,
        'Upload service error'
      ));
    }
  };
};

/**
 * Handle multiple images upload
 */
export const uploadMultipleImages = (fieldName: string = 'images', maxCount: number = 5) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uploadMiddleware = await uploadService.uploadMultipleFiles(fieldName, maxCount, 'image');
      uploadMiddleware(req, res, (error: any) => {
        if (error) {
          if (error.name === 'INVALID_FILE_TYPE') {
            res.status(400).json(createResponse(
              false,
              null,
              'Invalid file type. Please upload valid image files (JPG, PNG, GIF, WebP).'
            ));
            return;
          }
          
          if (error.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json(createResponse(
              false,
              null,
              'One or more files are too large. Maximum image size is 5MB.'
            ));
            return;
          }
          
          if (error.code === 'LIMIT_FILE_COUNT') {
            res.status(400).json(createResponse(
              false,
              null,
              `Too many files. Maximum ${maxCount} images allowed.`
            ));
            return;
          }
          
          logger.error('Multiple images upload error:', error);
          res.status(500).json(createResponse(
            false,
            null,
            'File upload failed. Please try again.'
          ));
          return;
        }
        
        next();
      });
    } catch (error) {
      logger.error('Upload middleware error:', error);
      res.status(500).json(createResponse(
        false,
        null,
        'Upload service error'
      ));
    }
  };
};

/**
 * Handle mixed file uploads (for news articles with different media types)
 */
export const uploadMixedFiles = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const uploadMiddleware = uploadService.getMixedUploadMiddleware([
        { name: 'mainImage', maxCount: 1 },
        { name: 'subImages', maxCount: 10 },
        { name: 'videos', maxCount: 3 },
        { name: 'documents', maxCount: 5 }
      ]);
      
      uploadMiddleware(req, res, (error: any) => {
        if (error) {
          if (error.name === 'INVALID_FILE_TYPE') {
            res.status(400).json(createResponse(
              false,
              null,
              'Invalid file type detected. Please check file types and try again.'
            ));
            return;
          }
          
          if (error.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json(createResponse(
              false,
              null,
              'One or more files exceed the size limit.'
            ));
            return;
          }
          
          if (error.code === 'LIMIT_FILE_COUNT') {
            res.status(400).json(createResponse(
              false,
              null,
              'Too many files in one or more categories.'
            ));
            return;
          }
          
          logger.error('Mixed files upload error:', error);
          res.status(500).json(createResponse(
            false,
            null,
            'File upload failed. Please try again.'
          ));
          return;
        }
        
        next();
      });
    } catch (error) {
      logger.error('Upload middleware error:', error);
      res.status(500).json(createResponse(
        false,
        null,
        'Upload service error'
      ));
    }
  };
};

/**
 * Process uploaded files and add file info to request
 */
export const processUploadedFiles = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.file) {
      // Single file
      req.body.fileInfo = uploadService.processUploadedFile(req.file);
    }
    
    if (req.files) {
      if (Array.isArray(req.files)) {
        // Multiple files with same field name
        req.body.filesInfo = uploadService.processUploadedFiles(req.files);
      } else {
        // Mixed files with different field names
        const processedFiles: { [key: string]: any } = {};
        
        for (const fieldName in req.files) {
          const files = req.files[fieldName] as Express.Multer.File[];
          if (files && files.length > 0) {
            if (files.length === 1) {
              processedFiles[fieldName] = uploadService.processUploadedFile(files[0]);
            } else {
              processedFiles[fieldName] = uploadService.processUploadedFiles(files);
            }
          }
        }
        
        req.body.filesInfo = processedFiles;
      }
    }
    
    next();
  } catch (error) {
    logger.error('Error processing uploaded files:', error);
    res.status(500).json(createResponse(
      false,
      null,
      'Error processing uploaded files'
    ));
  }
};

/**
 * Validate file requirements
 */
export const validateFileRequirements = (requirements: {
  required?: string[];
  optional?: string[];
  maxSizes?: { [key: string]: number };
  allowedTypes?: { [key: string]: string[] };
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { required = [], optional = [], maxSizes = {}, allowedTypes = {} } = requirements;
      
      // Check required files
      for (const fieldName of required) {
        const hasFile = req.file?.fieldname === fieldName || 
                       (req.files && (
                         Array.isArray(req.files) ? 
                         req.files.some(f => f.fieldname === fieldName) :
                         req.files[fieldName as keyof typeof req.files]
                       ));
        
        if (!hasFile) {
          res.status(400).json(createResponse(
            false,
            null,
            `Required file '${fieldName}' is missing`
          ));
          return;
        }
      }
      
      // Validate file sizes and types
      const filesToCheck: Express.Multer.File[] = [];
      
      if (req.file) {
        filesToCheck.push(req.file);
      }
      
      if (req.files) {
        if (Array.isArray(req.files)) {
          filesToCheck.push(...req.files);
        } else {
          for (const fieldName in req.files) {
            const files = req.files[fieldName] as Express.Multer.File[];
            if (files) {
              filesToCheck.push(...files);
            }
          }
        }
      }
      
      for (const file of filesToCheck) {
        const fieldName = file.fieldname;
        
        // Check file size
        if (maxSizes[fieldName] && file.size > maxSizes[fieldName]) {
          res.status(400).json(createResponse(
            false,
            null,
            `File '${file.originalname}' exceeds maximum size for field '${fieldName}'`
          ));
          return;
        }
        
        // Check file type
        if (allowedTypes[fieldName]) {
          const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
          if (!fileExtension || !allowedTypes[fieldName].includes(fileExtension)) {
            res.status(400).json(createResponse(
              false,
              null,
              `Invalid file type for '${file.originalname}'. Allowed types for '${fieldName}': ${allowedTypes[fieldName].join(', ')}`
            ));
            return;
          }
        }
      }
      
      next();
    } catch (error) {
      logger.error('Error validating file requirements:', error);
      res.status(500).json(createResponse(
        false,
        null,
        'Error validating file requirements'
      ));
    }
  };
};

/**
 * Clean up uploaded files on error
 */
export const cleanupOnError = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Clean up files if response status indicates error
    if (res.statusCode >= 400) {
      const filesToDelete: string[] = [];
      
      if (req.file) {
        filesToDelete.push(req.file.path);
      }
      
      if (req.files) {
        if (Array.isArray(req.files)) {
          filesToDelete.push(...req.files.map(f => f.path));
        } else {
          for (const fieldName in req.files) {
            const files = req.files[fieldName] as Express.Multer.File[];
            if (files) {
              filesToDelete.push(...files.map(f => f.path));
            }
          }
        }
      }
      
      // Delete files asynchronously
      if (filesToDelete.length > 0) {
        uploadService.deleteFiles(filesToDelete).catch(error => {
          logger.error('Error cleaning up files:', error);
        });
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};
