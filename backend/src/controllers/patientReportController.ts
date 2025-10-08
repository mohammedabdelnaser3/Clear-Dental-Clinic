import { Request, Response } from 'express';
import PatientReport from '../models/PatientReport';
import Patient from '../models/Patient';
import { AuthenticatedRequest } from '../types';
import { ApiResponse } from '../types';

// Get patient reports
export const getPatientReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10, search } = req.query;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      } as ApiResponse);
    }

    // Check access permissions
    const user = req.user;
    const hasAccess = 
      user.role === 'admin' || 
      user.role === 'staff' || 
      user.role === 'dentist' ||
      (user.role === 'patient' && patient.userId?.toString() === user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      } as ApiResponse);
    }

    const skip = (Number(page) - 1) * Number(limit);
    let query: any = { patientId };

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    const reports = await PatientReport.find(query)
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await PatientReport.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasNext: skip + Number(limit) < total,
        hasPrev: Number(page) > 1
      }
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching patient reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient reports',
      error: error.message
    } as ApiResponse);
  }
};

// Create patient report
export const createPatientReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { title, description, date, attachments = [], isShared = false } = req.body;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      } as ApiResponse);
    }

    // Check permissions (only staff, dentist, or admin can create reports)
    const user = req.user;
    if (!['admin', 'staff', 'dentist'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      } as ApiResponse);
    }

    const reportData = {
      patientId,
      dentistId: user._id,
      clinicId: patient.preferredClinicId,
      title,
      description,
      date: date || new Date(),
      attachments,
      isShared
    };

    const report = new PatientReport(reportData);
    await report.save();

    // Populate the created report
    await report.populate([
      { path: 'patientId', select: 'firstName lastName email' },
      { path: 'dentistId', select: 'firstName lastName specialization' },
      { path: 'clinicId', select: 'name address' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Patient report created successfully',
      data: report
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error creating patient report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create patient report',
      error: error.message
    } as ApiResponse);
  }
};

// Update patient report
export const updatePatientReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const updateData = req.body;
    
    // Check if report exists
    const report = await PatientReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      } as ApiResponse);
    }

    // Check permissions (only the creator, staff, or admin can update)
    const user = req.user;
    const hasAccess = 
      user.role === 'admin' || 
      user.role === 'staff' || 
      report.dentistId.toString() === user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      } as ApiResponse);
    }

    // Update the report
    const updatedReport = await PatientReport.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patientId', select: 'firstName lastName email' },
      { path: 'dentistId', select: 'firstName lastName specialization' },
      { path: 'clinicId', select: 'name address' }
    ]);

    res.json({
      success: true,
      message: 'Patient report updated successfully',
      data: updatedReport
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error updating patient report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient report',
      error: error.message
    } as ApiResponse);
  }
};

// Delete patient report
export const deletePatientReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    
    // Check if report exists
    const report = await PatientReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      } as ApiResponse);
    }

    // Check permissions (only the creator, staff, or admin can delete)
    const user = req.user;
    const hasAccess = 
      user.role === 'admin' || 
      user.role === 'staff' || 
      report.dentistId.toString() === user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      } as ApiResponse);
    }

    await PatientReport.findByIdAndDelete(reportId);

    res.json({
      success: true,
      message: 'Patient report deleted successfully'
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error deleting patient report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient report',
      error: error.message
    } as ApiResponse);
  }
};

// Get report by ID
export const getPatientReportById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    
    const report = await PatientReport.findById(reportId)
      .populate('patientId', 'firstName lastName email')
      .populate('dentistId', 'firstName lastName specialization')
      .populate('clinicId', 'name address');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      } as ApiResponse);
    }

    // Check access permissions
    const user = req.user;
    const hasAccess = 
      user.role === 'admin' || 
      user.role === 'staff' || 
      user.role === 'dentist' ||
      (user.role === 'patient' && report.patientId.userId?.toString() === user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: report
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching patient report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient report',
      error: error.message
    } as ApiResponse);
  }
};
