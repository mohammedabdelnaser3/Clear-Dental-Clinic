import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Patient from '../models/Patient';
import { AuthenticatedRequest, JWTPayload, IUser } from '../types';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

// Protect routes - require authentication
export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Get token from header
  console.log(req.headers.authorization);
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new AppError('No user found with this token', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('User account is deactivated', 401));
    }

    // Grant access to protected route
    (req as AuthenticatedRequest).user = user as any;
    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route', 401));
  }
});

// Backward compatibility alias
export const auth = protect;
export const authenticate = protect;

// Authorization middleware for specific roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as unknown as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
      return;
    }

    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
      return;
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorize('admin');

// Dentist or Admin middleware
export const dentistOrAdmin = authorize('dentist', 'admin');

// Staff or Admin middleware (staff, dentist, admin)
export const staffOrAdmin = authorize('staff', 'dentist', 'admin');

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        (req as AuthenticatedRequest).user = user as any;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Middleware to check if user owns the resource or is admin
export const ownerOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as unknown as AuthenticatedRequest;
    console.log(authReq);
      if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
      return;
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (authReq.user.role === 'admin' || authReq.user._id.toString() === resourceUserId) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
  };
};

// Middleware to check if user owns the resource or is staff/admin
export const userOwnerOrStaff = (userIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as unknown as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
      return;
    }

    // Staff and admin can access all user data
    if (['admin', 'dentist', 'staff'].includes(authReq.user.role)) {
      next();
      return;
    }

    // Users can only access their own data
    const userId = req.params[userIdField] || req.body[userIdField];
    if (authReq.user._id.toString() === userId) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own data.'
      });
    }
  };
};

// Middleware to check if patient owns the resource or is staff/admin
export const patientOwnerOrStaff = (patientIdField: string = 'id') => {
  console.log('I.m here');
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    
    const authReq = req as unknown as AuthenticatedRequest;
    console.log(authReq);
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
      return;
    }

    // Staff and admin can access all patient data
    if (['admin', 'dentist', 'staff'].includes(authReq.user.role)) {
      next();
      return;
    }

    // Patients can only access their own data
    if (authReq.user.role === 'patient') {
      try {
        const patientId = req.params[patientIdField] || req.body[patientIdField];
        
        // Fetch the patient record to get the userId
        const patient = await Patient.findById(patientId);
        console.log(patient);
        
        if (!patient) {
          res.status(404).json({
            success: false,
            message: 'Patient not found.'
          });
          return;
        }
        
        // Compare the authenticated user's ID with the patient's userId
        if (patient.userId && patient.userId.toString() === authReq.user.id.toString()) {
          console.log('here we go');
          next();
          return;
        } else {
          res.status(403).json({
            success: false,
            message: 'Access denied. Patients can only access their own data111.'
          });
          return;
        }
      } catch (error) {
        console.error('Patient ownership check error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error during access control check.'
        });
        return;
      }
    }

    res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  };
};

// Middleware for appointment access - allows staff/admin or patients accessing their own appointments
export const appointmentAccessControl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
      return;
    }

    // Staff and admin can access all appointments
    if (['admin', 'dentist', 'staff'].includes(authReq.user.role)) {
      next();
      return;
    }

    // For patients, check if they're accessing their own appointments
    if (authReq.user.role === 'patient') {
      const patientId = req.query.patientId as string;
      
      // If no patientId is provided, deny access (patients can't see all appointments)
      if (!patientId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Patients must specify a patient ID.'
        });
        return;
      }

      // Check if the patient record belongs to this user
      const patient = await (Patient as any).findById(patientId);
      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient not found.'
        });
        return;
      }

      // Check if this patient belongs to the authenticated user
      if (patient.userId && patient.userId.toString() === authReq.user._id.toString()) {
        next();
        return;
      } else {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own appointments.'
        });
        return;
      }
    }

    res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  } catch (error) {
    console.error('Appointment access control error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during access control check.'
    });
  }
};

// Middleware for individual appointment access - allows staff/admin or patients accessing their own appointments
export const appointmentDetailAccessControl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
      return;
    }

    // Staff and admin can access all appointments
    if (['admin', 'dentist', 'staff'].includes(authReq.user.role)) {
      next();
      return;
    }

    // For patients, check if they're accessing their own appointment
    if (authReq.user.role === 'patient') {
      const appointmentId = req.params.id;
      
      if (!appointmentId) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required.'
        });
        return;
      }

      // Import Appointment model dynamically to avoid circular dependencies
      const { default: Appointment } = await import('../models/Appointment');
      
      // Find the appointment and check if it belongs to this patient
      const appointment = await (Appointment as any).findById(appointmentId).populate('patientId', '_id userId');
      
      if (!appointment) {
        res.status(404).json({
          success: false,
          message: 'Appointment not found.'
        });
        return;
      }

      // Check if this appointment belongs to the authenticated user
      const appointmentPatient = appointment.patientId as any;
      if (appointmentPatient && appointmentPatient.userId && appointmentPatient.userId.toString() === authReq.user._id.toString()) {
        next();
        return;
      } else {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own appointments.'
        });
        return;
      }
    }

    res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  } catch (error) {
    console.error('Appointment detail access control error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during access control check.'
    });
  }
};

// Middleware to check clinic access
export const checkClinicAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
      return;
    }

    // Admin has access to all clinics
    if (authReq.user.role === 'admin') {
      next();
      return;
    }

    const clinicId = req.params.clinicId || req.body.clinicId;
    
    if (!clinicId) {
      res.status(400).json({
        success: false,
        message: 'Clinic ID is required.'
      });
      return;
    }

    // Check if user is assigned to this clinic
    if (!authReq.user.assignedClinics.includes(clinicId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this clinic.'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Clinic access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during clinic access check.'
    });
  }
};