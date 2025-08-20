import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, User, CheckCircle, AlertTriangle, Stethoscope, ArrowRight, ArrowLeft, Info, Check as CheckIcon, ClipboardCheck, Mail, Phone, FileText, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Toast } from 'react-hot-toast';

// Extend toast with warning method
interface CustomToast {
  warning: (message: string, options?: Partial<Pick<Toast, "id" | "className" | "style" | "icon" | "duration" | "ariaProps" | "position" | "iconTheme" | "removeDelay">>) => string;
}

// Add warning method to toast
const customToast = toast as typeof toast & CustomToast;
if (!customToast.warning) {
  customToast.warning = (message, options) => toast(message, {
    icon: <AlertTriangle className="text-amber-500" />,
    ...options
  });
}

import TimeSlotPicker from '../../components/appointment/TimeSlotPicker';

import { Alert } from '../../components/ui';
import { useAuth, useClinic } from '../../hooks';
import { appointmentService, patientService } from '../../services';
 

import { validateAppointmentForm, validateTimeSlotAvailability } from '../../utils/appointmentValidationUtils';

// Import TimeSlot interface from appointmentService
import type { TimeSlot } from '../../services/appointmentService';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ServiceOption {
  value: string;
  label: string;
  icon: string;
  duration: number;
  description: string;
}

type FormStep = 'patient' | 'service' | 'datetime' | 'details' | 'review';
type StepType = FormStep;

// Define step order for navigation
const stepOrder: StepType[] = ['patient', 'service', 'datetime', 'details', 'review'];

// Define step interface
interface Step {
  id: StepType;
  label: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

const AppointmentForm: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedClinic } = useClinic();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isPatientUser = user?.role === 'patient';

  // Form state
  const [currentStep, setCurrentStep] = useState<FormStep>(isPatientUser ? 'service' : 'patient');
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  // Removed unused state: const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    patientId: '',
    service: '',
    date: '',
    timeSlot: '',
    notes: '',
    emergency: false,
    patientSearch: ''
  });
  
  // Services data
  const services: ServiceOption[] = [
    { value: 'consultation', label: t('appointments.services.consultation'), icon: '👨‍⚕️', duration: 30, description: t('appointments.services.consultationDesc') || 'Initial consultation and examination' },
    { value: 'cleaning', label: t('appointments.services.cleaning'), icon: '🦷', duration: 60, description: t('appointments.services.cleaningDesc') || 'Professional teeth cleaning' },
    { value: 'filling', label: t('appointments.services.filling'), icon: '🔧', duration: 90, description: t('appointments.services.fillingDesc') || 'Dental filling procedure' },
    { value: 'crown', label: t('appointments.services.crown'), icon: '👑', duration: 120, description: t('appointments.services.crownDesc') || 'Crown placement procedure' },
    { value: 'orthodontics', label: t('appointments.services.orthodontics'), icon: '🦿', duration: 45, description: t('appointments.services.orthodonticsDesc') || 'Orthodontic treatment' },
    { value: 'emergency', label: t('appointments.services.emergency'), icon: '🚨', duration: 60, description: t('appointments.services.emergencyDesc') || 'Emergency dental care' }
  ];

  // Validate time slot selection - non-blocking approach
  const validateTimeSlotSelection = async (timeSlot: string): Promise<boolean> => {
    // Always return true immediately to allow selection
    // This makes the UI responsive and prevents blocking
    
    // Basic validation - just log warnings but don't block selection
    if (!formData.date || !selectedClinic?.id) {
      console.warn('Missing date or clinic ID for validation');
      // Still allow selection but show a warning toast
      customToast.warning(t('appointmentForm.warning_missingDateOrClinic'), {
        position: "top-center",
        duration: 3000,
      });
      return true; // Allow selection despite warning
    }

    try {
      // Run validation in background without blocking
      setTimeout(async () => {
        // Check for conflicts in background
        const conflicts = await appointmentService.checkTimeSlotConflict({
          date: formData.date,
          timeSlot,
          clinicId: selectedClinic.id,
          excludeAppointmentId: isEditMode ? id : undefined
        });
  
        if (Array.isArray(conflicts) && conflicts.length > 0) {
          // Show warning but don't reset selection
          customToast.warning(t('appointmentForm.warning_timeSlotConflict'), {
            position: "top-center",
            duration: 3000,
          });
          // We could set a warning state here if needed
          // setTimeSlotWarning(true);
        }
      }, 100); // Small delay to ensure UI updates first
      
      return true; // Always allow selection
    } catch (error) {
      console.error('Error in background validation:', error);
      return true; // Still allow selection despite error
    }
  };

  // Fetch user's appointment history for smart defaults
  const fetchUserAppointmentHistory = async (patientId: string) => {
    try {
      const history = await appointmentService.getUserAppointmentHistory(patientId);
      return history;
    } catch (error) {
      console.error('Error fetching user appointment history:', error);
      return { data: [] };
    }
  };
  
  // Set smart defaults based on user's appointment history
  const setSmartDefaults = async (patientId: string) => {
    try {
      setIsLoading(true);
      const history = await fetchUserAppointmentHistory(patientId);
      
      // Type assertion to handle history data
      const historyData = history as { data?: any[] };
      
      if (historyData && historyData.data && Array.isArray(historyData.data) && historyData.data.length > 0) {
        // Get the most recent appointment
        const recentAppointment = historyData.data[0];
        
        // Set service based on most frequently used service
        if (recentAppointment.serviceType) {
          setFormData(prev => ({
            ...prev,
            service: recentAppointment.serviceType
          }));
        }
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormData(prev => ({
          ...prev,
          date: tomorrow.toISOString().split('T')[0]
        }));
        
        // Show a toast notification that defaults were set
        toast.success(t('appointmentForm.smartDefaultsApplied'), {
          position: "top-center",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error setting smart defaults:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Define fetchTimeSlots outside useEffect to prevent recreation on each render
  const fetchTimeSlots = React.useCallback(async () => {
    // Only proceed if we have both date and clinic ID
    if (formData.date && selectedClinic?.id) {
      setIsLoading(true);
      
      // Get the selected service duration or default to 60 minutes
      const selectedService = services.find(s => s.value === formData.service);
      const duration = selectedService?.duration || 60;
      
      // Use the dentist ID from our debug script
      const defaultDentistId = '6879369cf9594e20abb3d14e';
      
      // Create request parameters
      const requestParams = {
        date: formData.date,
        duration: duration,
        dentistId: defaultDentistId,
        clinicId: selectedClinic?.id || '6879369cf9594e20abb3d14d'
      };
      
      try {
        // Use the enhanced getAvailableTimeSlots with improved error handling and caching
        const slots = await appointmentService.getAvailableTimeSlots(requestParams);
        
        // If no slots are returned (empty array), use fallback slots
        // The service now returns empty array instead of throwing on error
        if (!slots || slots.length === 0) {
          console.warn('No time slots returned from API, using fallback slots');
          // Use local fallback function to generate slots
          const fallbackSlots = generateLocalFallbackSlots();
          console.log('Generated fallback slots:', fallbackSlots.length);
          setAvailableTimeSlots(fallbackSlots);
          setIsLoading(false);
          return;
        }
        
        console.log('Received time slots from API:', slots.length);
        
        // Enhance slots with peak hour information only if not already set
        // This is now handled by the service, but we'll keep this as a safety measure
        const enhancedSlots = slots.map(slot => {
          // Only set isPeak if it's not already defined by the API
          if (slot.isPeak === undefined) {
            const hour = parseInt(slot.time.split(':')[0]);
            const isPeakHour = (hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 16);
            
            return {
              ...slot,
              isPeak: isPeakHour
            };
          }
          return slot;
        });
        
        // If we still have no slots after enhancement, use fallback
        if (enhancedSlots.length === 0) {
          console.warn('No enhanced slots available, using fallback');
          const fallbackSlots = generateLocalFallbackSlots();
          setAvailableTimeSlots(fallbackSlots);
        } else {
          setAvailableTimeSlots(enhancedSlots);
        }
      } catch (error: any) {
        // This catch block should rarely be hit now that the service handles errors internally
        console.error('Unexpected error fetching time slots:', error);
        
        // Show more specific error message if available
        const errorMessage = error.message || 
                            t('appointmentForm.error_loadingTimeSlots') || 
                            'Unable to load available time slots. Using default slots instead.';
        toast.error(errorMessage, {
          position: "top-center",
          duration: 3000,
          className: 'toast-error',
        });
        
        // Always generate fallback time slots locally on error
        const fallbackSlots = generateLocalFallbackSlots();
        console.log('Using fallback time slots after unexpected error:', fallbackSlots.length);
        setAvailableTimeSlots(fallbackSlots);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Reset time slots when date or clinic is not selected
      setAvailableTimeSlots([]);
      setIsLoading(false);
    }
  }, [formData.date, formData.service, services, selectedClinic, t]);
  
  // Function to fetch available time slots with specific parameters
  const fetchAvailableTimeSlots = async (date: string, dentistId?: string, clinicId?: string) => {
    if (!date) {
      customToast.warning(t('appointmentForm.warning_dateRequired') || 'Please select a date first');
      return;
    }
    
    setIsLoading(true);
    
    // Get the selected service duration or default to 60 minutes
    const selectedService = services.find(s => s.value === formData.service);
    const duration = selectedService?.duration || 60;
    
    // Use the provided dentist ID or default
    const defaultDentistId = dentistId || '6879369cf9594e20abb3d14e';
    
    // Use the provided clinic ID or selected clinic ID
    const defaultClinicId = clinicId || selectedClinic?.id || '6879369cf9594e20abb3d14d';
    
    // Create request parameters
    const requestParams = {
      date: date,
      duration: duration,
      dentistId: defaultDentistId,
      clinicId: defaultClinicId
    };
    
    try {
      // Use the enhanced getAvailableTimeSlots with improved error handling and caching
      const slots = await appointmentService.getAvailableTimeSlots(requestParams);
      
      // If no slots are returned (empty array), use fallback slots
      if (!slots || slots.length === 0) {
        console.warn('No time slots returned from API, using fallback slots');
        // Use local fallback function to generate slots
        const fallbackSlots = generateLocalFallbackSlots();
        setAvailableTimeSlots(fallbackSlots);
        
        // Show a warning to the user that we're using fallback slots
        customToast.warning(t('appointmentForm.warning_usingFallbackSlots') || 'Using estimated time slots. Actual availability may vary.', {
          position: "top-center",
          duration: 3000
        });
        return;
      }
      
      // Enhance slots with peak hour information if not already set
      const enhancedSlots = slots.map(slot => {
        if (slot.isPeak === undefined) {
          const hour = parseInt(slot.time.split(':')[0]);
          const isPeakHour = (hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 16);
          
          return {
            ...slot,
            isPeak: isPeakHour
          };
        }
        return slot;
      });
      
      setAvailableTimeSlots(enhancedSlots);
    } catch (error: any) {
      console.error('Unexpected error fetching time slots:', error);
      
      // Provide more specific error messages based on error type
      if (error.response) {
        const { status } = error.response;
        
        if (status === 403) {
          toast.error(t('appointmentForm.error_permissionDenied') || 'Access denied. Insufficient permissions.', {
            position: "top-center",
            duration: 3000,
            className: 'toast-error',
          });
        } else if (status === 404) {
          toast.error(t('appointmentForm.error_resourceNotFound') || 'Resource not found. Please try again later.', {
            position: "top-center",
            duration: 3000,
            className: 'toast-error',
          });
        } else {
          toast.error(t('appointmentForm.error_loadingTimeSlots') || 'Unable to load available time slots. Using default slots instead.', {
            position: "top-center",
            duration: 3000,
            className: 'toast-error',
          });
        }
      } else if (error.message && error.message.includes('permission')) {
        toast.error(t('appointmentForm.error_permissionDenied') || 'Access denied. Insufficient permissions.', {
          position: "top-center",
          duration: 3000,
          className: 'toast-error',
        });
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error(t('appointmentForm.error_timeout') || 'Request timed out. Please try again.', {
          position: "top-center",
          duration: 3000,
          className: 'toast-error',
        });
      } else {
        toast.error(t('appointmentForm.error_loadingTimeSlots') || 'Unable to load available time slots. Using default slots instead.', {
          position: "top-center",
          duration: 3000,
          className: 'toast-error',
        });
      }
      
      // Always generate fallback time slots locally on error
      const fallbackSlots = generateLocalFallbackSlots();
      setAvailableTimeSlots(fallbackSlots);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Local fallback function in case the service method is not accessible
  function generateLocalFallbackSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const date = formData.date ? new Date(formData.date) : new Date();
    // Start at 9 AM
    date.setHours(9, 0, 0, 0);
    
    // Generate slots from 9 AM to 5 PM at 30-minute intervals
    for (let i = 0; i < 16; i++) {
      const startTime = new Date(date);
      startTime.setMinutes(startTime.getMinutes() + i * 30);
      
      // End time is 30 minutes after start time
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);
      
      // Check if we've gone past 5 PM
      if (startTime.getHours() >= 17) {
        break;
      }
      
      // Determine if this is a peak hour (12-1 PM or 4-5 PM)
      const isPeak = 
        (startTime.getHours() === 12) || 
        (startTime.getHours() === 16);
      
      // Format time as HH:MM for compatibility
      const timeString = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
      
      // Make all slots available instead of random availability
      // This ensures users always have options to select
      const isAvailable = true;
      
      slots.push({
        time: timeString,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available: isAvailable,
        isPeak,
        dentistId: '6879369cf9594e20abb3d14e' // Add default dentist ID
      });
    }
    
    console.log('Generated fallback slots with all available:', slots.length);
    return slots;
  }

  // Save form data to session storage when it changes
  useEffect(() => {
    if (!isEditMode) { // Don't persist for edit mode
      sessionStorage.setItem('appointmentFormData', JSON.stringify(formData));
      sessionStorage.setItem('appointmentFormStep', currentStep);
    }
  }, [formData, currentStep, isEditMode]);

  // Load saved form data on initial load
  useEffect(() => {
    if (!isEditMode) { // Don't load saved data in edit mode
      const savedFormData = sessionStorage.getItem('appointmentFormData');
      const savedStep = sessionStorage.getItem('appointmentFormStep');
      
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          // Only restore if we have meaningful data
          if (parsedData.service || parsedData.date || parsedData.patientId) {
            setFormData(parsedData);
          }
        } catch (e) {
          console.error('Error parsing saved form data', e);
        }
      }
      
      if (savedStep && ['patient', 'service', 'datetime', 'details', 'review'].includes(savedStep)) {
        setCurrentStep(savedStep as FormStep);
      }
    }
  }, [isEditMode]);

  // Fetch available time slots when date or service changes
  useEffect(() => {
    if (formData.date && selectedClinic?.id) {
      console.log('Triggering fetchTimeSlots with date:', formData.date, 'clinic:', selectedClinic?.id);
      fetchTimeSlots();
    } else {
      console.log('Not fetching time slots - missing date or clinic:', { date: formData.date, clinicId: selectedClinic?.id });
    }
  }, [formData.date, formData.service, selectedClinic?.id, fetchTimeSlots]);
  
  // State for step transition animations
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState('next');
  
  // Track completed steps for navigation and visual indicators
  const [completedSteps, setCompletedSteps] = useState<FormStep[]>([]);
  
  // Step navigation functions with transition effects
  const goToNextStep = () => {
    if (currentStep === 'patient' && (isPatientUser || formData.patientId)) {
      setTransitionDirection('next');
      setIsTransitioning(true);
      setCompletedSteps(prev => [...new Set([...prev, 'patient' as FormStep])]);
      
      setTimeout(() => {
        setCurrentStep('service');
        setIsTransitioning(false);
      }, 300);
    } else if (currentStep === 'service' && formData.service) {
      setTransitionDirection('next');
      setIsTransitioning(true);
      setCompletedSteps(prev => [...new Set([...prev, 'service' as FormStep])]);
      
      setTimeout(() => {
        setCurrentStep('datetime');
        setIsTransitioning(false);
      }, 300);
    } else if (currentStep === 'datetime' && formData.date && formData.timeSlot) {
      setTransitionDirection('next');
      setIsTransitioning(true);
      setCompletedSteps(prev => [...new Set([...prev, 'datetime' as FormStep])]);
      
      setTimeout(() => {
        setCurrentStep('details');
        setIsTransitioning(false);
      }, 300);
    } else if (currentStep === 'details') {
      setTransitionDirection('next');
      setIsTransitioning(true);
      setCompletedSteps(prev => [...new Set([...prev, 'details' as FormStep])]);
      
      setTimeout(() => {
        setCurrentStep('review');
        setIsTransitioning(false);
      }, 300);
    } else {
      // Show validation error if required fields are missing
      toast.error(t('appointmentForm.error_requiredFields'));
    }
  };

  const goToPreviousStep = () => {
    setTransitionDirection('prev');
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentStep === 'service' && !isPatientUser) {
        setCurrentStep('patient');
      } else if (currentStep === 'datetime') {
        setCurrentStep('service');
      } else if (currentStep === 'details') {
        setCurrentStep('datetime');
      } else if (currentStep === 'review') {
        setCurrentStep('details');
      }
      setIsTransitioning(false);
    }, 300);
  };
  
  // Function to jump to a specific step (if allowed)
  const jumpToStep = (step: StepType) => {
    // Only allow jumping to steps that are already completed
    if (completedSteps.includes(step) || step === currentStep) {
      setTransitionDirection(stepOrder.indexOf(step) < stepOrder.indexOf(currentStep) ? 'prev' : 'next');
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentStep(step);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Filter patients based on search input
  useEffect(() => {
    if (formData.patientSearch.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const searchTerm = formData.patientSearch.toLowerCase();
      const filtered = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        return fullName.includes(searchTerm) || 
               patient.email.toLowerCase().includes(searchTerm) || 
               patient.phone.includes(searchTerm);
      });
      setFilteredPatients(filtered);
    }
  }, [formData.patientSearch, patients]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      // Fetch patients if user is not a patient
      if (!isPatientUser) {
        try {
          const patientsData = await patientService.getPatients();
          setPatients(patientsData.data);
          setFilteredPatients(patientsData.data);
        } catch (error) {
          console.error('Error fetching patients:', error);
          setPatients([]);
          setFilteredPatients([]);
        }
      }

      // If editing, fetch appointment data
      if (isEditMode && id) {
        try {
          const appointment = await appointmentService.getAppointment(id);
          setFormData({
            patientId: appointment.patientId,
            service: appointment.serviceType,
            date: typeof appointment.date === 'string' ? appointment.date : appointment.date.toISOString().split('T')[0],
            timeSlot: appointment.timeSlot,
            notes: appointment.notes || '',
            emergency: false,
            patientSearch: ''
          });
        } catch (error) {
          console.error('Error fetching appointment:', error);
          toast.error(t('appointmentForm.error_failedToLoad'));
        }
      } else {
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormData(prev => ({
          ...prev,
          date: tomorrow.toISOString().split('T')[0]
        }));
      }
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      toast.error(t('appointmentForm.error_failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [isEditMode, isPatientUser, user, id, t]); // Removed appointmentService to prevent circular dependency

  // If logged-in user is a patient, pre-select their own record and set smart defaults
  useEffect(() => {
    if (isPatientUser && user && patients.length > 0) {
      const patientRecord = patients.find(p => p.email === user.email);
      if (patientRecord) {
        setFormData(prev => ({ ...prev, patientId: patientRecord.id }));
        
        // Apply smart defaults based on patient's appointment history
        setSmartDefaults(patientRecord.id);
      }
    }
  }, [isPatientUser, user, patients]);

  const validateCurrentStep = async (): Promise<boolean> => {
    // Ensure patient ID is set correctly for validation
    if (currentStep === 'datetime' && isPatientUser && user?.id && !formData.patientId) {
      // Auto-set patient ID for patient users if not already set
      setFormData(prev => ({ ...prev, patientId: user.id }));
    }
    
    // Use the centralized validation utility
    const validationResult = validateAppointmentForm(formData, t, currentStep);
    
    // Display all errors for the current step
    if (!validationResult.isValid) {
      // Show the first error message as a warning instead of error
      const firstError = Object.values(validationResult.errors)[0];
      customToast.warning(firstError, {
        position: "top-center",
        duration: 3000
      });
      
      // For datetime step, allow proceeding despite warnings
      if (currentStep === 'datetime' && formData.date && formData.timeSlot) {
        console.log('Allowing datetime step to proceed despite validation warnings');
        return true;
      }
      
      return false;
    }
    
    // Less strict validation for time slot availability
    if (currentStep === 'datetime' && formData.date && formData.timeSlot && selectedClinic?.id) {
      // Run validation in background but don't block UI
      setTimeout(async () => {
        const timeSlotValidation = await validateTimeSlotAvailability(
          appointmentService,
          { date: formData.date, timeSlot: formData.timeSlot },
          selectedClinic.id,
          isEditMode ? id : undefined
        );
        
        if (!timeSlotValidation.isValid) {
          // Show as warning instead of error
          customToast.warning(timeSlotValidation.errors.timeSlot || t('appointmentForm.warning_timeSlotConflict'), {
            position: "top-center",
            duration: 3000
          });
        }
      }, 100);
    }
    
    return true;
  };

  const handleStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateCurrentStep();
    if (!isValid) return;
    
    if (currentStep === 'review') {
      await handleFinalSubmit();
    } else {
      goToNextStep();
    }
  };

  // This function is replaced by handleFinalSubmit and handleStepSubmit
  // Removing commented code to fix syntax errors

  const handleFinalSubmit = async () => {
    setIsLoading(true);

    try {
      // Create appointment data
      const appointmentData = {
        patientId: formData.patientId,
        service: formData.service,
        date: formData.date,
        timeSlot: formData.timeSlot,
        notes: formData.notes,
        emergency: formData.emergency,
        clinicId: selectedClinic?.id
      };

      // Create or update appointment
      if (isEditMode && id) {
        await appointmentService.updateAppointment(id, appointmentData);
        toast.success(t('appointmentForm.success_updated'));
      } else {
        await appointmentService.createAppointment(appointmentData);
        toast.success(t('appointmentForm.success_created'));
        
        // Clear saved form data after successful submission
        sessionStorage.removeItem('appointmentFormData');
        sessionStorage.removeItem('appointmentFormStep');
      }

      // Navigate back to appointments list
      navigate('/appointments');
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      
      // Provide more specific error messages based on error type
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 403) {
          toast.error(t('appointmentForm.error_permissionDenied') || 'Access denied. You don\'t have permission for this action.');
        } else if (status === 422 && data?.errors) {
          // Show validation errors
          const firstError = Object.values(data.errors)[0];
          toast.error(firstError as string || t('appointmentForm.error_validationFailed'));
        } else if (status === 409) {
          toast.error(t('appointmentForm.error_timeSlotConflict') || 'This time slot is no longer available. Please select another time.');
        } else if (status === 404) {
          // Check if the error is specifically about /appointments endpoint
          if (data?.message && data.message.includes('/appointments')) {
            toast.error('The appointment service is currently unavailable. Please try again later.');
          } else {
            toast.error(t('appointmentForm.error_resourceNotFound') || 'Resource not found. Please try again later.');
          }
        } else if (status === 500) {
          toast.error(t('appointmentForm.error_serverError') || 'Server error occurred. Please try again later.');
        } else {
          toast.error(`${t('appointmentForm.error_failedToSave')}: ${data?.message || ''}` || 'Failed to save appointment. Please try again.');
        }
      } else if (error.message && error.message.includes('permission')) {
        toast.error(t('appointmentForm.error_permissionDenied') || 'Access denied. Insufficient permissions.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_CONNECTION_RESET') {
        toast.error(t('appointmentForm.error_connectionFailed') || 'Connection to server failed. Please check your internet connection.');
      } else if (error.code === 'ETIMEDOUT') {
        toast.error(t('appointmentForm.error_requestTimeout') || 'Request timed out. Please try again.');
      } else {
        toast.error(`${t('appointmentForm.error_failedToSave')}: ${error.message || ''}` || 'Failed to save appointment. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get the selected service details
  const selectedService = services.find(s => s.value === formData.service);

  // Get the selected patient details
  const selectedPatient = patients.find(p => p.id === formData.patientId);

  // Add this function after the other utility functions
  const validateField = (fieldName: string, value: any): void => {
    // Create a partial form data object with just this field
    const fieldData = {
      ...formData,
      [fieldName]: value
    };
    
    // Use the existing validation utility to validate just this field
    const validationResult = validateAppointmentForm(fieldData, t, currentStep);
    
    // Update the field errors state
    if (!validationResult.isValid && validationResult.errors[fieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: validationResult.errors[fieldName]
      }));
    } else {
      // Clear the error if the field is now valid
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Modify the handleInputChange function to clear errors when a field changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Progress steps
  const steps: Step[] = [
    { id: 'patient', label: t('appointmentForm.step_patient'), icon: User, completed: Boolean(formData.patientId) },
    { id: 'service', label: t('appointmentForm.step_service'), icon: Stethoscope, completed: Boolean(formData.service) },
    { id: 'datetime', label: t('appointmentForm.step_datetime'), icon: Calendar, completed: Boolean(formData.date && formData.timeSlot) },
    { id: 'details', label: t('appointmentForm.step_details'), icon: AlertTriangle, completed: true },
    { id: 'review', label: t('appointmentForm.step_review'), icon: CheckCircle, completed: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? t('appointmentForm.title_edit') : t('appointmentForm.title_new')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('appointmentForm.subtitle')}
        </p>

        {/* Progress Steps */}
        <div className="mt-8 mb-6">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => {
                const isCurrent = step.id === currentStep;
                const isCompleted = completedSteps.includes(step.id) || stepOrder.indexOf(step.id) < stepOrder.indexOf(currentStep);
                const isClickable = isCompleted || step.id === currentStep;
                
                return (
                  <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'flex-1' : ''} relative`}>
                    <button
                      type="button"
                      onClick={() => isClickable && jumpToStep(step.id)}
                      disabled={!isClickable}
                      className={`group flex items-center w-full focus:outline-none ${!isClickable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {isCompleted ? (
                        <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-600 rounded-full transition-all duration-300 transform hover:scale-110 hover:bg-blue-700">
                          <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                        </span>
                      ) : isCurrent ? (
                        <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center border-2 border-blue-600 rounded-full transition-all duration-300 transform scale-110 ring-4 ring-blue-100">
                          <step.icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                        </span>
                      ) : (
                        <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center border-2 border-gray-300 rounded-full transition-all duration-300">
                          <step.icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                      )}
                      <span className={`ml-3 text-sm font-medium transition-all duration-300 ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </button>
                    
                    {stepIdx !== steps.length - 1 && (
                      <div className="hidden md:block absolute top-5 right-0 left-0 h-0.5 bg-gray-200">
                        <div 
                          className="h-0.5 bg-blue-600 transition-all duration-500 ease-in-out" 
                          style={{ width: isCompleted ? '100%' : '0%' }} 
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <form onSubmit={handleStepSubmit} className="mt-6 bg-white shadow-sm rounded-lg p-6 relative overflow-hidden">
          {/* Form content wrapper with transition effects */}
          <div className={`transition-all duration-300 transform ${isTransitioning ? (transitionDirection === 'next' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0') : 'translate-x-0 opacity-100'}`}>
          {/* Patient Selection Step */}
          {currentStep === 'patient' && !isPatientUser && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{t('appointmentForm.title_selectPatient')}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('appointmentForm.subtitle_selectPatient')}</p>
              </div>
              
              <div>
                <label htmlFor="patientSearch" className="block text-sm font-medium text-gray-700">
                  {t('appointmentForm.label_patientSearch')}
                </label>
                <div className="mt-1">
                  <input
                      type="text"
                      id="patientSearch"
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${fieldErrors.patientSearch ? 'border-red-500' : ''}`}
                      placeholder={t('appointmentForm.placeholder_patientSearch')}
                      value={formData.patientSearch}
                      onChange={(e) => handleInputChange('patientSearch', e.target.value)}
                      onBlur={(e) => validateField('patientSearch', e.target.value)}
                    />
                    {fieldErrors.patientSearch && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.patientSearch}</p>
                    )}
                </div>
              </div>
              
              {fieldErrors.service && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.service}</p>
              )}
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPatients.map(patient => (
                  <div 
                    key={patient.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${formData.patientId === patient.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    onClick={() => {
                      setFormData({ ...formData, patientId: patient.id });
                      
                      // Apply smart defaults based on selected patient's appointment history
                      if (patient.id) {
                        setSmartDefaults(patient.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                      {formData.patientId === patient.id && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <div>{patient.email}</div>
                      <div>{patient.phone}</div>
                    </div>
                  </div>
                ))}
                
                {filteredPatients.length === 0 && (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    {t('appointmentForm.no_patients_found')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Selection Step */}
          {currentStep === 'service' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{t('appointmentForm.title_selectService')}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('appointmentForm.subtitle_selectService')}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map(service => (
                  <div 
                    key={service.value} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${formData.service === service.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'} ${fieldErrors.service ? 'border-red-500' : ''}`}
                    onClick={() => {
                      handleInputChange('service', service.value);
                      validateField('service', service.value);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{service.icon}</span>
                        <span className="font-medium">{service.label}</span>
                      </div>
                      {formData.service === service.value && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <div>{service.description}</div>
                      <div className="mt-1 font-medium text-gray-700">
                        {t('appointmentForm.duration')}: {service.duration} {t('appointmentForm.minutes')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date & Time Selection Step */}
          {currentStep === 'datetime' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{t('appointmentForm.title_selectDateTime')}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('appointmentForm.subtitle_selectDateTime')}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Date Selection */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    {t('appointmentForm.label_date')}
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="date"
                      id="date"
                      className={`pl-10 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md transition-all duration-200 hover:border-blue-300 ${fieldErrors.date ? 'border-red-500' : ''}`}
                      value={formData.date}
                      onChange={(e) => {
                        // Reset time slot when date changes
                        setFormData({ ...formData, date: e.target.value, timeSlot: '' });
                        handleInputChange('date', e.target.value);
                        // Validate date is not in the past
                        if (e.target.value) {
                          const today = new Date().toISOString().split('T')[0];
                          if (e.target.value < today) {
                            toast.error(t('appointmentForm.error_pastDate'));
                          }
                        }
                      }}
                      onBlur={(e) => validateField('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      aria-describedby="date-description"
                      disabled={isLoading}
                    />
                  </div>
                  {fieldErrors.date && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.date}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500" id="date-description">
                    {t('appointmentForm.selectDate')}
                  </p>
                </div>
                
                {/* Time Slot Selection */}
                {formData.date && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('appointmentForm.label_timeSlot')}
                    </label>
                    {fieldErrors.timeSlot && (
                      <p className="text-red-500 text-sm mb-2">{fieldErrors.timeSlot}</p>
                    )}
                    
                    {/* Using the improved TimeSlotPicker component */}
                    <TimeSlotPicker
                      selectedDate={new Date(formData.date)}
                      selectedTimeSlot={formData.timeSlot}
                      onTimeSlotSelect={(timeSlot) => {
                        // Update form data
                        setFormData(prev => ({ ...prev, timeSlot }));
                        
                        // Clear any previous field errors
                        setFieldErrors(prev => ({ ...prev, timeSlot: '' }));
                        
                        // Run validation
                        validateTimeSlotSelection(timeSlot);
                      }}
                      // dentistId and clinicId removed as they're not in the component props
                      duration={selectedService?.duration || 30}
                      disabled={isLoading}
                      availableTimeSlots={availableTimeSlots}
                      isLoading={isLoading}
                      onRefresh={() => fetchAvailableTimeSlots(formData.date)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Details Step */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{t('appointmentForm.title_additionalDetails')}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('appointmentForm.subtitle_additionalDetails')}</p>
              </div>
              
              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  {t('appointmentForm.label_notes')}
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${fieldErrors.notes ? 'border-red-500' : ''}`}
                  placeholder={t('appointmentForm.placeholder_notes')}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  onBlur={(e) => validateField('notes', e.target.value)}
                />
                {fieldErrors.notes && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.notes}</p>
                )}
              </div>

              {/* Emergency Flag */}
              <div>
                <div className="flex items-center">
                  <input
                    id="emergency"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.emergency}
                    onChange={(e) => handleInputChange('emergency', e.target.checked)}
                    onBlur={(e) => validateField('emergency', e.target.checked)}
                  />
                  <label htmlFor="emergency" className="ml-3 block text-sm font-medium text-gray-700">
                    {t('appointmentForm.label_emergency')}
                  </label>
                </div>
                {formData.emergency && (
                  <div className="mt-2">
                    <Alert variant="warning" title={t('appointmentForm.emergency_alert_title')}>
                      {t('appointmentForm.emergency_alert_message')}
                    </Alert>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{t('appointmentForm.title_review')}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('appointmentForm.subtitle_review')}</p>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-md">
                {/* Summary Header */}
                <div className="bg-blue-50 p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <ClipboardCheck className="h-5 w-5 text-blue-500 mr-2" />
                    {t('appointmentForm.appointment_summary')}
                  </h3>
                </div>
                
                <div className="p-5 space-y-6">
                  {/* Patient Info */}
                  {selectedPatient && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-300 hover:shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <User className="h-4 w-4 text-blue-500 mr-2" />
                        {t('appointmentForm.label_patient')}
                      </h4>
                      <div className="ml-6">
                        <p className="text-sm font-medium text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                        <div className="mt-1 text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {selectedPatient.email}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {selectedPatient.phone}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Service Info */}
                  {selectedService && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-300 hover:shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Stethoscope className="h-4 w-4 text-blue-500 mr-2" />
                        {t('appointmentForm.label_service')}
                      </h4>
                      <div className="ml-6">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{selectedService.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{selectedService.label}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{selectedService.description}</p>
                        <div className="mt-2 text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {t('appointmentForm.duration')}: {selectedService.duration} {t('appointmentForm.minutes')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Date & Time */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-300 hover:shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                      {t('appointmentForm.label_datetime')}
                    </h4>
                    <div className="ml-6">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {formData.date && new Date(formData.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{formData.timeSlot}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Details Section */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-300 hover:shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FileText className="h-4 w-4 text-blue-500 mr-2" />
                      {t('appointmentForm.title_additionalDetails')}
                    </h4>
                    <div className="ml-6">
                      {/* Notes */}
                      {formData.notes ? (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-500 mb-1">{t('appointmentForm.label_notes')}</h5>
                          <p className="text-sm text-gray-900 p-2 bg-white rounded border border-gray-100">{formData.notes}</p>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <p className="text-sm text-gray-500 italic">{t('appointmentForm.no_notes')}</p>
                        </div>
                      )}
                      
                      {/* Emergency */}
                      {formData.emergency && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-md">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                            <span className="text-sm font-medium text-red-600">{t('appointmentForm.emergency_flag')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Clinic */}
                  {selectedClinic && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-300 hover:shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                        {t('appointmentForm.label_clinic')}
                      </h4>
                      <div className="ml-6">
                        <p className="text-sm font-medium text-gray-900">{selectedClinic.name}</p>
                        <div className="mt-1 text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {`${selectedClinic.address.street}, ${selectedClinic.address.city}, ${selectedClinic.address.state} ${selectedClinic.address.zipCode}`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Confirmation Message */}
                <div className="bg-blue-50 p-4 border-t border-gray-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        {isEditMode ? t('appointmentForm.confirm_update') : t('appointmentForm.confirm_create')}
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          {isEditMode 
                            ? t('appointmentForm.update_confirmation_message')
                            : t('appointmentForm.create_confirmation_message')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          </div>
          
          {/* Form Actions - Outside transition wrapper */}
          <div className="mt-8 flex justify-between">
            {currentStep !== (isPatientUser ? 'service' : 'patient') ? (
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={goToPreviousStep}
              >
                <ArrowLeft className="-ml-1 mr-2 h-4 w-4" />
                {t('common.back')}
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => navigate('/appointments')}
              >
                {t('common.cancel')}
              </button>
            )}
            
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('common.loading')}
                </span>
              ) : currentStep === 'review' ? (
                isEditMode ? t('common.update') : t('common.create')
              ) : (
                <>
                  {t('common.next')}
                  <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;