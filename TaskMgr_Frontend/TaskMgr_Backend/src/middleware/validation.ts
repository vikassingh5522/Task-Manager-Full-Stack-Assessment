import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

/**
 * Validation error formatter middleware
 * Checks for validation errors and returns formatted error response
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format errors into a more user-friendly structure
    const formattedErrors: Record<string, string[]> = {};
    
    errors.array().forEach((error) => {
      if (error.type === 'field') {
        const field = error.path;
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(error.msg);
      }
    });
    
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      status: 400
    });
    return;
  }
  
  next();
}

/**
 * Reusable validation chains for common fields
 */

// Email validation
export const validateEmail = (): ValidationChain => 
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail();

// Password validation
export const validatePassword = (fieldName: string = 'password'): ValidationChain => 
  body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`)
    .isLength({ min: 8 })
    .withMessage(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 8 characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must contain at least one uppercase letter, one lowercase letter, and one number`);

// Name validation (firstName, lastName)
export const validateName = (fieldName: string): ValidationChain => 
  body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`)
    .isLength({ min: 1, max: 50 })
    .withMessage(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be between 1 and 50 characters`);

// Task title validation
export const validateTaskTitle = (): ValidationChain => 
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters');

// Task description validation (optional)
export const validateTaskDescription = (): ValidationChain => 
  body('description')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters');

// Task priority validation
export const validateTaskPriority = (): ValidationChain => 
  body('priority')
    .optional({ values: 'null' })
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT');

// Task status validation
export const validateTaskStatus = (): ValidationChain => 
  body('status')
    .optional({ values: 'null' })
    .isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'])
    .withMessage('Status must be one of: TODO, IN_PROGRESS, REVIEW, COMPLETED');

// Due date validation
export const validateDueDate = (): ValidationChain => 
  body('dueDate')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date');

// MongoDB ObjectId validation
export const validateObjectId = (fieldName: string, location: 'param' | 'body' | 'query' = 'param'): ValidationChain => {
  const validator = location === 'param' ? param(fieldName) : 
                    location === 'body' ? body(fieldName) : 
                    query(fieldName);
  
  return validator
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be a valid MongoDB ObjectId`);
};

// Pagination validation
export const validatePagination = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

// Optional string field validation
export const validateOptionalString = (fieldName: string, maxLength: number = 500): ValidationChain => 
  body(fieldName)
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${maxLength} characters`);

/**
 * Validation chain builders for common operations
 */

// User registration validation
export const validateUserRegistration = [
  validateEmail(),
  validatePassword(),
  validateName('firstName'),
  validateName('lastName'),
  handleValidationErrors
];

// User login validation
export const validateUserLogin = [
  validateEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Password change validation
export const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  validatePassword('newPassword'),
  handleValidationErrors
];

// Task creation validation
export const validateTaskCreation = [
  validateTaskTitle(),
  validateTaskDescription(),
  validateTaskPriority(),
  validateTaskStatus(),
  validateDueDate(),
  body('assignedToId')
    .optional({ values: 'null' })
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('AssignedToId must be a valid MongoDB ObjectId'),
  handleValidationErrors
];

// Task update validation
export const validateTaskUpdate = [
  validateTaskTitle().optional({ values: 'null' }),
  validateTaskDescription(),
  validateTaskPriority(),
  validateTaskStatus(),
  validateDueDate(),
  body('assignedToId')
    .optional({ values: 'null' })
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('AssignedToId must be a valid MongoDB ObjectId'),
  handleValidationErrors
];

// Profile update validation
export const validateProfileUpdate = [
  validateName('firstName').optional(),
  validateName('lastName').optional(),
  validateOptionalString('bio', 500),
  validateOptionalString('phoneNumber', 20),
  validateOptionalString('avatarUrl', 500),
  handleValidationErrors
];
