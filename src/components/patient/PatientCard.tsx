import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '../ui';
import type { Patient } from '../../types';
import { calculateAge } from '../../utils';

interface PatientCardProps {
  patient: Patient;
  onEdit?: (patientId: string) => void;
  onDelete?: (patientId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onEdit,
  onDelete,
  showActions = true,
  compact = false
}) => {
  const age = calculateAge(patient.dateOfBirth);
  const patientInitials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(patient.id);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`)) {
      onDelete(patient.id);
    }
  };

  return (
    <Card className={`${compact ? 'p-4' : 'p-6'} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Patient Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {patientInitials}
            </div>
          </div>
          
          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {patient.firstName} {patient.lastName}
              </h3>
              {patient.isActive !== false && (
                <Badge variant="success">Active</Badge>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="truncate">{age} years old</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{patient.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="truncate">{patient.phone}</span>
              </div>
              
              {patient.address && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">
                    {patient.address.city}, {patient.address.state}
                  </span>
                </div>
              )}
              
              {patient.emergencyContact && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="truncate">
                    Emergency: {patient.emergencyContact.name} ({patient.emergencyContact.phone})
                  </span>
                </div>
              )}
            </div>
            
            {patient.medicalHistory && patient.medicalHistory.conditions.length > 0 && !compact && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Medical History:</div>
                <div className="flex flex-wrap gap-1">
                  {patient.medicalHistory.conditions.slice(0, 3).map((condition, index) => (
                    <Badge key={index} variant="gray" size="sm">
                      {condition}
                    </Badge>
                  ))}
                  {patient.medicalHistory.conditions.length > 3 && (
                    <Badge variant="gray" size="sm">
                      +{patient.medicalHistory.conditions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {patient.medicalHistory && patient.medicalHistory.allergies.length > 0 && !compact && (
              <div className="mt-2">
                <div className="text-xs font-medium text-red-700 mb-1">Allergies:</div>
                <div className="flex flex-wrap gap-1">
                  {patient.medicalHistory.allergies.slice(0, 3).map((allergy, index) => (
                    <Badge key={index} variant="danger" size="sm">
                      {allergy}
                    </Badge>
                  ))}
                  {patient.medicalHistory.allergies.length > 3 && (
                    <Badge variant="danger" size="sm">
                      +{patient.medicalHistory.allergies.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {showActions && (
          <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
            <Link to={`/patients/${patient.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEdit}
              className="w-full"
            >
              Edit
            </Button>
            
            <Link to={`/appointments/new?patientId=${patient.id}`}>
              <Button variant="primary" size="sm" className="w-full">
                Book Appointment
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDelete}
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        )}
      </div>
      

    </Card>
  );
};

export default PatientCard;