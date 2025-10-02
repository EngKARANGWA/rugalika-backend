import { Router } from 'express';
import { cloudinaryService } from '../services';
import { authenticate, adminOnly } from '../middleware';

const router = Router();

/**
 * @route   POST /api/upload/image
 * @desc    Upload single image to Cloudinary
 * @access  Admin
 */
router.post(
  '/image',
  authenticate,
  adminOnly,
  cloudinaryService.getImageUploadMiddleware().single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const fileInfo = cloudinaryService.processUploadedFile(req.file);
    
    return res.status(200).json({
      success: true,
      data: fileInfo,
      message: 'Image uploaded successfully to Cloudinary'
    });
  }
);

/**
 * @route   POST /api/upload/video
 * @desc    Upload single video to Cloudinary
 * @access  Admin
 */
router.post(
  '/video',
  authenticate,
  adminOnly,
  cloudinaryService.getVideoUploadMiddleware().single('video'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const fileInfo = cloudinaryService.processUploadedFile(req.file);
    
    return res.status(200).json({
      success: true,
      data: fileInfo,
      message: 'Video uploaded successfully to Cloudinary'
    });
  }
);

/**
 * @route   POST /api/upload/document
 * @desc    Upload single document to Cloudinary
 * @access  Admin
 */
router.post(
  '/document',
  authenticate,
  adminOnly,
  cloudinaryService.getDocumentUploadMiddleware().single('document'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    const fileInfo = cloudinaryService.processUploadedFile(req.file);
    
    return res.status(200).json({
      success: true,
      data: fileInfo,
      message: 'Document uploaded successfully to Cloudinary'
    });
  }
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files to Cloudinary
 * @access  Admin
 */
router.post(
  '/multiple',
  authenticate,
  adminOnly,
  cloudinaryService.getGeneralUploadMiddleware().array('files', 10),
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }

    const filesInfo = cloudinaryService.processUploadedFiles(req.files as Express.Multer.File[]);
    
    return res.status(200).json({
      success: true,
      data: filesInfo,
      message: `${filesInfo.length} files uploaded successfully to Cloudinary`
    });
  }
);

/**
 * @route   DELETE /api/upload/:publicId
 * @desc    Delete file from Cloudinary
 * @access  Admin
 */
router.delete(
  '/:publicId',
  authenticate,
  adminOnly,
  async (req, res) => {
    const { publicId } = req.params;
    
    try {
      const success = await cloudinaryService.deleteFile(publicId);
      
      if (success) {
        res.status(200).json({
          success: true,
          message: 'File deleted successfully from Cloudinary'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'File not found or could not be deleted'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting file from Cloudinary'
      });
    }
  }
);

/**
 * @route   GET /api/upload/stats
 * @desc    Get Cloudinary upload statistics
 * @access  Admin
 */
router.get(
  '/stats',
  authenticate,
  adminOnly,
  async (req, res) => {
    try {
      const stats = await cloudinaryService.getUploadStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Upload statistics retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving upload statistics'
      });
    }
  }
);

export default router;
