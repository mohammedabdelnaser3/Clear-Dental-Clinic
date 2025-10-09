import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole,
  getDentists,
  assignClinicToUser,
  removeClinicFromUser,
  setPreferredClinic,
  uploadUserProfileImage,
  getUserStatistics,
  searchUsers,
  getRecentUsers
} from '../controllers/userController';
import {
  authenticate,
  authorize,
  adminOnly,
  dentistOrAdmin,
  staffOrAdmin
} from '../middleware/auth';
import {
  validateMongoId,
  validatePagination,
  handleValidationErrors
} from '../middleware/validation';
import { body, query } from 'express-validator';
import { uploadSingle } from '../utils/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin/staff only)
router.get('/', staffOrAdmin, [
  ...validatePagination.slice(0, -1), // Remove handleValidationErrors from validatePagination
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  query('role')
    .optional()
    .isIn(['admin', 'dentist', 'staff', 'patient'])
    .withMessage('Invalid role'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  handleValidationErrors
], getAllUsers);

// Search users
router.get('/search', staffOrAdmin, [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  ...validatePagination.slice(0, -1),
  handleValidationErrors
], searchUsers);

// Get user statistics (admin only)
router.get('/statistics', adminOnly, getUserStatistics);

// Get recent users (admin only)
router.get('/recent', adminOnly, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], handleValidationErrors, getRecentUsers);

// Get users by role
router.get('/role/:role', staffOrAdmin, [
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  ...validatePagination.slice(0, -1),
  handleValidationErrors
], getUsersByRole);

// Get dentists (authenticated users) - allow all authenticated users to fetch dentist list
router.get('/dentists', [
  query('clinicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid clinic ID'),
  handleValidationErrors
], getDentists);

// Upload profile image
router.post('/upload-image', uploadSingle('profileImage'), uploadUserProfileImage);

// Add alias route for frontend compatibility
router.post('/profile-image', uploadSingle('profileImage'), uploadUserProfileImage);

// Get user by ID
router.get('/:id', validateMongoId, getUserById);

// Update user (admin only or self)
router.put('/:id', [
  ...validateMongoId,
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
  body('role')
    .optional()
    .isIn(['admin', 'dentist', 'staff', 'patient'])
    .withMessage('Invalid role'),
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
    .withMessage('Address must not exceed 200 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], handleValidationErrors, updateUser);

// Delete user (admin only)
router.delete('/:id', adminOnly, validateMongoId, deleteUser);

// Clinic assignment routes (admin only)
router.post('/:id/clinics/:clinicId', adminOnly, [
  ...validateMongoId
], handleValidationErrors, assignClinicToUser);

router.delete('/:id/clinics/:clinicId', adminOnly, [
  ...validateMongoId
], handleValidationErrors, removeClinicFromUser);

// Set preferred clinic
router.put('/:id/preferred-clinic', [
  ...validateMongoId,
  body('clinicId')
    .isMongoId()
    .withMessage('Invalid clinic ID')
], handleValidationErrors, setPreferredClinic);

export default router;