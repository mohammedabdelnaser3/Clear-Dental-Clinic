import { Request, Response } from 'express';
import { InsuranceClaim, Insurance, Patient, Billing } from '../models';
import { AuthenticatedRequest } from '../types';
import {
  getPaginationParams,
  createPaginatedResponse
} from '../utils/helpers';
import {
  AppError,
  catchAsync,
  createNotFoundError,
  createValidationError
} from '../middleware/errorHandler';
import { createAndSendNotification } from '../utils/notificationHelpers';

// Create insurance claim
export const createClaim = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const {
    insuranceId,
    patientId,
    providerId,
    clinicId,
    appointmentId,
    treatmentRecordId,
    billingId,
    serviceDate,
    claimType,
    procedures,
    priorAuthNumber,
    priorAuthRequired,
    priorAuthObtained
  } = req.body;

  // Verify insurance exists and is active
  const insurance = await (Insurance as any).findById(insuranceId);
  if (!insurance || !insurance.isActive) {
    throw createNotFoundError('Active insurance');
  }

  // Verify patient exists
  const patient = await (Patient as any).findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Calculate total billed from procedures
  const totalBilled = procedures.reduce((sum: number, proc: any) => sum + proc.totalPrice, 0);

  // Create claim
  const claim = await (InsuranceClaim as any).create({
    insuranceId,
    patientId,
    providerId,
    clinicId,
    appointmentId,
    treatmentRecordId,
    billingId,
    serviceDate,
    claimType: claimType || 'primary',
    procedures,
    totalBilled,
    priorAuthNumber,
    priorAuthRequired: priorAuthRequired || false,
    priorAuthObtained: priorAuthObtained || false,
    createdBy: req.user._id
  });

  // Send notification to patient
  await createAndSendNotification({
    userId: patientId,
    title: 'Insurance Claim Created',
    message: `A claim for $${totalBilled} has been submitted to your insurance`,
    type: 'insurance_update',
    link: `/insurance/claims/${claim._id}`,
    metadata: {
      claimId: claim._id,
      claimNumber: claim.claimNumber,
      totalBilled
    }
  });

  res.status(201).json({
    success: true,
    message: 'Insurance claim created successfully',
    data: { claim }
  });
});

// Submit claim to insurance
export const submitClaim = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { submissionMethod, clearinghouse, batchNumber } = req.body;

  const claim = await (InsuranceClaim as any).findById(id)
    .populate('patientId', 'firstName lastName')
    .populate('insuranceId', 'insuranceCompany');

  if (!claim) {
    throw createNotFoundError('Insurance claim');
  }

  if (claim.status !== 'draft') {
    throw createValidationError('claim', 'Only draft claims can be submitted');
  }

  // Check prior authorization if required
  if (claim.priorAuthRequired && !claim.priorAuthObtained) {
    throw createValidationError('claim', 'Prior authorization is required but not obtained');
  }

  // Update claim with submission details
  claim.submissionMethod = submissionMethod || 'electronic';
  if (clearinghouse) claim.clearinghouse = clearinghouse;
  if (batchNumber) claim.batchNumber = batchNumber;

  claim.status = 'submitted';
  (claim as any).submittedDate = new Date();
  await claim.save();

  // Send notification to patient
  await createAndSendNotification({
    userId: claim.patientId._id.toString(),
    title: 'Insurance Claim Submitted',
    message: `Your claim #${claim.claimNumber} has been submitted to ${(claim.insuranceId as any).insuranceCompany || 'your insurance'}`,
    type: 'insurance_update',
    metadata: {
      claimId: claim._id,
      claimNumber: claim.claimNumber,
      insuranceCompany: (claim.insuranceId as any).insuranceCompany
    }
  });

  res.json({
    success: true,
    message: 'Claim submitted successfully',
    data: { claim }
  });
});

// Process claim response from insurance
export const processClaim = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    totalAllowed,
    totalPaid,
    patientResponsibility,
    deductibleApplied,
    copayAmount,
    coinsuranceAmount,
    explanationOfBenefits
  } = req.body;

  const claim = await (InsuranceClaim as any).findById(id)
    .populate('patientId', 'firstName lastName')
    .populate('insuranceId');

  if (!claim) {
    throw createNotFoundError('Insurance claim');
  }

  if (!['submitted', 'pending'].includes(claim.status)) {
    throw createValidationError('claim', 'Only submitted or pending claims can be processed');
  }

  // Process the claim
  await (claim as any).markAsProcessed({
    totalAllowed,
    totalPaid,
    patientResponsibility,
    explanationOfBenefits
  });

  // Update additional amounts if provided
  if (deductibleApplied) claim.deductibleApplied = deductibleApplied;
  if (copayAmount) claim.copayAmount = copayAmount;
  if (coinsuranceAmount) claim.coinsuranceAmount = coinsuranceAmount;
  await claim.save();

  // Update insurance benefit usage
  const insurance = await (Insurance as any).findById(claim.insuranceId);
  if (insurance && totalPaid) {
    await (insurance as any).updateBenefitUsage(totalPaid);
  }

  // Send notification to patient
  await createAndSendNotification({
    userId: claim.patientId._id.toString(),
    title: 'Insurance Claim Processed',
    message: `Your claim #${claim.claimNumber} has been processed. Insurance paid $${totalPaid || 0}`,
    type: 'insurance_update',
    metadata: {
      claimId: claim._id,
      claimNumber: claim.claimNumber,
      totalPaid,
      patientResponsibility
    }
  });

  res.json({
    success: true,
    message: 'Claim processed successfully',
    data: { claim }
  });
});

// Mark claim as paid
export const markClaimPaid = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const claim = await (InsuranceClaim as any).findById(id).populate('patientId', 'firstName lastName');
  if (!claim) {
    throw createNotFoundError('Insurance claim');
  }

  if (claim.status !== 'processed') {
    throw createValidationError('claim', 'Only processed claims can be marked as paid');
  }

  await (claim as any).markAsPaid();

  // Send notification to patient
  await createAndSendNotification({
    userId: claim.patientId._id.toString(),
    title: 'Insurance Payment Received',
    message: `Payment of $${claim.totalPaid} has been received for claim #${claim.claimNumber}`,
    type: 'payment_success',
    metadata: {
      claimId: claim._id,
      claimNumber: claim.claimNumber,
      totalPaid: claim.totalPaid
    }
  });

  res.json({
    success: true,
    message: 'Claim marked as paid successfully',
    data: { claim }
  });
});

// Deny claim
export const denyClaim = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { denialReason, denialCode } = req.body;

  if (!denialReason) {
    throw createValidationError('denialReason', 'Denial reason is required');
  }

  const claim = await (InsuranceClaim as any).findById(id).populate('patientId', 'firstName lastName');
  if (!claim) {
    throw createNotFoundError('Insurance claim');
  }

  await (claim as any).deny(denialReason, denialCode);

  // Send notification to patient
  await createAndSendNotification({
    userId: claim.patientId._id.toString(),
    title: 'Insurance Claim Denied',
    message: `Your claim #${claim.claimNumber} has been denied: ${denialReason}`,
    type: 'insurance_update',
    metadata: {
      claimId: claim._id,
      claimNumber: claim.claimNumber,
      denialReason
    }
  });

  res.json({
    success: true,
    message: 'Claim denied successfully',
    data: { claim }
  });
});

// Appeal claim
export const appealClaim = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { appealReason } = req.body;

  if (!appealReason) {
    throw createValidationError('appealReason', 'Appeal reason is required');
  }

  const claim = await (InsuranceClaim as any).findById(id).populate('patientId', 'firstName lastName');
  if (!claim) {
    throw createNotFoundError('Insurance claim');
  }

  if (claim.status !== 'denied') {
    throw createValidationError('claim', 'Only denied claims can be appealed');
  }

  await (claim as any).addAppeal({
    reason: appealReason,
    appealedBy: req.user._id
  });

  // Send notification to patient
  await createAndSendNotification({
    userId: claim.patientId._id.toString(),
    title: 'Insurance Claim Appealed',
    message: `An appeal has been submitted for claim #${claim.claimNumber}`,
    type: 'insurance_update',
    metadata: {
      claimId: claim._id,
      claimNumber: claim.claimNumber,
      appealReason
    }
  });

  res.json({
    success: true,
    message: 'Claim appealed successfully',
    data: { claim }
  });
});

// Get claims by patient
export const getPatientClaims = catchAsync(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { page, limit, skip } = getPaginationParams(req);
  const { status } = req.query;

  const [claims, total] = await Promise.all([
    (InsuranceClaim as any).findByPatient(patientId, { skip, limit, status }),
    (InsuranceClaim as any).countDocuments({ 
      patientId, 
      ...(status && { status }) 
    })
  ]);

  res.json({
    success: true,
    data: createPaginatedResponse(claims, total, page, limit)
  });
});

// Get claims by insurance
export const getInsuranceClaims = catchAsync(async (req: Request, res: Response) => {
  const { insuranceId } = req.params;

  const claims = await (InsuranceClaim as any).findByInsurance(insuranceId);

  res.json({
    success: true,
    data: { claims }
  });
});

// Get pending claims
export const getPendingClaims = catchAsync(async (req: Request, res: Response) => {
  const { clinicId } = req.query;

  const pendingClaims = await (InsuranceClaim as any).findPendingClaims(clinicId as string);

  res.json({
    success: true,
    data: { 
      claims: pendingClaims,
      count: pendingClaims.length
    }
  });
});

// Get claims needing follow-up
export const getClaimsNeedingFollowUp = catchAsync(async (req: Request, res: Response) => {
  const { clinicId } = req.query;

  const followUpClaims = await (InsuranceClaim as any).findClaimsNeedingFollowUp(clinicId as string);

  res.json({
    success: true,
    data: { 
      claims: followUpClaims,
      count: followUpClaims.length
    }
  });
});

// Get claim by ID
export const getClaimById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const claim = await (InsuranceClaim as any).findById(id)
    .populate('patientId', 'firstName lastName email dateOfBirth')
    .populate('insuranceId')
    .populate('providerId', 'firstName lastName')
    .populate('clinicId', 'name')
    .populate('appointmentId')
    .populate('treatmentRecordId')
    .populate('billingId')
    .populate('createdBy', 'firstName lastName')
    .populate('correspondenceLog.handledBy', 'firstName lastName')
    .populate('appealHistory.appealedBy', 'firstName lastName');

  if (!claim) {
    throw createNotFoundError('Insurance claim');
  }

  res.json({
    success: true,
    data: { claim }
  });
});

// Add correspondence to claim
export const addCorrespondence = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { type, direction, subject, notes } = req.body;

  const claim = await (InsuranceClaim as any).findById(id);
  if (!claim) {
    throw createNotFoundError('Insurance claim');
  }

  if (!claim.correspondenceLog) {
    claim.correspondenceLog = [];
  }
  claim.correspondenceLog.push({
    type,
    direction,
    subject,
    notes,
    date: new Date(),
    handledBy: req.user._id
  });

  res.json({
    success: true,
    message: 'Correspondence added successfully',
    data: { claim }
  });
});

// Get claim statistics
export const getClaimStatistics = catchAsync(async (req: Request, res: Response) => {
  const { clinicId, startDate, endDate } = req.query;

  const dateRange = startDate && endDate ? {
    start: new Date(startDate as string),
    end: new Date(endDate as string)
  } : undefined;

  const stats = await (InsuranceClaim as any).getClaimStatistics(clinicId as string, dateRange);

  // Calculate additional metrics
  const totalStats = {
    totalClaims: 0,
    totalBilled: 0,
    totalPaid: 0,
    averageProcessingTime: 0,
    paymentRate: 0,
    denialRate: 0
  };

  let processingTimes = 0;
  let processedClaims = 0;

  stats.forEach((stat: any) => {
    totalStats.totalClaims += stat.count;
    totalStats.totalBilled += stat.totalBilled;
    totalStats.totalPaid += stat.totalPaid;
    
    if (stat.averageProcessingTime) {
      processingTimes += stat.averageProcessingTime * stat.count;
      processedClaims += stat.count;
    }
  });

  if (processedClaims > 0) {
    totalStats.averageProcessingTime = Math.round(processingTimes / processedClaims / (1000 * 60 * 60 * 24)); // Convert to days
  }

  if (totalStats.totalBilled > 0) {
    totalStats.paymentRate = Math.round((totalStats.totalPaid / totalStats.totalBilled) * 100);
  }

  const deniedClaims = stats.find((stat: any) => stat._id === 'denied');
  if (deniedClaims && totalStats.totalClaims > 0) {
    totalStats.denialRate = Math.round((deniedClaims.count / totalStats.totalClaims) * 100);
  }

  res.json({
    success: true,
    data: {
      summary: totalStats,
      breakdown: stats
    }
  });
});

// Update claim follow-up
export const updateFollowUp = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { followUpRequired, followUpDate, followUpReason } = req.body;

  const claim = await (InsuranceClaim as any).findById(id);
  if (!claim) {
    throw createNotFoundError('Insurance claim');
  }

  claim.followUpRequired = followUpRequired;
  if (followUpDate) claim.followUpDate = new Date(followUpDate);
  if (followUpReason) claim.followUpReason = followUpReason;
  claim.updatedBy = req.user._id;

  await claim.save();

  res.json({
    success: true,
    message: 'Follow-up updated successfully',
    data: { claim }
  });
});
