import { Request, Response } from 'express';
import { Appointment, Patient, Notification } from '../models';
import { AuthenticatedRequest } from '../types';
import {
  getPaginationParams,
  createPaginatedResponse
} from '../utils/helpers';
import {
  catchAsync,
  createNotFoundError,
  createValidationError,
  createConflictError
} from '../middleware/errorHandler';
import { createAndSendNotification } from '../utils/notificationHelpers';

// Get patient's appointments
export const getPatientAppointments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;
  const { page, limit, skip } = getPaginationParams(req);
  const { status, startDate, endDate } = req.query;

  // Verify patient exists and user has access
  const patient = await (Patient as any).findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Check if user is the patient or has access
  if (req.user.role === 'patient' && req.user._id.toString() !== patient.userId?.toString()) {
    throw createValidationError('authorization', 'Access denied');
  }

  const query: any = { patientId };
  
  if (status) {
    query.status = status;
  }
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate as string);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate as string);
    }
  }

  const [appointments, total] = await Promise.all([
    (Appointment as any).find(query)
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address phone')
      .sort({ date: -1, timeSlot: 1 })
      .skip(skip)
      .limit(limit),
    (Appointment as any).countDocuments(query)
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(appointments, total, page, limit)
  });
});

// Modify appointment (reschedule)
export const modifyAppointment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { appointmentId } = req.params;
  const { date, timeSlot, notes, reason } = req.body;

  const appointment = await (Appointment as any).findById(appointmentId)
    .populate('patientId', 'firstName lastName userId')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name');

  if (!appointment) {
    throw createNotFoundError('Appointment');
  }

  // Check if user is the patient or has access
  if (req.user.role === 'patient' && req.user._id.toString() !== appointment.patientId.userId?.toString()) {
    throw createValidationError('authorization', 'Access denied');
  }

  // Check if appointment can be modified
  if (!['scheduled', 'confirmed'].includes(appointment.status)) {
    throw createValidationError('appointment', 'Only scheduled or confirmed appointments can be modified');
  }

  // Check if appointment is not too close (e.g., not within 2 hours)
  const now = new Date();
  const appointmentDateTime = new Date(appointment.date);
  const [hours, minutes] = appointment.timeSlot.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes);

  const timeDifference = appointmentDateTime.getTime() - now.getTime();
  const hoursUntilAppointment = timeDifference / (1000 * 60 * 60);

  if (hoursUntilAppointment < 2) {
    throw createValidationError('appointment', 'Cannot modify appointment less than 2 hours before scheduled time');
  }

  // If rescheduling, check for conflicts
  if (date && timeSlot) {
    const newDate = new Date(date);
    const conflictQuery: any = {
      dentistId: appointment.dentistId,
      date: newDate,
      timeSlot: timeSlot,
      status: { $in: ['scheduled', 'confirmed'] },
      _id: { $ne: appointmentId }
    };

    const existingAppointment = await (Appointment as any).findOne(conflictQuery);
    if (existingAppointment) {
      throw createConflictError('Time slot is already booked');
    }
  }

  // Store original details for notification
  const originalDate = appointment.date;
  const originalTimeSlot = appointment.timeSlot;

  // Update appointment
  if (date) appointment.date = new Date(date);
  if (timeSlot) appointment.timeSlot = timeSlot;
  if (notes) appointment.notes = notes;
  
  appointment.status = 'scheduled'; // Reset to scheduled for confirmation
  appointment.updatedAt = new Date();

  await appointment.save();

  // Send notification to dentist about the change
  if (appointment.dentistId) {
    await createAndSendNotification({
      userId: appointment.dentistId._id.toString(),
      title: 'Appointment Modified',
      message: `${appointment.patientId.firstName} ${appointment.patientId.lastName} has modified their appointment from ${originalDate.toDateString()} ${originalTimeSlot} to ${appointment.date.toDateString()} ${appointment.timeSlot}`,
      type: 'general',
      link: `/appointments/${appointment._id}`,
      metadata: {
        appointmentId: appointment._id,
        patientId: appointment.patientId._id,
        originalDate: originalDate,
        originalTime: originalTimeSlot,
        newDate: appointment.date,
        newTime: appointment.timeSlot,
        reason: reason || 'Patient requested change'
      }
    });
  }

  // Send confirmation to patient
  await createAndSendNotification({
    userId: appointment.patientId.userId.toString(),
    title: 'Appointment Modified',
    message: `Your appointment has been rescheduled to ${appointment.date.toDateString()} at ${appointment.timeSlot}`,
    type: 'general',
    link: `/appointments/${appointment._id}`,
    metadata: {
      appointmentId: appointment._id,
      clinicName: appointment.clinicId.name,
      newDate: appointment.date,
      newTime: appointment.timeSlot
    }
  });

  res.json({
    success: true,
    message: 'Appointment modified successfully',
    data: { appointment }
  });
});

// Cancel appointment
export const cancelAppointment = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { appointmentId } = req.params;
  const { reason, cancelledBy = 'patient' } = req.body;

  const appointment = await (Appointment as any).findById(appointmentId)
    .populate('patientId', 'firstName lastName userId')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name phone');

  if (!appointment) {
    throw createNotFoundError('Appointment');
  }

  // Check if user is the patient or has access
  if (req.user.role === 'patient' && req.user._id.toString() !== appointment.patientId.userId?.toString()) {
    throw createValidationError('authorization', 'Access denied');
  }

  // Check if appointment can be cancelled
  if (!['scheduled', 'confirmed'].includes(appointment.status)) {
    throw createValidationError('appointment', 'Only scheduled or confirmed appointments can be cancelled');
  }

  // Update appointment status
  appointment.status = 'cancelled';
  appointment.cancellationReason = reason || 'Patient requested cancellation';
  appointment.cancelledBy = cancelledBy;
  appointment.cancelledAt = new Date();

  await appointment.save();

  // Send notification to dentist
  if (appointment.dentistId) {
    await createAndSendNotification({
      userId: appointment.dentistId._id.toString(),
      title: 'Appointment Cancelled',
      message: `${appointment.patientId.firstName} ${appointment.patientId.lastName} has cancelled their appointment on ${appointment.date.toDateString()} at ${appointment.timeSlot}`,
      type: 'appointment_cancellation',
      link: `/appointments/${appointment._id}`,
      metadata: {
        appointmentId: appointment._id,
        patientName: `${appointment.patientId.firstName} ${appointment.patientId.lastName}`,
        date: appointment.date,
        time: appointment.timeSlot,
        reason: appointment.cancellationReason
      }
    });
  }

  // Send confirmation to patient
  await createAndSendNotification({
    userId: appointment.patientId.userId.toString(),
    title: 'Appointment Cancelled',
    message: `Your appointment on ${appointment.date.toDateString()} at ${appointment.timeSlot} has been cancelled`,
    type: 'appointment_cancellation',
    link: `/appointments`,
    metadata: {
      appointmentId: appointment._id,
      clinicName: appointment.clinicId.name,
      date: appointment.date,
      time: appointment.timeSlot,
      reason: appointment.cancellationReason
    }
  });

  res.json({
    success: true,
    message: 'Appointment cancelled successfully',
    data: { appointment }
  });
});

// Get upcoming appointments for patient
export const getUpcomingAppointments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { patientId } = req.params;
  const { limit = 5 } = req.query;

  // Verify patient exists and user has access
  const patient = await (Patient as any).findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  if (req.user.role === 'patient' && req.user._id.toString() !== patient.userId?.toString()) {
    throw createValidationError('authorization', 'Access denied');
  }

  const now = new Date();
  const appointments = await (Appointment as any).find({
    patientId,
    date: { $gte: now },
    status: { $in: ['scheduled', 'confirmed'] }
  })
    .populate('dentistId', 'firstName lastName specialization')
    .populate('clinicId', 'name address phone')
    .sort({ date: 1, timeSlot: 1 })
    .limit(Number(limit));

  res.json({
    success: true,
    data: { appointments }
  });
});

// Request appointment reminder
export const requestAppointmentReminder = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { appointmentId } = req.params;
  const { reminderTime, channels } = req.body; // reminderTime in hours before appointment

  const appointment = await (Appointment as any).findById(appointmentId)
    .populate('patientId', 'firstName lastName userId');

  if (!appointment) {
    throw createNotFoundError('Appointment');
  }

  // Check if user is the patient
  if (req.user.role === 'patient' && req.user._id.toString() !== appointment.patientId.userId?.toString()) {
    throw createValidationError('authorization', 'Access denied');
  }

  // Update reminder preferences
  if (reminderTime) {
    if (!appointment.notificationPreferences.reminderTimes.includes(reminderTime)) {
      appointment.notificationPreferences.reminderTimes.push(reminderTime);
    }
  }

  if (channels) {
    if (channels.email !== undefined) appointment.notificationPreferences.channels.email = channels.email;
    if (channels.sms !== undefined) appointment.notificationPreferences.channels.sms = channels.sms;
    if (channels.inApp !== undefined) appointment.notificationPreferences.channels.inApp = channels.inApp;
  }

  await appointment.save();

  res.json({
    success: true,
    message: 'Reminder preferences updated successfully',
    data: { 
      reminderTimes: appointment.notificationPreferences.reminderTimes,
      channels: appointment.notificationPreferences.channels
    }
  });
});