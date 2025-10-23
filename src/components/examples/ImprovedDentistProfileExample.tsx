import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncOperation';
import { dentistService } from '../../services/dentistService';
import { LoadingState, ErrorFallback, DataErrorFallback } from '../ui';
import { safeAccess, exists } from '../../utils/safeAccess';
import type { Dentist, Appointment } from '../../types';
import type { DentistClinic } from '../../services/dentistService';

/**
 * Example component demonstrating improved error handling and user experience
 * This shows how to use the new utilities for better UX
 */
export const ImprovedDentistProfileExample: React.FC = () => {
    const { user } = useAuth();

    // Use the new async data hook for dentist profile
    const dentistProfile = useAsyncData(
        () => dentistService.getDentistById(user?.id || ''),
        {
            autoFetch: !!user?.id,
            dependencies: [user?.id],
            logOperationName: 'dentist profile fetch',
            onError: (error) => {
                console.error('Failed to load dentist profile:', error);
            }
        }
    );

    // Use async data hook for clinics (non-critical data)
    const clinicsData = useAsyncData(
        () => dentistService.getDentistClinics(user?.id || ''),
        {
            autoFetch: !!user?.id,
            dependencies: [user?.id],
            logOperationName: 'dentist clinics fetch'
        }
    );

    // Use async data hook for appointments
    const appointmentsData = useAsyncData(
        () => dentistService.getDentistAppointments(user?.id || '', { limit: 10 }),
        {
            autoFetch: !!user?.id,
            dependencies: [user?.id],
            logOperationName: 'dentist appointments fetch'
        }
    );

    // Show loading state while main profile data is loading
    if (dentistProfile.loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <LoadingState
                    message="Loading your profile..."
                    size="lg"
                    className="min-h-[400px]"
                />
            </div>
        );
    }

    // Show error state if main profile data failed to load
    if (dentistProfile.error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <ErrorFallback
                    error={dentistProfile.error}
                    title="Unable to load your profile"
                    message="We couldn't load your profile information. Please try again."
                    onRetry={dentistProfile.retry}
                    className="min-h-[400px]"
                    size="lg"
                />
            </div>
        );
    }

    const dentist = dentistProfile.data as Dentist;
    const clinics = clinicsData.data as DentistClinic[] || [];
    const appointments = appointmentsData.data?.data as Appointment[] || [];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Profile Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl font-semibold text-blue-600">
                                {safeAccess(dentist, 'firstName.0', { fallback: 'D' })}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Dr. {safeAccess(dentist, 'firstName', { fallback: 'Unknown' })} {safeAccess(dentist, 'lastName', { fallback: '' })}
                            </h1>
                            <p className="text-gray-600">
                                {safeAccess(dentist, 'specialization', { fallback: 'General Dentist' })}
                            </p>
                            {exists(dentist?.yearsOfExperience) && (
                                <p className="text-sm text-gray-500">
                                    {dentist.yearsOfExperience} years of experience
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Clinics Section */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Associated Clinics
                            </h2>

                            {clinicsData.loading ? (
                                <LoadingState message="Loading clinics..." size="sm" />
                            ) : clinicsData.error ? (
                                <DataErrorFallback
                                    entityName="clinics"
                                    onRetry={clinicsData.retry}
                                    className="py-4"
                                />
                            ) : clinics.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No clinics associated with your profile yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {clinics.map((clinic, index) => (
                                        <div key={clinic.id || index} className="border rounded-lg p-4">
                                            <h3 className="font-medium text-gray-900">
                                                {safeAccess(clinic, 'name', { fallback: 'Unnamed Clinic' })}
                                            </h3>
                                            {exists(clinic.address) && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {typeof clinic.address === 'string' ? clinic.address : 'Address available'}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Appointments */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Recent Appointments
                            </h2>

                            {appointmentsData.loading ? (
                                <LoadingState message="Loading appointments..." size="sm" />
                            ) : appointmentsData.error ? (
                                <DataErrorFallback
                                    entityName="appointments"
                                    onRetry={appointmentsData.retry}
                                    className="py-4"
                                />
                            ) : appointments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No appointments scheduled.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {appointments.slice(0, 5).map((appointment, index) => (
                                        <div key={appointment.id || index} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">
                                                        {safeAccess(appointment, 'patientName', { fallback: 'Unknown Patient' })}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {safeAccess(appointment, 'serviceType', { fallback: 'General Consultation' })}
                                                    </p>
                                                    {exists(appointment.date) && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {new Date(appointment.date).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                                                    {appointment.status || 'scheduled'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Information */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Contact Information
                            </h2>
                            <div className="space-y-3">
                                {exists(dentist?.email) && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Email</label>
                                        <p className="text-gray-900">{dentist.email}</p>
                                    </div>
                                )}
                                {exists(dentist?.phone) && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Phone</label>
                                        <p className="text-gray-900">{dentist.phone}</p>
                                    </div>
                                )}
                                {exists(dentist?.licenseNumber) && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">License Number</label>
                                        <p className="text-gray-900">{dentist.licenseNumber}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Professional Information */}
                        {(exists(dentist?.education) || exists(dentist?.certifications)) && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Professional Information
                                </h2>

                                {exists(dentist?.education) && Array.isArray(dentist.education) && dentist.education.length > 0 && (
                                    <div className="mb-4">
                                        <label className="text-sm font-medium text-gray-500">Education</label>
                                        <div className="mt-1 space-y-1">
                                            {dentist.education!.map((edu, index) => (
                                                <p key={index} className="text-gray-900 text-sm">{edu}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {exists(dentist?.certifications) && Array.isArray(dentist.certifications) && dentist.certifications.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Certifications</label>
                                        <div className="mt-1 space-y-1">
                                            {dentist.certifications!.map((cert, index) => (
                                                <p key={index} className="text-gray-900 text-sm">{cert}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function for appointment status colors
function getStatusColor(status?: string): string {
    switch (status) {
        case 'confirmed':
            return 'bg-green-100 text-green-800';
        case 'completed':
            return 'bg-gray-100 text-gray-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        case 'scheduled':
        default:
            return 'bg-blue-100 text-blue-800';
    }
}

export default ImprovedDentistProfileExample;