import { Request, Response, NextFunction } from 'express';
import { Billing, Patient, Appointment } from '../models';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { AuthenticatedRequest } from '../types';

// @desc    Get all billing records
// @route   GET /api/billing
// @access  Private (Dentist, Staff, Admin)
export const getAllBillingRecords = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10, status, patientId, clinicId } = req.query;
  
  let query: any = { isActive: true };
  
  // If user is a dentist, only show their billing records
  if (req.user.role === 'dentist') {
    query.dentistId = req.user._id;
  }
  
  if (status) {
    query.paymentStatus = status;
  }
  
  if (patientId) {
    query.patientId = patientId;
  }
  
  if (clinicId) {
    query.clinicId = clinicId;
  }
  
  const billingRecords = await Billing.find(query)
    .populate('patientId', 'firstName lastName email phone')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name address')
    .populate('appointmentId', 'appointmentDate appointmentTime')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));
    
  const total = await Billing.countDocuments(query);
  
  return res.status(200).json({
    success: true,
    data: {
      billingRecords,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      totalRecords: total
    }
  });
});

// @desc    Get billing record by ID
// @route   GET /api/billing/:id
// @access  Private (Dentist, Staff, Admin, Patient - own only)
export const getBillingRecordById = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const billingRecord = await Billing.findById(req.params.id)
    .populate('patientId', 'firstName lastName email phone address')
    .populate('dentistId', 'firstName lastName specialization licenseNumber')
    .populate('clinicId', 'name address phone email')
    .populate('appointmentId', 'appointmentDate appointmentTime procedure')
    .populate('treatmentRecordId', 'procedure diagnosis');
  
  if (!billingRecord) {
    return next(new AppError('Billing record not found', 404));
  }
  
  // Check if patient is accessing their own billing record
  if (req.user.role === 'patient' && billingRecord.patientId.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  // Check if dentist is accessing their own billing record
  if (req.user.role === 'dentist' && billingRecord.dentistId.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  return res.status(200).json({
    success: true,
    data: billingRecord
  });
});

// @desc    Create new billing record
// @route   POST /api/billing
// @access  Private (Dentist, Staff)
export const createBillingRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Verify patient exists
  const patient = await Patient.findById(req.body.patientId);
  if (!patient) {
    return next(new AppError('Patient not found', 404));
  }
  
  // Verify appointment exists if provided
  if (req.body.appointmentId) {
    const appointment = await Appointment.findById(req.body.appointmentId);
    if (!appointment) {
      return next(new AppError('Appointment not found', 404));
    }
  }
  
  // Generate invoice number
  const invoiceCount = await Billing.countDocuments();
  const invoiceNumber = `INV-${Date.now()}-${(invoiceCount + 1).toString().padStart(4, '0')}`;
  
  const billingData = {
    ...req.body,
    dentistId: req.user._id,
    invoiceNumber,
    dueDate: req.body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  };
  
  const billingRecord = await Billing.create(billingData);
  
  const populatedBillingRecord = await Billing.findById(billingRecord._id)
    .populate('patientId', 'firstName lastName email')
    .populate('dentistId', 'firstName lastName')
    .populate('clinicId', 'name')
    .populate('appointmentId', 'appointmentDate appointmentTime');
  
  return res.status(201).json({
    success: true,
    data: populatedBillingRecord,
    message: 'Billing record created successfully'
  });
});

// @desc    Update billing record
// @route   PUT /api/billing/:id
// @access  Private (Dentist - own only, Staff, Admin)
export const updateBillingRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const billingRecord = await Billing.findById(req.params.id);
  
  if (!billingRecord) {
    return next(new AppError('Billing record not found', 404));
  }
  
  // Check if dentist is updating their own billing record
  if (req.user.role === 'dentist' && billingRecord.dentistId.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  const updatedBillingRecord = await Billing.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('patientId', 'firstName lastName email')
   .populate('dentistId', 'firstName lastName')
   .populate('clinicId', 'name')
   .populate('appointmentId', 'appointmentDate appointmentTime');
  
  return res.status(200).json({
    success: true,
    data: updatedBillingRecord,
    message: 'Billing record updated successfully'
  });
});

// @desc    Delete billing record (soft delete)
// @route   DELETE /api/billing/:id
// @access  Private (Admin)
export const deleteBillingRecord = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const billingRecord = await Billing.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  
  if (!billingRecord) {
    return next(new AppError('Billing record not found', 404));
  }
  
  return res.status(200).json({
    success: true,
    message: 'Billing record deleted successfully'
  });
});

// @desc    Get billing records by patient
// @route   GET /api/billing/patient/:patientId
// @access  Private (Dentist, Staff, Admin, Patient - own only)
export const getBillingRecordsByPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { patientId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  
  // Check if patient is accessing their own billing records
  if (req.user.role === 'patient' && patientId !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [billingRecords, total] = await Promise.all([
    Billing.findByPatient(patientId, {
      status,
      limit: Number(limit),
      skip
    }),
    Billing.countDocuments({
      patientId,
      isActive: true,
      ...(status && { paymentStatus: status })
    })
  ]);
  
  return res.status(200).json({
    success: true,
    data: {
      billingRecords,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      totalRecords: total
    }
  });
});

// @desc    Get overdue billing records
// @route   GET /api/billing/overdue
// @access  Private (Dentist, Staff, Admin)
export const getOverdueBillingRecords = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { clinicId } = req.query;
  
  let filterClinicId = clinicId as string;
  
  // If user is a dentist, filter by their assigned clinics
  if (req.user.role === 'dentist' && req.user.assignedClinics && req.user.assignedClinics.length > 0) {
    filterClinicId = req.user.assignedClinics[0].toString();
  }
  
  const overdueBillingRecords = await Billing.findOverdue(filterClinicId);
  
  return res.status(200).json({
    success: true,
    data: overdueBillingRecords
  });
});

// @desc    Add payment to billing record
// @route   POST /api/billing/:id/payment
// @access  Private (Dentist, Staff, Admin)
export const addPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { amount, method } = req.body;
  
  if (!amount || amount <= 0) {
    return next(new AppError('Valid payment amount is required', 400));
  }
  
  const billingRecord = await Billing.findById(req.params.id);
  
  if (!billingRecord) {
    return next(new AppError('Billing record not found', 404));
  }
  
  // Check if dentist is adding payment to their own billing record
  if (req.user.role === 'dentist' && billingRecord.dentistId.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied', 403));
  }
  
  const updatedBillingRecord = await billingRecord.addPayment(amount, method);
  
  return res.status(200).json({
    success: true,
    data: updatedBillingRecord,
    message: 'Payment added successfully'
  });
});

// @desc    Get revenue statistics
// @route   GET /api/billing/stats/revenue
// @access  Private (Dentist, Staff, Admin)
export const getRevenueStats = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { clinicId, startDate, endDate } = req.query;
  
  if (!clinicId) {
    return next(new AppError('Clinic ID is required', 400));
  }
  
  const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate ? new Date(endDate as string) : new Date();
  
  const revenueStats = await Billing.getRevenueStats(clinicId as string, start, end);
  
  return res.status(200).json({
    success: true,
    data: revenueStats
  });
});

// @desc    Get billing summary
// @route   GET /api/billing/summary
// @access  Private (Dentist, Staff, Admin)
export const getBillingSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let query: any = { isActive: true };
  
  // If user is a dentist, only show their billing records
  if (req.user.role === 'dentist') {
    query.dentistId = req.user._id;
  }
  
  const [totalRecords, pendingPayments, overduePayments, totalRevenue] = await Promise.all([
    Billing.countDocuments(query),
    Billing.countDocuments({ ...query, paymentStatus: 'pending' }),
    Billing.countDocuments({ ...query, paymentStatus: 'overdue' }),
    Billing.aggregate([
      { $match: { ...query, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
  ]);
  
  return res.status(200).json({
    success: true,
    data: {
      totalRecords,
      pendingPayments,
      overduePayments,
      totalRevenue: totalRevenue[0]?.total || 0
    }
  });
});