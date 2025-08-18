import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller';
import { 
  authenticate,
  adminOnly,
  uploadRateLimit,
  uploadSingleImage,
  uploadSingleVideo,
  uploadSingleDocument,
  uploadMultipleImages,
  processUploadedFiles,
  cleanupOnError
} from '../middleware';

const router = Router();

/**
 * All upload routes require authentication
 */

/**
 * @route   POST /api/upload/image
 * @desc    Upload single image
 * @access  Private
 */
router.post(
  '/image',
  authenticate,
  uploadRateLimit,
  uploadSingleImage('image'),
  cleanupOnError,
  uploadController.uploadImage
);

/**
 * @route   POST /api/upload/video
 * @desc    Upload single video
 * @access  Private
 */
router.post(
  '/video',
  authenticate,
  uploadRateLimit,
  uploadSingleVideo('video'),
  cleanupOnError,
  uploadController.uploadVideo
);

/**
 * @route   POST /api/upload/document
 * @desc    Upload single document
 * @access  Private
 */
router.post(
  '/document',
  authenticate,
  uploadRateLimit,
  uploadSingleDocument('document'),
  cleanupOnError,
  uploadController.uploadDocument
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files
 * @access  Private
 */
router.post(
  '/multiple',
  authenticate,
  uploadRateLimit,
  uploadMultipleImages('files', 10),
  processUploadedFiles,
  cleanupOnError,
  uploadController.uploadMultipleFiles
);

/**
 * @route   GET /api/upload/stats
 * @desc    Get upload statistics
 * @access  Admin
 */
router.get(
  '/stats',
  authenticate,
  adminOnly,
  uploadController.getUploadStats
);

export default router;
