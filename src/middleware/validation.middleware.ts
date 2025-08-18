import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createResponse } from '../utils/helpers';
import { IValidationError } from '../types';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors: IValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '')
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'Validation errors occurred',
        errors: validationErrors
      });
      return;
    }

    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
};

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const id = req.params[paramName];

    if (!id || !objectIdPattern.test(id)) {
      res.status(400).json(createResponse(
        false,
        null,
        `Invalid ${paramName}. Must be a valid MongoDB ObjectId.`
      ));
      return;
    }

    next();
  };
};

/**
 * Validate multiple ObjectIds in params
 */
export const validateObjectIds = (...paramNames: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const errors: string[] = [];

    paramNames.forEach(paramName => {
      const id = req.params[paramName];
      if (id && !objectIdPattern.test(id)) {
        errors.push(`Invalid ${paramName}. Must be a valid MongoDB ObjectId.`);
      }
    });

    if (errors.length > 0) {
      res.status(400).json(createResponse(
        false,
        null,
        'Validation failed',
        errors.join(', ')
      ));
      return;
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().max(100).optional(),
    sort: Joi.string().valid('asc', 'desc', '1', '-1').default('desc').optional(),
    sortBy: Joi.string().trim().max(50).optional()
  });

  const { error, value } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true
  });

  if (error) {
    res.status(400).json(createResponse(
      false,
      null,
      'Invalid pagination parameters',
      error.details[0].message
    ));
    return;
  }

  req.query = value;
  next();
};

/**
 * Validate email format
 */
export const validateEmail = (fieldName: string = 'email') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const email = req.body[fieldName];
    const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

    if (email && !emailPattern.test(email)) {
      res.status(400).json(createResponse(
        false,
        null,
        `Invalid ${fieldName} format`
      ));
      return;
    }

    next();
  };
};

/**
 * Validate Rwandan phone number
 */
export const validateRwandanPhone = (fieldName: string = 'phone') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const phone = req.body[fieldName];
    const phonePattern = /^(\+250|250)?[0-9]{9}$/;

    if (phone && !phonePattern.test(phone)) {
      res.status(400).json(createResponse(
        false,
        null,
        `Invalid ${fieldName} format. Must be a valid Rwandan phone number.`
      ));
      return;
    }

    next();
  };
};

/**
 * Validate National ID
 */
export const validateNationalId = (fieldName: string = 'nationalId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const nationalId = req.body[fieldName];
    const nationalIdPattern = /^[0-9]{16}$/;

    if (nationalId && !nationalIdPattern.test(nationalId)) {
      res.status(400).json(createResponse(
        false,
        null,
        `Invalid ${fieldName} format. Must be 16 digits.`
      ));
      return;
    }

    next();
  };
};

/**
 * Validate file upload
 */
export const validateFileUpload = (
  allowedTypes: string[],
  maxSize: number,
  required: boolean = false
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;

    if (required && !file) {
      res.status(400).json(createResponse(
        false,
        null,
        'File is required'
      ));
      return;
    }

    if (file) {
      // Check file type
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        res.status(400).json(createResponse(
          false,
          null,
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        ));
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        res.status(400).json(createResponse(
          false,
          null,
          `File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`
        ));
        return;
      }
    }

    next();
  };
};

/**
 * Validate multiple files upload
 */
export const validateMultipleFiles = (
  allowedTypes: string[],
  maxSize: number,
  maxCount: number,
  required: boolean = false
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const files = req.files as Express.Multer.File[];

    if (required && (!files || files.length === 0)) {
      res.status(400).json(createResponse(
        false,
        null,
        'At least one file is required'
      ));
      return;
    }

    if (files && files.length > 0) {
      if (files.length > maxCount) {
        res.status(400).json(createResponse(
          false,
          null,
          `Too many files. Maximum allowed: ${maxCount}`
        ));
        return;
      }

      for (const file of files) {
        // Check file type
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedTypes.includes(fileExtension)) {
          res.status(400).json(createResponse(
            false,
            null,
            `Invalid file type for ${file.originalname}. Allowed types: ${allowedTypes.join(', ')}`
          ));
          return;
        }

        // Check file size
        if (file.size > maxSize) {
          res.status(400).json(createResponse(
            false,
            null,
            `File ${file.originalname} is too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`
          ));
          return;
        }
      }
    }

    next();
  };
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'string') {
          // Basic XSS prevention
          sanitized[key] = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
        } else {
          sanitized[key] = sanitizeObject(value);
        }
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Validate array of items
 */
export const validateArray = (
  itemSchema: Joi.Schema,
  minItems: number = 1,
  maxItems: number = 100,
  fieldName: string = 'items'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const items = req.body[fieldName];

    if (!Array.isArray(items)) {
      res.status(400).json(createResponse(
        false,
        null,
        `${fieldName} must be an array`
      ));
      return;
    }

    if (items.length < minItems) {
      res.status(400).json(createResponse(
        false,
        null,
        `${fieldName} must contain at least ${minItems} item(s)`
      ));
      return;
    }

    if (items.length > maxItems) {
      res.status(400).json(createResponse(
        false,
        null,
        `${fieldName} must contain at most ${maxItems} item(s)`
      ));
      return;
    }

    // Validate each item
    const errors: string[] = [];
    const validatedItems: any[] = [];

    items.forEach((item, index) => {
      const { error, value } = itemSchema.validate(item, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        errors.push(`Item ${index + 1}: ${error.details.map(d => d.message).join(', ')}`);
      } else {
        validatedItems.push(value);
      }
    });

    if (errors.length > 0) {
      res.status(400).json(createResponse(
        false,
        null,
        'Validation failed',
        errors.join('; ')
      ));
      return;
    }

    req.body[fieldName] = validatedItems;
    next();
  };
};

/**
 * Validate date range
 */
export const validateDateRange = (
  startDateField: string = 'startDate',
  endDateField: string = 'endDate',
  required: boolean = false
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startDate = req.query[startDateField] || req.body[startDateField];
    const endDate = req.query[endDateField] || req.body[endDateField];

    if (required && (!startDate || !endDate)) {
      res.status(400).json(createResponse(
        false,
        null,
        `Both ${startDateField} and ${endDateField} are required`
      ));
      return;
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json(createResponse(
          false,
          null,
          'Invalid date format'
        ));
        return;
      }

      if (start > end) {
        res.status(400).json(createResponse(
          false,
          null,
          `${startDateField} must be before ${endDateField}`
        ));
        return;
      }
    }

    next();
  };
};
