import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge, Avatar, Alert } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import type { Patient, Appointment } from '../../types';
import {
  User,
  Calendar,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  Activity,
  Edit3,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  Settings,
  Camera
} from 'lucide-react';

const PatientProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        // Fetch patient data based on current user
        const patientData = await patientService.getPatientsByUserId(user?.id!);
        const patientRecord = patientData.data[0];
        setPatient(patientRecord);

        // Fetch appointments for this patient using the fetched patient data
        if (patientRecord?.id) {
          const appointmentsData = await appointmentService.getAppointments({
            patientId: patientRecord.id
          }) as { data: Appointment[] };
          setAppointments(appointmentsData.data || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchPatientData();
    }
  }, [user?.id]);

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

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

  const upcomingAppointments = Array.isArray(appointments) ? appointments.filter(apt =>
    new Date(apt.date) > new Date() && apt.status !== 'cancelled'
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];

  const recentAppointments = Array.isArray(appointments) ? appointments.filter(apt =>
    new Date(apt.date) <= new Date()
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5) : [];

  const tabs = [
    { id: 'overview', label: t('patientProfile.overview'), icon: <User className="w-4 h-4" /> },
    { id: 'appointments', label: t('patientProfile.appointments'), icon: <Calendar className="w-4 h-4" /> },
    { id: 'medical', label: t('patientProfile.medical'), icon: <Heart className="w-4 h-4" /> },
    { id: 'documents', label: t('patientProfile.documents'), icon: <FileText className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('patientProfile.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Alert variant="error" className="max-w-md">
          {error || t('patientProfile.profileNotFound')}
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('patientProfile.title')}</h1>
                <p className="text-xl text-gray-600">
                  {t('patientProfile.subtitle')}
                </p>
              </div>
              <div className="flex gap-3">
                <Button size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  {t('patientProfile.editProfile')}
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Header Card */}
          <Card className="p-8 mb-8 bg-gradient-to-r from-white to-blue-50 border-0 shadow-xl">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Avatar Section */}
              <div className="relative">
                <div className="relative">
                  <Avatar
                    src={user?.profileImage}
                    alt={`${patient.firstName} ${patient.lastName}`}
                    size="xl"
                    fallback={`${patient.firstName[0]}${patient.lastName[0]}`}
                    className="ring-4 ring-white shadow-2xl w-32 h-32"
                  />
                  <button className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-3">
                    <Badge className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">
                      {t('patientProfile.activePatient')}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                      {t('common.age')} {calculateAge(patient.dateOfBirth)}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800 px-3 py-1 text-sm">
                      {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{patient.email}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{patient.phone}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{patient.address.city}, {patient.address.state}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Patient since {new Date(patient.createdAt).getFullYear()}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{Array.isArray(appointments) ? appointments.length : 0}</div>
                    <div className="text-sm text-gray-600">{t('patientProfile.totalVisits')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">{upcomingAppointments.length}</div>
                    <div className="text-sm text-gray-600">{t('patientProfile.upcoming')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {patient.medicalHistory.allergies.length}
                    </div>
                    <div className="text-sm text-gray-600">{t('patientProfile.allergies')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {patient.medicalHistory.conditions.length}
                    </div>
                    <div className="text-sm text-gray-600">{t('patientProfile.conditions')}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Upcoming Appointments */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Upcoming Appointments
                      </h3>
                      <Button size="sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book New
                      </Button>
                    </div>

                    {upcomingAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingAppointments.slice(0, 3).map((appointment) => (
                          <div key={appointment.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {new Date(appointment.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {appointment.timeSlot} • {appointment.serviceType || 'General Checkup'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Dr. {appointment.dentistName || 'TBD'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getAppointmentStatusColor(appointment.status)}>
                                {getAppointmentStatusIcon(appointment.status)}
                                <span className="ml-1 capitalize">{appointment.status}</span>
                              </Badge>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No upcoming appointments</p>
                        <Button>
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Your Next Visit
                        </Button>
                      </div>
                    )}
                  </Card>

                  {/* Recent Activity */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      Recent Visits
                    </h3>

                    {recentAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {recentAppointments.map((appointment) => (
                          <div key={appointment.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-2 h-2 rounded-full ${appointment.status === 'completed' ? 'bg-green-500' :
                              appointment.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                              }`}></div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {appointment.serviceType || 'Dental Visit'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(appointment.date).toLocaleDateString()} • Dr. {appointment.dentistName || 'Unknown'}
                              </p>
                            </div>
                            <Badge className={getAppointmentStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-4">No recent visits</p>
                    )}
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button className="w-full justify-start" variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Appointment
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        View Records
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download Reports
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Account Settings
                      </Button>
                    </div>
                  </Card>

                  {/* Health Summary */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Summary</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Checkup</span>
                        <span className="text-sm font-medium">
                          {recentAppointments.length > 0
                            ? new Date(recentAppointments[0].date).toLocaleDateString()
                            : 'No records'
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Next Due</span>
                        <span className="text-sm font-medium text-blue-600">
                          {upcomingAppointments.length > 0
                            ? new Date(upcomingAppointments[0].date).toLocaleDateString()
                            : 'Schedule now'
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Allergies</span>
                        <Badge className={patient.medicalHistory.allergies.length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                          {patient.medicalHistory.allergies.length > 0 ? `${patient.medicalHistory.allergies.length} recorded` : 'None'}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Emergency Contact */}
                  {patient.emergencyContact && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                      <div className="space-y-2">
                        <p className="font-medium">{patient.emergencyContact.name}</p>
                        <p className="text-sm text-gray-600">{patient.emergencyContact.relationship}</p>
                        <p className="text-sm text-gray-600">{patient.emergencyContact.phone}</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">All Appointments</h3>
                  <Button>
                    <Calendar className="w-4 h-4 mr-2" />
                    Book New Appointment
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(Array.isArray(appointments) ? appointments : []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(appointment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {appointment.timeSlot}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {appointment.serviceType || 'General Checkup'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Dr. {appointment.dentistName || 'TBD'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getAppointmentStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === 'medical' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Allergies
                  </h3>
                  {patient.medicalHistory.allergies.length > 0 ? (
                    <div className="space-y-2">
                      {patient.medicalHistory.allergies.map((allergy, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-red-800">{allergy}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No known allergies</p>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-blue-600" />
                    Medical Conditions
                  </h3>
                  {patient.medicalHistory.conditions.length > 0 ? (
                    <div className="space-y-2">
                      {patient.medicalHistory.conditions.map((condition, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <Heart className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-800">{condition}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No medical conditions recorded</p>
                  )}
                </Card>

                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Medical Notes
                  </h3>
                  {patient.medicalHistory.notes ? (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{patient.medicalHistory.notes}</p>
                    </div>
                  ) : (
                    <p className="text-gray-600">No medical notes available</p>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'documents' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Medical Documents</h3>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No documents available yet</p>
                  <p className="text-sm text-gray-500">
                    Your medical reports, X-rays, and treatment plans will appear here
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;