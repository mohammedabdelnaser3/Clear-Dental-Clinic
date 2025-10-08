import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import DoctorSchedule from '../models/DoctorSchedule';
import { Clinic, User, Appointment } from '../models';
import { AppError } from '../middleware/errorHandler';
import { getDay } from 'date-fns';

/**
 * Validates that the appointment time falls within doctor's schedule for the selected branch
 */
export const validateDoctorSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dentistId, clinicId, date, timeSlot, duration = 30 } = req.body;

    // If no dentist is specified, skip this validation (appointment can be created without a specific dentist)
    if (!dentistId) {
      return next();
    }

    // Convert date to day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const appointmentDate = new Date(date);
    const dayOfWeek = getDay(appointmentDate);

    // Find doctor's schedule for this day and clinic
    const schedules = await DoctorSchedule.findByDoctorAndDay(
      dentistId,
      dayOfWeek,
      clinicId
    );

    if (!schedules || schedules.length === 0) {
      throw new AppError(
        `Doctor is not scheduled to work at this clinic on ${appointmentDate.toLocaleDateString('en-US', { weekday: 'long' })}`,
        400
      );
    }

    // Check if the time slot falls within any of the doctor's schedules
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const appointmentTimeInMinutes = hours * 60 + minutes;
    const appointmentEndTimeInMinutes = appointmentTimeInMinutes + duration;

    let isWithinSchedule = false;

    for (const schedule of schedules) {
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

      const scheduleStartInMinutes = startHour * 60 + startMinute;
      const scheduleEndInMinutes = endHour * 60 + endMinute;

      // Check if appointment falls within this schedule
      if (
        appointmentTimeInMinutes >= scheduleStartInMinutes &&
        appointmentEndTimeInMinutes <= scheduleEndInMinutes
      ) {
        isWithinSchedule = true;
        break;
      }
    }

    if (!isWithinSchedule) {
      const scheduleInfo = schedules
        .map(s => `${s.startTime} - ${s.endTime}`)
        .join(', ');
      throw new AppError(
        `The selected time slot is outside the doctor's working hours for this day. Available hours: ${scheduleInfo}`,
        400
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that the appointment time falls within clinic operating hours
 */
export const validateClinicOperatingHours = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clinicId, date, timeSlot, duration = 30 } = req.body;

    // Find clinic
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      throw new AppError('Clinic not found', 404);
    }

    // Check if clinic has operating hours defined
    if (!clinic.operatingHours || clinic.operatingHours.length === 0) {
      // If no operating hours defined, allow the appointment
      return next();
    }

    // Get day of week
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Find operating hours for this day
    const daySchedule = clinic.operatingHours.find(
      oh => oh.day.toLowerCase() === dayOfWeek
    );

    if (!daySchedule || daySchedule.closed) {
      throw new AppError(
        `The clinic is closed on ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}`,
        400
      );
    }

    // Check if appointment falls within operating hours
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const appointmentTimeInMinutes = hours * 60 + minutes;
    const appointmentEndTimeInMinutes = appointmentTimeInMinutes + duration;

    const [openHour, openMinute] = daySchedule.open.split(':').map(Number);
    const [closeHour, closeMinute] = daySchedule.close.split(':').map(Number);

    const openTimeInMinutes = openHour * 60 + openMinute;
    const closeTimeInMinutes = closeHour * 60 + closeMinute;

    if (
      appointmentTimeInMinutes < openTimeInMinutes ||
      appointmentEndTimeInMinutes > closeTimeInMinutes
    ) {
      throw new AppError(
        `The selected time slot is outside clinic operating hours (${daySchedule.open} - ${daySchedule.close})`,
        400
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that there are no scheduling conflicts with existing appointments
 */
export const validateAppointmentConflicts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dentistId, date, timeSlot, duration = 30 } = req.body;
    const appointmentId = req.params.id; // For updates

    // If no dentist specified, skip conflict check
    if (!dentistId) {
      return next();
    }

    // Check for conflicts using the Appointment model's static method
    const conflicts = await Appointment.findConflicts(
      dentistId,
      new Date(date),
      timeSlot,
      duration,
      appointmentId
    );

    if (conflicts.length > 0) {
      throw new AppError(
        'This time slot conflicts with an existing appointment',
        409
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates that the doctor is assigned to the selected clinic
 */
export const validateDoctorClinicAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dentistId, clinicId } = req.body;

    // If no dentist specified, skip this check
    if (!dentistId) {
      return next();
    }

    // Find doctor
    const doctor = await User.findById(dentistId).populate('assignedClinics');
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if doctor is assigned to this clinic
    const isAssigned = doctor.assignedClinics?.some(
      (clinic: any) => clinic._id.toString() === clinicId
    );

    if (!isAssigned) {
      throw new AppError(
        'The selected doctor is not assigned to this clinic',
        400
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Combined validation middleware for multi-branch appointments
 * Runs all validations in sequence
 */
export const validateMultiBranchAppointment = [
  validateClinicOperatingHours,
  validateDoctorClinicAssignment,
  validateDoctorSchedule,
  validateAppointmentConflicts
];

