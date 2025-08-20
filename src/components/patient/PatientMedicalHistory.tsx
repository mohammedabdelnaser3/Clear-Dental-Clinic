import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Input, Textarea } from '../ui';
import type { Patient } from '../../types';
import { formatDate } from '../../utils';

interface MedicalRecord {
  id: string;
  date: Date;
  type: 'diagnosis' | 'treatment' | 'prescription' | 'note';
  title: string;
  description: string;
  provider: string;
  attachments?: string[];
}

interface PatientMedicalHistoryProps {
  patient: Patient;
  onUpdate?: (patientId: string, updates: Partial<Patient>) => void;
  readOnly?: boolean;
}

const PatientMedicalHistory: React.FC<PatientMedicalHistoryProps> = ({
  patient,
  onUpdate,
  readOnly = false
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<string | null>(null);
  const [editingCondition, setEditingCondition] = useState<string | null>(null);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newRecord, setNewRecord] = useState<Partial<MedicalRecord>>({
    type: 'note',
    title: '',
    description: '',
    provider: ''
  });

  // Mock medical records - in real app, this would come from API
  const [medicalRecords] = useState<MedicalRecord[]>([
    {
      id: '1',
      date: new Date('2024-01-15'),
      type: 'diagnosis',
      title: 'Routine Dental Cleaning',
      description: 'Regular cleaning and examination. No issues found.',
      provider: 'Dr. Smith'
    },
    {
      id: '2',
      date: new Date('2023-12-10'),
      type: 'treatment',
      title: 'Cavity Filling',
      description: 'Filled cavity in upper right molar. Used composite filling.',
      provider: 'Dr. Johnson'
    },
    {
      id: '3',
      date: new Date('2023-11-05'),
      type: 'prescription',
      title: 'Antibiotic Prescription',
      description: 'Prescribed amoxicillin for infection prevention post-procedure.',
      provider: 'Dr. Smith'
    }
  ]);

  const handleAddAllergy = () => {
    if (newAllergy.trim() && onUpdate) {
      const updatedAllergies = [...(patient.medicalHistory?.allergies || []), newAllergy.trim()];
      const updatedMedicalHistory = { ...patient.medicalHistory, allergies: updatedAllergies };
      onUpdate(patient.id, { medicalHistory: updatedMedicalHistory });
      setNewAllergy('');
      setEditingAllergy(null);
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    if (onUpdate) {
      const updatedAllergies = (patient.medicalHistory?.allergies || []).filter(a => a !== allergy);
      const updatedMedicalHistory = { ...patient.medicalHistory, allergies: updatedAllergies };
      onUpdate(patient.id, { medicalHistory: updatedMedicalHistory });
    }
  };

  const handleAddCondition = () => {
    if (newCondition.trim() && onUpdate) {
      const updatedConditions = [...(patient.medicalHistory?.conditions || []), newCondition.trim()];
      const updatedMedicalHistory = { ...patient.medicalHistory, conditions: updatedConditions };
      onUpdate(patient.id, { medicalHistory: updatedMedicalHistory });
      setNewCondition('');
      setEditingCondition(null);
    }
  };

  const handleRemoveCondition = (condition: string) => {
    if (onUpdate) {
      const updatedConditions = (patient.medicalHistory?.conditions || []).filter(c => c !== condition);
      const updatedMedicalHistory = { ...patient.medicalHistory, conditions: updatedConditions };
      onUpdate(patient.id, { medicalHistory: updatedMedicalHistory });
    }
  };

  const handleAddRecord = () => {
    if (newRecord.title && newRecord.description) {
      // In real app, this would call an API
      console.log('Adding medical record:', newRecord);
      setNewRecord({
        type: 'note',
        title: '',
        description: '',
        provider: ''
      });
      setShowAddModal(false);
    }
  };

  const getRecordTypeVariant = (type: string) => {
    switch (type) {
      case 'diagnosis': return 'info';
      case 'treatment': return 'success';
      case 'prescription': return 'warning';
      case 'note': return 'gray';
      default: return 'gray';
    }
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'diagnosis':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'treatment':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      case 'prescription':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Allergies Section */}
      <Card title="Allergies" className="p-6">
        <div className="space-y-3">
          {patient.medicalHistory && patient.medicalHistory.allergies && patient.medicalHistory.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.medicalHistory.allergies.map((allergy, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Badge variant="danger">{allergy}</Badge>
                  {!readOnly && (
                    <button
                      onClick={() => handleRemoveAllergy(allergy)}
                      className="text-red-500 hover:text-red-700 ml-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No known allergies</p>
          )}
          
          {!readOnly && (
            <div className="mt-3">
              {editingAllergy ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter allergy"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddAllergy}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingAllergy(null)}>Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingAllergy('new')}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Allergy
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Medical Conditions Section */}
      <Card title="Medical History" className="p-6">
        <div className="space-y-3">
          {patient.medicalHistory && patient.medicalHistory.conditions && patient.medicalHistory.conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.medicalHistory.conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Badge variant="info">{condition}</Badge>
                  {!readOnly && (
                    <button
                      onClick={() => handleRemoveCondition(condition)}
                      className="text-red-500 hover:text-red-700 ml-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No medical history recorded</p>
          )}
          
          {!readOnly && (
            <div className="mt-3">
              {editingCondition ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter medical condition"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCondition()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddCondition}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingCondition(null)}>Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingCondition('new')}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Condition
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Medical Records Section */}
      <Card title="Medical Records" className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-gray-900">Recent Records</h4>
            {!readOnly && (
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Record
              </Button>
            )}
          </div>
          
          {medicalRecords.length > 0 ? (
            <div className="space-y-3">
              {medicalRecords.map(record => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full bg-${getRecordTypeVariant(record.type)}-100 text-${getRecordTypeVariant(record.type)}-600`}>
                        {getRecordTypeIcon(record.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-900">{record.title}</h5>
                          <Badge variant={getRecordTypeVariant(record.type)} size="sm">
                            {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatDate(record.date)}</span>
                          <span>•</span>
                          <span>{record.provider}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No medical records found</p>
          )}
        </div>
      </Card>

      {/* Add Record Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Medical Record"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Record Type
            </label>
            <select
              value={newRecord.type}
              onChange={(e) => setNewRecord(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="note">Note</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="treatment">Treatment</option>
              <option value="prescription">Prescription</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <Input
              type="text"
              value={newRecord.title || ''}
              onChange={(e) => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter record title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={newRecord.description || ''}
              onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter detailed description"
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <Input
              type="text"
              value={newRecord.provider || ''}
              onChange={(e) => setNewRecord(prev => ({ ...prev, provider: e.target.value }))}
              placeholder="Enter provider name"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAddRecord} className="flex-1">
              Add Record
            </Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PatientMedicalHistory;