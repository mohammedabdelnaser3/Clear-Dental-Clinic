import { Request, Response } from 'express';
import { Appointment, Patient, User, Clinic, Notification } from '../models';
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
    dentistId,
    clinicId,
    serviceType,
    date,
    timeSlot,
    duration = 60,
    notes,
    emergency = false
  } = req.body;

  // Required fields validation
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
  if (!emergency && appointmentDate <= now) {
    throw createValidationError('date', 'Appointment date must be in the future');
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
    [patient, dentist, clinic] = await Promise.all([
      Patient.findById(patientId).exec(),
      dentistId ? User.findById(dentistId).exec() : null,
      clinicId ? Clinic.findById(clinicId).exec() : null
    ]);

    if (!patient) {
      throw createNotFoundError('Patient not found');
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

    // Check for conflicts with more detailed error message
    const conflicts = await Appointment.findConflicts(dentistId, appointmentDate, timeSlot, duration);
    if (conflicts.length > 0) {
      throw createConflictError(
        `Time slot ${timeSlot} on ${formatDate(appointmentDate)} is already booked. Please select another time.`
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error during entity validation:', error);
    throw createValidationError('general', 'Failed to validate appointment data');
  }

  // Create and save appointment with enhanced status handling for emergency appointments
  const appointment = await Appointment.create({
    patientId,
    dentistId,
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
  });

  // Populate related data with more comprehensive information
  await appointment.populate([
    { path: 'patientId', select: 'firstName lastName email phone dateOfBirth gender' },
    { path: 'dentistId', select: 'firstName lastName email specialization phone' },
    { path: 'clinicId', select: 'name address phone email operatingHours' }
  ]);

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
            dentist: dentist ? (dentist.fullName || `${dentist.firstName} ${dentist.lastName}`) : 'Assigned dentist',
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
            dentist: dentist ? (dentist.fullName || `${dentist.firstName} ${dentist.lastName}`) : 'Assigned dentist',
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
      const notificationPromise = Notification.create({
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
      const staffNotificationPromise = Notification.create({
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
    Appointment.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address phone')
      .sort({ date: -1, 'timeSlot.start': 1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(query)
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
  const appointment = await Appointment.findById(req.params.id)
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

  const appointment = await Appointment.findById(id)
    .populate('patientId', 'firstName lastName email')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name');

  if (!appointment) {
    throw createNotFoundError('Appointment');
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    throw createValidationError('status', 'Cannot modify completed or cancelled appointments');
  }

  // Handle date/time changes
  if (date || timeSlot) {
    await validateAndUpdateDateTime(appointment, date, timeSlot);
  }

  // Update other fields
  Object.assign(appointment, {
    ...(duration && { duration }),
    ...(serviceType && { serviceType }),
    ...(notes && { notes }),
    ...(status && { status })
  });

  await appointment.save();

  res.json({
    success: true,
    message: 'Appointment updated successfully',
    data: { appointment }
  });
});

// Helper function to validate and update date/time
async function validateAndUpdateDateTime(appointment: any, date: string, timeSlot: string) {
  if (date || timeSlot) {
    const newDate = date ? new Date(date) : appointment.date;
    const newTimeSlot = timeSlot || appointment.timeSlot;

    if (newDate <= new Date()) {
      throw createValidationError('date', 'Appointment date must be in the future');
    }

    const conflicts = await Appointment.find({
      dentistId: appointment.dentistId,
      date: {
        $gte: new Date(newDate.setHours(0, 0, 0, 0)),
        $lte: new Date(newDate.setHours(23, 59, 59, 999))
      },
      'timeSlot.start': newTimeSlot.start,
      _id: { $ne: appointment._id },
      status: { $ne: 'cancelled' }
    });

    if (conflicts.length > 0) {
      throw createConflictError('Time slot is already booked');
    }

    appointment.date = newDate;
    appointment.timeSlot = newTimeSlot;
  }
}

// Cancel appointment
export const cancelAppointment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const appointment = await Appointment.findById(id)
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
      Notification.create({
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
    Appointment.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address phone')
      .sort({ 'timeSlot.start': 1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(appointments, total, page, limit)
  });
});

// Send appointment reminder
export const sendAppointmentReminder = catchAsync(async (req: Request, res: Response) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findById(appointmentId)
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
    await Notification.create({
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

  const appointment = await Appointment.findById(id);
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

  const appointment = await Appointment.findById(id)
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
  if (appointmentDate <= new Date()) {
    return res.status(400).json({
      status: 'error',
      message: 'New appointment date must be in the future'
    });
  }

  // Check for conflicts
  const conflicts = await Appointment.findConflicts(
    appointment.dentistId.toString(),
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

// Get available time slots
export const getAvailableTimeSlots = catchAsync(async (req: Request, res: Response) => {
  const { date, dentistId, duration = 60 } = req.query;

  if (!date || !dentistId) {
    return res.status(400).json({
      status: 'error',
      message: 'Date and dentistId are required'
    });
  }

  const searchDate = new Date(date as string);
  if (searchDate <= new Date()) {
    return res.status(400).json({
      status: 'error',
      message: 'Date must be in the future'
    });
  }

  const availableSlots = await Appointment.getAvailableTimeSlots(
    dentistId as string,
    searchDate,
    parseInt(duration as string)
  );

  return res.status(200).json({
    status: 'success',
    data: { availableSlots }
  });
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
    Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('dentistId', 'name specialization')
      .populate('clinicId', 'name address')
      .sort({ date: 1, timeSlot: 1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(query)
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
    Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('dentistId', 'name specialization')
      .populate('clinicId', 'name address')
      .sort({ date: 1, timeSlot: 1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(query)
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

  const statistics = await Appointment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalAppointments = await Appointment.countDocuments(matchQuery);
  
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
    Appointment.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string) || pageLimit),
    Appointment.countDocuments(query)
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
    Appointment.find({})
      .populate('patientId', 'firstName lastName email phone')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string) || pageLimit),
    Appointment.countDocuments({})
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

  const appointments = await Appointment.find(query)
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

      await Notification.create({
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
