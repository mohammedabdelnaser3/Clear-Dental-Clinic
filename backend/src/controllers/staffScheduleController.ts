import { Request, Response } from 'express';
import { StaffSchedule, User, Clinic, Notification } from '../models';
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

// Create a new staff schedule
export const createStaffSchedule = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const {
    staffId,
    clinicId,
    date,
    startTime,
    endTime,
    shiftType,
    notes,
    isRecurring,
    recurringPattern
  } = req.body;

  // Verify staff member exists and is assigned to the clinic
  const staff = await User.findById(staffId);
  if (!staff || !staff.assignedClinics.includes(clinicId)) {
    throw createValidationError('staffId', 'Staff member not found or not assigned to this clinic');
  }

  // Verify clinic exists
  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  // Check for scheduling conflicts using the new method
  const conflicts = await StaffSchedule.find({
    staffId,
    date: new Date(date),
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  });
  
  if (conflicts.length > 0) {
    // Create conflict notification
    const conflictDetails = `Overlapping schedule from ${conflicts[0].startTime} to ${conflicts[0].endTime}`;
    await Notification.create({
      userId: staffId,
      type: 'schedule_conflict',
      title: 'Schedule Conflict Detected',
      message: conflictDetails,
      metadata: {
        conflictingScheduleId: conflicts[0]?._id?.toString() ?? ''
      },
      channels: {
        email: true,
        inApp: true
      }
    });
    throw createConflictError('Staff member already has a schedule during this time');
  }

  const scheduleData = {
    staffId,
    clinicId,
    date: new Date(date),
    startTime,
    endTime,
    shiftType,
    notes,
    isRecurring: isRecurring || false,
    recurringPattern: isRecurring ? recurringPattern : undefined,
    createdBy: req.user!.id
  };

  const schedule = await StaffSchedule.create(scheduleData);
  await schedule.populate('staffId', 'firstName lastName role email phone');
  await schedule.populate('clinicId', 'name address');

  // Create schedule assignment notification
  await Notification.createScheduleNotification(
    staffId,
    'schedule_assignment',
    'New Schedule Assignment',
    `You have been assigned a ${shiftType} shift at ${clinic.name} on ${new Date(date).toLocaleDateString()} from ${startTime} to ${endTime}`,
    {
      scheduleId: schedule._id,
      clinicId,
      date: new Date(date),
      startTime,
      endTime
    },
    {
      email: true,
      sms: false,
      inApp: true
    }
  );

  res.status(201).json({
    success: true,
    message: 'Staff schedule created successfully',
    data: { schedule }
  });
});

// Get staff schedules with filtering and pagination
export const getStaffSchedules = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { clinicId, staffId, startDate, endDate, status, shiftType } = req.query;

  const query: any = {};

  if (clinicId) query.clinicId = clinicId;
  if (staffId) query.staffId = staffId;
  if (status) query.status = status;
  if (shiftType) query.shiftType = shiftType;

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate as string);
    if (endDate) query.date.$lte = new Date(endDate as string);
  }

  const [schedules, total] = await Promise.all([
    StaffSchedule.find(query)
      .populate('staffId', 'firstName lastName role email phone')
      .populate('clinicId', 'name address')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(limit),
    StaffSchedule.countDocuments(query)
  ]);

  const paginatedResponse = createPaginatedResponse(schedules, total, page, limit);

  res.json({
    success: true,
    data: paginatedResponse
  });
});

// Get staff schedule by ID
export const getStaffScheduleById = catchAsync(async (req: Request, res: Response) => {
  const schedule = await StaffSchedule.findById(req.params.id)
    .populate('staffId', 'firstName lastName role email phone')
    .populate('clinicId', 'name address phone email')
    .populate('createdBy', 'firstName lastName');

  if (!schedule) {
    throw createNotFoundError('Staff schedule');
  }

  res.json({
    success: true,
    data: { schedule }
  });
});

// Update staff schedule
export const updateStaffSchedule = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const schedule = await StaffSchedule.findById(id);
  if (!schedule) {
    throw createNotFoundError('Staff schedule');
  }

  // Check for conflicts if time or date is being updated
  if (updates.date || updates.startTime || updates.endTime) {
    const newDate = updates.date ? new Date(updates.date) : schedule.date;
    const newStartTime = updates.startTime || schedule.startTime;
    const newEndTime = updates.endTime || schedule.endTime;
    
    const conflicts = await StaffSchedule.detectConflicts(
      (schedule.staffId as any).toString(),
      newDate,
      newStartTime,
      newEndTime,
      id // exclude current schedule
    );
    
    if (conflicts.length > 0) {
      const conflictDetails = `Overlapping schedule from ${conflicts[0].startTime} to ${conflicts[0].endTime}`;
      await Notification.createScheduleConflict(
        (schedule.staffId as any).toString(),
        (conflicts[0]._id as any).toString(),
        (schedule.clinicId as any).name || 'Unknown Clinic',
        newDate,
        newStartTime,
        newEndTime,
        'conflict_detected'
      );
      throw createConflictError('Staff member already has a schedule during this time');
    }
  }

  const originalData = {
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime
  };

  Object.assign(schedule, updates);
  await schedule.save();
  await schedule.populate('staffId', 'firstName lastName role email phone');
  await schedule.populate('clinicId', 'name address');

  // Send schedule change notification if time/date changed
  if (updates.date || updates.startTime || updates.endTime) {
    await Notification.createScheduleChange(
      (schedule.staffId as any)._id.toString(),
      (schedule._id as any).toString(),
      (schedule.clinicId as any).name,
      schedule.date,
      schedule.startTime,
      schedule.endTime,
      'updated'
    );
  }

  res.json({
    success: true,
    message: 'Staff schedule updated successfully',
    data: { schedule }
  });
});

// Delete staff schedule
export const deleteStaffSchedule = catchAsync(async (req: Request, res: Response) => {
  const schedule = await StaffSchedule.findById(req.params.id);
  if (!schedule) {
    throw createNotFoundError('Staff schedule');
  }

  await StaffSchedule.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Staff schedule deleted successfully'
  });
});

// Get staff availability for a specific date
export const getStaffAvailability = catchAsync(async (req: Request, res: Response) => {
  const { clinicId, date } = req.query;

  if (!clinicId || !date) {
    throw createValidationError('query', 'Clinic ID and date are required');
  }

  // Get all staff assigned to the clinic
  const allStaff = await User.find({
    assignedClinics: clinicId,
    role: { $in: ['dentist', 'staff'] },
    isActive: true
  }).select('firstName lastName role email phone');

  // Get scheduled staff for the date
  const scheduledStaff = await StaffSchedule.find({
    clinicId,
    date: new Date(date as string),
    status: { $in: ['scheduled', 'completed'] }
  }).populate('staffId', 'firstName lastName role email phone');

  // Create availability map
  const availability = allStaff.map(staff => {
    const schedule = scheduledStaff.find(s => s.staffId.toString() === staff._id.toString());
    return {
      staff: {
        id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
        email: staff.email,
        phone: staff.phone
      },
      isScheduled: !!schedule,
      schedule: schedule ? {
        id: schedule._id,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        shiftType: schedule.shiftType,
        status: schedule.status
      } : null
    };
  });

  res.json({
    success: true,
    data: {
      date: new Date(date as string),
      clinic: clinicId,
      availability
    }
  });
});

// Get schedule analytics for a clinic
export const getScheduleAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { clinicId } = req.params;
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const [scheduleStats, shiftDistribution, staffUtilization] = await Promise.all([
    // Overall schedule statistics
    StaffSchedule.aggregate([
      {
        $match: {
          clinicId: clinicId,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                {
                  $subtract: [
                    { $dateFromString: { dateString: { $concat: ['1970-01-01T', '$endTime', ':00Z'] } } },
                    { $dateFromString: { dateString: { $concat: ['1970-01-01T', '$startTime', ':00Z'] } } }
                  ]
                },
                1000 * 60 * 60
              ]
            }
          }
        }
      }
    ]),

    // Shift type distribution
    StaffSchedule.aggregate([
      {
        $match: {
          clinicId: clinicId,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$shiftType',
          count: { $sum: 1 }
        }
      }
    ]),

    // Staff utilization
    StaffSchedule.aggregate([
      {
        $match: {
          clinicId: clinicId,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$staffId',
          totalShifts: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                {
                  $subtract: [
                    { $dateFromString: { dateString: { $concat: ['1970-01-01T', '$endTime', ':00Z'] } } },
                    { $dateFromString: { dateString: { $concat: ['1970-01-01T', '$startTime', ':00Z'] } } }
                  ]
                },
                1000 * 60 * 60
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      {
        $unwind: '$staff'
      },
      {
        $project: {
          staffName: { $concat: ['$staff.firstName', ' ', '$staff.lastName'] },
          role: '$staff.role',
          totalShifts: 1,
          totalHours: 1
        }
      },
      {
        $sort: { totalHours: -1 }
      }
    ])
  ]);

  res.json({
    success: true,
    data: {
      dateRange: { start, end },
      scheduleStats,
      shiftDistribution,
      staffUtilization
    }
  });
});