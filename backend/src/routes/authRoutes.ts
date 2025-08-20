import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  logout,
  validateToken,
  deactivateAccount,
  reactivateAccount
} from '../controllers/authController';
import {
  authenticate,
  optionalAuth
} from '../middleware/auth';
import {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
  handleValidationErrors
} from '../middleware/validation';
import { body } from 'express-validator';
import { authRateLimit, strictRateLimit } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post('/register', authRateLimit, validateUserRegistration, handleValidationErrors, register);
router.post('/login', authRateLimit, validateUserLogin, handleValidationErrors, login);
router.post('/refresh-token', authRateLimit, refreshToken);

// Password reset routes
router.post('/request-password-reset', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], handleValidationErrors, requestPasswordReset);

router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], handleValidationErrors, resetPassword);

// Account reactivation (public)
router.post('/reactivate', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], handleValidationErrors, reactivateAccount);

// Protected routes
router.use(authenticate); // All routes below require authentication

// User profile routes
router.get('/me', strictRateLimit, getCurrentUser);
router.get('/validate', strictRateLimit, validateToken);
router.put('/profile', [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters')
], handleValidationErrors, updateProfile);

router.put('/change-password', authRateLimit, validatePasswordChange, handleValidationErrors, changePassword);

// Account management
router.post('/logout', logout);
router.put('/deactivate', authRateLimit, [
  body('password')
    .notEmpty()
    .withMessage('Password is required to deactivate account')
], handleValidationErrors, deactivateAccount);

export default router;