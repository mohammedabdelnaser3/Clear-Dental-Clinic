import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

import { Alert } from '../../components/ui';
import { useAuth, useClinic } from '../../hooks';
import { appointmentService, patientService } from '../../services';
 

import { validateAppointmentForm, validateTimeSlotAvailability } from '../../utils/appointmentValidationUtils';


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
  // Use the actual clinic ID from the database (Dr. Gamal Abdel Nasser Center)
  const FALLBACK_CLINIC_ID = '687468107e70478314c346be';
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Enhanced debouncing and circuit breaker refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchRequestRef = useRef<AbortController | null>(null);
  const lastFetchParamsRef = useRef<string>('');
  const circuitBreakerRef = useRef<{
    failureCount: number;
    lastFailureTime: number;
    isOpen: boolean;
  }>({ failureCount: 0, lastFailureTime: 0, isOpen: false });
  const [formData, setFormData] = useState({
    patientId: '',
    dentistId: '',
    service: '',
    date: new Date().toISOString().split('T')[0], // Default to today's date
    timeSlot: '',
    notes: '',
    emergency: false,
    patientSearch: '',
    clinicId: FALLBACK_CLINIC_ID
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
  
  // Sync clinicId with selectedClinic to ensure consistency
  
  // Enhanced function to fetch available time slots with better error handling
  const fetchTimeSlotsImmediate = useCallback(async ({
    date,
    clinicId, 
    duration,
    dentistId
  }: {
    date: string;
    clinicId: string;
    duration: number;
    dentistId?: string;
  }) => {
    // Clear any previous error states
    setApiError('');
    // Removed: setIsDentistError(false);
    
    // Cancel any existing request to prevent race conditions
    if (fetchRequestRef.current) {
      fetchRequestRef.current.abort();
    }
    
    // Create new abort controller
    fetchRequestRef.current = new AbortController();
    
    setIsLoading(true);
    
    try {
      // Use parameters for logging/debugging (fixes linter warning)
      console.debug(`Fetching time slots for clinic ${clinicId} on ${date} with duration ${duration}${dentistId ? ` and dentist ${dentistId}` : ''}`);
      
      // Clear the request ref since it completed successfully
      fetchRequestRef.current = null;
      
      
      // Success! Reset circuit breaker
      const circuitBreaker = circuitBreakerRef.current;
      circuitBreaker.failureCount = 0;
      circuitBreaker.isOpen = false;
      
      setApiError(''); // Clear any previous errors
      
    } catch (error: any) {
      console.error('Error fetching time slots:', error);
      
      // Clear the request ref
      fetchRequestRef.current = null;
      
      // Update circuit breaker on any error
      const circuitBreaker = circuitBreakerRef.current;
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();
      
      // Open circuit breaker after 3 consecutive failures
      if (circuitBreaker.failureCount >= 3) {
        circuitBreaker.isOpen = true;
      }
      
      // Handle specific error cases based on enhanced error messages
      if (error.message && error.message.includes('dentist')) {
        // Removed: setIsDentistError(true);
        // More specific error message based on the type of dentist issue
        if (error.message.includes('No dentists are scheduled')) {
          setApiError('No dentists are scheduled to work on this day. Please select a different date or contact the clinic to confirm availability.');
        } else {
          setApiError('No dentists are available for this clinic. Please contact administration to assign dentists or select a different clinic.');
        }
        
        // Don't show fallback slots for dentist availability issues
        // setAvailableTimeSlots([]);
        
        // Reduce toast frequency when circuit breaker is active
        if (circuitBreaker.failureCount < 3) {
          toast.error(error.message, {
        position: "top-center",
            duration: 5000,
        className: 'toast-error',
      });
        }
      } else if (error.message && error.message.includes('Authentication')) {
        setApiError('Session expired. Please log in again.');
        // setAvailableTimeSlots([]);
        
        toast.error('Session expired. Please log in again.', {
          position: "top-center",
          duration: 4000,
          className: 'toast-error',
        });
      } else {
        // Other errors - show appropriate message
        const errorMessage = error.message || 'Unable to load available time slots.';
        setApiError(errorMessage);
        // setAvailableTimeSlots([]);
        
        // Reduce toast frequency when circuit breaker is active
        if (circuitBreaker.failureCount < 3) {
          toast.error(errorMessage, {
            position: "top-center",
            duration: 4000,
            className: 'toast-error',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTimeSlots = useCallback(() => {
    const clinicId = formData.clinicId || selectedClinic?.id || FALLBACK_CLINIC_ID;
    
    if (!formData.date) {
      return;
    }
    
    if (!clinicId) {
      console.warn('Cannot fetch time slots - missing clinic ID');
      return;
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      console.error('Invalid date format:', formData.date);
      return;
    }
    
    // Get the selected service duration or default to 60 minutes
    const selectedService = services.find(s => s.value === formData.service);
    const duration = selectedService?.duration || 60;
    
    // Create unique request signature to prevent duplicate calls
    const requestSignature = `${formData.date}-${duration}-${clinicId}`;
    
    // Skip if this exact request was just made
    if (lastFetchParamsRef.current === requestSignature) {
        return;
    }
      
    // Circuit breaker logic for repeated failures
    const now = Date.now();
    const circuitBreaker = circuitBreakerRef.current;
    
    if (circuitBreaker.isOpen) {
      // Check if circuit breaker should reset (after 30 seconds)
      if (now - circuitBreaker.lastFailureTime > 30000) {
        circuitBreaker.isOpen = false;
        circuitBreaker.failureCount = 0;
        } else {
        return;
      }
    }
    
    // Clear existing timer to prevent overlapping requests
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Update request signature and set debounced timer
    lastFetchParamsRef.current = requestSignature;
    
    debounceTimerRef.current = setTimeout(() => {
      const params = {
        date: formData.date,
        duration: duration,
        dentistId: '', // Backend handles dentist availability
        clinicId: clinicId
      };
      
      fetchTimeSlotsImmediate(params);
    }, 500); // Increased to 500ms for better debouncing
  }, [formData.date, formData.service, formData.clinicId, selectedClinic?.id]);

  // Enhanced memoized form data to prevent unnecessary fetchTimeSlots calls
  const memoizedFormData = useMemo(() => {
    const effectiveClinicId = FALLBACK_CLINIC_ID;
    // Get service duration or default to 60 (services array is static)
    const duration = formData.service === 'cleaning' ? 60 : formData.service === 'examination' ? 30 : 60;
    
    return {
      date: formData.date,
      service: formData.service,
      clinicId: effectiveClinicId,
      duration,
      hasDate: !!formData.date && formData.date !== '',
      hasService: !!formData.service && formData.service !== '',
      hasClinic: !!effectiveClinicId,
      // Include a stability key to prevent unnecessary changes - only include essential fields
      stabilityKey: `${formData.date}-${duration}-${effectiveClinicId}`
    };
  }, [formData.date, formData.service, FALLBACK_CLINIC_ID]);

  // Simplified useEffect - debouncing is now handled in fetchTimeSlots
  useEffect(() => {
    // Minimal logging in development mode
    
    // Only trigger fetch if we have required data - fetchTimeSlots handles all validation
    if (memoizedFormData.hasDate && memoizedFormData.hasClinic) {
      fetchTimeSlots();
    } else {
      // Clear time slots if missing required data
      setApiError('');
    }
  }, [memoizedFormData.stabilityKey, fetchTimeSlots]);
  
  // Removed unused fetchAvailableTimeSlots function - now using optimized fetchTimeSlots with circuit breaker
  
  // Fallback slot generation removed - using proper error handling instead

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

  // Sync clinicId when selectedClinic changes - Removed as we're hardcoding the clinic ID
  /* useEffect(() => {
    if (selectedClinic?.id && !formData.clinicId) {
      setFormData(prev => ({
        ...prev,
        clinicId: selectedClinic.id
      }));
    }
  }, [selectedClinic?.id, formData.clinicId]); */
  // Set clinic ID to hardcoded value
  
  // Remove redundant useEffect - time slot fetching is now handled by the optimized fetchTimeSlots function
  // with debouncing in the memoized form data useEffect above
  
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

      // Fetch patients based on user type
      // Note: Dentists are auto-assigned by backend, no need to fetch them for selection
      if (!isPatientUser) {
        // For staff/admin users: fetch all patients for selection
        try {
          const patientsData = await patientService.getPatients();
          setPatients(patientsData.data);
          setFilteredPatients(patientsData.data);
        } catch (error) {
          console.error('Error fetching patients:', error);
          setPatients([]);
          setFilteredPatients([]);
        }
      } else if (isPatientUser && user?.id) {
        // For patient users: fetch their patient record using userId
        try {
          const patientsData = await patientService.getPatientsByUserId(user.id);
          
          let patientRecord = patientsData.data.length > 0 ? patientsData.data[0] : null;
          
          if (!patientRecord) {
            // Create a patient record for this user if it doesn't exist
            const newPatientData = {
              firstName: user.firstName || user.email.split('@')[0],
              lastName: user.lastName || '',
              email: user.email,
              phone: user.phone || '0000000000', // Provide default phone if not available
              dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : new Date('1990-01-01'), // Provide default DOB
              gender: 'male' as const, // Default gender
              address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
              },
              medicalHistory: {
                allergies: [],
                medications: [],
                conditions: [],
                notes: ''
              },
              treatmentRecords: [], // Add required treatment records property
              preferredClinicId: FALLBACK_CLINIC_ID, // Use fallback clinic
              userId: user.id, // Link to user account
            };
            
            const createdPatient = await patientService.createPatient(newPatientData);
            patientRecord = createdPatient; // createPatient returns the patient data directly
          }
          
          // Set the patient in the array and pre-select it
          setPatients([patientRecord]);
          setFilteredPatients([patientRecord]);
          setFormData(prev => ({ ...prev, patientId: patientRecord.id }));
          
        } catch (error) {
          console.error('Error fetching/creating patient record for logged-in user:', error);
          // Show error message - patient record is required
          customToast.error(t('appointmentForm.error_patientRecordRequired') || 'Patient record is required. Please contact support to create your patient profile.');
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
            dentistId: appointment.dentistId || '',
            service: appointment.serviceType,
            date: typeof appointment.date === 'string' ? appointment.date : appointment.date.toISOString().split('T')[0],
            timeSlot: appointment.timeSlot,
            notes: appointment.notes || '',
            emergency: false,
            patientSearch: '',
            clinicId: appointment.clinicId
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

  // Patient record selection is now handled in fetchInitialData
  // This useEffect applies smart defaults once the patient record is loaded
  useEffect(() => {
    if (isPatientUser && user && formData.patientId && patients.length > 0) {
      console.log('Applying smart defaults for patient user with patientId:', formData.patientId);
        
        // Apply smart defaults based on patient's appointment history
      setSmartDefaults(formData.patientId);
      
      // Clear any previous patient selection errors
      setFieldErrors(prev => ({
        ...prev,
        patientId: '' // Clear any previous errors
      }));
    }
  }, [isPatientUser, user, formData.patientId, patients, t]);

  const validateCurrentStep = async (): Promise<boolean> => {
    // Create a copy of formData to ensure we have the latest data
    let currentFormData = { ...formData };
    
    // For patient users, patient ID should already be set by fetchInitialData
    // If not set, there was an error during initialization
    if (currentStep === 'datetime' && isPatientUser && user && !formData.patientId) {
      // Patient ID should have been set during initialization
      // Show error and suggest refreshing
      customToast.error(t('appointmentForm.error_patientRecordNotLoaded') || 'Patient record not loaded. Please refresh the page and try again.');
        return false;
    }
    
    
    // Use the centralized validation utility with the current form data
    const validationResult = validateAppointmentForm(currentFormData, t, currentStep);
    
    
    // Display all errors for the current step
    if (!validationResult.isValid) {
      console.log('🐛 DEBUG - VALIDATION FAILED - Specific errors:', validationResult.errors);
      // Show the first error message as a warning instead of error
      const firstError = Object.values(validationResult.errors)[0];
      customToast.warning(firstError, {
        position: "top-center",
        duration: 3000
      });
      
      // For datetime step, allow proceeding despite warnings if date and timeSlot are set
      if (currentStep === 'datetime' && formData.date && formData.timeSlot) {
        console.log('🐛 DEBUG - Allowing datetime step to proceed despite validation warnings');
        console.log('🐛 DEBUG - Date:', formData.date, 'TimeSlot:', formData.timeSlot);
        console.log('🐛 DEBUG - PatientId status:', formData.patientId);
        
        // For non-patient users, patientId validation should happen in the patient step, not datetime step
        if (!isPatientUser && !formData.patientId) {
          console.log('🐛 DEBUG - Non-patient user without patientId - this might be the issue');
          // Show specific error for non-patient users
          customToast.error(t('appointmentForm.error_selectPatientFirst') || 'Please go back and select a patient first.');
          return false;
        }
        
        return true;
      }
      
      return false;
    }
    
    // Less strict validation for time slot availability
    if (currentStep === 'datetime' && formData.date && formData.timeSlot) {
      const clinicId = FALLBACK_CLINIC_ID;
      // Run validation in background but don't block UI
      setTimeout(async () => {
        const timeSlotValidation = await validateTimeSlotAvailability(
          appointmentService,
          { date: formData.date, timeSlot: formData.timeSlot },
          clinicId,
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
    
    console.log('🐛 DEBUG - Validation passed, returning true');
    return true;
  };

  const handleStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form step submit:', currentStep);
    
    const isValid = await validateCurrentStep();
    if (!isValid) {
      console.log('Validation failed for step:', currentStep);
      return;
    }
    
    if (currentStep === 'review') {
      await handleFinalSubmit();
    } else {
      goToNextStep();
    }
  };

  // This function is replaced by handleFinalSubmit and handleStepSubmit
  // Removing commented code to fix syntax errors

  // Handle auto-booking functionality - assigns next slot after last booking
  const handleAssignFirstAvailableSlot = async () => {
    setIsLoading(true);
    setApiError('');

    try {
        // Validation for patient is important for the whole form, but for slots we just need date/service/clinic
        if (!formData.service || !formData.date) {
            toast.error(t('appointmentForm.error_fillRequiredFieldsForSlot') || 'Please select a service and date first.');
        setIsLoading(false);
        return;
      }

      const clinicId = FALLBACK_CLINIC_ID;
        const selectedServiceDetails = services.find(s => s.value === formData.service);
        const duration = selectedServiceDetails?.duration || 45;

        // Get the next available slot after the last booked appointment
        const nextSlot = await appointmentService.getNextSlotAfterLastBooking({
            date: formData.date,
            clinicId,
            duration,
        });

        if (nextSlot && nextSlot.time) {
            console.log('Assigning time slot:', nextSlot.time);
            handleInputChange('timeSlot', nextSlot.time);
            toast.success(`${t('appointmentForm.success_slotAssigned')} ${nextSlot.time}`);
      } else {
            const errorMessage = t('appointmentForm.error_noSlotsFound') || 'No available time slots found after last booking for the selected date.';
            setApiError(errorMessage);
            toast.error(errorMessage);
        }

    } catch (error: any) {
        console.error('Error assigning next available slot:', error);
        const errorMessage = error.message || t('appointmentForm.error_failedToGetSlots') || 'Failed to get next available slot.';
        setApiError(errorMessage);
        toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setIsSubmitting(true);
    
    // Create a loading toast
    const loadingToast = customToast.loading(t('appointmentForm.creatingAppointment', 'Creating your appointment...'));

    try {
      // Debug authentication status
      const token = localStorage.getItem('token');
      console.log('🔐 Final Submit Authentication Check:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        userLoggedIn: !!user,
        userEmail: user?.email,
        userRole: user?.role,
        userId: user?.id
      });
      
      // Validate required fields before submission
      if (!formData.patientId) {
        toast.error(t('appointmentForm.error_noPatientRecord') || 'No patient record found. Please contact support to create a patient profile.');
        setIsLoading(false);
        return;
      }

      if (!formData.service) {
        toast.error(t('appointmentForm.error_serviceRequired') || 'Please select a service.');
        setIsLoading(false);
        return;
      }

      if (!formData.date) {
        toast.error(t('appointmentForm.error_dateRequired') || 'Please select a date.');
        setIsLoading(false);
        return;
      }

      if (!formData.timeSlot) {
        toast.error(t('appointmentForm.error_timeSlotRequired') || 'Please select a time slot.');
        setIsLoading(false);
        return;
      }

      // Ensure clinicId is set to hardcoded value
      const clinicId = FALLBACK_CLINIC_ID;
      if (!clinicId) {
        toast.error(t('appointmentForm.error_clinicRequired') || 'No clinic selected. Please select a clinic.');
        setIsLoading(false);
        return;
      }

      // Ensure date is in correct format (YYYY-MM-DD)
      let formattedDate = formData.date;
      if (formData.date.includes('T')) {
        formattedDate = formData.date.split('T')[0];
      }

      // Create appointment data with all required fields
      const appointmentData: any = {
        patientId: formData.patientId,
        serviceType: formData.service, // Fixed: use 'serviceType' to match backend expectation
        date: formattedDate,
        timeSlot: formData.timeSlot,
        notes: formData.notes || '',
        emergency: formData.emergency || false,
        clinicId: clinicId
      };

      // For patients: Never send dentistId - let backend auto-assign
      // For staff/admin: Only include dentistId if explicitly selected
      if (!isPatientUser && formData.dentistId && formData.dentistId.trim() !== '') {
        appointmentData.dentistId = formData.dentistId;
        console.log('Staff/Admin selected specific dentist:', formData.dentistId);
      } else {
        // Backend will auto-assign the best available dentist
        console.log('No dentist specified - backend will auto-assign based on availability and clinic');
      }



      // Validate appointment data before submission
      const validation = validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join('; ');
        console.error('Client-side validation failed:', validation.errors);
        toast.error(`Validation failed: ${errorMessage}`);
        setIsLoading(false);
        return;
      }

      // Check for time slot conflicts before creating appointment
      try {
        console.log('Checking time slot conflict for:', {
          date: appointmentData.date,
          timeSlot: appointmentData.timeSlot,
          clinicId: appointmentData.clinicId
        });
        
        const hasConflict = await appointmentService.checkTimeSlotConflict({
          date: appointmentData.date,
          timeSlot: appointmentData.timeSlot,
          clinicId: appointmentData.clinicId,
          dentistId: appointmentData.dentistId,
          excludeAppointmentId: isEditMode ? id : undefined
        });
        
        if (hasConflict) {
          toast.error(t('appointmentForm.error_timeSlotConflict') || 'This time slot is no longer available. Please select another time.');
          setIsLoading(false);
          return;
        }
      } catch (conflictError: any) {
        console.error('Conflict check failed:', conflictError);
        toast.error(conflictError.message || 'Failed to verify time slot availability. Please try again.');
        setIsLoading(false);
        return;
      }

      // Log the exact data being sent for debugging
      console.log('Submitting appointment data:', appointmentData);

      // Create or update appointment
      if (isEditMode && id) {
        await appointmentService.updateAppointment(id, appointmentData);
        toast.dismiss(loadingToast);
        customToast.success(t('appointmentForm.success_updated'));
      } else {
        await appointmentService.createAppointment(appointmentData);
        toast.dismiss(loadingToast);
        customToast.success(t('appointmentForm.success_created'));
        
        // Clear saved form data after successful submission
        sessionStorage.removeItem('appointmentFormData');
        sessionStorage.removeItem('appointmentFormStep');
      }

      // Navigate back to appointments list
      navigate('/appointments');
    } catch (error: any) {
      // Dismiss loading toast on error
      toast.dismiss(loadingToast);
      console.error('Error saving appointment:', error);
      
      // Ensure clinicId is accessible in this scope
      const clinicId = FALLBACK_CLINIC_ID;
      
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
        } else if (status === 400) {
          toast.error(t('appointmentForm.error_badRequest') || 'Invalid data provided. Please check all fields and try again.');
          // Log the specific data that caused the error for debugging
          console.log('Bad Request Data:', {
            patientId: formData.patientId,
            serviceType: formData.service,
            date: formData.date,
            timeSlot: formData.timeSlot,
            clinicId: clinicId,
            dentistId: '6879369cf9594e20abb3d14e',
            notes: formData.notes || '',
            emergency: formData.emergency || false
          });
          // If the response contains specific error details, log and display them
          if (data && data.message) {
            console.log('Server Error Details:', data.message);
            toast.error(`${t('appointmentForm.error_badRequest')}: ${data.message}`);
          } else if (data && data.errors) {
            // Handle detailed validation errors if provided
            const errorMessages = Object.values(data.errors).join(', ');
            console.log('Validation Errors:', errorMessages);
            toast.error(`${t('appointmentForm.error_badRequest')}: ${errorMessages}`);
          }
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
      setIsSubmitting(false);
    }
  };

  // Comprehensive client-side validation function
  const validateAppointmentData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Validate required fields
    if (!data.patientId) {
      errors.push('Patient ID is required');
    }
    
    if (!data.service && !data.serviceType) {
      errors.push('Service is required');
    }
    
    if (!data.clinicId) {
      errors.push('Clinic ID is required');
    }
    
    // Dentist ID is optional - backend can auto-assign if not provided
    
    // Validate date format (YYYY-MM-DD)
    if (!data.date) {
      errors.push('Date is required');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }
    
    // Validate time slot format (HH:mm)
    if (!data.timeSlot) {
      errors.push('Time slot is required');
    } else if (!/^\d{2}:\d{2}$/.test(data.timeSlot)) {
      errors.push('Time slot must be in HH:mm format');
    }
    
    // Validate service against allowed values
    const allowedServices = ['consultation', 'cleaning', 'filling', 'crown', 'extraction', 'whitening', 'emergency'];
    if (data.service && !allowedServices.includes(data.service)) {
      errors.push(`Service must be one of: ${allowedServices.join(', ')}`);
    }
    
    // Validate MongoDB ObjectID format for IDs
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (data.patientId && !objectIdRegex.test(data.patientId)) {
      errors.push('Patient ID must be a valid MongoDB ObjectID');
    }
    
    if (data.clinicId && !objectIdRegex.test(data.clinicId)) {
      errors.push('Clinic ID must be a valid MongoDB ObjectID');
    }
    
    // Only validate dentist ID format if provided (it's optional)
    if (data.dentistId && !objectIdRegex.test(data.dentistId)) {
      errors.push('Dentist ID must be a valid MongoDB ObjectID');
    }
    
    // Validate date is not in the past (except for today)
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.push('Cannot schedule appointments for past dates');
    }
    
    // Validate notes length
    if (data.notes && data.notes.length > 500) {
      errors.push('Notes cannot exceed 500 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
          {isEditMode ? t('appointmentForm.title_edit') : t('appointmentForm.title_new')}
        </h1>
              <p className="mt-2 text-lg text-gray-600">
          {t('appointmentForm.subtitle')}
        </p>
            </div>
            <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                {t('appointmentForm.quickEasy')}
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                {t('appointmentForm.secureBooking')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Progress Sidebar */}
          <div className="order-2 lg:order-1 lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:sticky lg:top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-6 text-center lg:text-left">{t('appointmentForm.bookingProgress')}</h3>

              <div className="flex lg:flex-col lg:space-y-4 lg:space-x-0 space-x-3 lg:space-x-0 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide">
              {steps.map((step, stepIdx) => {
                const isCurrent = step.id === currentStep;
                const isCompleted = completedSteps.includes(step.id) || stepOrder.indexOf(step.id) < stepOrder.indexOf(currentStep);
                const isClickable = isCompleted || step.id === currentStep;
                
                return (
                    <div key={step.id} className="relative">
                    <button
                      type="button"
                      onClick={() => isClickable && jumpToStep(step.id)}
                      disabled={!isClickable}
                        className={`w-full lg:w-auto min-w-[120px] lg:min-w-0 flex flex-col lg:flex-row items-center p-3 lg:p-4 rounded-xl border transition-all duration-300 ${
                          isCurrent 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md transform scale-105' 
                            : isCompleted
                              ? 'bg-green-50 border-green-200 hover:shadow-md hover:scale-105'
                              : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                        }`}
                    >
                      {isCompleted ? (
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center">
                            <CheckIcon className="h-5 w-5 text-white" />
                          </div>
                      ) : isCurrent ? (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center animate-pulse">
                            <step.icon className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-xl flex items-center justify-center">
                            <step.icon className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        
                        <div className="mt-2 lg:mt-0 lg:ml-4 text-center lg:text-left">
                          <p className={`font-semibold text-xs lg:text-sm ${
                            isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                          }`}>
                        {step.label}
                          </p>
                          <p className={`text-xs hidden lg:block ${
                            isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {isCurrent ? t('appointmentForm.stepStatus_inProgress') : isCompleted ? t('appointmentForm.stepStatus_completed') : t('appointmentForm.stepStatus_pending')}
                          </p>
                        </div>
                        
                        {isCurrent && (
                          <div className="ml-auto">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                          </div>
                        )}
                    </button>
                    
                    {stepIdx !== steps.length - 1 && (
                        <div className="flex justify-center py-2">
                          <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'} transition-all duration-500`}></div>
                      </div>
                    )}
                    </div>
                );
              })}
              </div>
        </div>

            {/* Help Card */}
            <div className="mt-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                  <Phone className="h-4 w-4" />
                </div>
                <h4 className="font-semibold">{t('appointmentForm.needHelp')}</h4>
              </div>
              <p className="text-blue-100 text-sm mb-4">
                {t('appointmentForm.supportMessage')}
              </p>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                {t('appointmentForm.contactSupport')}
              </button>
            </div>
          </div>

          {/* Main Form Content */}
          <div className="order-1 lg:order-2 lg:col-span-3">
            <form onSubmit={handleStepSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Step Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center">
                      {steps.find(s => s.id === currentStep)?.icon && (
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                          {React.createElement(steps.find(s => s.id === currentStep)?.icon || Calendar, { className: "h-4 w-4" })}
                        </div>
                      )}
                      {steps.find(s => s.id === currentStep)?.label}
                    </h2>
                    <p className="text-blue-100 mt-1">
                      {currentStep === 'patient' && t('appointmentForm.stepDescription_patient')}
                      {currentStep === 'service' && t('appointmentForm.stepDescription_service')}  
                      {currentStep === 'datetime' && t('appointmentForm.stepDescription_datetime')}
                      {currentStep === 'details' && t('appointmentForm.stepDescription_details')}
                      {currentStep === 'review' && t('appointmentForm.stepDescription_review')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm">{t('appointmentForm.stepCounter', { current: stepOrder.indexOf(currentStep) + 1, total: steps.length })}</p>
                    <div className="w-20 bg-white bg-opacity-20 rounded-full h-2 mt-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-500"
                        style={{ width: `${((stepOrder.indexOf(currentStep) + 1) / steps.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

          {/* Form content wrapper with transition effects */}
              <div className={`p-6 md:p-8 transition-all duration-500 transform ${isTransitioning ? (transitionDirection === 'next' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0') : 'translate-x-0 opacity-100'}`}>
          {/* Patient Selection Step */}
          {currentStep === 'patient' && !isPatientUser && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{t('appointmentForm.title_selectPatient')}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('appointmentForm.subtitle_selectPatient')}</p>
              </div>

              {/* Clinic Selection */}

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Clinic
                </label>
                 <ClinicSelector
                  selectedClinicId="687468107e70478314c346be"
                  onClinicSelect={(clinic) => {
                    setFormData(prev => ({ ...prev, clinicId: clinic.id }));
                    // Clear time slots when clinic changes
                    setApiError('');
                  }}
                  error={fieldErrors.clinicId}
                /> 
                {fieldErrors.clinicId && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.clinicId}</p>
                )}
              </div>
              */}

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
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-red-700 text-sm" role="alert" aria-live="polite">{fieldErrors.patientSearch}</p>
                      </div>
                    )}
                </div>
              </div>
              
              {fieldErrors.service && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.service}</p>
              )}
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Loading skeleton */}
                {isLoading && filteredPatients.length === 0 && (
                  <>
                    {[...Array(3)].map((_, index) => (
                      <div key={`skeleton-${index}`} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Actual patient list */}
                {!isLoading && filteredPatients.map((patient, index) => (
                  <div 
                    key={patient.id || `patient-${index}`} 
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 transform active:scale-95 touch-manipulation ${formData.patientId === patient.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                    onClick={() => {

                      
                      // Use the patient ID
                      const patientId = patient.id;

                      handleInputChange('patientId', patientId);
                      
                      // Apply smart defaults based on selected patient's appointment history
                      if (patientId) {
                        setSmartDefaults(patientId);
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
                
                {!isLoading && filteredPatients.length === 0 && (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    {t('appointmentForm.no_patients_found')}
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Service Selection Step */}
          {currentStep === 'service' && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('appointmentForm.selectYourService')}</h3>
                <p className="text-gray-600">{t('appointmentForm.serviceSelectionDescription')}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service, index) => (
                  <div 
                    key={service.value || `service-${index}`} 
                    className={`group relative border-2 rounded-2xl p-4 sm:p-6 cursor-pointer transition-all duration-300 transform active:scale-95 hover:scale-105 hover:shadow-xl touch-manipulation ${
                      formData.service === service.value 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    } ${fieldErrors.service ? 'border-red-500' : ''}`}
                    onClick={() => {
                      handleInputChange('service', service.value);
                      validateField('service', service.value);
                    }}
                  >
                    {/* Selection Indicator */}
                      {formData.service === service.value && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    {/* Service Icon */}
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 ${
                      formData.service === service.value
                        ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg'
                        : 'bg-gray-100 group-hover:bg-blue-100'
                    }`}>
                      {service.icon}
                    </div>
                    
                    {/* Service Info */}
                    <div className="text-center">
                      <h4 className={`font-bold text-lg mb-2 transition-colors ${
                        formData.service === service.value ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                      }`}>
                        {service.label}
                      </h4>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {service.description}
                      </p>
                      
                      {/* Duration Badge */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        formData.service === service.value
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                      }`}>
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration} {t('appointmentForm.minutes')}
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                  </div>
                ))}
              </div>
              
              {fieldErrors.service && (
                <div className="flex items-center justify-center mt-4">
                  <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                    {fieldErrors.service}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Date & Time Selection Step */}
          {currentStep === 'datetime' && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('appointmentForm.chooseDateAndTime')}</h3>
                <p className="text-gray-600">{t('appointmentForm.dateTimeSelectionDescription')}</p>
              </div>

              {/* Clinic Selection and Display */}
              <div className="space-y-4">
                {/* Current Clinic Display */}
                {FALLBACK_CLINIC_ID && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          Selected Clinic: { 'Dr. Gamal Abdel Nasser Center'}
                        </p>
                        {selectedClinic?.address && (
                          <p className="text-sm text-blue-700">
                            {selectedClinic.address.street}, {selectedClinic.address.city}
                          </p>
                        )}
                        {selectedClinic?.phone && (
                          <p className="text-xs text-blue-600">📞 {selectedClinic.phone}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {t('appointmentForm.active')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clinic Selector for changing clinic */}
{/*                 
                <div>
                  <label htmlFor="clinic-selector" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('appointmentForm.changeClinic')}
                  </label>
                   <ClinicSelector
                    selectedClinicId={formData.clinicId}
                    onClinicSelect={(clinic) => {
                      handleInputChange('clinicId', clinic.id);
                      // Clear time slots when clinic changes
                      setApiError('');
                      toast.success(`Switched to ${clinic.name}`);
                    }}
                    disabled={isLoading || isSubmitting}
                    placeholder={t('common.placeholders.selectClinic')}
                    className="w-full"
                  /> 
                </div> */}
              </div>
              
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Date Selection */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <label htmlFor="date" className="block text-lg font-semibold text-gray-900 mb-3">
                    📅 {t('appointmentForm.label_date')}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="date"
                      className={`w-full px-4 py-3 text-lg border-2 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-300 ${fieldErrors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      value={formData.date}
                      onChange={(e) => {
                        // Reset time slot when date changes using single update
                        handleInputChange('date', e.target.value);
                        handleInputChange('timeSlot', ''); // Clear time slot when date changes
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
                      disabled={isLoading || isSubmitting}
                    />
                  </div>
                  {fieldErrors.date && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-red-700 text-sm" role="alert" aria-live="polite">{fieldErrors.date}</p>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500" id="date-description">
                    {t('appointmentForm.selectDate')}
                  </p>
                </div>
                
                {/* Time Slot Selection */}
                {formData.date && (
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      🕐 {t('appointmentForm.label_timeSlot')}
                    </label>
                    
                    {fieldErrors.timeSlot && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-600 text-sm">{fieldErrors.timeSlot}</p>
                      </div>
                    )}
                    
                    {apiError && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                          <h4 className="text-red-800 font-medium">{t('appointmentForm.timeSlotLoadingError')}</h4>
                            </div>
                        <p className="text-red-700 mt-1 text-sm">{apiError}</p>
                        </div>
                    )}
                    
                    {formData.timeSlot ? (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                              <CheckIcon className="h-5 w-5 text-white" />
                            </div>
                        <div>
                              <p className="font-semibold text-green-800">{t('appointmentForm.timeSlotConfirmed')}</p>
                              <p className="text-2xl font-bold text-green-700">{formData.timeSlot}</p>
                        </div>
                          </div>
                          <button
                          type="button"
                            onClick={() => handleInputChange('timeSlot', '')}
                            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-medium"
                          >
                            {t('common.change')}
                          </button>
                      </div>
                    </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAssignFirstAvailableSlot}
                        disabled={isLoading || isSubmitting || !formData.date || !formData.service}
                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 font-semibold text-lg ${
                          isLoading || isSubmitting || !formData.date || !formData.service
                            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-blue-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            {t('appointmentForm.findingSlot', 'Finding Slot...')}
                    </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Calendar className="h-5 w-5 mr-2" />
                            {t('appointmentForm.button_assignFirstAvailable', 'Assign First Available Slot')}
                  </div>
                )}
                      </button>
                    )}
                    <p className="mt-3 text-xs text-gray-500 text-center">
                      We'll automatically find the next available time slot for you
                    </p>
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
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-red-700 text-sm" role="alert" aria-live="polite">{fieldErrors.notes}</p>
                  </div>
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
                  
                  {/* Dentist Assignment Info for Patients */}
                  {isPatientUser && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 transition-all duration-300 hover:shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <User className="h-4 w-4 text-blue-500 mr-2" />
                        {t('appointmentForm.label_dentist')}
                      </h4>
                      <div className="ml-6">
                        <p className="text-sm text-blue-700">
                          {t('appointmentForm.auto_assign_dentist')}
                        </p>
                      </div>
                    </div>
                  )}
                  
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
                  {/* Removed clinic selection UI as we now have a single clinic */}
                  {/* {selectedClinic && (
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
                  )} */}
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
          
              {/* Form Actions - Modern Footer */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-200">
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
            {currentStep !== (isPatientUser ? 'service' : 'patient') ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md touch-manipulation"
              >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                {t('common.back')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md touch-manipulation"
              >
                {t('common.cancel')}
              </button>
            )}
            
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
                    className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border-2 border-transparent rounded-xl text-lg font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 touch-manipulation ${
                      isLoading || isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-xl transform hover:scale-105'
                    }`}
            >
              {isLoading || isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                        {isSubmitting ? t('appointmentForm.creatingAppointment') : t('common.loading')}
                      </div>
              ) : currentStep === 'review' ? (
                      <div className="flex items-center">
                        {isEditMode ? (
                          <>
                            <CheckIcon className="w-5 h-5 mr-2" />
                            {t('common.update')}
                          </>
              ) : (
                <>
                            <Calendar className="w-5 h-5 mr-2" />
                            {t('common.create')}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {t('common.next')}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </div>
              )}
            </button>
                </div>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;