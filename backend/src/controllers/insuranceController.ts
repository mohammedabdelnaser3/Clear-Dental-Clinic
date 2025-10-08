import { Request, Response } from 'express';
import { Insurance, Patient, User } from '../models';
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

// Create insurance record
export const createInsurance = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const {
    patientId,
    insuranceCompany,
    policyNumber,
    groupNumber,
    membershipNumber,
    policyHolderName,
    relationshipToPolicyHolder,
    policyHolderDateOfBirth,
    coverageType,
    effectiveDate,
    expirationDate,
    dentalCoveragePercentage,
    annualMaxBenefit,
    annualDeductible,
    preventiveCoverage,
    basicCoverage,
    majorCoverage,
    orthodonticCoverage,
    orthodonticLifetimeMax,
    insurancePhone,
    insuranceAddress,
    preAuthorizationRequired,
    waitingPeriods,
    exclusions,
    limitations
  } = req.body;

  // Check if patient exists
  const patient = await (Patient as any).findById(patientId);
  if (!patient) {
    throw createNotFoundError('Patient');
  }

  // Check for existing active insurance for this patient
  const existingInsurance = await (Insurance as any).findActiveInsurance(patientId);
  if (existingInsurance && existingInsurance.policyNumber === policyNumber) {
    throw createValidationError('insurance', 'Patient already has active insurance with this policy number');
  }

  // Create insurance record
  const insurance = await (Insurance as any).create({
    patientId,
    insuranceCompany,
    policyNumber,
    groupNumber,
    membershipNumber,
    policyHolderName,
    relationshipToPolicyHolder,
    policyHolderDateOfBirth,
    coverageType,
    effectiveDate,
    expirationDate,
    dentalCoveragePercentage,
    annualMaxBenefit,
    annualDeductible,
    remainingBenefits: annualMaxBenefit || 0,
    preventiveCoverage: preventiveCoverage || 100,
    basicCoverage: basicCoverage || 80,
    majorCoverage: majorCoverage || 50,
    orthodonticCoverage: orthodonticCoverage || 0,
    orthodonticLifetimeMax,
    insurancePhone,
    insuranceAddress,
    preAuthorizationRequired: preAuthorizationRequired || false,
    waitingPeriods,
    exclusions,
    limitations,
    createdBy: req.user._id
  });

  // Send notification to patient
  await createAndSendNotification({
    userId: patientId,
    title: 'Insurance Added',
    message: `Your ${insuranceCompany} insurance has been added to your account`,
    type: 'insurance_update',
    metadata: {
      insuranceId: insurance._id,
      insuranceCompany
    }
  });

  res.status(201).json({
    success: true,
    message: 'Insurance record created successfully',
    data: { insurance }
  });
});

// Get patient insurance records
export const getPatientInsurance = catchAsync(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  const insuranceRecords = await (Insurance as any).findByPatient(patientId);

  res.json({
    success: true,
    data: { insurance: insuranceRecords }
  });
});

// Get active insurance for patient
export const getActiveInsurance = catchAsync(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  const activeInsurance = await (Insurance as any).findActiveInsurance(patientId);

  if (!activeInsurance) {
    throw createNotFoundError('Active insurance');
  }

  res.json({
    success: true,
    data: { insurance: activeInsurance }
  });
});

// Get insurance by ID
export const getInsuranceById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const insurance = await (Insurance as any).findById(id)
    .populate('patientId', 'firstName lastName email dateOfBirth')
    .populate('verifiedBy', 'firstName lastName')
    .populate('createdBy', 'firstName lastName');

  if (!insurance) {
    throw createNotFoundError('Insurance');
  }

  res.json({
    success: true,
    data: { insurance }
  });
});

// Update insurance record
export const updateInsurance = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const insurance = await (Insurance as any).findById(id);
  if (!insurance) {
    throw createNotFoundError('Insurance');
  }

  // Update insurance record
  Object.assign(insurance, {
    ...updateData,
    updatedBy: req.user._id
  });

  await insurance.save();

  // Send notification if significant changes
  const significantFields = ['annualMaxBenefit', 'verificationStatus', 'isActive'];
  const changedSignificantField = significantFields.some(field => 
    updateData[field] !== undefined && updateData[field] !== (insurance as any)[field]
  );

  if (changedSignificantField) {
    await createAndSendNotification({
      userId: insurance.patientId.toString(),
      title: 'Insurance Updated',
      message: 'Your insurance information has been updated',
      type: 'insurance_update',
      metadata: {
        insuranceId: insurance._id,
        changes: Object.keys(updateData)
      }
    });
  }

  res.json({
    success: true,
    message: 'Insurance record updated successfully',
    data: { insurance }
  });
});

// Verify insurance
export const verifyInsurance = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { notes, eligibilityStatus, annualMaxBenefit, usedBenefits, coverageDetails } = req.body;

  const insurance = await (Insurance as any).findById(id).populate('patientId', 'firstName lastName email');
  if (!insurance) {
    throw createNotFoundError('Insurance');
  }

  // Update verification status
  await (insurance as any).markAsVerified(req.user._id, notes);

  // Update additional verification details if provided
  if (eligibilityStatus) {
    insurance.eligibilityStatus = eligibilityStatus;
  }
  if (annualMaxBenefit !== undefined) {
    insurance.annualMaxBenefit = annualMaxBenefit;
    insurance.remainingBenefits = Math.max(0, annualMaxBenefit - (insurance.usedBenefits || 0));
  }
  if (usedBenefits !== undefined) {
    insurance.usedBenefits = usedBenefits;
    if (insurance.annualMaxBenefit) {
      insurance.remainingBenefits = Math.max(0, insurance.annualMaxBenefit - usedBenefits);
    }
  }
  if (coverageDetails) {
    Object.assign(insurance, coverageDetails);
  }

  await insurance.save();

  // Send notification to patient
  await createAndSendNotification({
    userId: insurance.patientId._id.toString(),
    title: 'Insurance Verified',
    message: `Your ${insurance.insuranceCompany} insurance has been verified and is active`,
    type: 'insurance_update',
    metadata: {
      insuranceId: insurance._id,
      verificationStatus: 'verified'
    }
  });

  res.json({
    success: true,
    message: 'Insurance verified successfully',
    data: { insurance }
  });
});

// Calculate coverage for treatment
export const calculateCoverage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { treatmentType, amount } = req.body;

  if (!treatmentType || !amount) {
    throw createValidationError('request', 'Treatment type and amount are required');
  }

  const insurance = await (Insurance as any).findById(id);
  if (!insurance) {
    throw createNotFoundError('Insurance');
  }

  if (insurance.verificationStatus !== 'verified') {
    throw createValidationError('insurance', 'Insurance must be verified to calculate coverage');
  }

  const coverage = (insurance as any).calculateCoverage(treatmentType, amount);

  res.json({
    success: true,
    data: { coverage }
  });
});

// Get expiring insurance policies
export const getExpiringInsurance = catchAsync(async (req: Request, res: Response) => {
  const { days = 30 } = req.query;

  const expiringPolicies = await (Insurance as any).findExpiring(Number(days));

  res.json({
    success: true,
    data: { 
      expiringPolicies,
      count: expiringPolicies.length
    }
  });
});

// Get insurance verification statistics
export const getVerificationStatistics = catchAsync(async (req: Request, res: Response) => {
  const stats = await (Insurance as any).getVerificationStatistics();

  // Calculate additional metrics
  const totalInsurance = stats.reduce((sum: number, stat: any) => sum + stat.count, 0);
  const verificationBreakdown = stats.reduce((acc: any, stat: any) => {
    acc[stat._id] = {
      count: stat.count,
      percentage: totalInsurance ? ((stat.count / totalInsurance) * 100).toFixed(1) : 0,
      averageUsedBenefits: Math.round(stat.averageUsedBenefits || 0)
    };
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalInsurance,
      verificationBreakdown,
      stats
    }
  });
});

// Deactivate insurance
export const deactivateInsurance = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const insurance = await (Insurance as any).findById(id).populate('patientId', 'firstName lastName email');
  if (!insurance) {
    throw createNotFoundError('Insurance');
  }

  insurance.isActive = false;
  insurance.verificationStatus = 'expired';
  insurance.verificationNotes = reason || 'Deactivated by admin';
  insurance.updatedBy = req.user._id;
  await insurance.save();

  // Send notification to patient
  await createAndSendNotification({
    userId: insurance.patientId._id.toString(),
    title: 'Insurance Deactivated',
    message: `Your ${insurance.insuranceCompany} insurance has been deactivated`,
    type: 'insurance_update',
    metadata: {
      insuranceId: insurance._id,
      reason
    }
  });

  res.json({
    success: true,
    message: 'Insurance deactivated successfully',
    data: { insurance }
  });
});

// Reset annual benefits (for new benefit year)
export const resetAnnualBenefits = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const insurance = await (Insurance as any).findById(id);
  if (!insurance) {
    throw createNotFoundError('Insurance');
  }

  insurance.usedBenefits = 0;
  if (insurance.annualMaxBenefit) {
    insurance.remainingBenefits = insurance.annualMaxBenefit;
  }
  await insurance.save();

  res.json({
    success: true,
    message: 'Annual benefits reset successfully',
    data: { insurance }
  });
});

// Update benefit usage
export const updateBenefitUsage = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw createValidationError('amount', 'Valid amount is required');
  }

  const insurance = await (Insurance as any).findById(id);
  if (!insurance) {
    throw createNotFoundError('Insurance');
  }

  insurance.usedBenefits = (insurance.usedBenefits || 0) + amount;
  if (insurance.annualMaxBenefit) {
    insurance.remainingBenefits = Math.max(0, insurance.annualMaxBenefit - (insurance.usedBenefits || 0));
  }
  await insurance.save();

  // Check if approaching annual max
  const remainingPercentage = insurance.remainingBenefits && insurance.annualMaxBenefit 
    ? (insurance.remainingBenefits / insurance.annualMaxBenefit) * 100 
    : 0;

  if (remainingPercentage <= 20 && remainingPercentage > 0) {
    await createAndSendNotification({
      userId: insurance.patientId.toString(),
      title: 'Insurance Benefits Low',
      message: `You have ${remainingPercentage.toFixed(1)}% of your annual dental benefits remaining`,
      type: 'insurance_update',
      metadata: {
        insuranceId: insurance._id,
        remainingBenefits: insurance.remainingBenefits
      }
    });
  } else if (remainingPercentage <= 0) {
    await createAndSendNotification({
      userId: insurance.patientId.toString(),
      title: 'Insurance Benefits Exhausted',
      message: 'You have reached your annual dental benefit maximum',
      type: 'insurance_update',
      metadata: {
        insuranceId: insurance._id,
        benefitsExhausted: true
      }
    });
  }

  res.json({
    success: true,
    message: 'Benefit usage updated successfully',
    data: { insurance }
  });
});
