import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Common validation patterns
const email = Joi.string().email().lowercase().trim().max(255).required();
const password = Joi.string().min(8).max(128).pattern(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
).message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const phone = Joi.string().pattern(/^\+?[\d\s-()]+$/).min(10).max(20).optional();
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

// Auth validation schemas
export const authSchemas = {
  businessLogin: Joi.object({
    email: email,
    password: Joi.string().required().max(128)
  }),

  businessSignup: Joi.object({
    businessName: Joi.string().trim().min(2).max(100).required(),
    email: email,
    password: password
  }),

  customerLogin: Joi.object({
    email: email,
    password: Joi.string().required().max(128)
  }),

  customerSignup: Joi.object({
    fullName: Joi.string().trim().min(2).max(100).required(),
    email: email,
    password: password,
    phone: phone
  }),

  adminLogin: Joi.object({
    email: email,
    password: Joi.string().required().max(128)
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: password
  })
};

// Business data validation schemas
export const businessSchemas = {
  createCustomer: Joi.object({
    full_name: Joi.string().trim().min(2).max(100).required(),
    email: email,
    phone: phone,
    notes: Joi.string().max(500).allow('').optional()
  }),

  updateCustomer: Joi.object({
    full_name: Joi.string().trim().min(2).max(100).optional(),
    email: email.optional(),
    phone: phone,
    notes: Joi.string().max(500).allow('').optional()
  }),

  createService: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().max(500).allow('').optional(),
    duration_minutes: Joi.number().integer().min(15).max(480).required(),
    price: Joi.number().min(0).max(10000).precision(2).required(),
    staffIds: Joi.array().items(objectId).min(1).required(),
    required_skill: Joi.string().max(100).optional()
  }),

  createBooking: Joi.object({
    customerId: objectId.required(),
    serviceId: objectId.required(),
    staffId: objectId.required(),
    startTime: Joi.string().isoDate().required(),
    recurrenceRule: Joi.string().valid('weekly', 'monthly').optional(),
    recurrenceEndDate: Joi.string().isoDate().optional()
  }),

  createStaff: Joi.object({
    full_name: Joi.string().trim().min(2).max(100).required(),
    email: email,
    phone: phone.required(),
    role: Joi.string().valid('Owner', 'Manager', 'Assistant', 'Stylist').required(),
    skills: Joi.array().items(Joi.string().max(50)).optional()
  })
};

// Generic validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        message: 'Validation error',
        errors: errorDetails
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Validate query parameters
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        message: 'Query validation error',
        errors: errorDetails
      });
    }

    req.query = value;
    next();
  };
};

// Validate URL parameters
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        message: 'Parameter validation error',
        errors: errorDetails
      });
    }

    req.params = value;
    next();
  };
};

// Common parameter schemas
export const paramSchemas = {
  objectId: Joi.object({
    id: objectId.required()
  })
};

// Query parameter schemas
export const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().max(50).optional(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  })
};