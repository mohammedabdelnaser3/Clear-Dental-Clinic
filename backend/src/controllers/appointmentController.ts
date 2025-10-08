import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Appointment, Patient, User, Clinic, Notification, StaffSchedule } from '../models';
import { AuthenticatedRequest } from '../types';
import {
  getPaginationParams,
  createPaginatedResponse,
  formatDate,
  formatTime,
  isValidTimeSlot
} from '../utils/helpers';
import {
  AppError,
  catchAsync,
  createNotFoundError,
  createValidationError,
  createConflictError
} from '../middleware/errorHandler';
import { sendAppointmentConfirmationEmail, sendAppointmentReminderEmail, sendAppointmentCancellationEmail } from '../utils/email';
import { sendAppointmentConfirmationSMS, sendAppointmentReminderSMS, sendAppointmentCancellationSMS } from '../utils/sms';
import { scheduleAppointmentReminders, cancelAppointmentReminders } from '../utils/scheduler';

// Create new appointment with enhanced validation and error handling
export const createAppointment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const {
    patientId,
    clinicId,
    serviceType,
    date,
    timeSlot,
    duration = 60,
    notes,
    emergency = false
  } = req.body;
  
  let { dentistId } = req.body;

  // Required fields validation - dentistId is completely optional
  const requiredFields = ['patientId', 'serviceType', 'date', 'timeSlot'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    throw createValidationError(
      missingFields[0], 
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }

  // Input validation
  const now = new Date();
  const appointmentDate = new Date(date);
  
  // Date validation with emergency exception
  const today = new Date();
  
  // Simple timezone-safe date comparison using date strings
  const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
  const todayDateStr = today.toISOString().split('T')[0];
  
  if (!emergency && appointmentDateStr < todayDateStr) {
    throw createValidationError('date', 'Appointment date cannot be in the past');
  }
  
  // For emergency appointments, allow same day but not past time
  if (emergency && appointmentDate.toDateString() === now.toDateString()) {
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (timeSlot < currentTime) {
      throw createValidationError('timeSlot', 'Emergency appointment time must be in the future');
    }
  }

  // Validate time slot format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeSlot)) {
    throw createValidationError('timeSlot', 'Invalid time slot format. Use HH:MM format');
  }

  // Validate service type
  if (serviceType && typeof serviceType !== 'string') {
    throw createValidationError('serviceType', 'Service type must be a string');
  }

  // Validate duration
  if (duration && (isNaN(Number(duration)) || Number(duration) <= 0)) {
    throw createValidationError('duration', 'Duration must be a positive number');
  }

  // Entity existence checks with detailed error messages
  let patient: any = null;
  let dentist: any = null;
  let clinic: any = null;
  
  try {
    // Debug logging to understand what IDs we're receiving
    console.log('Creating appointment with IDs:', {
      patientId,
      dentistId,
      clinicId,
      patientIdType: typeof patientId,
      dentistIdType: typeof dentistId,
      clinicIdType: typeof clinicId
    });

    [patient, dentist, clinic] = await Promise.all([
      (Patient as any).findById(patientId).exec(),
      dentistId ? User.findById(dentistId).exec() : null,
      clinicId ? (Clinic as any).findById(clinicId).exec() : null
    ]);

    console.log('Entity lookup results:', {
      patientFound: !!patient,
      dentistFound: !!dentist,
      clinicFound: !!clinic,
      patientData: patient ? { id: patient._id, name: `${patient.firstName} ${patient.lastName}` } : null
    });

    if (!patient) {
      throw createNotFoundError(`Patient not found with ID: ${patientId}`);
    }

    // If dentistId is provided but not found
    if (dentistId && !dentist) {
      throw createNotFoundError('Dentist not found');
    }

    // If clinicId is provided but not found
    if (clinicId && !clinic) {
      throw createNotFoundError('Clinic not found');
    }

    // Business rules validation
    if (dentist && clinicId && !dentist.assignedClinics.includes(clinicId)) {
      throw createValidationError('dentistId', 'Dentist is not assigned to this clinic');
    }

    // Check for conflicts only if dentistId is provided
    if (dentistId) {
    const conflicts = await (Appointment as any).findConflicts(dentistId, appointmentDate, timeSlot, duration);
    if (conflicts.length > 0) {
      throw createConflictError(
        `Time slot ${timeSlot} on ${formatDate(appointmentDate)} is already booked. Please select another time.`
      );
      }
    } else {
      console.log('Skipping conflict check - no dentist assigned to appointment');
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error during entity validation:', error);
    throw createValidationError('general', 'Failed to validate appointment data');
  }

  // Auto-assign dentist if none provided (with timeout protection)
  if (!dentistId) {
    console.log('No dentist provided - attempting auto-assignment with timeout');
    
    try {
      // Add timeout wrapper for auto-assignment
      const autoAssignmentPromise = Promise.race([
        (async () => {
      // Get the day of the week for the appointment (0 = Sunday, 6 = Saturday)
      const appointmentDayOfWeek = appointmentDate.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`📅 Appointment requested for ${dayNames[appointmentDayOfWeek]} (day ${appointmentDayOfWeek})`);
      
      // Find all dentists in this clinic
      const allDentists = await User.find({
        role: 'dentist',
        isActive: true,
        assignedClinics: { $in: [clinicId] }
      });
      
      if (allDentists.length === 0) {
        console.log('⚠️ No dentists found in this clinic - proceeding without assignment');
        return;
      }
      
      console.log(`🔍 Found ${allDentists.length} dentists in clinic, checking schedules...`);
      
      // Check which dentists are scheduled to work on this day
      const scheduledDentists = [];
      
      for (const dentist of allDentists) {
        // Check if this dentist has a schedule for this specific date or recurring pattern
        // FIXED: Use proper ObjectId conversion and simplified query structure
        const staffObjectId = typeof dentist._id === 'string' ? new mongoose.Types.ObjectId(dentist._id) : dentist._id;
        const clinicObjectId = typeof clinicId === 'string' ? new mongoose.Types.ObjectId(clinicId) : clinicId;
        
        const scheduleQuery = {
          staffId: staffObjectId,
          clinicId: clinicObjectId,
          status: { $in: ['scheduled', 'completed'] },
          $or: [
            // Specific date schedule
            {
              date: {
                $gte: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate()),
                $lt: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1)
              }
            },
            // Recurring schedule that includes this day of week
            {
              isRecurring: true,
              'recurringPattern.daysOfWeek': { $in: [appointmentDayOfWeek] },
              $or: [
                { 'recurringPattern.endDate': { $exists: false } },
                { 'recurringPattern.endDate': { $gte: appointmentDate } }
              ]
            }
          ]
        };
        
        // Simplified scheduling check - just look for basic availability
        const schedules = await StaffSchedule.find(scheduleQuery).limit(1);
        
        console.log(`Checking Dr. ${dentist.firstName} ${dentist.lastName} - found ${schedules.length} schedules`);
        
        if (schedules.length > 0) {
          console.log(`✅ ${dentist.firstName} ${dentist.lastName} is scheduled for ${dayNames[appointmentDayOfWeek]}`);
          scheduledDentists.push(dentist);
        } else {
          console.log(`❌ ${dentist.firstName} ${dentist.lastName} is NOT scheduled for ${dayNames[appointmentDayOfWeek]}`);
        }
      }
      
      if (scheduledDentists.length === 0) {
        console.log('⚠️ No dentists are scheduled to work on this day - proceeding without assignment');
        return;
      }
      
      // Among scheduled dentists, check for appointment conflicts (parallel processing)
      const availableDentists = [];
      
      if (scheduledDentists.length > 0) {
        console.log(`Checking conflicts for ${scheduledDentists.length} dentists...`);
        
        // Check conflicts in parallel for better performance
        const conflictPromises = scheduledDentists.map(dentist => 
          (Appointment as any).findConflicts(dentist._id.toString(), appointmentDate, timeSlot, duration)
            .then(conflicts => ({ dentist, conflicts }))
        );
        
        const conflictResults = await Promise.all(conflictPromises);
        
        for (const { dentist, conflicts } of conflictResults) {
          if (conflicts.length === 0) {
            availableDentists.push(dentist);
            console.log(`✅ Dr. ${dentist.firstName} ${dentist.lastName} is available`);
          }
        }
      }
      
      if (availableDentists.length > 0) {
        // Auto-assign the first available dentist
        const assignedDentist = availableDentists[0];
        dentistId = assignedDentist._id.toString();
        dentist = assignedDentist;
        
        console.log(`🎯 AUTO-ASSIGNED: Dr. ${assignedDentist.firstName} ${assignedDentist.lastName} for ${dayNames[appointmentDayOfWeek]} at ${timeSlot}`);
      } else {
        console.log('⚠️ All scheduled dentists are busy at this time - proceeding without assignment');
      }
      
        })(), // End of auto-assignment async function
        
        // Timeout after 5 seconds
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auto-assignment timeout')), 5000)
        )
      ]);
      
      await autoAssignmentPromise;
      
    } catch (autoAssignError) {
      console.error('Error during auto-assignment:', autoAssignError);
      console.log('Proceeding without dentist assignment due to error or timeout');
    }
  }

  // Create and save appointment with enhanced status handling for emergency appointments
  const appointmentData: any = {
    patientId,
    clinicId,
    serviceType,
    date: appointmentDate,
    timeSlot,
    duration,
    notes,
    status: emergency ? 'urgent' : 'scheduled',
    emergency,
    createdBy: req.user?._id || req.user?.id,
    createdAt: new Date()
  };

  // Only add dentistId if it's provided
  if (dentistId) {
    appointmentData.dentistId = dentistId;
  }

  const appointment = await (Appointment as any).create(appointmentData);

  // Populate related data with more comprehensive information
  const populatePaths = [
    { path: 'patientId', select: 'firstName lastName email phone dateOfBirth gender' },
    { path: 'clinicId', select: 'name address phone email operatingHours' }
  ];

  // Only populate dentistId if it exists
  if (dentistId) {
    populatePaths.push({ path: 'dentistId', select: 'firstName lastName email specialization phone' });
  }

  await appointment.populate(populatePaths);

  // Enhanced notification system with better error handling
  const notificationResults: { email: boolean; sms?: boolean; inApp: boolean; errors: any[] } = { email: false, sms: false, inApp: false, errors: [] };
  
  try {
    const notificationPromises = [];
    // Get notification preferences - use default if not set
    const notificationPreferences = {
      enabled: true,
      channels: { email: true, sms: true, inApp: true }
    };
    
    // Only proceed with notifications if they're enabled
    if (notificationPreferences.enabled) {
      // Send email if patient has an email address and email notifications are enabled
      if (patient.email && notificationPreferences.channels.email) {
        const emailPromise = sendAppointmentConfirmationEmail(
          patient.email,
          patient.fullName || `${patient.firstName} ${patient.lastName}`,
          {
            date: formatDate(appointmentDate),
            time: timeSlot,
            dentist: dentist ? (dentist.fullName || `${dentist.firstName} ${dentist.lastName}`) : 'To be assigned',
            clinic: clinic ? clinic.name : 'Our clinic',
            service: serviceType
          }
        ).then(() => {
          notificationResults.email = true;
        }).catch(err => {
          console.error('Email notification error:', err);
          notificationResults.errors.push({ type: 'email', message: err.message });
          return null; // Don't fail the promise chain
        });
        
        notificationPromises.push(emailPromise);
      }
      
      // Send SMS if patient has a phone number and SMS notifications are enabled
      if (patient.phone && notificationPreferences.channels.sms) {
        const smsPromise = sendAppointmentConfirmationSMS(
          patient.phone,
          patient.fullName || `${patient.firstName} ${patient.lastName}`,
          {
            date: formatDate(appointmentDate),
            time: timeSlot,
            dentist: dentist ? (dentist.fullName || `${dentist.firstName} ${dentist.lastName}`) : 'To be assigned',
            clinic: clinic ? clinic.name : 'Our clinic',
            service: serviceType
          }
        ).then(() => {
          if (notificationResults.sms !== undefined) notificationResults.sms = true;
        }).catch((err: any) => {
          console.error('SMS notification error:', err);
          notificationResults.errors.push({ type: 'sms', message: err.message });
          return null; // Don't fail the promise chain
        });
        
        notificationPromises.push(smsPromise);
      }
      
      // Schedule appointment reminders
      try {
        scheduleAppointmentReminders(appointment, patient, dentist, clinic);
      } catch (err: any) {
        console.error('Failed to schedule appointment reminders:', err);
        notificationResults.errors.push({ type: 'reminder', message: err?.message || 'Unknown error' });
      }
    }
    
    // Create in-app notification if enabled or if this is an emergency
    if (notificationPreferences.channels.inApp || emergency) {
      const notificationPromise = (Notification as any).create({
      userId: patientId,
      type: emergency ? 'urgent_appointment' : 'appointment_confirmation',
      title: emergency ? 'Urgent Appointment Scheduled' : 'Appointment Confirmed',
      message: `Your ${emergency ? 'urgent ' : ''}appointment has been ${emergency ? 'scheduled' : 'confirmed'} for ${formatDate(appointmentDate)} at ${timeSlot}${dentist ? ` with ${dentist.firstName} ${dentist.lastName}` : ''}`,
      appointmentId: appointment._id,
      createdAt: new Date(),
      status: 'unread',
      priority: emergency ? 'high' : 'normal'
    }).then(() => {
      notificationResults.inApp = true;
    }).catch((err: any) => {
      console.error('In-app notification error:', err);
      notificationResults.errors.push({ type: 'inApp', message: err.message });
      return null; // Don't fail the promise chain
    });
    
    notificationPromises.push(notificationPromise);
    }
    
    // If this is an emergency appointment, also notify staff
    if (emergency && dentist && dentistId) {
      const staffNotificationPromise = (Notification as any).create({
        userId: dentistId,
        type: 'urgent_appointment_staff',
        title: 'Urgent Appointment Scheduled',
        message: `An urgent appointment has been scheduled for ${formatDate(appointmentDate)} at ${timeSlot} with patient ${patient.firstName} ${patient.lastName}`,
        appointmentId: appointment._id,
        createdAt: new Date(),
        status: 'unread',
        priority: 'high'
      }).catch((err: any) => {
        console.error('Staff notification error:', err);
        notificationResults.errors.push({ type: 'staffNotification', message: err.message });
        return null; // Don't fail the promise chain
      });
      
      notificationPromises.push(staffNotificationPromise);
    }
    
    await Promise.allSettled(notificationPromises);
  } catch (error: any) {
    console.error('Notification system error:', error);
    notificationResults.errors.push({ type: 'system', message: error?.message || 'Unknown notification error' });
  }

  // Enhanced response with more detailed information
  res.status(201).json({
    success: true,
    message: emergency ? 'Urgent appointment scheduled successfully' : 'Appointment created successfully',
    data: { 
      appointment,
      notifications: {
        emailSent: notificationResults.email,
        smsSent: notificationResults.sms || false,
        inAppCreated: notificationResults.inApp,
        errors: notificationResults.errors.length > 0 ? notificationResults.errors : undefined
      }
    }
  });
});

// Get all appointments with filtering and pagination
export const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { status, date, dentistId, clinicId, patientId } = req.query;

  const query = buildAppointmentQuery({ 
    status: status as string, 
    date: date as string, 
    dentistId: dentistId as string, 
    clinicId: clinicId as string, 
    patientId: patientId as string 
  });

  const [appointments, total] = await Promise.all([
    (Appointment as any).find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address phone')
      .sort({ date: -1, 'timeSlot.start': 1 })
      .skip(skip)
      .limit(limit),
    (Appointment as any).countDocuments(query)
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(appointments, total, page, limit)
  });
});

// Helper function to build appointment query
const buildAppointmentQuery = ({ status, date, dentistId, clinicId, patientId }: {
  status?: string;
  date?: string;
  dentistId?: string;
  clinicId?: string;
  patientId?: string;
}) => {
  const query: any = {};

  if (status) query.status = status;
  if (dentistId) query.dentistId = dentistId;
  if (clinicId) query.clinicId = clinicId;
  if (patientId) query.patientId = patientId;

  if (date) {
    const searchDate = new Date(date as string);
    query.date = {
      $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
      $lte: new Date(searchDate.setHours(23, 59, 59, 999))
    };
  }

  return query;
};

// Get appointment by ID
export const getAppointmentById = catchAsync(async (req: Request, res: Response) => {
  const appointment = await (Appointment as any).findById(req.params.id)
    .populate('patientId', 'firstName lastName email phone dateOfBirth gender address')
    .populate('dentistId', 'firstName lastName email specialization phone')
    .populate('clinicId', 'name address phone email operatingHours');

  if (!appointment) {
    throw createNotFoundError('Appointment');
  }

  res.json({
    success: true,
    data: { appointment }
  });
});

// Update appointment
export const updateAppointment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date, timeSlot, duration, serviceType, notes, status } = req.body;

  // console.log('🔍 UpdateAppointment - Request details:', { appointmentId: id, requestBody: req.body });

  const appointment = await (Appointment as any).findById(id)
    .populate('patientId', 'firstName lastName email')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name');

  if (!appointment) {
    console.error('❌ Appointment not found:', id);
    throw createNotFoundError('Appointment');
  }

  // Check if appointment can be modified (allow cancellation of any non-cancelled appointment)
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    if (status !== 'cancelled' || appointment.status === 'cancelled') {
      throw createValidationError('status', 'Cannot modify completed or cancelled appointments');
    }
  }

  // Handle date/time changes (only if date or timeSlot is provided)
  if (date || timeSlot) {
    try {
      await validateAndUpdateDateTime(appointment, date, timeSlot);
    } catch (error) {
      console.error('❌ Date/time validation failed:', error);
      throw error;
    }
  }

  // Update other fields
  const updateData = {
    ...(duration && { duration }),
    ...(serviceType && { serviceType }),
    ...(notes && { notes }),
    ...(status && { status })
  };
  
  Object.assign(appointment, updateData);

  try {
    // Skip validation when only updating status (to avoid createdBy and past date validation issues)
    const isOnlyStatusUpdate = Object.keys(updateData).length === 1 && updateData.status;
    if (isOnlyStatusUpdate) {
      await appointment.save({ validateBeforeSave: false });
    } else {
      await appointment.save();
    }
  } catch (saveError) {
    console.error('❌ Error saving appointment:', saveError);
    throw saveError;
  }

  res.json({
    success: true,
    message: 'Appointment updated successfully',
    data: { appointment }
  });
});

// Helper function to validate and update date/time
async function validateAndUpdateDateTime(appointment: any, date: string, timeSlot: string) {
  const newDate = date ? new Date(date) : appointment.date;
  const newTimeSlot = timeSlot || appointment.timeSlot;

  const today = new Date();
  
  // Simple timezone-safe date comparison using date strings
  const newDateStr = newDate.toISOString().split('T')[0];
  const todayDateStr = today.toISOString().split('T')[0];
  
  if (newDateStr < todayDateStr) {
    throw createValidationError('date', 'Appointment date cannot be in the past');
  }

  const conflicts = await (Appointment as any).find({
    dentistId: appointment.dentistId,
    date: {
      $gte: new Date(newDate.setHours(0, 0, 0, 0)),
      $lte: new Date(newDate.setHours(23, 59, 59, 999))
    },
    timeSlot: newTimeSlot, // Fixed: timeSlot is a string, not an object
    _id: { $ne: appointment._id },
    status: { $ne: 'cancelled' }
  });

  if (conflicts.length > 0) {
    throw createConflictError('Time slot is already booked');
  }

  appointment.date = newDate;
  appointment.timeSlot = newTimeSlot;
}

// Cancel appointment
export const cancelAppointment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const appointment = await (Appointment as any).findById(id)
    .populate('patientId', 'firstName lastName email')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name address phone');

  if (!appointment) {
    throw createNotFoundError('Appointment');
  }

  if (!appointment.canBeCancelled()) {
    throw createValidationError('appointment', 'Appointment cannot be cancelled');
  }

  appointment.status = 'cancelled';
  if (reason) {
    appointment.notes = appointment.notes ? 
      `${appointment.notes}\n\nCancellation reason: ${reason}` : 
      `Cancellation reason: ${reason}`;
  }

  await appointment.save();

  // Send notifications
  try {
    await Promise.all([
      sendAppointmentCancellationEmail(
        (appointment.patientId as any).email,
        (appointment.patientId as any).fullName,
        {
          date: formatDate(appointment.date),
          time: appointment.timeSlot,
          reason: reason || 'No reason provided'
        }
      ),
      (Notification as any).create({
        userId: appointment.patientId,
        type: 'appointment_cancellation',
        title: 'Appointment Cancelled',
        message: `Your appointment for ${formatDate(appointment.date)} at ${appointment.timeSlot} has been cancelled${reason ? `: ${reason}` : ''}`,
        appointmentId: appointment._id
      })
    ]);
  } catch (error) {
    console.error('Notification error:', error);
  }

  res.json({
    success: true,
    message: 'Appointment cancelled successfully',
    data: { appointment }
  });
});

// Get today's appointments
export const getTodayAppointments = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { dentistId, clinicId, status } = req.query;

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const query: any = {
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  };

  if (dentistId) query.dentistId = dentistId;
  if (clinicId) query.clinicId = clinicId;
  if (status) query.status = status;

  const [appointments, total] = await Promise.all([
    (Appointment as any).find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address phone')
      .sort({ 'timeSlot.start': 1 })
      .skip(skip)
      .limit(limit),
    (Appointment as any).countDocuments(query)
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(appointments, total, page, limit)
  });
});

// Send appointment reminder
export const sendAppointmentReminder = catchAsync(async (req: Request, res: Response) => {
  const { appointmentId } = req.params;

  const appointment = await (Appointment as any).findById(appointmentId)
    .populate('patientId', 'name email')
    .populate('dentistId', 'name')
    .populate('clinicId', 'name');

  if (!appointment) {
    return res.status(404).json({
      status: 'error',
      message: 'Appointment not found'
    });
  }

  const patient = appointment.patientId as any;
  const dentist = appointment.dentistId as any;
  const clinic = appointment.clinicId as any;

  // Send reminder email
  try {
    await sendAppointmentReminderEmail(
      patient.email,
      patient.name,
      {
        date: new Date(appointment.date).toLocaleDateString(),
        time: appointment.timeSlot,
        dentist: dentist.name,
        clinic: clinic.name
      }
    );
  } catch (emailError) {
    console.error('Failed to send reminder email:', emailError);
  }

  // Create notification
  try {
    await (Notification as any).create({
      userId: appointment.patientId,
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: `You have an appointment scheduled for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot}`,
      appointmentId: appointment._id
    });
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError);
  }

  return res.status(200).json({
    status: 'success',
    message: 'Appointment reminder sent successfully'
  });
});

// Complete appointment
export const completeAppointment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { treatmentProvided, followUpRequired, followUpDate, notes } = req.body;

  const appointment = await (Appointment as any).findById(id);
  if (!appointment) {
    return res.status(404).json({
      status: 'error',
      message: 'Appointment not found'
    });
  }

  if (appointment.status !== 'in-progress') {
    return res.status(400).json({
      status: 'error',
      message: 'Only in-progress appointments can be completed'
    });
  }

  appointment.status = 'completed';
  appointment.treatmentProvided = treatmentProvided;
  appointment.followUpRequired = followUpRequired;
  appointment.followUpDate = followUpDate;
  if (notes) appointment.notes = notes;

  await appointment.save();

  return res.status(200).json({
    status: 'success',
    message: 'Appointment completed successfully',
    data: { appointment }
  });
});

// Reschedule appointment
export const rescheduleAppointment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newDate, newTime, reason } = req.body;

  const appointment = await (Appointment as any).findById(id)
    .populate('patientId', 'name email')
    .populate('dentistId', 'name')
    .populate('clinicId', 'name');

  if (!appointment) {
    return res.status(404).json({
      status: 'error',
      message: 'Appointment not found'
    });
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return res.status(400).json({
      status: 'error',
      message: 'Cannot reschedule completed or cancelled appointments'
    });
  }

  const appointmentDate = new Date(newDate);
  const today = new Date();
  
  // Simple timezone-safe date comparison using date strings
  const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
  const todayDateStr = today.toISOString().split('T')[0];
  
  if (appointmentDateStr < todayDateStr) {
    return res.status(400).json({
      status: 'error',
      message: 'New appointment date cannot be in the past'
    });
  }

  // Check for conflicts
  const conflicts = await (Appointment as any).findConflicts(
    appointment.dentistId?.toString() || '',
    appointmentDate,
    newTime,
    appointment.duration,
    id
  );

  if (conflicts.length > 0) {
    return res.status(409).json({
      status: 'error',
      message: 'The new time slot conflicts with an existing appointment'
    });
  }

  const oldDate = new Date(appointment.date).toLocaleDateString();
  const oldTime = appointment.timeSlot;

  appointment.date = appointmentDate;
  appointment.timeSlot = newTime;
  if (reason) {
    appointment.notes = appointment.notes ? 
      `${appointment.notes}\n\nRescheduled: ${reason}` : 
      `Rescheduled: ${reason}`;
  }

  await appointment.save();

  const patient = appointment.patientId as any;
  const dentist = appointment.dentistId as any;
  const clinic = appointment.clinicId as any;

  // Send confirmation email for rescheduled appointment
  try {
    await sendAppointmentConfirmationEmail(
      patient.email,
      patient.name,
      {
        date: new Date(appointmentDate).toLocaleDateString(),
        time: newTime,
        dentist: dentist.name,
        clinic: clinic.name,
        service: appointment.serviceType
      }
    );
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
  }

  return res.status(200).json({
    status: 'success',
    message: `Appointment rescheduled from ${oldDate} ${oldTime} to ${new Date(appointmentDate).toLocaleDateString()} ${newTime}`,
    data: { appointment }
  });
});

// Auto-book first available appointment for a given date
export const autoBookFirstAvailable = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    patientId,
    clinicId,
    serviceType,
    date,
    duration = 60,
    notes,
    emergency = false
  } = req.body;
  
  // Required fields validation
  const requiredFields = ['patientId', 'serviceType', 'date', 'clinicId'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    throw createValidationError(
      missingFields[0], 
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }

  // Input validation
  const appointmentDate = new Date(date);
  const today = new Date();
  
  // Date validation with emergency exception
  const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
  const todayDateStr = today.toISOString().split('T')[0];
  
  if (!emergency && appointmentDateStr < todayDateStr) {
    throw createValidationError('date', 'Appointment date cannot be in the past');
  }

  // Validate entities exist
  const [patient, clinic] = await Promise.all([
    (Patient as any).findById(patientId).exec(),
    (Clinic as any).findById(clinicId).exec()
  ]);

  if (!patient) {
    throw createNotFoundError(`Patient not found with ID: ${patientId}`);
  }

  if (!clinic) {
    throw createNotFoundError('Clinic not found');
  }

  // Get available time slots for this date
  const appointmentDayOfWeek = appointmentDate.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  console.log(`🔍 Auto-booking: Looking for first available slot on ${dayNames[appointmentDayOfWeek]} (${appointmentDateStr})`);

  // Get all dentists assigned to this clinic
  const allDentists = await User.find({
    role: { $in: ['dentist', 'admin'] },
    isActive: true,
    assignedClinics: clinicId
  });

  if (allDentists.length === 0) {
    res.status(404).json({
      success: false,
      message: 'No dentists available at this clinic'
    });
    return;
  }

  // Filter dentists who are scheduled to work on this day
  const scheduledDentists = [];
  
  for (const dentist of allDentists) {
    const staffObjectId = typeof dentist._id === 'string' ? new mongoose.Types.ObjectId(dentist._id) : dentist._id;
    const clinicObjectId = typeof clinicId === 'string' ? new mongoose.Types.ObjectId(clinicId) : clinicId;
    
    const scheduleQuery = {
      staffId: staffObjectId,
      clinicId: clinicObjectId,
      status: { $in: ['scheduled', 'completed'] },
      $or: [
        // Specific date schedule
        {
          date: {
            $gte: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate()),
            $lt: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1)
          }
        },
        // Recurring schedule that includes this day of week
        {
          isRecurring: true,
          'recurringPattern.daysOfWeek': { $in: [appointmentDayOfWeek] },
          $or: [
            { 'recurringPattern.endDate': { $exists: false } },
            { 'recurringPattern.endDate': { $gte: appointmentDate } }
          ]
        }
      ]
    };
    
    const schedules = await StaffSchedule.find(scheduleQuery);
    
    if (schedules.length > 0) {
      scheduledDentists.push(dentist);
    }
  }

  if (scheduledDentists.length === 0) {
    res.status(404).json({
      success: false,
      message: `No dentists are scheduled to work on ${dayNames[appointmentDayOfWeek]}`
    });
    return;
  }

  // Get available slots for all scheduled dentists and find the first available one
  const allSlots = [];
  
  for (const dentist of scheduledDentists) {
    const slots = await Appointment.getAvailableTimeSlots(
      dentist._id.toString(),
      appointmentDate,
      parseInt(duration as string)
    );
    
    // Add dentist information to each slot
    const slotsWithDentist = slots.map(slot => ({
      ...slot,
      dentistId: dentist._id.toString(),
      dentistName: `${dentist.firstName} ${dentist.lastName}`,
      dentistSpecialization: dentist.specialization
    }));
    
    allSlots.push(...slotsWithDentist);
  }

  if (allSlots.length === 0) {
    res.status(404).json({
      success: false,
      message: 'No available time slots found for the selected date'
    });
    return;
  }

  // Sort slots by time to get the earliest available slot
  allSlots.sort((a, b) => {
    const timeA = a.time || a.timeSlot;
    const timeB = b.time || b.timeSlot;
    return timeA.localeCompare(timeB);
  });

  const firstAvailableSlot = allSlots[0];
  const selectedTimeSlot = firstAvailableSlot.time || firstAvailableSlot.timeSlot;

  console.log(`✅ Auto-booking: Found first available slot at ${selectedTimeSlot} with Dr. ${firstAvailableSlot.dentistName}`);

  // Create the appointment with the first available slot
  const appointmentData = {
    patientId,
    dentistId: firstAvailableSlot.dentistId,
    clinicId,
    serviceType,
    date: appointmentDate,
    timeSlot: selectedTimeSlot,
    duration,
    notes,
    status: emergency ? 'urgent' : 'scheduled',
    emergency,
    createdBy: req.user?._id || req.user?.id,
    createdAt: new Date()
  };

  const appointment = await (Appointment as any).create(appointmentData);

  // Populate related data
  await appointment.populate([
    { path: 'patientId', select: 'firstName lastName email phone dateOfBirth gender' },
    { path: 'dentistId', select: 'firstName lastName email specialization phone' },
    { path: 'clinicId', select: 'name address phone email operatingHours' }
  ]);

  // Send notifications (reusing existing notification logic)
  const notificationResults = { email: false, sms: false, inApp: false, errors: [] };
  
  try {
    // Schedule appointment reminders
    await scheduleAppointmentReminders(appointment as any);
    
    res.status(201).json({
      success: true,
      message: `Appointment automatically booked for ${selectedTimeSlot} with Dr. ${firstAvailableSlot.dentistName}`,
      data: {
        appointment,
        bookedSlot: {
          time: selectedTimeSlot,
          dentistName: firstAvailableSlot.dentistName,
          dentistSpecialization: firstAvailableSlot.dentistSpecialization
        },
        notifications: notificationResults
      }
    });
  } catch (error) {
    console.error('Auto-booking appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-book appointment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available time slots with enhanced validation
export const getAvailableTimeSlots = catchAsync(async (req: Request, res: Response) => {
  const { date, dentistId, clinicId, duration = 60 } = req.query;

  if (!date || !clinicId) {
    return res.status(400).json({
      status: 'error',
      message: 'Date and clinicId are required'
    });
  }

  // Validate clinic exists first
  const clinic = await (Clinic as any).findById(clinicId);
  if (!clinic) {
    return res.status(404).json({
      status: 'error',
      message: 'Clinic not found',
      data: { availableSlots: [] }
    });
  }

  const searchDate = new Date(date as string);
  const today = new Date();
  
  // Simple timezone-safe date comparison using date strings
  const searchDateStr = searchDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const todayDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (searchDateStr < todayDateStr) {
    return res.status(400).json({
      status: 'error',
      message: 'Date cannot be in the past'
    });
  }

  let availableSlots: any[] = [];

  if (dentistId) {
    // If dentistId is provided, get slots for that specific dentist
    availableSlots = await Appointment.getAvailableTimeSlots(
      dentistId as string,
      searchDate,
      parseInt(duration as string)
    );
  } else {
    // If no dentistId provided, get slots for all dentists in the clinic
    console.log('Searching for dentists with clinicId:', clinicId);
    
    try {
      console.log('Querying for dentists with criteria:', {
        role: 'dentist',
        isActive: true,
        assignedClinics: { $in: [clinicId] }
      });
      
      // Get all dentists assigned to this clinic
      const allDentists = await User.find({ 
        role: 'dentist', 
        isActive: true,  // Use isActive instead of status
        assignedClinics: { $in: [clinicId] }
      });

      console.log(`🎯 Found ${allDentists.length} dentists for clinic ${clinicId}`);
      allDentists.forEach(d => {
        console.log(`  ✅ ${d.firstName} ${d.lastName} (${d._id})`);
      });

      if (allDentists.length === 0) {
        // No dentists in clinic - this is a configuration issue
        console.warn(`⚠️ No dentists assigned to clinic ${clinicId} (${clinic.name})`);
        return res.status(200).json({
          status: 'success',
          data: { availableSlots: [] },
          message: `No dentists are assigned to clinic "${clinic.name}". Please contact administration to assign dentists before booking appointments.`,
          error: 'NO_DENTISTS_ASSIGNED',
          clinicInfo: {
            id: clinic._id,
            name: clinic.name
          }
        });
      }

      // SCHEDULE-AWARE: Only include dentists who are scheduled to work on this day
      const appointmentDayOfWeek = searchDate.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`📅 Checking available slots for ${dayNames[appointmentDayOfWeek]} (day ${appointmentDayOfWeek})`);
      
      // Filter dentists who are scheduled to work on this day
      const dentists = [];
      
      for (const dentist of allDentists) {
        // Check if this dentist has a schedule for this specific date or recurring pattern
        // FIXED: Use proper ObjectId conversion and simplified query structure
        const staffObjectId = typeof dentist._id === 'string' ? new mongoose.Types.ObjectId(dentist._id) : dentist._id;
        const clinicObjectId = typeof clinicId === 'string' ? new mongoose.Types.ObjectId(clinicId) : clinicId;
        
        const scheduleQuery = {
          staffId: staffObjectId,
          clinicId: clinicObjectId,
          status: { $in: ['scheduled', 'completed'] },
          $or: [
            // Specific date schedule
            {
              date: {
                $gte: new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate()),
                $lt: new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate() + 1)
              }
            },
            // Recurring schedule that includes this day of week
            {
              isRecurring: true,
              'recurringPattern.daysOfWeek': { $in: [appointmentDayOfWeek] },
              $or: [
                { 'recurringPattern.endDate': { $exists: false } },
                { 'recurringPattern.endDate': { $gte: searchDate } }
              ]
            }
          ]
        };
        
        console.log(`🔍 Schedule query for ${dentist.firstName} ${dentist.lastName}:`, JSON.stringify(scheduleQuery, null, 2));
        
        const schedules = await StaffSchedule.find(scheduleQuery);
        
        // Also check all schedules for this dentist to debug
        const allSchedules = await StaffSchedule.find({ staffId: dentist._id });
        console.log(`📊 All schedules for ${dentist.firstName} ${dentist.lastName}:`, allSchedules.length);
        allSchedules.forEach(schedule => {
          console.log(`   Schedule: isRecurring=${schedule.isRecurring}, daysOfWeek=${schedule.recurringPattern?.daysOfWeek}, status=${schedule.status}`);
          // Debug: Does this schedule match our day?
          if (schedule.isRecurring && schedule.recurringPattern?.daysOfWeek) {
            const includesDay = schedule.recurringPattern.daysOfWeek.includes(appointmentDayOfWeek);
            console.log(`   → Does schedule include day ${appointmentDayOfWeek}? ${includesDay} (array: [${schedule.recurringPattern.daysOfWeek}])`);
            
            // DEBUG: Test different query approaches on this specific schedule
            console.log(`   🧪 Testing query approaches:`);
            console.log(`     - appointmentDayOfWeek type: ${typeof appointmentDayOfWeek} (${appointmentDayOfWeek})`);
            console.log(`     - daysOfWeek type: ${typeof schedule.recurringPattern.daysOfWeek[0]} (${schedule.recurringPattern.daysOfWeek[0]})`);
            console.log(`     - Array includes check: ${schedule.recurringPattern.daysOfWeek.includes(appointmentDayOfWeek)}`);
            console.log(`     - Array includes string: ${(schedule.recurringPattern.daysOfWeek as any[]).includes(appointmentDayOfWeek.toString())}`);
            console.log(`     - Raw array: ${JSON.stringify(schedule.recurringPattern.daysOfWeek)}`);
          }
        });
        
        console.log(`🔍 Checking ${dentist.firstName} ${dentist.lastName} for ${dayNames[appointmentDayOfWeek]} (day ${appointmentDayOfWeek})`);
        console.log(`   Found ${schedules.length} schedule records`);
        
        if (schedules.length > 0) {
          console.log(`✅ ${dentist.firstName} ${dentist.lastName} is scheduled for ${dayNames[appointmentDayOfWeek]}`);
          dentists.push(dentist);
        } else {
          console.log(`❌ ${dentist.firstName} ${dentist.lastName} is NOT scheduled for ${dayNames[appointmentDayOfWeek]}`);
        }
      }
      
      console.log(`📊 Found ${dentists.length} dentists scheduled for ${dayNames[appointmentDayOfWeek]}`);
      
      if (dentists.length === 0) {
        console.log('⚠️ No dentists are scheduled to work on this day');
        return res.status(200).json({
          status: 'success',
          data: { availableSlots: [] },
          message: `No dentists are scheduled to work on ${dayNames[appointmentDayOfWeek]}`
        });
      }

      // Get available slots for all dentists and combine them
      const allSlots = await Promise.all(
        dentists.map(async (dentist) => {
          const slots = await Appointment.getAvailableTimeSlots(
            dentist._id.toString(),
            searchDate,
            parseInt(duration as string)
          );
          
          // Add dentist information to each slot
          return slots.map(slot => ({
            ...slot,
            dentistId: dentist._id,
            dentistName: `${dentist.firstName} ${dentist.lastName}`,
            dentistSpecialization: dentist.specialization,
            timeSlot: slot.time // Ensure consistent naming
          }));
        })
      );

      // Combine and deduplicate slots by time (multiple dentists can have same time slot)
      const slotMap = new Map();
      allSlots.flat().forEach(slot => {
        const key = `${slot.timeSlot || slot.time}`;
        if (!slotMap.has(key)) {
          slotMap.set(key, []);
        }
        slotMap.get(key).push(slot);
      });

      // Convert to final format - one slot per time with available dentists
      availableSlots = Array.from(slotMap.entries()).map(([timeSlot, slots]) => ({
        timeSlot,
        time: timeSlot, // Backward compatibility
        isAvailable: true,
        isPeak: slots[0]?.isPeak || false,
        availableDentists: slots.map((slot: any) => ({
          dentistId: slot.dentistId,
          dentistName: slot.dentistName,
          dentistSpecialization: slot.dentistSpecialization
        })),
        // For backward compatibility, include the first dentist as primary
        dentistId: slots[0]?.dentistId,
        dentistName: slots[0]?.dentistName
      }));
      
      console.log(`🕐 Generated ${availableSlots.length} time slots with dentist info`);
    } catch (error) {
      console.error('Error finding dentists:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error finding dentists for this clinic'
      });
    }
  }

  return res.status(200).json({
    status: 'success',
    data: { availableSlots }
  });
});

// Get next available slot after last booked appointment
export const getNextSlotAfterLastBooking = catchAsync(async (req: Request, res: Response) => {
  const { date, clinicId, duration = 60 } = req.query;

  if (!date || !clinicId) {
    return res.status(400).json({
      status: 'error',
      message: 'Date and clinicId are required'
    });
  }

  // Validate clinic exists first
  const clinic = await (Clinic as any).findById(clinicId);
  if (!clinic) {
    return res.status(404).json({
      status: 'error',
      message: 'Clinic not found'
    });
  }

  const searchDate = new Date(date as string);
  const today = new Date();
  
  // Simple timezone-safe date comparison using date strings
  const searchDateStr = searchDate.toISOString().split('T')[0];
  const todayDateStr = today.toISOString().split('T')[0];
  
  if (searchDateStr < todayDateStr) {
    return res.status(400).json({
      status: 'error',
      message: 'Date cannot be in the past'
    });
  }

  try {
    const nextSlot = await Appointment.getNextSlotAfterLastBooking(
      clinicId as string,
      searchDate,
      parseInt(duration as string)
    );

    if (!nextSlot) {
      return res.status(200).json({
        status: 'success',
        data: { nextSlot: null },
        message: 'No available time after last booking or clinic is closed'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { nextSlot }
    });
  } catch (error) {
    console.error('Error getting next slot after last booking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error finding next available slot'
    });
  }
});

// Get upcoming appointments
export const getUpcomingAppointments = catchAsync(async (req: Request, res: Response) => {
  const { days = 7, clinicId, dentistId } = req.query;
  const { page, limit, skip } = getPaginationParams(req);
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + parseInt(days as string));

  const query: any = {
    date: { $gte: startDate, $lte: endDate },
    status: { $in: ['scheduled', 'confirmed'] }
  };

  if (clinicId) query.clinicId = clinicId;
  if (dentistId) query.dentistId = dentistId;
  
  const [appointments, total] = await Promise.all([
    (Appointment as any).find(query)
      .populate('patientId', 'name email phone')
      .populate('dentistId', 'name specialization')
      .populate('clinicId', 'name address')
      .sort({ date: 1, timeSlot: 1 })
      .skip(skip)
      .limit(limit),
    (Appointment as any).countDocuments(query)
  ]);

  return res.status(200).json({
    status: 'success',
    data: createPaginatedResponse(appointments, total, page, limit)
  });
});

// Get appointments by date range
export const getAppointmentsByDateRange = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate, clinicId, dentistId, status } = req.query;
  const { page, limit, skip } = getPaginationParams(req);

  if (!startDate || !endDate) {
    return res.status(400).json({
      status: 'error',
      message: 'Start date and end date are required'
    });
  }

  const query: any = {
    date: {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    }
  };

  if (clinicId) query.clinicId = clinicId;
  if (dentistId) query.dentistId = dentistId;
  if (status) query.status = status;
  
  const [appointments, total] = await Promise.all([
    (Appointment as any).find(query)
      .populate('patientId', 'name email phone')
      .populate('dentistId', 'name specialization')
      .populate('clinicId', 'name address')
      .sort({ date: 1, timeSlot: 1 })
      .skip(skip)
      .limit(limit),
    (Appointment as any).countDocuments(query)
  ]);

  return res.status(200).json({
    status: 'success',
    data: createPaginatedResponse(appointments, total, page, limit)
  });
});

// Get appointment statistics
export const getAppointmentStatistics = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate, clinicId } = req.query;

  const matchQuery: any = {};
  
  if (startDate && endDate) {
    matchQuery.date = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };
  }
  
  if (clinicId) {
    matchQuery.clinicId = clinicId;
  }

  const statistics = await (Appointment as any).aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalAppointments = await (Appointment as any).countDocuments(matchQuery);
  
  const statusCounts = {
    scheduled: 0,
    confirmed: 0,
    'in-progress': 0,
    completed: 0,
    cancelled: 0,
    'no-show': 0
  };

  statistics.forEach((stat: any) => {
    if (stat._id in statusCounts) {
      (statusCounts as any)[stat._id] = stat.count;
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      totalAppointments,
      statusBreakdown: statusCounts,
      completionRate: totalAppointments > 0 ? (statusCounts.completed / totalAppointments * 100).toFixed(2) : 0,
      cancellationRate: totalAppointments > 0 ? (statusCounts.cancelled / totalAppointments * 100).toFixed(2) : 0
    }
  });
});

// Get recent appointments
export const getRecentAppointments = catchAsync(async (req: Request, res: Response) => {
  const { limit = 10, clinicId } = req.query;
  const { page, limit: pageLimit, skip } = getPaginationParams(req);
  
  const query: any = {};
  if (clinicId) query.clinicId = clinicId;
  
  const [appointments, total] = await Promise.all([
    (Appointment as any).find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string) || pageLimit),
    (Appointment as any).countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: createPaginatedResponse(appointments, total, page, pageLimit),
    message: 'Recent appointments retrieved successfully'
  });
});

// Get recent appointments across all clinics (admin only)
export const getRecentAppointmentsOverall = catchAsync(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  const { page, limit: pageLimit, skip } = getPaginationParams(req);
  
  const [appointments, total] = await Promise.all([
    (Appointment as any).find({})
      .populate('patientId', 'firstName lastName email phone')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string) || pageLimit),
    (Appointment as any).countDocuments({})
  ]);

  res.status(200).json({
    success: true,
    data: createPaginatedResponse(appointments, total, page, pageLimit),
    message: 'Overall recent appointments retrieved successfully'
  });
});

// Send appointment reminders
export const sendAppointmentReminders = catchAsync(async (req: Request, res: Response) => {
  const { date, clinicId } = req.body;
  
  const reminderDate = date ? new Date(date) : new Date();
  reminderDate.setDate(reminderDate.getDate() + 1); // Tomorrow's appointments

  const query: any = {
    date: {
      $gte: new Date(reminderDate.toDateString()),
      $lt: new Date(reminderDate.getTime() + 24 * 60 * 60 * 1000)
    },
    status: { $in: ['scheduled', 'confirmed'] }
  };

  if (clinicId) query.clinicId = clinicId;

  const appointments = await (Appointment as any).find(query)
    .populate('patientId', 'name email')
    .populate('dentistId', 'name')
    .populate('clinicId', 'name');

  let sentCount = 0;
  let failedCount = 0;

  for (const appointment of appointments) {
    try {
      const patient = appointment.patientId as any;
      const dentist = appointment.dentistId as any;
      const clinic = appointment.clinicId as any;

      await sendAppointmentReminderEmail(
        patient.email,
        patient.name,
        {
          date: new Date(appointment.date).toLocaleDateString(),
          time: appointment.timeSlot,
          dentist: dentist.name,
          clinic: clinic.name
        }
      );

      await (Notification as any).create({
        userId: appointment.patientId,
        type: 'appointment_reminder',
        title: 'Appointment Reminder',
        message: `You have an appointment scheduled for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot}`,
        appointmentId: appointment._id
      });

      sentCount++;
    } catch (error) {
      console.error(`Failed to send reminder for appointment ${appointment._id}:`, error);
      failedCount++;
    }
  }

  res.status(200).json({
    status: 'success',
    message: `Sent ${sentCount} reminders successfully. ${failedCount} failed.`,
    data: {
      totalAppointments: appointments.length,
      sentCount,
      failedCount
    }
  });
});

// Check appointment conflicts (for frontend validation)
// ==================== UNIFIED APPOINTMENT DASHBOARD ENDPOINTS ====================

// Get unified appointments for doctor across all assigned clinics
export const getDoctorUnifiedAppointments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, clinicId, patientName, status, sortBy = 'date', sortOrder = 'asc' } = req.query;
  const { page: pageNum, limit: limitNum } = getPaginationParams(req);
  
  // Build query for doctor's appointments across all assigned clinics
  const query: any = {
    dentistId: req.user._id
  };
  
  // Filter by date range
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate as string);
    if (endDate) query.date.$lte = new Date(endDate as string);
  }
  
  // Filter by specific clinic (optional)
  if (clinicId) {
    query.clinicId = clinicId;
  }
  
  // Filter by status
  if (status) {
    query.status = status;
  }
  
  // Build sort object
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  
  // Execute query with pagination
  const [appointments, total] = await Promise.all([
    (Appointment as any).find(query)
      .populate('patientId', 'firstName lastName email phone dateOfBirth')
      .populate('clinicId', 'name address phone')
      .populate('dentistId', 'firstName lastName email')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    (Appointment as any).countDocuments(query)
  ]);
  
  // Filter by patient name if provided (post-query filtering for flexibility)
  let filteredAppointments = appointments;
  if (patientName) {
    const searchTerm = (patientName as string).toLowerCase();
    filteredAppointments = appointments.filter((apt: any) => {
      const fullName = `${apt.patientId.firstName} ${apt.patientId.lastName}`.toLowerCase();
      return fullName.includes(searchTerm);
    });
  }
  
  // Group appointments by clinic for better visualization
  const appointmentsByClinic = filteredAppointments.reduce((acc: any, apt: any) => {
    const clinicName = apt.clinicId.name;
    if (!acc[clinicName]) {
      acc[clinicName] = {
        clinic: apt.clinicId,
        appointments: [],
        count: 0
      };
    }
    acc[clinicName].appointments.push(apt);
    acc[clinicName].count++;
    return acc;
  }, {});
  
  res.json({
    success: true,
    message: 'Unified appointments retrieved successfully',
    data: {
      appointments: filteredAppointments,
      appointmentsByClinic,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      stats: {
        totalAppointments: filteredAppointments.length,
        clinicsCount: Object.keys(appointmentsByClinic).length,
        todayAppointments: filteredAppointments.filter((apt: any) => 
          new Date(apt.date).toDateString() === new Date().toDateString()
        ).length
      }
    }
  });
});

// Get unified appointments for admin (all appointments across all clinics)
export const getAdminUnifiedAppointments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, clinicId, dentistId, patientName, status, sortBy = 'date', sortOrder = 'asc' } = req.query;
  const { page: pageNum, limit: limitNum } = getPaginationParams(req);
  
  // Build query
  const query: any = {};
  
  // Filter by date range
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate as string);
    if (endDate) query.date.$lte = new Date(endDate as string);
  }
  
  // Filter by clinic
  if (clinicId) {
    query.clinicId = clinicId;
  }
  
  // Filter by dentist
  if (dentistId) {
    query.dentistId = dentistId;
  }
  
  // Filter by status
  if (status) {
    query.status = status;
  }
  
  // Build sort object
  const sort: any = {};
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  
  // Execute query
  const [appointments, total] = await Promise.all([
    (Appointment as any).find(query)
      .populate('patientId', 'firstName lastName email phone dateOfBirth')
      .populate('clinicId', 'name address phone')
      .populate('dentistId', 'firstName lastName email specialization')
      .populate('createdBy', 'firstName lastName')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    (Appointment as any).countDocuments(query)
  ]);
  
  // Filter by patient name if provided
  let filteredAppointments = appointments;
  if (patientName) {
    const searchTerm = (patientName as string).toLowerCase();
    filteredAppointments = appointments.filter((apt: any) => {
      const fullName = `${apt.patientId.firstName} ${apt.patientId.lastName}`.toLowerCase();
      return fullName.includes(searchTerm);
    });
  }
  
  // Analytics data
  const stats = {
    totalAppointments: filteredAppointments.length,
    byStatus: filteredAppointments.reduce((acc: any, apt: any) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {}),
    byClinic: filteredAppointments.reduce((acc: any, apt: any) => {
      const clinicName = apt.clinicId.name;
      acc[clinicName] = (acc[clinicName] || 0) + 1;
      return acc;
    }, {}),
    todayCount: filteredAppointments.filter((apt: any) => 
      new Date(apt.date).toDateString() === new Date().toDateString()
    ).length
  };
  
  res.json({
    success: true,
    message: 'Admin unified appointments retrieved successfully',
    data: {
      appointments: filteredAppointments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      stats
    }
  });
});

// Quick update appointment (time/notes only - lightweight operation)
export const quickUpdateAppointment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { timeSlot, notes, duration } = req.body;
  
  // Validate appointment ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createValidationError('id', 'Invalid appointment ID');
  }
  
  // Find appointment
  const appointment = await (Appointment as any).findById(id);
  if (!appointment) {
    throw createNotFoundError('Appointment');
  }
  
  // Authorization: Doctors can only update their own appointments, admins can update all
  if (req.user.role !== 'admin' && appointment.dentistId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own appointments'
    });
  }
  
  // Store original values for audit
  const originalTimeSlot = appointment.timeSlot;
  const originalNotes = appointment.notes;
  
  // Update fields
  if (timeSlot) {
    // Validate time slot format
    if (!isValidTimeSlot(timeSlot)) {
      throw createValidationError('timeSlot', 'Invalid time slot format. Use HH:MM format');
    }
    appointment.timeSlot = timeSlot;
  }
  
  if (notes !== undefined) {
    appointment.notes = notes;
  }
  
  if (duration) {
    appointment.duration = duration;
  }
  
  // Add modification history
  if (!appointment.modificationHistory) {
    appointment.modificationHistory = [];
  }
  
  appointment.modificationHistory.push({
    modifiedBy: req.user._id,
    modifiedAt: new Date(),
    changes: {
      timeSlot: { from: originalTimeSlot, to: timeSlot },
      notes: { from: originalNotes, to: notes }
    }
  });
  
  appointment.lastModifiedBy = req.user._id;
  
  await appointment.save();
  
  // Populate for response
  const updatedAppointment = await (Appointment as any).findById(id)
    .populate('patientId', 'firstName lastName email phone')
    .populate('clinicId', 'name address')
    .populate('dentistId', 'firstName lastName')
    .populate('lastModifiedBy', 'firstName lastName');
  
  res.json({
    success: true,
    message: 'Appointment updated successfully',
    data: { appointment: updatedAppointment }
  });
});

// Cancel appointment with automatic notification
export const cancelAppointmentWithNotification = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { cancellationReason, notifyPatient = true } = req.body;
  
  // Validate appointment ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createValidationError('id', 'Invalid appointment ID');
  }
  
  // Find appointment
  const appointment = await (Appointment as any).findById(id)
    .populate('patientId', 'firstName lastName email phone userId')
    .populate('clinicId', 'name address phone')
    .populate('dentistId', 'firstName lastName');
  
  if (!appointment) {
    throw createNotFoundError('Appointment');
  }
  
  // Authorization check
  if (req.user.role !== 'admin' && appointment.dentistId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only cancel your own appointments'
    });
  }
  
  // Check if already cancelled
  if (appointment.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Appointment is already cancelled'
    });
  }
  
  // Update appointment
  appointment.status = 'cancelled';
  appointment.cancellationReason = cancellationReason || 'Cancelled by staff';
  appointment.lastModifiedBy = req.user._id;
  
  // Add to modification history
  if (!appointment.modificationHistory) {
    appointment.modificationHistory = [];
  }
  
  appointment.modificationHistory.push({
    modifiedBy: req.user._id,
    modifiedAt: new Date(),
    changes: {
      status: { from: appointment.status, to: 'cancelled' },
      cancellationReason: cancellationReason
    }
  });
  
  await appointment.save();
  
  // Send notifications if requested
  const notifications = {
    email: false,
    sms: false,
    inApp: false
  };
  
  if (notifyPatient) {
    const patient = appointment.patientId;
    const clinic = appointment.clinicId;
    const dentist = appointment.dentistId;
    
    // Send email notification
    if (patient.email) {
      try {
        await sendAppointmentCancellationEmail(
          patient.email,
          `${patient.firstName} ${patient.lastName}`,
          {
            date: new Date(appointment.date).toLocaleDateString(),
            time: appointment.timeSlot,
            reason: cancellationReason || 'Cancelled by clinic'
          }
        );
        notifications.email = true;
      } catch (error) {
        console.error('Failed to send cancellation email:', error);
      }
    }
    
    // Send SMS notification
    if (patient.phone) {
      try {
        await sendAppointmentCancellationSMS(
          patient.phone,
          `${patient.firstName} ${patient.lastName}`,
          {
            date: new Date(appointment.date).toLocaleDateString(),
            time: appointment.timeSlot,
            clinic: clinic.name
          }
        );
        notifications.sms = true;
      } catch (error) {
        console.error('Failed to send cancellation SMS:', error);
      }
    }
    
    // Create in-app notification
    if (patient.userId) {
      try {
        await (Notification as any).create({
          userId: patient.userId,
          type: 'appointment_cancellation',
          title: 'Appointment Cancelled',
          message: `Your appointment on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot} has been cancelled. Reason: ${cancellationReason || 'Cancelled by clinic'}`,
          link: `/appointments/${appointment._id}`,
          metadata: {
            appointmentId: appointment._id,
            clinicId: clinic._id,
            reason: cancellationReason
          }
        });
        notifications.inApp = true;
      } catch (error) {
        console.error('Failed to create in-app notification:', error);
      }
    }
    
    // Cancel any scheduled reminders
    try {
      await cancelAppointmentReminders(appointment);
    } catch (error) {
      console.error('Failed to cancel appointment reminders:', error);
    }
  }
  
  res.json({
    success: true,
    message: 'Appointment cancelled successfully',
    data: {
      appointment,
      notificationsSent: notifications
    }
  });
});

// Reschedule appointment with conflict checking
export const rescheduleAppointmentEnhanced = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newDate, newTimeSlot, newDuration = 60, reason } = req.body;
  
  // Validate appointment ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createValidationError('id', 'Invalid appointment ID');
  }
  
  // Validate required fields
  if (!newDate || !newTimeSlot) {
    throw createValidationError('newDate/newTimeSlot', 'New date and time slot are required');
  }
  
  // Find appointment
  const appointment = await (Appointment as any).findById(id)
    .populate('patientId', 'firstName lastName email phone userId')
    .populate('clinicId', 'name address phone operatingHours')
    .populate('dentistId', 'firstName lastName');
  
  if (!appointment) {
    throw createNotFoundError('Appointment');
  }
  
  // Authorization check
  if (req.user.role !== 'admin' && appointment.dentistId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only reschedule your own appointments'
    });
  }
  
  // Store original values
  const originalDate = appointment.date;
  const originalTimeSlot = appointment.timeSlot;
  
  // Validate new date is not in the past
  const appointmentDate = new Date(newDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (appointmentDate < today) {
    throw createValidationError('newDate', 'Cannot reschedule to a past date');
  }
  
  // Check for conflicts
  const conflicts = await (Appointment as any).find({
    _id: { $ne: id },
    dentistId: appointment.dentistId._id,
    clinicId: appointment.clinicId._id,
    date: appointmentDate,
    status: { $in: ['scheduled', 'confirmed'] }
  });
  
  // Check if new time slot conflicts with existing appointments
  const hasConflict = conflicts.some((existingApt: any) => {
    const [existingHour, existingMin] = existingApt.timeSlot.split(':').map(Number);
    const [newHour, newMin] = newTimeSlot.split(':').map(Number);
    
    const existingStart = existingHour * 60 + existingMin;
    const existingEnd = existingStart + existingApt.duration;
    const newStart = newHour * 60 + newMin;
    const newEnd = newStart + newDuration;
    
    return (newStart < existingEnd && newEnd > existingStart);
  });
  
  if (hasConflict) {
    throw createConflictError('The new time slot conflicts with an existing appointment');
  }
  
  // Update appointment
  appointment.date = appointmentDate;
  appointment.timeSlot = newTimeSlot;
  appointment.duration = newDuration;
  appointment.lastModifiedBy = req.user._id;
  
  // Add to modification history
  if (!appointment.modificationHistory) {
    appointment.modificationHistory = [];
  }
  
  appointment.modificationHistory.push({
    modifiedBy: req.user._id,
    modifiedAt: new Date(),
    changes: {
      date: { from: originalDate, to: newDate },
      timeSlot: { from: originalTimeSlot, to: newTimeSlot },
      reason: reason || 'Rescheduled'
    }
  });
  
  await appointment.save();
  
  // Send notification to patient
  const patient = appointment.patientId;
  const clinic = appointment.clinicId;
  const dentist = appointment.dentistId;
  
  const notifications = {
    email: false,
    sms: false,
    inApp: false
  };
  
  // Email notification
  if (patient.email) {
    try {
      await sendAppointmentConfirmationEmail(
        patient.email,
        `${patient.firstName} ${patient.lastName}`,
        {
          date: appointmentDate.toLocaleDateString(),
          time: newTimeSlot,
          dentist: `Dr. ${dentist.firstName} ${dentist.lastName}`,
          clinic: clinic.name,
          service: appointment.serviceType
        }
      );
      notifications.email = true;
    } catch (error) {
      console.error('Failed to send rescheduling email:', error);
    }
  }
  
  // In-app notification
  if (patient.userId) {
    try {
      await (Notification as any).create({
        userId: patient.userId,
        type: 'appointment_confirmation',
        title: 'Appointment Rescheduled',
        message: `Your appointment has been rescheduled to ${appointmentDate.toLocaleDateString()} at ${newTimeSlot}`,
        link: `/appointments/${appointment._id}`,
        metadata: {
          appointmentId: appointment._id,
          clinicId: clinic._id,
          oldDate: originalDate,
          newDate: appointmentDate
        }
      });
      notifications.inApp = true;
    } catch (error) {
      console.error('Failed to create in-app notification:', error);
    }
  }
  
  // Reschedule reminders
  try {
    await cancelAppointmentReminders(appointment);
    await scheduleAppointmentReminders(appointment, patient, dentist, clinic);
  } catch (error) {
    console.error('Failed to reschedule appointment reminders:', error);
  }
  
  res.json({
    success: true,
    message: 'Appointment rescheduled successfully',
    data: {
      appointment,
      notificationsSent: notifications
    }
  });
});

// ==================== END UNIFIED DASHBOARD ENDPOINTS ====================

export const checkAppointmentConflicts = catchAsync(async (req: Request, res: Response) => {
  const { date, timeSlot, dentistId, clinicId, excludeAppointmentId, duration = 60 } = req.query;

  // Validate required parameters
  if (!date || !timeSlot || !clinicId) {
    return res.status(400).json({
      success: false,
      message: 'Date, timeSlot, and clinicId are required'
    });
  }

  try {
    const appointmentDate = new Date(date as string);
    let effectiveDentistId = dentistId as string;

    // If no dentistId provided, check for conflicts across all dentists in the clinic
    if (!effectiveDentistId) {
      // First validate the clinic exists
      const clinic = await (Clinic as any).findById(clinicId);
      if (!clinic) {
        return res.status(404).json({
          success: false,
          message: 'Clinic not found'
        });
      }

      const dentists = await User.find({ 
        role: 'dentist', 
        isActive: true,  // Use isActive instead of status
        assignedClinics: { $in: [clinicId] }
      });
      
      if (dentists.length === 0) {
        // No dentists in clinic - this indicates a configuration issue
        console.warn(`⚠️ No dentists assigned to clinic ${clinicId} during conflict check`);
        return res.status(200).json({
          success: true,
          hasConflict: false,
          conflicts: [],
          message: `No dentists are assigned to clinic "${clinic.name}". Please contact administration to assign dentists.`,
          error: 'NO_DENTISTS_ASSIGNED',
          clinicInfo: {
            id: clinic._id,
            name: clinic.name
          }
        });
      }
      
      // Check conflicts for all dentists and return the most relevant ones
      const allConflicts = await Promise.all(
        dentists.map(dentist =>
          (Appointment as any).findConflicts(
            dentist._id.toString(),
            appointmentDate,
            timeSlot as string,
            parseInt(duration as string) || 60,
            excludeAppointmentId as string
          )
        )
      );
      
      const conflicts = allConflicts.flat();
      
      return res.status(200).json({
        success: true,
        hasConflict: conflicts.length > 0,
        conflicts: conflicts.map(conflict => ({
          id: conflict._id,
          patientName: conflict.patientId && typeof conflict.patientId === 'object' && 'firstName' in conflict.patientId
            ? `${(conflict.patientId as any).firstName} ${(conflict.patientId as any).lastName}`
            : 'Unknown Patient',
          timeSlot: conflict.timeSlot,
          date: conflict.date,
          duration: conflict.duration
        })),
        message: conflicts.length > 0 ? 'Conflicts found across all dentists' : 'No conflicts found'
      });
    }

    // Check for conflicts with the specific dentist
    const conflicts = await (Appointment as any).findConflicts(
      effectiveDentistId,
      appointmentDate,
      timeSlot as string,
      parseInt(duration as string) || 60,
      excludeAppointmentId as string
    );

    // Populate patient data for conflicts
    const populatedConflicts = await (Appointment as any).populate(conflicts, [
      { path: 'patientId', select: 'firstName lastName' }
    ]);

    return res.status(200).json({
      success: true,
      hasConflict: conflicts.length > 0,
      conflicts: populatedConflicts.map(conflict => ({
        id: conflict._id,
        patientName: conflict.patientId && typeof conflict.patientId === 'object' && 'firstName' in conflict.patientId
          ? `${(conflict.patientId as any).firstName} ${(conflict.patientId as any).lastName}`
          : 'Unknown Patient',
        timeSlot: conflict.timeSlot,
        date: conflict.date,
        duration: conflict.duration
      }))
    });
  } catch (error: any) {
    console.error('Error checking appointment conflicts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check appointment conflicts',
      error: error.message
    });
  }
});

// @desc    Get booked time slots for a specific date and clinic/doctor
// @route   GET /api/v1/appointments/booked-slots
// @access  Public (to allow patients to see availability)
export const getBookedSlots = catchAsync(async (req: Request, res: Response) => {
  const { date, clinicId, doctorId } = req.query;

  // Validate required parameters
  if (!date || !clinicId) {
    throw createValidationError('date/clinicId', 'Date and clinic ID are required');
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date as string)) {
    throw createValidationError('date', 'Date must be in YYYY-MM-DD format');
  }

  // Validate clinic ID
  if (!mongoose.Types.ObjectId.isValid(clinicId as string)) {
    throw createValidationError('clinicId', 'Invalid clinic ID');
  }

  // Build query
  const query: any = {
    clinicId,
    date: new Date(date as string),
    status: { $in: ['scheduled', 'confirmed'] } // Only count scheduled/confirmed appointments
  };

  // Optionally filter by doctor
  if (doctorId) {
    if (!mongoose.Types.ObjectId.isValid(doctorId as string)) {
      throw createValidationError('doctorId', 'Invalid doctor ID');
    }
    query.dentistId = doctorId;
  }

  // Find all booked appointments for this date/clinic/doctor
  const bookedAppointments = await Appointment.find(query)
    .select('timeSlot duration')
    .lean();

  // Extract booked time slots (just the start times)
  const bookedSlots = bookedAppointments.map(apt => apt.timeSlot);

  // Return unique booked slots
  const uniqueBookedSlots = [...new Set(bookedSlots)];

  res.status(200).json({
    success: true,
    data: {
      date: date as string,
      clinicId: clinicId as string,
      doctorId: doctorId as string || null,
      bookedSlots: uniqueBookedSlots,
      count: uniqueBookedSlots.length
    }
  });
});
