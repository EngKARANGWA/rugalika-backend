import { Request, Response } from 'express';
import { News, User } from '../models';
import { createResponse, asyncHandler } from '../middleware/error.middleware';
import { getPaginationParams, createPaginationMeta, sanitizeHtml } from '../utils/helpers';
import { uploadService } from '../services';
import { logger } from '../utils/logger';

/**
 * Get all news with filtering and pagination
 */
export const getAllNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, category, status, featured } = req.query;
  const user = req.user;

  // Build filter object
  const filter: any = {};
  
  // Non-admin users can only see published news
  if (!user || user.role !== 'admin') {
    filter.status = 'published';
  } else if (status) {
    filter.status = status;
  }
  
  if (category) {
    filter.category = category;
  }
  
  if (featured !== undefined) {
    filter.featured = featured === 'true';
  }
  
  if (search) {
    filter.$text = { $search: search };
  }

  // Get news and total count
  const [news, total] = await Promise.all([
    News.find(filter)
      .populate('author', 'firstName lastName email')
      .select('-__v')
      .sort(search ? { score: { $meta: 'textScore' }, publishedAt: -1 } : { publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    News.countDocuments(filter)
  ]);

  const pagination = createPaginationMeta(total, page, limit);

  res.status(200).json(createResponse(
    true,
    { 
      news,
      pagination
    },
    'News retrieved successfully'
  ));
});

/**
 * Get single news article by ID
 */
export const getNewsById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user;

  const filter: any = { _id: id };
  
  // Non-admin users can only see published news
  if (!user || user.role !== 'admin') {
    filter.status = 'published';
  }

  const news = await News.findOne(filter)
    .populate('author', 'firstName lastName email')
    .select('-__v');
  
  if (!news) {
    res.status(404).json(createResponse(
      false,
      null,
      'News article not found'
    ));
    return;
  }

  res.status(200).json(createResponse(
    true,
    { news },
    'News article retrieved successfully'
  ));
});

/**
 * Create new news article (Admin only)
 */
export const createNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const newsData = req.body;
  const user = req.user;
  
  if (!user) {
    res.status(401).json(createResponse(
      false,
      null,
      'Authentication required'
    ));
    return;
  }

  // Sanitize HTML content
  if (newsData.content) {
    newsData.content = sanitizeHtml(newsData.content);
  }

  // Process uploaded files from Cloudinary if any
  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Handle main image
    if (files.mainImage && files.mainImage[0]) {
      const mainImageFile = files.mainImage[0];
      // Extract Cloudinary data
      const cloudinaryData = (mainImageFile as any).cloudinaryData || {};
      newsData.mainImage = cloudinaryData.secure_url || cloudinaryData.url || '';
    }
    
    // Process sub-contents with media
    if (newsData.subContents) {
      newsData.subContents.forEach((subContent: any, index: number) => {
        if (subContent.type === 'image' && files.subImages && files.subImages[index]) {
          const imageFile = files.subImages[index];
          const cloudinaryData = (imageFile as any).cloudinaryData || {};
          subContent.mediaUrl = cloudinaryData.secure_url || cloudinaryData.url || '';
        } else if (subContent.type === 'video' && files.videos && files.videos[index]) {
          const videoFile = files.videos[index];
          const cloudinaryData = (videoFile as any).cloudinaryData || {};
          subContent.mediaUrl = cloudinaryData.secure_url || cloudinaryData.url || '';
        } else if (subContent.type === 'pdf' && files.documents && files.documents[index]) {
          const docFile = files.documents[index];
          const cloudinaryData = (docFile as any).cloudinaryData || {};
          subContent.mediaUrl = cloudinaryData.secure_url || cloudinaryData.url || '';
        }
      });
    }
  }

  // Set author
  newsData.author = user._id;

  try {
    const news = new News(newsData);
    await news.save();
    
    // Populate author information
    await news.populate('author', 'firstName lastName email');

    res.status(201).json(createResponse(
      true,
      { news },
      'News article created successfully'
    ));
  } catch (error: any) {
    // Clean up uploaded files from Cloudinary if news creation fails
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const filesToDelete: string[] = [];
      
      Object.values(files).forEach((fileArray: Express.Multer.File[]) => {
        fileArray.forEach((file: Express.Multer.File) => {
          const cloudinaryData = (file as any).cloudinaryData || {};
          if (cloudinaryData.public_id) {
            filesToDelete.push(cloudinaryData.public_id);
          }
        });
      });
      
      if (filesToDelete.length > 0) {
        // Import cloudinaryService here to avoid circular dependency
        const { cloudinaryService } = await import('../services');
        cloudinaryService.deleteFiles(filesToDelete).catch(deleteError => {
          logger.error('Error cleaning up Cloudinary files after news creation failure:', deleteError);
        });
      }
    }
    
    throw error;
  }
});

/**
 * Update news article (Admin only)
 */
export const updateNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  // Sanitize HTML content
  if (updates.content) {
    updates.content = sanitizeHtml(updates.content);
  }

  // Remove fields that shouldn't be updated directly
  delete updates._id;
  delete updates.author;
  delete updates.createdAt;
  delete updates.views;
  delete updates.likes;

  // Process uploaded files from Cloudinary if any
  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Handle main image
    if (files.mainImage && files.mainImage[0]) {
      const mainImageFile = files.mainImage[0];
      // Extract Cloudinary data
      const cloudinaryData = (mainImageFile as any).cloudinaryData || {};
      updates.mainImage = cloudinaryData.secure_url || cloudinaryData.url || '';
    }
    
    // Process sub-contents with media
    if (updates.subContents) {
      updates.subContents.forEach((subContent: any, index: number) => {
        if (subContent.type === 'image' && files.subImages && files.subImages[index]) {
          const imageFile = files.subImages[index];
          const cloudinaryData = (imageFile as any).cloudinaryData || {};
          subContent.mediaUrl = cloudinaryData.secure_url || cloudinaryData.url || '';
        } else if (subContent.type === 'video' && files.videos && files.videos[index]) {
          const videoFile = files.videos[index];
          const cloudinaryData = (videoFile as any).cloudinaryData || {};
          subContent.mediaUrl = cloudinaryData.secure_url || cloudinaryData.url || '';
        } else if (subContent.type === 'pdf' && files.documents && files.documents[index]) {
          const docFile = files.documents[index];
          const cloudinaryData = (docFile as any).cloudinaryData || {};
          subContent.mediaUrl = cloudinaryData.secure_url || cloudinaryData.url || '';
        }
      });
    }
  }

  const news = await News.findByIdAndUpdate(
    id,
    updates,
    { 
      new: true, 
      runValidators: true
    }
  ).populate('author', 'firstName lastName email');

  if (!news) {
    res.status(404).json(createResponse(
      false,
      null,
      'News article not found'
    ));
    return;
  }

  res.status(200).json(createResponse(
    true,
    { news },
    'News article updated successfully'
  ));
});

/**
 * Delete news article (Admin only)
 */
export const deleteNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const news = await News.findById(id);
  
  // Helper function to extract public ID from Cloudinary URL
  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
      const match = url.match(/\/upload\/[^\/]+\/(.+?)(?:\.[^\/]+)?$/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  };
  
  if (!news) {
    res.status(404).json(createResponse(
      false,
      null,
      'News article not found'
    ));
    return;
  }

  // Collect Cloudinary public IDs to delete
  const filesToDelete: string[] = [];
  
  // Add main image
  if (news.mainImage) {
    // Extract public ID from Cloudinary URL
    const publicId = extractPublicIdFromUrl(news.mainImage);
    if (publicId) {
      filesToDelete.push(publicId);
    }
  }
  
  // Add sub-content media files
  news.subContents.forEach(subContent => {
    if (subContent.mediaUrl) {
      const publicId = extractPublicIdFromUrl(subContent.mediaUrl);
      if (publicId) {
        filesToDelete.push(publicId);
      }
    }
  });

  // Delete the news article
  await News.findByIdAndDelete(id);

  // Delete associated files from Cloudinary
  if (filesToDelete.length > 0) {
    // Import cloudinaryService here to avoid circular dependency
    const { cloudinaryService } = await import('../services');
    cloudinaryService.deleteFiles(filesToDelete).catch(error => {
      logger.error('Error deleting Cloudinary files after news deletion:', error);
    });
  }

  res.status(200).json(createResponse(
    true,
    null,
    'News article deleted successfully'
  ));
});

/**
 * Increment view count for news article
 */
export const incrementViews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const news = await News.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  ).select('views');

  if (!news) {
    res.status(404).json(createResponse(
      false,
      null,
      'News article not found'
    ));
    return;
  }

  res.status(200).json(createResponse(
    true,
    { views: news.views },
    'View count updated'
  ));
});

/**
 * Like/unlike news article
 */
export const toggleLike = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const news = await News.findByIdAndUpdate(
    id,
    { $inc: { likes: 1 } },
    { new: true }
  ).select('likes');

  if (!news) {
    res.status(404).json(createResponse(
      false,
      null,
      'News article not found'
    ));
    return;
  }

  res.status(200).json(createResponse(
    true,
    { likes: news.likes },
    'Like count updated'
  ));
});

/**
 * Get featured news
 */
export const getFeaturedNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { limit = 5 } = req.query;

  const news = await News.find({ 
    status: 'published', 
    featured: true 
  })
    .populate('author', 'firstName lastName')
    .select('-__v')
    .sort({ publishedAt: -1 })
    .limit(parseInt(limit as string))
    .lean();

  res.status(200).json(createResponse(
    true,
    { news },
    'Featured news retrieved successfully'
  ));
});

/**
 * Get news by category
 */
export const getNewsByCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { category } = req.params;
  const { page, limit, skip } = getPaginationParams(req.query);

  const [news, total] = await Promise.all([
    News.find({ 
      status: 'published', 
      category: category.toUpperCase() 
    })
      .populate('author', 'firstName lastName')
      .select('-__v')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    News.countDocuments({ 
      status: 'published', 
      category: category.toUpperCase() 
    })
  ]);

  const pagination = createPaginationMeta(total, page, limit);

  res.status(200).json(createResponse(
    true,
    { 
      news,
      pagination,
      category
    },
    `News in ${category} category retrieved successfully`
  ));
});

/**
 * Get latest news
 */
export const getLatestNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { limit = 10 } = req.query;

  const news = await News.find({ status: 'published' })
    .populate('author', 'firstName lastName')
    .select('-__v')
    .sort({ publishedAt: -1 })
    .limit(parseInt(limit as string))
    .lean();

  res.status(200).json(createResponse(
    true,
    { news },
    'Latest news retrieved successfully'
  ));
});

/**
 * Get popular news (by views)
 */
export const getPopularNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { limit = 10, period = '30' } = req.query;
  
  // Calculate date range for the period
  const periodDays = parseInt(period as string);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const news = await News.find({ 
    status: 'published',
    publishedAt: { $gte: startDate }
  })
    .populate('author', 'firstName lastName')
    .select('-__v')
    .sort({ views: -1, publishedAt: -1 })
    .limit(parseInt(limit as string))
    .lean();

  res.status(200).json(createResponse(
    true,
    { 
      news,
      period: `${periodDays} days`
    },
    'Popular news retrieved successfully'
  ));
});

/**
 * Search news articles
 */
export const searchNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { q, category } = req.query;

  if (!q) {
    res.status(400).json(createResponse(
      false,
      null,
      'Search query is required'
    ));
    return;
  }

  const filter: any = {
    status: 'published',
    $text: { $search: q }
  };

  if (category) {
    filter.category = category.toString().toUpperCase();
  }

  const [news, total] = await Promise.all([
    News.find(filter)
      .populate('author', 'firstName lastName')
      .select('-__v')
      .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    News.countDocuments(filter)
  ]);

  const pagination = createPaginationMeta(total, page, limit);

  res.status(200).json(createResponse(
    true,
    { 
      news,
      pagination,
      query: q
    },
    `Found ${total} news articles matching "${q}"`
  ));
});

/**
 * Get news statistics (Admin only)
 */
export const getNewsStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const stats = {
    total: await News.countDocuments(),
    published: await News.countDocuments({ status: 'published' }),
    draft: await News.countDocuments({ status: 'draft' }),
    archived: await News.countDocuments({ status: 'archived' }),
    featured: await News.countDocuments({ featured: true }),
    totalViews: await News.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]).then(result => result[0]?.total || 0),
    totalLikes: await News.aggregate([
      { $group: { _id: null, total: { $sum: '$likes' } } }
    ]).then(result => result[0]?.total || 0),
    categoryStats: await News.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    mostViewed: await News.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(10)
      .select('title views category publishedAt')
      .populate('author', 'firstName lastName'),
    recentArticles: await News.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status category createdAt')
      .populate('author', 'firstName lastName')
  };

  res.status(200).json(createResponse(
    true,
    { stats },
    'News statistics retrieved successfully'
  ));
});

/**
 * Bulk update news status (Admin only)
 */
export const bulkUpdateNewsStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { newsIds, status } = req.body;

  if (!Array.isArray(newsIds) || newsIds.length === 0) {
    res.status(400).json(createResponse(
      false,
      null,
      'News IDs array is required'
    ));
    return;
  }

  const validStatuses = ['published', 'draft', 'archived'];
  if (!validStatuses.includes(status)) {
    res.status(400).json(createResponse(
      false,
      null,
      'Invalid status. Must be one of: ' + validStatuses.join(', ')
    ));
    return;
  }

  const updateData: any = { status };
  
  // Set publishedAt when publishing
  if (status === 'published') {
    updateData.publishedAt = new Date();
  }

  const result = await News.updateMany(
    { _id: { $in: newsIds } },
    updateData
  );

  res.status(200).json(createResponse(
    true,
    { 
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    },
    `${result.modifiedCount} news articles updated to ${status}`
  ));
});
