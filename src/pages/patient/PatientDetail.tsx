import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Badge, Alert, Tabs } from '../../components/ui';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import type { Patient, Appointment } from '../../types';

// Update PatientDetailView to accept props
interface PatientDetailViewProps {
  patient: Patient;
  appointments: Appointment[];
  handleDeletePatient: () => void;
}

const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patient, appointments, handleDeletePatient }) => {
  const { t } = useTranslation();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
            <div className="mt-2 flex items-center space-x-4">
              <Badge variant={patient.isActive ? 'success' : 'gray'}>
                {patient.isActive ? t('patients.active') : t('patients.inactive')}
              </Badge>
              <span className="text-gray-500">{t('patient_detail.patient_id')}: {patient.id}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link to={`/patients/${patient.id}/edit`}>
              <Button variant="outline">{t('patient_detail.edit_patient')}</Button>
            </Link>
            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleDeletePatient}>
              {t('patient_detail.delete_patient')}
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        tabs={[
          {
            id: 'overview',
            label: t('patient_detail.overview'),
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{t('patient_detail.personal_information')}</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('patient_detail.full_name')}</p>
                        <p className="mt-1">{patient.firstName} {patient.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('patient_detail.age')}</p>
                        <p className="mt-1">{t('patient_detail.years', { count: calculateAge(patient.dateOfBirth) })}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('patient_detail.date_of_birth')}</p>
                        <p className="mt-1">{formatDate(patient.dateOfBirth)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('patient_detail.gender')}</p>
                        <p className="mt-1 capitalize">{patient.gender}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('patient_detail.email')}</p>
                      <p className="mt-1">{patient.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('patient_detail.phone')}</p>
                      <p className="mt-1">{patient.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('patient_detail.address')}</p>
                      <p className="mt-1">{patient.address.street}</p>
                      <p className="mt-1">{patient.address.city}, {patient.address.state} {patient.address.zipCode}</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">{t('patient_detail.allergies')}</h2>
                    <Button variant="outline" size="sm">{t('patient_detail.add_allergy')}</Button>
                  </div>
                  {patient.medicalHistory?.allergies?.length > 0 ? (
                    <ul className="space-y-2">
                      {patient.medicalHistory?.allergies?.map((allergy: string, index: number) => (
                        <li key={index} className="flex items-center justify-between">
                          {allergy}
                          <Button variant="outline" size="sm">{t('patient_detail.remove')}</Button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-gray-500">{t('patient_detail.no_allergies_recorded')}</p>}
                </Card>
                
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">{t('patient_detail.medical_conditions')}</h2>
                    <Button variant="outline" size="sm">{t('patient_detail.add_condition')}</Button>
                  </div>
                  {patient.medicalHistory?.conditions?.length > 0 ? (
                    <ul className="space-y-2">
                      {patient.medicalHistory?.conditions?.map((condition: string, index: number) => (
                        <li key={index} className="flex items-center justify-between">
                          {condition}
                          <Button variant="outline" size="sm">{t('patient_detail.remove')}</Button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-gray-500">{t('patient_detail.no_medical_conditions_recorded')}</p>}
                </Card>
              </div>
            )
          },
          {
            id: 'appointments',
            label: t('patient_detail.appointments'),
            content: (
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">{t('patient_detail.appointments')}</h2>
                  <Link to={`/appointments/create?patientId=${patient.id}`}>
                    <Button variant="outline" size="sm">{t('patient_detail.schedule_new')}</Button>
                  </Link>
                </div>
                {appointments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patient_detail.date')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patient_detail.time')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patient_detail.dentist')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patient_detail.status')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patient_detail.actions')}</th>
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
                              <Link to={`/appointments/${appointment.id}`} className="text-indigo-600 hover:text-indigo-900">{t('actions.view')}</Link>
                              <Link to={`/appointments/${appointment.id}/edit`} className="ml-4 text-indigo-600 hover:text-indigo-900">{t('actions.edit')}</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-gray-500">{t('patient_detail.no_appointments_scheduled')}</p>}
              </Card>
            )
          },
          {
            id: 'medical-history',
            label: t('patient_detail.medical_history'),
            content: <div>{t('patient_detail.medical_history_placeholder')}</div>
          },
          {
            id: 'medications',
            label: t('patient_detail.medications'),
            content: <div>{t('patient_detail.medications_placeholder')}</div>
          },
          {
            id: 'notes',
            label: t('patient_detail.notes'),
            content: <div>{t('patient_detail.notes_placeholder')}</div>
          }
        ]}
        defaultTabId="overview"
      />
    </div>
  );
};

function PatientDetail() {
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
    if (id) fetchPatientData();
  }, [id]);

  const { t } = useTranslation();
  if (isLoading) return <div>{t('loading')}</div>;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!patient) return <Alert variant="error">{t('errors.patient_not_found')}</Alert>;

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

  return <PatientDetailView patient={patient} appointments={appointments} handleDeletePatient={handleDeletePatient} />;
}

export default PatientDetail;

