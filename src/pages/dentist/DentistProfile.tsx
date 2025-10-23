import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Avatar, Alert } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { usePerformance } from '../../hooks/usePerformance';
import { dentistService, type Dentist, type DentistClinic } from '../../services/dentistService';
import type { Appointment } from '../../types';
import {
  User,
  Calendar,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Clock,

  Edit3,
  Settings,
  Camera,
  Award,
  GraduationCap,
  Building2,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const DentistProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { measureAsync, mark } = usePerformance('DentistProfile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [clinics, setClinics] = useState<DentistClinic[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [clinicsLoading, setClinicsLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  // Navigation handlers
  const handleEditProfile = () => {
    navigate('/settings');
  };

  const handleManageSchedule = () => {
    navigate('/schedule');
  };

  const handleViewAppointments = () => {
    navigate('/appointments');
  };

  useEffect(() => {
    const fetchDentistData = async () => {
      try {
        setLoading(true);
        setError(null);
        mark('fetchStart');

        if (!user?.id) {
          setError('User not found');
          return;
        }

        // Fetch dentist profile data with performance monitoring (disable cache for debugging)
        const dentistData = await measureAsync('fetchDentistProfile', () => {
          const response = dentistService.getDentistById(user.id, false); // Disable cache
          console.log('response', response);
          return response;
        }
          
        );
        console.log('dentist', dentistData);
        console.log('user.id', user.id);
        console.log('user object:', user);
        console.log('dentistData.result', dentistData.result);
        setDentist(dentistData.result);
        mark('profileLoaded');

        // Fetch associated clinics
        try {
          setClinicsLoading(true);
          const { result: clinicsData } = await measureAsync('fetchClinics', () =>
            dentistService.getDentistClinics(user.id)
          );
          setClinics(Array.isArray(clinicsData) ? clinicsData : []);
        } catch (clinicErr) {
          console.warn('Failed to fetch clinics:', clinicErr);
          setClinics([]);
        } finally {
          setClinicsLoading(false);
        }

        // Fetch appointments
        try {
          setAppointmentsLoading(true);
          const { result: appointmentsData } = await measureAsync('fetchAppointments', () =>
            dentistService.getDentistAppointments(user.id, { limit: 50 })
          );
          setAppointments(Array.isArray(appointmentsData?.data) ? appointmentsData.data : []);
        } catch (appointmentErr) {
          console.warn('Failed to fetch appointments:', appointmentErr);
          setAppointments([]);
        } finally {
          setAppointmentsLoading(false);
        }

        mark('allDataLoaded');
      } catch (err: any) {
        console.error('Error fetching dentist data:', err);
        console.error('Error details:', {
          status: err.response?.status,
          message: err.message,
          response: err.response?.data
        });

        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view this profile.');
        } else if (err.response?.status === 404) {
          setError('Dentist profile not found. The user may not exist in the database.');
        } else {
          setError(err.message || 'Failed to load dentist data. Please try again later.');
        }
      } finally {
        setLoading(false);
        mark('renderComplete');
      }
    };

    if (user?.id) {
      fetchDentistData();
    }
  }, [user?.id, measureAsync, mark]);

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'no-show':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const upcomingAppointments = Array.isArray(appointments) && appointments.length > 0 ? appointments.filter(apt =>
    apt?.date && new Date(apt.date) > new Date() && apt.status !== 'cancelled'
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];

  const completedAppointments = Array.isArray(appointments) && appointments.length > 0 ? appointments.filter(apt =>
    apt?.status === 'completed'
  ).length : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
    { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
    { id: 'clinics', label: 'Clinics', icon: <Building2 className="w-4 h-4" /> },
    { id: 'availability', label: 'Availability', icon: <Clock className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600">Loading dentist profile...</p>
        </div>
      </div>
    );
  }

  if (error || !dentist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div role="alert" className="max-w-md">
          <Alert variant="error" className="w-full">
            {error || 'Dentist profile not found'}
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Professional Profile</h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600">
                  Manage your professional information and appointments
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  size="sm"
                  onClick={handleEditProfile}
                  className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                >
                  <Edit3 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Header Card */}
          <Card className="p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 bg-gradient-to-r from-white to-blue-50 border-0 shadow-xl">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 sm:gap-8">
              <div className="relative flex-shrink-0">
                <div className="relative">
                  <Avatar
                    src={dentist?.profileImage}
                    alt={`Dr. ${dentist?.firstName || ''} ${dentist?.lastName || ''}`}
                    size="xl"
                    fallback={`${dentist?.firstName?.[0] || 'D'}${dentist?.lastName?.[0] || 'R'}`}
                    className="ring-4 ring-white shadow-2xl w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32"
                    loading="eager"
                  />
                  <button
                    onClick={handleEditProfile}
                    className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-blue-600 text-white rounded-full p-2 sm:p-3 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 min-h-[44px] min-w-[44px]"
                    aria-label="Change profile picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left w-full">
                <div className="mb-4">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    Dr. {dentist?.firstName || 'Unknown'} {dentist?.lastName || 'Dentist'}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-3">
                    <Badge className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium">
                      {dentist?.specialization || 'General Dentistry'}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                      License: {dentist?.licenseNumber || 'N/A'}
                    </Badge>
                    {dentist?.rating && (
                      <Badge className="bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 text-xs sm:text-sm flex items-center gap-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                        {dentist.rating.toFixed(1)} ({dentist?.reviewCount || 0})
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{dentist?.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{dentist?.phone || 'No phone provided'}</span>
                  </div>
                  {dentist?.yearsOfExperience && (
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{dentist.yearsOfExperience} years experience</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-600">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{clinics?.length || 0} clinic{(clinics?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">{appointments?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">{upcomingAppointments?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Upcoming</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">{completedAppointments || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-1">{clinics?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Clinics</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs Navigation */}
          <nav className="mb-6 sm:mb-8" aria-label="Profile sections">
            <div className="border-b border-gray-200">
              <div className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`flex items-center gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap min-h-[44px] ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Tab Content */}
          <div className="space-y-6 sm:space-y-8">
            {activeTab === 'overview' && (
              <div role="tabpanel">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Professional Information */}
                    <Card className="p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Professional Information
                      </h3>

                      {dentist?.bio && (
                        <div className="mb-4 sm:mb-6">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Bio</h4>
                          <p className="text-sm sm:text-base text-gray-600">{dentist.bio}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {dentist?.yearsOfExperience && (
                          <div>
                            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Years of Experience</h4>
                            <p className="text-sm sm:text-base text-gray-900 font-semibold">{dentist.yearsOfExperience} years</p>
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Specialization</h4>
                          <p className="text-sm sm:text-base text-gray-900 font-semibold">{dentist?.specialization || 'General Dentistry'}</p>
                        </div>
                      </div>

                      {dentist?.education && Array.isArray(dentist.education) && dentist.education.length > 0 && (
                        <div className="mt-4 sm:mt-6">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Education
                          </h4>
                          <ul className="space-y-2">
                            {dentist.education.map((edu, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm sm:text-base text-gray-600">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{edu || 'N/A'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {dentist?.certifications && Array.isArray(dentist.certifications) && dentist.certifications.length > 0 && (
                        <div className="mt-4 sm:mt-6">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Certifications
                          </h4>
                          <ul className="space-y-2">
                            {dentist.certifications.map((cert, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm sm:text-base text-gray-600">
                                <span className="text-green-600 mt-1">•</span>
                                <span>{cert || 'N/A'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>

                    {/* Upcoming Appointments */}
                    <Card className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          Upcoming Appointments
                        </h3>
                        <Button
                          size="sm"
                          onClick={handleViewAppointments}
                          className="min-h-[44px] w-full sm:w-auto"
                        >
                          View All
                        </Button>
                      </div>

                      {appointmentsLoading ? (
                        <div className="text-center py-6 sm:py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" aria-hidden="true"></div>
                          <p className="text-sm text-gray-600">Loading appointments...</p>
                        </div>
                      ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {upcomingAppointments.slice(0, 5).map((appointment) => (
                            <div key={appointment?.id || Math.random()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
                              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                                    {appointment?.date ? new Date(appointment.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'Date not available'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    {appointment?.timeSlot || 'Time not set'} • {appointment?.serviceType || 'Consultation'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    Patient: {appointment?.patientName || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <Badge className={`${getAppointmentStatusColor(appointment?.status || 'scheduled')} flex-shrink-0 self-start sm:self-center`}>
                                {getAppointmentStatusIcon(appointment?.status || 'scheduled')}
                                <span className="ml-1 capitalize text-xs">{appointment?.status || 'scheduled'}</span>
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 sm:py-8">
                          <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3 sm:mb-4" />
                          <p className="text-sm sm:text-base text-gray-600">No upcoming appointments</p>
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Quick Actions */}
                    <Card className="p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
                      <div className="space-y-2 sm:space-y-3">
                        <Button
                          className="w-full justify-start min-h-[44px]"
                          variant="outline"
                          onClick={handleEditProfile}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button
                          className="w-full justify-start min-h-[44px]"
                          variant="outline"
                          onClick={handleManageSchedule}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Manage Schedule
                        </Button>
                        <Button
                          className="w-full justify-start min-h-[44px]"
                          variant="outline"
                          onClick={handleViewAppointments}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          View Appointments
                        </Button>
                        <Button
                          className="w-full justify-start min-h-[44px]"
                          variant="outline"
                          onClick={() => navigate('/settings')}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div role="tabpanel">
                <Card className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">All Appointments</h3>
                  <div className="text-center py-8 sm:py-12">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Appointment management coming soon</p>
                    <Button onClick={handleViewAppointments}>
                      <Calendar className="w-4 h-4 mr-2" />
                      View Appointments
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'clinics' && (
              <div role="tabpanel">
                <Card className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Clinic Affiliations</h3>
                  {clinicsLoading ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" aria-hidden="true"></div>
                      <p className="text-sm text-gray-600">Loading clinic information...</p>
                    </div>
                  ) : clinics && clinics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {clinics.map((clinic) => (
                        <div key={clinic?.id || clinic?.clinicId || Math.random()} className="p-4 sm:p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{clinic?.name || clinic?.clinicName || 'Unnamed Clinic'}</h4>
                                {clinic?.branchName && (
                                  <p className="text-xs sm:text-sm text-gray-600 truncate">{clinic.branchName}</p>
                                )}
                              </div>
                            </div>
                            {clinic?.isPrimary && (
                              <Badge className="bg-green-100 text-green-800 text-xs self-start">Primary</Badge>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                              <span className="break-words">
                                {clinic?.address?.street || 'N/A'}, {clinic?.address?.city || 'N/A'}, {clinic?.address?.state || 'N/A'} {clinic?.address?.zipCode || ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span>{clinic?.phone || 'No phone provided'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No clinic affiliations found</p>
                      <Button onClick={() => navigate('/settings')}>
                        <Building2 className="w-4 h-4 mr-2" />
                        Manage Clinics
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'availability' && (
              <div role="tabpanel">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Availability Schedule</h3>
                    <Button onClick={handleManageSchedule}>
                      <Clock className="w-4 h-4 mr-2" />
                      Manage Schedule
                    </Button>
                  </div>
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Availability management coming soon</p>
                    <p className="text-sm text-gray-500">
                      You'll be able to set your working hours and availability for each clinic here.
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DentistProfile;