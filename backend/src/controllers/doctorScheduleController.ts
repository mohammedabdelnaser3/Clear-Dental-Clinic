import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import DoctorSchedule from '../models/DoctorSchedule';
import { User, Clinic } from '../models';
import { AppError, catchAsync } from '../middleware/errorHandler';

// @desc    Get all doctor schedules with optional filters
// @route   GET /api/v1/schedules
// @access  Private
export const getAllSchedules = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { doctorId, clinicId, dayOfWeek, isActive } = req.query;
  
  const query: any = {};
  
  if (doctorId) query.doctorId = doctorId;
  if (clinicId) query.clinicId = clinicId;
  if (dayOfWeek !== undefined) query.dayOfWeek = parseInt(dayOfWeek as string);
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const schedules = await DoctorSchedule.find(query)
    .populate('doctorId', 'firstName lastName email specialization')
    .populate('clinicId', 'name branchName address phone')
    .sort({ dayOfWeek: 1, startTime: 1 });
  
  return res.status(200).json({
    success: true,
    count: schedules.length,
    data: schedules
  });
});

// @desc    Get schedule by ID
// @route   GET /api/v1/schedules/:id
// @access  Private
export const getScheduleById = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const schedule = await DoctorSchedule.findById(req.params.id)
    .populate('doctorId', 'firstName lastName email specialization')
    .populate('clinicId', 'name branchName address');
  
  if (!schedule) {
    return next(new AppError('Schedule not found', 404));
  }
  
  return res.status(200).json({
    success: true,
    data: schedule
  });
});

// @desc    Get schedules by doctor ID
// @route   GET /api/v1/schedules/doctor/:doctorId
// @access  Private
export const getSchedulesByDoctor = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { isActive } = req.query;
  const activeFilter = isActive !== undefined ? isActive === 'true' : true;
  
  const schedules = await DoctorSchedule.findByDoctor(req.params.doctorId, activeFilter);
  
  return res.status(200).json({
    success: true,
    count: schedules.length,
    data: schedules
  });
});

// @desc    Get schedules by clinic ID
// @route   GET /api/v1/schedules/clinic/:clinicId
// @access  Private
export const getSchedulesByClinic = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { isActive } = req.query;
  const activeFilter = isActive !== undefined ? isActive === 'true' : true;
  
  const schedules = await DoctorSchedule.findByClinic(req.params.clinicId, activeFilter);
  
  return res.status(200).json({
    success: true,
    count: schedules.length,
    data: schedules
  });
});

// @desc    Get available doctors for a specific day at a clinic
// @route   GET /api/v1/schedules/available
// @access  Private
export const getAvailableDoctors = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { clinicId, dayOfWeek, date } = req.query;
  
  if (!clinicId) {
    return next(new AppError('Clinic ID is required', 400));
  }
  
  let day: number;
  
  if (date) {
    // Calculate day of week from date
    day = new Date(date as string).getDay();
  } else if (dayOfWeek !== undefined) {
    day = parseInt(dayOfWeek as string);
  } else {
    return next(new AppError('Either date or dayOfWeek is required', 400));
  }
  
  if (day < 0 || day > 6) {
    return next(new AppError('Invalid day of week (must be 0-6)', 400));
  }
  
  const schedules = await DoctorSchedule.getAvailableDoctorsForDay(clinicId as string, day);
  
  // Group by doctor to avoid duplicates
  const doctorMap = new Map();
  schedules.forEach(schedule => {
    const doctorId = schedule.doctorId._id.toString();
    if (!doctorMap.has(doctorId)) {
      doctorMap.set(doctorId, {
        doctor: schedule.doctorId,
        clinic: schedule.clinicId,
        schedules: []
      });
    }
    doctorMap.get(doctorId).schedules.push({
      id: schedule._id,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      dayOfWeek: schedule.dayOfWeek,
      notes: schedule.notes
    });
  });
  
  const availableDoctors = Array.from(doctorMap.values());
  
  return res.status(200).json({
    success: true,
    count: availableDoctors.length,
    data: availableDoctors
  });
});

// @desc    Create new schedule
// @route   POST /api/v1/schedules
// @access  Private (Admin only)
export const createSchedule = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { doctorId, clinicId, dayOfWeek, startTime, endTime, notes, effectiveFrom, effectiveUntil } = req.body;
  
  // Verify doctor exists and is a dentist
  const doctor = await User.findById(doctorId);
  if (!doctor) {
    return next(new AppError('Doctor not found', 404));
  }
  if (doctor.role !== 'dentist' && doctor.role !== 'super_admin') {
    return next(new AppError('User is not a dentist', 400));
  }
  
  // Verify clinic exists
  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    return next(new AppError('Clinic not found', 404));
  }
  
  // Check for conflicting schedules for same doctor/clinic/day
  const existingSchedules = await DoctorSchedule.find({
    doctorId,
    clinicId,
    dayOfWeek,
    isActive: true
  });
  
  // Check for time overlaps
  const [newStartHour, newStartMin] = startTime.split(':').map(Number);
  const [newEndHour, newEndMin] = endTime.split(':').map(Number);
  const newStartMinutes = newStartHour * 60 + newStartMin;
  const newEndMinutes = newEndHour * 60 + newEndMin;
  
  for (const existing of existingSchedules) {
    const [existStartHour, existStartMin] = existing.startTime.split(':').map(Number);
    const [existEndHour, existEndMin] = existing.endTime.split(':').map(Number);
    const existStartMinutes = existStartHour * 60 + existStartMin;
    const existEndMinutes = existEndHour * 60 + existEndMin;
    
    // Check for overlap
    if (
      (newStartMinutes >= existStartMinutes && newStartMinutes < existEndMinutes) ||
      (newEndMinutes > existStartMinutes && newEndMinutes <= existEndMinutes) ||
      (newStartMinutes <= existStartMinutes && newEndMinutes >= existEndMinutes)
    ) {
      return next(new AppError(
        `Schedule conflicts with existing schedule from ${existing.startTime} to ${existing.endTime}`,
        409
      ));
    }
  }
  
  const schedule = await DoctorSchedule.create({
    doctorId,
    clinicId,
    dayOfWeek,
    startTime,
    endTime,
    notes,
    effectiveFrom,
    effectiveUntil,
    isActive: true
  });
  
  const populatedSchedule = await DoctorSchedule.findById(schedule._id)
    .populate('doctorId', 'firstName lastName email')
    .populate('clinicId', 'name branchName');
  
  return res.status(201).json({
    success: true,
    data: populatedSchedule,
    message: 'Doctor schedule created successfully'
  });
});

// @desc    Update schedule
// @route   PUT /api/v1/schedules/:id
// @access  Private (Admin only)
export const updateSchedule = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let schedule = await DoctorSchedule.findById(req.params.id);
  
  if (!schedule) {
    return next(new AppError('Schedule not found', 404));
  }
  
  // If updating time, check for conflicts
  if (req.body.startTime || req.body.endTime) {
    const startTime = req.body.startTime || schedule.startTime;
    const endTime = req.body.endTime || schedule.endTime;
    
    const [newStartHour, newStartMin] = startTime.split(':').map(Number);
    const [newEndHour, newEndMin] = endTime.split(':').map(Number);
    const newStartMinutes = newStartHour * 60 + newStartMin;
    const newEndMinutes = newEndHour * 60 + newEndMin;
    
    // Find conflicting schedules (excluding current schedule)
    const conflictingSchedules = await DoctorSchedule.find({
      _id: { $ne: schedule._id },
      doctorId: schedule.doctorId,
      clinicId: schedule.clinicId,
      dayOfWeek: schedule.dayOfWeek,
      isActive: true
    });
    
    for (const existing of conflictingSchedules) {
      const [existStartHour, existStartMin] = existing.startTime.split(':').map(Number);
      const [existEndHour, existEndMin] = existing.endTime.split(':').map(Number);
      const existStartMinutes = existStartHour * 60 + existStartMin;
      const existEndMinutes = existEndHour * 60 + existEndMin;
      
      if (
        (newStartMinutes >= existStartMinutes && newStartMinutes < existEndMinutes) ||
        (newEndMinutes > existStartMinutes && newEndMinutes <= existEndMinutes) ||
        (newStartMinutes <= existStartMinutes && newEndMinutes >= existEndMinutes)
      ) {
        return next(new AppError(
          `Updated schedule would conflict with existing schedule from ${existing.startTime} to ${existing.endTime}`,
          409
        ));
      }
    }
  }
  
  schedule = await DoctorSchedule.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('doctorId', 'firstName lastName email')
   .populate('clinicId', 'name branchName');
  
  return res.status(200).json({
    success: true,
    data: schedule,
    message: 'Schedule updated successfully'
  });
});

// @desc    Delete schedule (soft delete - set isActive to false)
// @route   DELETE /api/v1/schedules/:id
// @access  Private (Admin only)
export const deleteSchedule = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const schedule = await DoctorSchedule.findById(req.params.id);
  
  if (!schedule) {
    return next(new AppError('Schedule not found', 404));
  }
  
  // Soft delete
  schedule.isActive = false;
  await schedule.save();
  
  return res.status(200).json({
    success: true,
    data: {},
    message: 'Schedule deleted successfully'
  });
});

// @desc    Bulk create schedules
// @route   POST /api/v1/schedules/bulk
// @access  Private (Admin only)
export const bulkCreateSchedules = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { schedules } = req.body;
  
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return next(new AppError('Schedules array is required and cannot be empty', 400));
  }
  
  const createdSchedules = [];
  const errors = [];
  
  for (let i = 0; i < schedules.length; i++) {
    try {
      const schedule = await DoctorSchedule.create(schedules[i]);
      createdSchedules.push(schedule);
    } catch (error: any) {
      errors.push({
        index: i,
        schedule: schedules[i],
        error: error.message
      });
    }
  }
  
  return res.status(201).json({
    success: true,
    data: {
      created: createdSchedules.length,
      failed: errors.length,
      schedules: createdSchedules,
      errors
    },
    message: `${createdSchedules.length} schedules created successfully, ${errors.length} failed`
  });
});

