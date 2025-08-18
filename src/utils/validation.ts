import Joi from 'joi';
import { IValidationError } from '../types';

// Common validation patterns
export const validationPatterns = {
  email: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  phone: /^(\+250|250)?[0-9]{9}$/,
  nationalId: /^[0-9]{16}$/,
  objectId: /^[0-9a-fA-F]{24}$/,
  url: /^https?:\/\/.+/,
  imageUrl: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
};

// User validation schemas
export const userValidation = {
  create: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().pattern(validationPatterns.phone).required(),
    nationalId: Joi.string().pattern(validationPatterns.nationalId).required(),
    role: Joi.string().valid('admin', 'citizen').default('citizen'),
    status: Joi.string().valid('active', 'inactive').default('active'),
    mutualStatus: Joi.string().valid('registered', 'not_registered').default('not_registered'),
    employmentStatus: Joi.string().valid('employed', 'unemployed', 'leader').required(),
    profileImage: Joi.string().pattern(validationPatterns.imageUrl).optional()
  }),
  
  update: Joi.object({
    firstName: Joi.string().trim().min(2).max(50),
    lastName: Joi.string().trim().min(2).max(50),
    email: Joi.string().email().lowercase().trim(),
    phone: Joi.string().pattern(validationPatterns.phone),
    nationalId: Joi.string().pattern(validationPatterns.nationalId),
    role: Joi.string().valid('admin', 'citizen'),
    status: Joi.string().valid('active', 'inactive'),
    mutualStatus: Joi.string().valid('registered', 'not_registered'),
    employmentStatus: Joi.string().valid('employed', 'unemployed', 'leader'),
    profileImage: Joi.string().pattern(validationPatterns.imageUrl).allow('')
  }).min(1),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100),
    role: Joi.string().valid('admin', 'citizen'),
    status: Joi.string().valid('active', 'inactive')
  })
};

// News validation schemas
export const newsValidation = {
  create: Joi.object({
    title: Joi.string().trim().min(5).max(200).required(),
    content: Joi.string().trim().min(50).required(),
    excerpt: Joi.string().trim().max(300),
    category: Joi.string().valid('UBUREZI', 'UBUKUNGU', 'UBUZIMA', 'AMATANGAZO').required(),
    status: Joi.string().valid('published', 'draft', 'archived').default('draft'),
    featured: Joi.boolean().default(false),
    mainImage: Joi.string().pattern(validationPatterns.imageUrl).required(),
    subContents: Joi.array().items(
      Joi.object({
        title: Joi.string().trim().min(2).max(200).required(),
        content: Joi.string().trim().required(),
        type: Joi.string().valid('text', 'image', 'video', 'pdf').required(),
        mediaUrl: Joi.string().pattern(validationPatterns.url).when('type', {
          is: Joi.string().valid('image', 'video', 'pdf'),
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
        explanation: Joi.string().trim().max(500)
      })
    ).default([]),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(50)).default([])
  }),

  update: Joi.object({
    title: Joi.string().trim().min(5).max(200),
    content: Joi.string().trim().min(50),
    excerpt: Joi.string().trim().max(300),
    category: Joi.string().valid('UBUREZI', 'UBUKUNGU', 'UBUZIMA', 'AMATANGAZO'),
    status: Joi.string().valid('published', 'draft', 'archived'),
    featured: Joi.boolean(),
    mainImage: Joi.string().pattern(validationPatterns.imageUrl),
    subContents: Joi.array().items(
      Joi.object({
        title: Joi.string().trim().min(2).max(200).required(),
        content: Joi.string().trim().required(),
        type: Joi.string().valid('text', 'image', 'video', 'pdf').required(),
        mediaUrl: Joi.string().pattern(validationPatterns.url).when('type', {
          is: Joi.string().valid('image', 'video', 'pdf'),
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
        explanation: Joi.string().trim().max(500)
      })
    ),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(50))
  }).min(1),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100),
    category: Joi.string().valid('UBUREZI', 'UBUKUNGU', 'UBUZIMA', 'AMATANGAZO'),
    status: Joi.string().valid('published', 'draft', 'archived'),
    featured: Joi.boolean()
  })
};

// Authentication validation schemas
export const authValidation = {
  sendCode: Joi.object({
    email: Joi.string().email().lowercase().trim().required()
  }),

  verifyCode: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    code: Joi.string().pattern(/^[0-9]{6}$/).required()
  })
};

// Feedback validation schemas
export const feedbackValidation = {
  create: Joi.object({
    author: Joi.string().trim().min(2).max(100).required(),
    title: Joi.string().trim().min(5).max(200).required(),
    content: Joi.string().trim().min(10).max(2000).required(),
    category: Joi.string().trim().max(50)
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    adminResponse: Joi.string().trim().max(1000)
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100),
    status: Joi.string().valid('pending', 'approved', 'rejected')
  })
};

// Help Request validation schemas
export const helpRequestValidation = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().trim().required(),
    phone: Joi.string().pattern(validationPatterns.phone).required(),
    department: Joi.string().valid(
      'Ubutaka', 
      'Ubuvuzi bw\'Amatungo', 
      'Imiturire', 
      'Irangamimerere', 
      'Imibereho Myiza', 
      'Amashyamba'
    ).required(),
    description: Joi.string().trim().min(10).max(2000).required()
  }),

  update: Joi.object({
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent'),
    adminResponse: Joi.string().trim().max(1000),
    assignedTo: Joi.string().pattern(validationPatterns.objectId)
  }).min(1),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
    department: Joi.string().valid(
      'Ubutaka', 
      'Ubuvuzi bw\'Amatungo', 
      'Imiturire', 
      'Irangamimerere', 
      'Imibereho Myiza', 
      'Amashyamba'
    ),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent')
  })
};

// Comment validation schemas
export const commentValidation = {
  create: Joi.object({
    content: Joi.string().trim().min(1).max(1000).required(),
    author: Joi.string().trim().min(2).max(100).required(),
    itemId: Joi.string().pattern(validationPatterns.objectId).required(),
    itemType: Joi.string().valid('news', 'feedback').required()
  })
};

// System Settings validation schemas
export const systemSettingsValidation = {
  update: Joi.object({
    siteName: Joi.string().trim().min(2).max(100),
    siteDescription: Joi.string().trim().min(10).max(500),
    contactEmail: Joi.string().email().lowercase().trim(),
    contactPhone: Joi.string().pattern(validationPatterns.phone),
    logo: Joi.string().pattern(validationPatterns.imageUrl).allow(''),
    enableNotifications: Joi.boolean(),
    enableComments: Joi.boolean(),
    enableRegistration: Joi.boolean(),
    maintenanceMode: Joi.boolean()
  }).min(1)
};

// Generic validation function
export const validate = (schema: Joi.ObjectSchema, data: any): { error?: IValidationError[]; value?: any } => {
  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const validationErrors: IValidationError[] = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { error: validationErrors };
  }

  return { value };
};

// Middleware validation function
export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    const { error, value } = validate(schema, req[property]);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error
      });
    }

    req[property] = value;
    next();
  };
};
