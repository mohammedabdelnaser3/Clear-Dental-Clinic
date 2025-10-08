import React from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SafetyWarning {
  type: 'allergy' | 'interaction' | 'contraindication' | 'duplicate' | 'dosage' | 'age' | 'pregnancy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  affectedDrugs?: string[];
  recommendation?: string;
}

interface SafetyError {
  type: 'allergy' | 'contraindication' | 'invalid-dosage';
  message: string;
  details: string;
}

interface SafetyCheckResult {
  safe: boolean;
  warnings: SafetyWarning[];
  errors: SafetyError[];
  recommendations: string[];
}

interface PatientSummary {
  allergies: string[];
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    prescribedDate: string;
  }>;
  medicalConditions: string[];
  age: number;
}

interface MedicationSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  safetyCheck: SafetyCheckResult | null;
  patientSummary: PatientSummary | null;
  patientName: string;
  onProceed: () => void;
  loading?: boolean;
}

const MedicationSafetyModal: React.FC<MedicationSafetyModalProps> = ({
  isOpen,
  onClose,
  safetyCheck,
  patientSummary,
  patientName,
  onProceed,
  loading = false
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-900';
      case 'high':
        return 'text-orange-900';
      case 'medium':
        return 'text-yellow-900';
      case 'low':
        return 'text-blue-900';
      default:
        return 'text-gray-900';
    }
  };

  const canProceed = safetyCheck?.safe && safetyCheck.errors.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
              canProceed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {canProceed ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Medication Safety Check</h2>
              <p className="text-sm text-gray-600 mt-1">Patient: {patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Performing safety check...</span>
            </div>
          ) : (
            <>
              {/* Patient Summary */}
              {patientSummary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Allergies */}
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Allergies ({patientSummary.allergies.length})
                      </h4>
                      {patientSummary.allergies.length > 0 ? (
                        <ul className="space-y-1">
                          {patientSummary.allergies.map((allergy, idx) => (
                            <li key={idx} className="text-sm text-red-800">• {allergy}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-red-700">No known allergies</p>
                      )}
                    </div>

                    {/* Current Medications */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Current Medications ({patientSummary.currentMedications.length})
                      </h4>
                      {patientSummary.currentMedications.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {patientSummary.currentMedications.map((med, idx) => (
                            <div key={idx} className="text-sm text-blue-800">
                              <p className="font-medium">{med.name}</p>
                              <p className="text-xs">{med.dosage} - {med.frequency}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-blue-700">No current medications</p>
                      )}
                    </div>

                    {/* Medical Conditions */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Medical Conditions ({patientSummary.medicalConditions.length})
                      </h4>
                      {patientSummary.medicalConditions.length > 0 ? (
                        <ul className="space-y-1">
                          {patientSummary.medicalConditions.map((condition, idx) => (
                            <li key={idx} className="text-sm text-yellow-800">• {condition}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-yellow-700">No known conditions</p>
                      )}
                    </div>

                    {/* Age */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Patient Age</h4>
                      <p className="text-2xl font-bold text-gray-900">{patientSummary.age} years</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Safety Check Results */}
              {safetyCheck && (
                <div className="space-y-4">
                  {/* Overall Status */}
                  <div className={`p-4 rounded-lg border-2 ${
                    canProceed 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center">
                      {canProceed ? (
                        <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 mr-3" />
                      )}
                      <div>
                        <h3 className={`text-lg font-bold ${
                          canProceed ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {canProceed 
                            ? t('medicationSafetyModal.status.noCriticalIssues') 
                            : t('medicationSafetyModal.status.criticalIssuesDetected')}
                        </h3>
                        <p className={`text-sm ${
                          canProceed ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {canProceed
                            ? t('medicationSafetyModal.status.reviewWarnings')
                            : t('medicationSafetyModal.status.resolveErrors')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Errors (Critical Blockers) */}
                  {safetyCheck.errors.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                        <XCircle className="w-5 h-5 mr-2" />
                        Critical Errors ({safetyCheck.errors.length})
                      </h3>
                      <div className="space-y-3">
                        {safetyCheck.errors.map((error, idx) => (
                          <div key={idx} className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                            <div className="flex items-start">
                              <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-bold text-red-900">{error.message}</h4>
                                <p className="text-sm text-red-800 mt-1">{error.details}</p>
                                <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded bg-red-200 text-red-900">
                                  {error.type.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {safetyCheck.warnings.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Warnings ({safetyCheck.warnings.length})
                      </h3>
                      <div className="space-y-3">
                        {safetyCheck.warnings.map((warning, idx) => (
                          <div key={idx} className={`p-4 border rounded-lg ${getSeverityColor(warning.severity)}`}>
                            <div className="flex items-start">
                              {getSeverityIcon(warning.severity)}
                              <div className="flex-1 ml-3">
                                <div className="flex items-center justify-between">
                                  <h4 className={`font-bold ${getSeverityTextColor(warning.severity)}`}>
                                    {warning.message}
                                  </h4>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                    warning.severity === 'critical' ? 'bg-red-200 text-red-900' :
                                    warning.severity === 'high' ? 'bg-orange-200 text-orange-900' :
                                    warning.severity === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                                    'bg-blue-200 text-blue-900'
                                  }`}>
                                    {warning.severity.toUpperCase()}
                                  </span>
                                </div>
                                <p className={`text-sm mt-1 ${getSeverityTextColor(warning.severity)}`}>
                                  {warning.details}
                                </p>
                                {warning.affectedDrugs && warning.affectedDrugs.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium">Affected Medications:</p>
                                    <p className="text-sm">{warning.affectedDrugs.join(', ')}</p>
                                  </div>
                                )}
                                {warning.recommendation && (
                                  <div className={`mt-2 p-2 rounded ${
                                    warning.severity === 'critical' ? 'bg-red-100' :
                                    warning.severity === 'high' ? 'bg-orange-100' :
                                    warning.severity === 'medium' ? 'bg-yellow-100' :
                                    'bg-blue-100'
                                  }`}>
                                    <p className="text-xs font-medium">Recommendation:</p>
                                    <p className="text-sm">{warning.recommendation}</p>
                                  </div>
                                )}
                                <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
                                  warning.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                  warning.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                  warning.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {warning.type.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {safetyCheck.recommendations.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Clinical Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {safetyCheck.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-800">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            disabled={!canProceed || loading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              canProceed
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canProceed ? t('medicationSafetyModal.actions.proceed') : t('medicationSafetyModal.actions.cannotProceed')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicationSafetyModal;

