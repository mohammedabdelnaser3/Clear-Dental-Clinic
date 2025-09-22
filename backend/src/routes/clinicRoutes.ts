import { Router } from 'express';
import {
  createClinic,
  getAllClinics,
  getClinicById,
  updateClinic,
  deleteClinic,
  getClinicsByCity,
  getClinicsByService,
  getNearbyClinic,
  searchClinics,
  addStaffToClinic,
  removeStaffFromClinic,
  getClinicStaff,
  uploadClinicImage,
  getClinicStatistics,
  getOverallStatistics,
  checkClinicStatus,
  getClinicDashboard
} from '../controllers/clinicController';
import {
  authenticate,
  adminOnly,
  staffOrAdmin,
  checkClinicAccess
} from '../middleware/auth';
import {
  validateClinicCreation,
  validateMongoId,
  validatePagination,
  createMongoIdValidation,
  handleValidationErrors
} from '../middleware/validation';
import { body, query } from 'express-validator';
import { uploadSingle } from '../utils/upload';

const router = Router();

// Public routes (no authentication required)
router.get('/public', [
  ...validatePagination.slice(0, -1),
  query('city')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('City must be at least 2 characters'),
  query('service')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Service must be at least 2 characters')
], handleValidationErrors, getAllClinics);

router.get('/public/search', [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, searchClinics);

router.get('/public/nearby', [
  query('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Radius must be between 0.1 and 100 km'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], handleValidationErrors, getNearbyClinic);

router.get('/public/city/:city', [
  ...validatePagination.slice(0, -1)
], handleValidationErrors, getClinicsByCity);

router.get('/public/service/:service', [
  ...validatePagination.slice(0, -1)
], handleValidationErrors, getClinicsByService);

router.get('/public/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, getClinicById);

router.get('/public/:id/status', [
  ...createMongoIdValidation('id')
], handleValidationErrors, checkClinicStatus);

// TEMPORARY: Move appointment endpoints here until routing issue is fixed
router.get('/appointments/available-slots', [
  query('date')
    .isISO8601()
    .withMessage('Date is required and must be a valid date'),
  query('dentistId')
    .optional()
    .custom((value) => {
      if (value === '' || value === undefined || value === null) {
        return true; // Allow empty values
      }
      // If value is provided, validate it's a valid MongoDB ID
      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      return mongoIdRegex.test(value);
    })
    .withMessage('Dentist ID must be valid if provided'),
  query('clinicId')
    .isMongoId()
    .withMessage('Valid clinic ID is required'),
  query('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes')
], handleValidationErrors, async (req: any, res: any, next: any) => {
  // Import and use the controller
  const { getAvailableTimeSlots } = await import('../controllers/appointmentController');
  return getAvailableTimeSlots(req, res, next);
});

// Protected routes (authentication required)
router.use(authenticate);

// Create clinic (admin only)
router.post('/', adminOnly, validateClinicCreation, handleValidationErrors, createClinic);

// Get all clinics (staff and admin)
router.get('/', staffOrAdmin, [
  ...validatePagination.slice(0, -1),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  query('city')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('City must be at least 2 characters'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], handleValidationErrors, getAllClinics);

// Search clinics
router.get('/search', [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, searchClinics);

// Get overall statistics for all clinics (admin only)
router.get('/statistics/overall', adminOnly, getOverallStatistics);

// Get clinic statistics (admin only)
router.get('/statistics', adminOnly, getClinicStatistics);

// Get clinic by ID
router.get('/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, getClinicById);

// Update clinic
router.put('/:id', adminOnly, [
  ...createMongoIdValidation('id'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Clinic name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('address.state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Zip code must be between 3 and 20 characters'),
  body('address.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  body('services')
    .optional()
    .isArray()
    .withMessage('Services must be an array'),
  body('services.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each service must be between 2 and 100 characters'),
  body('operatingHours.*.day')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week'),
  body('operatingHours.*.openTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Open time must be in HH:MM format'),
  body('operatingHours.*.closeTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Close time must be in HH:MM format'),
  body('operatingHours.*.isClosed')
    .optional()
    .isBoolean()
    .withMessage('isClosed must be a boolean'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], handleValidationErrors, updateClinic);

// Delete clinic (admin only)
router.delete('/:id', adminOnly, [
  ...createMongoIdValidation('id')
], handleValidationErrors, deleteClinic);

// Staff management routes
router.get('/:id/staff', [
  ...createMongoIdValidation('id'),
  ...validatePagination.slice(0, -1)
], handleValidationErrors, checkClinicAccess, getClinicStaff);

router.post('/:id/staff/:userId', adminOnly, [
  ...createMongoIdValidation('id'),
  ...createMongoIdValidation('userId')
], handleValidationErrors, addStaffToClinic);

router.delete('/:id/staff/:userId', adminOnly, [
  ...createMongoIdValidation('id'),
  ...createMongoIdValidation('userId')
], handleValidationErrors, removeStaffFromClinic);

// Upload clinic image
router.post('/:id/upload-image', [
  ...createMongoIdValidation('id')
], handleValidationErrors, checkClinicAccess, uploadSingle('clinicImage'), uploadClinicImage);

// Get clinic dashboard data
router.get('/:id/dashboard', [
  ...createMongoIdValidation('id'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
], handleValidationErrors, checkClinicAccess, getClinicDashboard);

// Check clinic status
router.get('/:id/status', [
  ...createMongoIdValidation('id')
], handleValidationErrors, checkClinicStatus);

export default router;