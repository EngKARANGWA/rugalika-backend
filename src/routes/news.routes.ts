import { Router } from 'express';
import * as newsController from '../controllers/news.controller';
import { 
  authenticate, 
  adminOnly,
  optionalAuth,
  validate,
  validateObjectId,
  validatePagination,
  uploadMixedFiles,
  processUploadedFiles,
  cleanupOnError
} from '../middleware';
import { newsValidation } from '../utils/validation';

const router = Router();

/**
 * @route   GET /api/news
 * @desc    Get all news with filtering and pagination
 * @access  Public (published only) / Admin (all)
 */
router.get(
  '/',
  optionalAuth,
  validatePagination,
  validate(newsValidation.query, 'query'),
  newsController.getAllNews
);

/**
 * @route   GET /api/news/featured
 * @desc    Get featured news
 * @access  Public
 */
router.get(
  '/featured',
  newsController.getFeaturedNews
);

/**
 * @route   GET /api/news/latest
 * @desc    Get latest news
 * @access  Public
 */
router.get(
  '/latest',
  newsController.getLatestNews
);

/**
 * @route   GET /api/news/popular
 * @desc    Get popular news (by views)
 * @access  Public
 */
router.get(
  '/popular',
  newsController.getPopularNews
);

/**
 * @route   GET /api/news/search
 * @desc    Search news articles
 * @access  Public
 */
router.get(
  '/search',
  validatePagination,
  newsController.searchNews
);

/**
 * @route   GET /api/news/category/:category
 * @desc    Get news by category
 * @access  Public
 */
router.get(
  '/category/:category',
  validatePagination,
  newsController.getNewsByCategory
);

/**
 * @route   POST /api/news
 * @desc    Create news article
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  uploadMixedFiles(),
  processUploadedFiles,
  cleanupOnError,
  validate(newsValidation.create),
  newsController.createNews
);

/**
 * Admin only routes
 */

/**
 * @route   GET /api/news/stats
 * @desc    Get news statistics
 * @access  Admin
 */
router.get(
  '/admin/stats',
  authenticate,
  adminOnly,
  newsController.getNewsStats
);

/**
 * @route   PUT /api/news/bulk-update-status
 * @desc    Bulk update news status
 * @access  Admin
 */
router.put(
  '/admin/bulk-update-status',
  authenticate,
  adminOnly,
  newsController.bulkUpdateNewsStatus
);

/**
 * @route   GET /api/news/:id
 * @desc    Get single news article by ID
 * @access  Public (published only) / Admin (all)
 */
router.get(
  '/:id',
  optionalAuth,
  validateObjectId('id'),
  newsController.getNewsById
);

/**
 * @route   PUT /api/news/:id
 * @desc    Update news article
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  uploadMixedFiles(),
  processUploadedFiles,
  cleanupOnError,
  validate(newsValidation.update),
  newsController.updateNews
);

/**
 * @route   DELETE /api/news/:id
 * @desc    Delete news article
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  newsController.deleteNews
);

/**
 * @route   POST /api/news/:id/view
 * @desc    Increment view count
 * @access  Public
 */
router.post(
  '/:id/view',
  validateObjectId('id'),
  newsController.incrementViews
);

/**
 * @route   POST /api/news/:id/like
 * @desc    Like/unlike news article
 * @access  Public
 */
router.post(
  '/:id/like',
  validateObjectId('id'),
  newsController.toggleLike
);

export default router;
