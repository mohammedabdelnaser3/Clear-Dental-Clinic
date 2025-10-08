import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Badge, Alert, Tabs } from '../../components/ui';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import type { Patient, Appointment } from '../../types';

const PatientDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const patientData = await patientService.getPatientById(id!);
        setPatient(patientData as Patient);
        const appts = await appointmentService.getAppointments({ patientId: id });
        setAppointments((appts as any)?.data || []);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Error fetching patient data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id && !['new', 'create', 'edit'].includes(id.toLowerCase())) {
      fetchPatientData();
    } else if (id && ['new', 'create', 'edit'].includes(id.toLowerCase())) {
      navigate('/patients/new', { replace: true });
    }
  }, [id, navigate]);

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: 'info' as const, label: t('appointmentStatus.scheduled') },
      confirmed: { variant: 'success' as const, label: t('appointmentStatus.confirmed') },
      completed: { variant: 'success' as const, label: t('appointmentStatus.completed') },
      cancelled: { variant: 'danger' as const, label: t('appointmentStatus.cancelled') },
      'no-show': { variant: 'warning' as const, label: t('appointmentStatus.no-show') }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'gray' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleDeletePatient = async () => {
    if (window.confirm(t('patient_detail.confirm_delete'))) {
      try {
        await patientService.deletePatient(id!);
        navigate('/patients');
      } catch (err: any) {
        setError(err.message || t('errors.delete_patient'));
      }
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!patient) return <Alert variant="error">{t('errors.patient_not_found')}</Alert>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {patient.firstName} {patient.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={patient.isActive ? 'success' : 'gray'} className="px-3 py-1">
                    {patient.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                    Age {calculateAge(patient.dateOfBirth)}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 px-3 py-1 capitalize">
                    {patient.gender}
                  </Badge>
                  <span className="text-gray-500 text-sm">ID: {patient.id}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={`/patients/${patient.id}/edit`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Patient
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2" 
                onClick={handleDeletePatient}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Patient
              </Button>
            </div>
          </div>
        </div>

        <Tabs
          tabs={[
            {
              id: 'overview',
              label: 'Overview',
              content: (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 bg-gradient-to-r from-white to-blue-50 border-0 shadow-lg">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Personal Information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Full Name</p>
                              <p className="font-semibold text-gray-900">{patient.firstName} {patient.lastName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Age</p>
                              <p className="font-semibold text-gray-900">{calculateAge(patient.dateOfBirth)} years old</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                              <p className="font-semibold text-gray-900">{formatDate(patient.dateOfBirth)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Email</p>
                              <p className="font-semibold text-gray-900">{patient.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Phone</p>
                              <p className="font-semibold text-gray-900">{patient.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Address</p>
                              <p className="font-semibold text-gray-900">{patient.address.street}</p>
                              <p className="text-sm text-gray-600">{patient.address.city}, {patient.address.state} {patient.address.zipCode}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Patient Statistics
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-1">{appointments.length}</div>
                          <div className="text-sm text-gray-600">Total Visits</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {appointments.filter(apt => apt.status === 'completed').length}
                          </div>
                          <div className="text-sm text-gray-600">Completed</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {appointments.filter(apt => new Date(apt.date) > new Date() && apt.status !== 'cancelled').length}
                          </div>
                          <div className="text-sm text-gray-600">Upcoming</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600 mb-1">
                            {patient.medicalHistory?.allergies?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Allergies</div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Link to={`/appointments/create?patientId=${patient.id}`}>
                          <Button className="w-full justify-start" variant="outline">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                            </svg>
                            Schedule Appointment
                          </Button>
                        </Link>
                        <Button className="w-full justify-start" variant="outline">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Records
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Reports
                        </Button>
                      </div>
                    </Card>

                    {/* Emergency Contact */}
                    {patient.emergencyContact && (
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Emergency Contact
                        </h3>
                        <div className="space-y-2">
                          <p className="font-medium">{patient.emergencyContact.name}</p>
                          <p className="text-sm text-gray-600">{patient.emergencyContact.relationship}</p>
                          <p className="text-sm text-gray-600">{patient.emergencyContact.phone}</p>
                        </div>
                      </Card>
                    )}

                    {/* Medical Information Cards */}
                    <div className="space-y-6">
                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          Allergies
                        </h3>
                        {patient.medicalHistory?.allergies?.length > 0 ? (
                          <div className="space-y-2">
                            {patient.medicalHistory?.allergies?.map((allergy: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="text-red-800">{allergy}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No known allergies</p>
                        )}
                      </Card>

                      <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Medical Conditions
                        </h3>
                        {patient.medicalHistory?.conditions?.length > 0 ? (
                          <div className="space-y-2">
                            {patient.medicalHistory?.conditions?.map((condition: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span className="text-blue-800">{condition}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No medical conditions recorded</p>
                        )}
                      </Card>
                    </div>
                  </div>
                </div>
              )
            },
            {
              id: 'appointments',
              label: 'Appointments',
              content: (
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Appointments</h2>
                    <Link to={`/appointments/create?patientId=${patient.id}`}>
                      <Button variant="outline" size="sm">Schedule New</Button>
                    </Link>
                  </div>
                  {appointments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dentist</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((appointment) => (
                            <tr key={appointment.id}>
                              <td className="px-6 py-4 whitespace-nowrap">{formatDate(new Date(appointment.date))}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{appointment.timeSlot}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{appointment.dentistName || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(appointment.status)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link to={`/appointments/${appointment.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">View</Link>
                                <Link to={`/appointments/${appointment.id}/edit`} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No appointments scheduled</p>
                  )}
                </Card>
              )
            },
            {
              id: 'medical-history',
              label: 'Medical History',
              content: <div className="p-6">Medical history details coming soon...</div>
            },
            {
              id: 'medications',
              label: 'Medications',
              content: <div className="p-6">Medications list coming soon...</div>
            },
            {
              id: 'notes',
              label: 'Notes',
              content: <div className="p-6">Patient notes coming soon...</div>
            }
          ]}
          defaultTabId="overview"
        />
      </div>
    </div>
  );
};

export default PatientDetail;