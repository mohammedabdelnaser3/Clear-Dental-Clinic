import { Router } from 'express';
import {
  getAdminClinicOverview,
  getClinicDetailedData,
  getClinicComparison,
  getSystemStatistics,
  getMultiClinicDashboard,
  getClinicPerformanceMetrics
} from '../controllers/adminController';
import {
  authenticate,
  adminOnly
} from '../middleware/auth';
import {
  query,
  param
} from 'express-validator';
import {
  handleValidationErrors,
  createMongoIdValidation,
  validatePagination
} from '../middleware/validation';
import {
  getHomepageContentBlocks,
  createHomepageContentBlock,
  updateHomepageContentBlock,
  deleteHomepageContentBlock,
  publishHomepageContentBlock
} from '../controllers/homepageContentController';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// Get comprehensive clinic overview for admin dashboard
router.get('/clinics/overview', [
  ...validatePagination,
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  query('status')
    .optional()
    .isIn(['all', 'active', 'inactive'])
    .withMessage('Status must be all, active, or inactive'),
  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'patients', 'revenue', 'appointments'])
    .withMessage('Invalid sort field')
], handleValidationErrors, getAdminClinicOverview);

// Get detailed data for a specific clinic
router.get('/clinics/:clinicId/detailed', [
  ...createMongoIdValidation('clinicId'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
], handleValidationErrors, getClinicDetailedData);

// Get clinic comparison data
router.get('/clinics/comparison', [
  query('clinicIds')
    .notEmpty()
    .withMessage('Clinic IDs are required')
    .custom((value) => {
      const ids = Array.isArray(value) ? value : [value];
      if (ids.length < 2) {
        throw new Error('At least 2 clinic IDs are required for comparison');
      }
      if (ids.length > 5) {
        throw new Error('Maximum 5 clinics can be compared at once');
      }
      return true;
    }),
  query('metric')
    .optional()
    .isIn(['revenue', 'patients', 'appointments'])
    .withMessage('Metric must be revenue, patients, or appointments'),
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be 7d, 30d, 90d, or 1y')
], handleValidationErrors, getClinicComparison);

// Get system-wide statistics
router.get('/system/statistics', [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be 7d, 30d, 90d, or 1y')
], handleValidationErrors, getSystemStatistics);

// Get multi-clinic dashboard overview with staff schedules
router.get('/multi-clinic/dashboard', [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be 7d, 30d, 90d, or 1y'),
  query('clinicIds')
    .optional()
    .custom((value) => {
      if (value) {
        const ids = Array.isArray(value) ? value : [value];
        if (ids.length > 10) {
          throw new Error('Maximum 10 clinics can be selected at once');
        }
      }
      return true;
    })
], handleValidationErrors, getMultiClinicDashboard);

// Get clinic performance metrics for comparison
router.get('/clinics/performance', [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be 7d, 30d, 90d, or 1y'),
  query('metrics')
    .optional()
    .isIn(['all', 'efficiency', 'satisfaction', 'revenue', 'productivity'])
    .withMessage('Invalid metrics parameter')
], handleValidationErrors, getClinicPerformanceMetrics);

// Homepage content management routes
router.get('/homepage/blocks', handleValidationErrors, getHomepageContentBlocks);
router.post('/homepage/blocks', handleValidationErrors, createHomepageContentBlock);
router.put('/homepage/blocks/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, updateHomepageContentBlock);
router.delete('/homepage/blocks/:id', [
  ...createMongoIdValidation('id')
], handleValidationErrors, deleteHomepageContentBlock);
router.post('/homepage/blocks/:id/publish', [
  ...createMongoIdValidation('id')
], handleValidationErrors, publishHomepageContentBlock);
export default router;