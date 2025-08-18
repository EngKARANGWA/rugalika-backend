import { Request, Response } from 'express';
import { uploadService } from '../services';
import { createResponse, asyncHandler } from '../middleware/error.middleware';

/**
 * Upload single image
 */
export const uploadImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json(createResponse(
      false,
      null,
      'No image file provided'
    ));
    return;
  }

  const fileInfo = uploadService.processUploadedFile(req.file);

  res.status(200).json(createResponse(
    true,
    { 
      url: fileInfo.url,
      filename: fileInfo.filename,
      size: fileInfo.size
    },
    'Image uploaded successfully'
  ));
});

/**
 * Upload single video
 */
export const uploadVideo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json(createResponse(
      false,
      null,
      'No video file provided'
    ));
    return;
  }

  const fileInfo = uploadService.processUploadedFile(req.file);

  res.status(200).json(createResponse(
    true,
    { 
      url: fileInfo.url,
      filename: fileInfo.filename,
      size: fileInfo.size
    },
    'Video uploaded successfully'
  ));
});

/**
 * Upload single document
 */
export const uploadDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json(createResponse(
      false,
      null,
      'No document file provided'
    ));
    return;
  }

  const fileInfo = uploadService.processUploadedFile(req.file);

  res.status(200).json(createResponse(
    true,
    { 
      url: fileInfo.url,
      filename: fileInfo.filename,
      size: fileInfo.size
    },
    'Document uploaded successfully'
  ));
});

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    res.status(400).json(createResponse(
      false,
      null,
      'No files provided'
    ));
    return;
  }

  const filesInfo = uploadService.processUploadedFiles(files);

  res.status(200).json(createResponse(
    true,
    { 
      files: filesInfo,
      count: filesInfo.length
    },
    `${filesInfo.length} files uploaded successfully`
  ));
});

/**
 * Get upload statistics (Admin only)
 */
export const getUploadStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = uploadService.getUploadStats();

  res.status(200).json(createResponse(
    true,
    { stats },
    'Upload statistics retrieved successfully'
  ));
});
