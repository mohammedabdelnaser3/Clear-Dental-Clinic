import { Request, Response } from 'express';
import { Clinic, User, Patient, Appointment, Billing, StaffSchedule } from '../models';
import { AuthenticatedRequest } from '../types';
import {
  getPaginationParams,
  createPaginatedResponse
} from '../utils/helpers';
import {
  catchAsync,
  createNotFoundError,
  createValidationError
} from '../middleware/errorHandler';

// Get all clinics with comprehensive data for admin dashboard
export const getAdminClinicOverview = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { search, status, sortBy = 'name' } = req.query;

  // Build query for clinics
  const query: any = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
      { 'address.state': { $regex: search, $options: 'i' } }
    ];
  }

  if (status && status !== 'all') {
    query.isActive = status === 'active';
  }

  // Get clinics with basic info
  const [clinics, totalClinics] = await Promise.all([
    Clinic.find(query)
      .populate('staff', 'firstName lastName role')
      .sort({ [sortBy as string]: 1 })
      .skip(skip)
      .limit(limit),
    Clinic.countDocuments(query)
  ]);

  // Get comprehensive data for each clinic
  const clinicsWithData = await Promise.all(
    clinics.map(async (clinic) => {
      const [patientStats, appointmentStats, billingStats, staffCount] = await Promise.all([
        // Patient statistics
        Patient.aggregate([
          { $match: { preferredClinicId: clinic._id } },
          {
            $group: {
              _id: null,
              totalPatients: { $sum: 1 },
              newThisMonth: {
                $sum: {
                  $cond: [
                    { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ]),
        
        // Appointment statistics
        Appointment.aggregate([
          { $match: { clinicId: clinic._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),
        
        // Billing statistics
        Billing.aggregate([
          { $match: { clinicId: clinic._id } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              paidAmount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
                }
              },
              pendingAmount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
                }
              },
              overdueAmount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'overdue'] }, '$amount', 0]
                }
              }
            }
          }
        ]),
        
        // Staff count
        User.countDocuments({ assignedClinics: clinic._id })
      ]);

      const patientData = patientStats[0] || { totalPatients: 0, newThisMonth: 0 };
      const appointmentData = appointmentStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as any);
      const billingData = billingStats[0] || {
        totalRevenue: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0
      };

      return {
        clinic: {
          id: clinic._id,
          name: clinic.name,
          email: clinic.email,
          phone: clinic.phone,
          address: clinic.address,
          isActive: clinic.isActive,
          services: clinic.services,
          operatingHours: clinic.operatingHours,
          createdAt: clinic.createdAt
        },
        statistics: {
          patients: {
            total: patientData.totalPatients,
            newThisMonth: patientData.newThisMonth
          },
          appointments: {
            total: Object.values(appointmentData).reduce((sum: number, count: any) => sum + count, 0),
            scheduled: appointmentData.scheduled || 0,
            completed: appointmentData.completed || 0,
            cancelled: appointmentData.cancelled || 0,
            'no-show': appointmentData['no-show'] || 0
          },
          billing: {
            totalRevenue: billingData.totalRevenue,
            paidAmount: billingData.paidAmount,
            pendingAmount: billingData.pendingAmount,
            overdueAmount: billingData.overdueAmount,
            collectionRate: billingData.totalRevenue > 0 
              ? (billingData.paidAmount / billingData.totalRevenue) * 100 
              : 0
          },
          staff: {
            total: staffCount,
            active: clinic.staff.length
          }
        }
      };
    })
  );

  // Calculate overall statistics
  const overallStats = clinicsWithData.reduce(
    (acc, clinicData) => ({
      totalClinics: acc.totalClinics + 1,
      totalPatients: acc.totalPatients + clinicData.statistics.patients.total,
      totalRevenue: acc.totalRevenue + clinicData.statistics.billing.totalRevenue,
      totalAppointments: acc.totalAppointments + clinicData.statistics.appointments.total,
      totalStaff: acc.totalStaff + clinicData.statistics.staff.total
    }),
    { totalClinics: 0, totalPatients: 0, totalRevenue: 0, totalAppointments: 0, totalStaff: 0 }
  );

  const paginatedResponse = createPaginatedResponse(clinicsWithData, totalClinics, page, limit);

  res.json({
    success: true,
    data: {
      ...paginatedResponse,
      overallStatistics: overallStats
    }
  });
});

// Get detailed data for a specific clinic
export const getClinicDetailedData = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { clinicId } = req.params;
  const { startDate, endDate } = req.query;

  const clinic = await Clinic.findById(clinicId).populate('staff', 'firstName lastName role email phone');
  if (!clinic) {
    throw createNotFoundError('Clinic');
  }

  // Date range for filtering (default to last 30 days)
  const end = endDate ? new Date(endDate as string) : new Date();
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [patientData, appointmentData, billingData, recentActivity] = await Promise.all([
    // Detailed patient analytics
    Patient.aggregate([
      { $match: { preferredClinicId: clinic._id } },
      {
        $facet: {
          demographics: [
            {
              $group: {
                _id: '$gender',
                count: { $sum: 1 }
              }
            }
          ],
          ageGroups: [
            {
              $addFields: {
                age: {
                  $floor: {
                    $divide: [
                      { $subtract: [new Date(), { $dateFromString: { dateString: '$dateOfBirth' } }] },
                      365.25 * 24 * 60 * 60 * 1000
                    ]
                  }
                }
              }
            },
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      { case: { $lt: ['$age', 18] }, then: 'Under 18' },
                      { case: { $lt: ['$age', 30] }, then: '18-29' },
                      { case: { $lt: ['$age', 50] }, then: '30-49' },
                      { case: { $lt: ['$age', 65] }, then: '50-64' }
                    ],
                    default: '65+'
                  }
                },
                count: { $sum: 1 }
              }
            }
          ],
          registrationTrend: [
            {
              $match: {
                createdAt: { $gte: start, $lte: end }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ]
        }
      }
    ]),

    // Detailed appointment analytics
    Appointment.aggregate([
      { $match: { clinicId: clinic._id, date: { $gte: start, $lte: end } } },
      {
        $facet: {
          statusBreakdown: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          dailyTrend: [
            {
              $group: {
                _id: {
                  year: { $year: '$date' },
                  month: { $month: '$date' },
                  day: { $dayOfMonth: '$date' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ],
          timeSlots: [
            {
              $group: {
                _id: { $hour: '$time' },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ]
        }
      }
    ]),

    // Detailed billing analytics
    Billing.aggregate([
      { $match: { clinicId: clinic._id, createdAt: { $gte: start, $lte: end } } },
      {
        $facet: {
          revenueBreakdown: [
            {
              $group: {
                _id: '$status',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          dailyRevenue: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                revenue: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ],
          paymentMethods: [
            {
              $group: {
                _id: '$paymentMethod',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]),

    // Recent activity
    Promise.all([
      Patient.find({ preferredClinicId: clinic._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email createdAt'),
      Appointment.find({ clinicId: clinic._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('patientId', 'firstName lastName')
        .populate('dentistId', 'firstName lastName')
        .select('date time status patientId dentistId createdAt'),
      Billing.find({ clinicId: clinic._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('patientId', 'firstName lastName')
        .select('amount status paymentMethod patientId createdAt')
    ])
  ]);

  const [recentPatients, recentAppointments, recentBilling] = recentActivity;

  res.json({
    success: true,
    data: {
      clinic: {
        id: clinic._id,
        name: clinic.name,
        email: clinic.email,
        phone: clinic.phone,
        address: clinic.address,
        isActive: clinic.isActive,
        services: clinic.services,
        operatingHours: clinic.operatingHours,
        staff: clinic.staff,
        createdAt: clinic.createdAt
      },
      analytics: {
        patients: patientData[0],
        appointments: appointmentData[0],
        billing: billingData[0]
      },
      recentActivity: {
        patients: recentPatients,
        appointments: recentAppointments,
        billing: recentBilling
      },
      dateRange: { start, end }
    }
  });
});

// Get clinic comparison data
export const getClinicComparison = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { clinicIds, metric = 'revenue', period = '30d' } = req.query;

  if (!clinicIds) {
    throw createValidationError('clinicIds', 'Clinic IDs are required for comparison');
  }

  const ids = Array.isArray(clinicIds) ? clinicIds : [clinicIds];
  
  // Calculate date range based on period
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  const clinics = await Clinic.find({ _id: { $in: ids } }).select('name');
  
  const comparisonData = await Promise.all(
    clinics.map(async (clinic) => {
      let data;
      
      switch (metric) {
        case 'revenue':
          data = await Billing.aggregate([
            {
              $match: {
                clinicId: clinic._id,
                createdAt: { $gte: start, $lte: end }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                value: { $sum: '$amount' }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ]);
          break;
          
        case 'patients':
          data = await Patient.aggregate([
            {
              $match: {
                preferredClinicId: clinic._id,
                createdAt: { $gte: start, $lte: end }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' }
                },
                value: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ]);
          break;
          
        case 'appointments':
          data = await Appointment.aggregate([
            {
              $match: {
                clinicId: clinic._id,
                date: { $gte: start, $lte: end }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$date' },
                  month: { $month: '$date' },
                  day: { $dayOfMonth: '$date' }
                },
                value: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
          ]);
          break;
          
        default:
          data = [];
      }
      
      return {
        clinicId: clinic._id,
        clinicName: clinic.name,
        data: data.map(item => ({
          date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
          value: item.value
        }))
      };
    })
  );

  res.json({
    success: true,
    data: {
      comparison: comparisonData,
      metric,
      period,
      dateRange: { start, end }
    }
  });
});

// Get system-wide statistics for admin
export const getSystemStatistics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { period = '30d' } = req.query;
  
  // Calculate date range
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  const [systemStats, growthStats] = await Promise.all([
    // Current system statistics
    Promise.all([
      Clinic.countDocuments({ isActive: true }),
      Clinic.countDocuments({ isActive: false }),
      User.countDocuments({ role: 'patient', isActive: true }),
      User.countDocuments({ role: { $in: ['dentist', 'staff'] }, isActive: true }),
      User.countDocuments({ role: 'admin', isActive: true }),
      Appointment.countDocuments({ date: { $gte: start, $lte: end } }),
      Billing.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
      ])
    ]),
    
    // Growth statistics
    Promise.all([
      Clinic.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({ role: 'patient', createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({ role: { $in: ['dentist', 'staff'] }, createdAt: { $gte: start, $lte: end } })
    ])
  ]);

  const [
    activeClinics,
    inactiveClinics,
    totalPatients,
    totalStaff,
    totalAdmins,
    totalAppointments,
    revenueData
  ] = systemStats;

  const [newClinics, newPatients, newStaff] = growthStats;
  const totalRevenue = revenueData[0]?.totalRevenue || 0;

  res.json({
    success: true,
    data: {
      overview: {
        clinics: {
          total: activeClinics + inactiveClinics,
          active: activeClinics,
          inactive: inactiveClinics
        },
        users: {
          patients: totalPatients,
          staff: totalStaff,
          admins: totalAdmins,
          total: totalPatients + totalStaff + totalAdmins
        },
        appointments: totalAppointments,
        revenue: totalRevenue
      },
      growth: {
        clinics: newClinics,
        patients: newPatients,
        staff: newStaff
      },
      period,
      dateRange: { start, end }
    }
  });
});

// Get multi-clinic dashboard overview with staff schedules
export const getMultiClinicDashboard = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { period = '30d', clinicIds } = req.query;
  
  // Calculate date range
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  // Filter clinics if specific IDs provided
  const clinicFilter = clinicIds ? 
    { _id: { $in: Array.isArray(clinicIds) ? clinicIds : [clinicIds] } } : 
    {};

  const clinics = await Clinic.find(clinicFilter).populate('staff', 'firstName lastName role specialization');

  const dashboardData = await Promise.all(
    clinics.map(async (clinic) => {
      const [patientStats, appointmentStats, billingStats, staffScheduleStats] = await Promise.all([
        // Patient statistics
        Patient.aggregate([
          { $match: { preferredClinicId: clinic._id } },
          {
            $facet: {
              total: [{ $count: 'count' }],
              newPatients: [
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $count: 'count' }
              ],
              demographics: [
                {
                  $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                  }
                }
              ]
            }
          }
        ]),

        // Appointment statistics
        Appointment.aggregate([
          { $match: { clinicId: clinic._id, date: { $gte: start, $lte: end } } },
          {
            $facet: {
              total: [{ $count: 'count' }],
              statusBreakdown: [
                {
                  $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                  }
                }
              ],
              dailyTrend: [
                {
                  $group: {
                    _id: {
                      year: { $year: '$date' },
                      month: { $month: '$date' },
                      day: { $dayOfMonth: '$date' }
                    },
                    count: { $sum: 1 }
                  }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
              ]
            }
          }
        ]),

        // Billing statistics
        Billing.aggregate([
          { $match: { clinicId: clinic._id, createdAt: { $gte: start, $lte: end } } },
          {
            $facet: {
              totalRevenue: [
                {
                  $group: {
                    _id: null,
                    amount: { $sum: '$amount' }
                  }
                }
              ],
              revenueByStatus: [
                {
                  $group: {
                    _id: '$status',
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 }
                  }
                }
              ],
              dailyRevenue: [
                {
                  $group: {
                    _id: {
                      year: { $year: '$createdAt' },
                      month: { $month: '$createdAt' },
                      day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$amount' }
                  }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
              ]
            }
          }
        ]),

        // Staff schedule statistics
        StaffSchedule.aggregate([
          { $match: { clinicId: clinic._id, date: { $gte: start, $lte: end } } },
          {
            $facet: {
              totalSchedules: [{ $count: 'count' }],
              statusBreakdown: [
                {
                  $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                  }
                }
              ],
              shiftTypeBreakdown: [
                {
                  $group: {
                    _id: '$shiftType',
                    count: { $sum: 1 }
                  }
                }
              ],
              staffUtilization: [
                {
                  $group: {
                    _id: '$staffId',
                    scheduledHours: {
                      $sum: {
                        $divide: [
                          {
                            $subtract: [
                              { $dateFromString: { dateString: { $concat: ['1970-01-01T', '$endTime', ':00Z'] } } },
                              { $dateFromString: { dateString: { $concat: ['1970-01-01T', '$startTime', ':00Z'] } } }
                            ]
                          },
                          3600000
                        ]
                      }
                    },
                    scheduleCount: { $sum: 1 }
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
                    scheduledHours: 1,
                    scheduleCount: 1
                  }
                }
              ]
            }
          }
        ])
      ]);

      return {
        clinic: {
          id: clinic._id,
          name: clinic.name,
          email: clinic.email,
          phone: clinic.phone,
          address: clinic.address,
          isActive: clinic.isActive,
          staffCount: clinic.staff.length
        },
        metrics: {
          patients: {
            total: patientStats[0]?.total[0]?.count || 0,
            new: patientStats[0]?.newPatients[0]?.count || 0,
            demographics: patientStats[0]?.demographics || []
          },
          appointments: {
            total: appointmentStats[0]?.total[0]?.count || 0,
            statusBreakdown: appointmentStats[0]?.statusBreakdown || [],
            dailyTrend: appointmentStats[0]?.dailyTrend || []
          },
          billing: {
            totalRevenue: billingStats[0]?.totalRevenue[0]?.amount || 0,
            revenueByStatus: billingStats[0]?.revenueByStatus || [],
            dailyRevenue: billingStats[0]?.dailyRevenue || []
          },
          staffSchedules: {
            total: staffScheduleStats[0]?.totalSchedules[0]?.count || 0,
            statusBreakdown: staffScheduleStats[0]?.statusBreakdown || [],
            shiftTypeBreakdown: staffScheduleStats[0]?.shiftTypeBreakdown || [],
            staffUtilization: staffScheduleStats[0]?.staffUtilization || []
          }
        }
      };
    })
  );

  // Calculate overall statistics across all clinics
  const overallStats = dashboardData.reduce(
    (acc, clinic) => {
      acc.totalPatients += clinic.metrics.patients.total;
      acc.newPatients += clinic.metrics.patients.new;
      acc.totalAppointments += clinic.metrics.appointments.total;
      acc.totalRevenue += clinic.metrics.billing.totalRevenue;
      acc.totalSchedules += clinic.metrics.staffSchedules.total;
      return acc;
    },
    {
      totalPatients: 0,
      newPatients: 0,
      totalAppointments: 0,
      totalRevenue: 0,
      totalSchedules: 0
    }
  );

  res.json({
    success: true,
    data: {
      clinics: dashboardData,
      overallStats,
      period,
      dateRange: { start, end }
    }
  });
});

// Get clinic performance metrics for comparison
export const getClinicPerformanceMetrics = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { period = '30d', metrics = 'all' } = req.query;
  
  // Calculate date range
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  const clinics = await Clinic.find({ isActive: true }).select('name');

  const performanceData = await Promise.all(
    clinics.map(async (clinic) => {
      const [efficiency, patientSatisfaction, revenue, staffProductivity] = await Promise.all([
        // Efficiency metrics (appointment completion rate)
        Appointment.aggregate([
          { $match: { clinicId: clinic._id, date: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                }
              },
              cancelled: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
                }
              },
              noShow: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0]
                }
              }
            }
          }
        ]),

        // Patient satisfaction (based on completed appointments vs cancellations)
        Patient.aggregate([
          { $match: { preferredClinicId: clinic._id, createdAt: { $gte: start, $lte: end } } },
          {
            $lookup: {
              from: 'appointments',
              localField: '_id',
              foreignField: 'patientId',
              as: 'appointments'
            }
          },
          {
            $project: {
              totalAppointments: { $size: '$appointments' },
              completedAppointments: {
                $size: {
                  $filter: {
                    input: '$appointments',
                    cond: { $eq: ['$$this.status', 'completed'] }
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: null,
              avgCompletionRate: {
                $avg: {
                  $cond: [
                    { $gt: ['$totalAppointments', 0] },
                    { $divide: ['$completedAppointments', '$totalAppointments'] },
                    0
                  ]
                }
              }
            }
          }
        ]),

        // Revenue metrics
        Billing.aggregate([
          { $match: { clinicId: clinic._id, createdAt: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              avgTransactionValue: { $avg: '$amount' },
              totalTransactions: { $sum: 1 },
              paidAmount: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
                }
              }
            }
          }
        ]),

        // Staff productivity (schedules completed vs total)
        StaffSchedule.aggregate([
          { $match: { clinicId: clinic._id, date: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              totalSchedules: { $sum: 1 },
              completedSchedules: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                }
              },
              totalHours: {
                $sum: {
                  $divide: [
                    {
                      $subtract: [
                        { $dateFromString: { dateString: { $concat: ['1970-01-01T', '$endTime', ':00Z'] } } },
                        { $dateFromString: { dateString: { $concat: ['1970-01-01T', '$startTime', ':00Z'] } } }
                      ]
                    },
                    3600000
                  ]
                }
              }
            }
          }
        ])
      ]);

      const efficiencyData = efficiency[0] || { total: 0, completed: 0, cancelled: 0, noShow: 0 };
      const satisfactionData = patientSatisfaction[0] || { avgCompletionRate: 0 };
      const revenueData = revenue[0] || { totalRevenue: 0, avgTransactionValue: 0, totalTransactions: 0, paidAmount: 0 };
      const productivityData = staffProductivity[0] || { totalSchedules: 0, completedSchedules: 0, totalHours: 0 };

      return {
        clinicId: clinic._id,
        clinicName: clinic.name,
        metrics: {
          efficiency: {
            completionRate: efficiencyData.total > 0 ? (efficiencyData.completed / efficiencyData.total) * 100 : 0,
            cancellationRate: efficiencyData.total > 0 ? (efficiencyData.cancelled / efficiencyData.total) * 100 : 0,
            noShowRate: efficiencyData.total > 0 ? (efficiencyData.noShow / efficiencyData.total) * 100 : 0,
            totalAppointments: efficiencyData.total
          },
          patientSatisfaction: {
            avgCompletionRate: (satisfactionData.avgCompletionRate || 0) * 100
          },
          revenue: {
            total: revenueData.totalRevenue,
            average: revenueData.avgTransactionValue,
            transactions: revenueData.totalTransactions,
            collectionRate: revenueData.totalRevenue > 0 ? (revenueData.paidAmount / revenueData.totalRevenue) * 100 : 0
          },
          staffProductivity: {
            scheduleCompletionRate: productivityData.totalSchedules > 0 ? (productivityData.completedSchedules / productivityData.totalSchedules) * 100 : 0,
            totalHours: productivityData.totalHours,
            avgHoursPerSchedule: productivityData.totalSchedules > 0 ? productivityData.totalHours / productivityData.totalSchedules : 0
          }
        }
      };
    })
  );

  res.json({
    success: true,
    data: {
      clinics: performanceData,
      period,
      dateRange: { start, end }
    }
  });
});