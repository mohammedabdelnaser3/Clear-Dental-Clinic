import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Select, Input, Alert } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { getPatientReports } from '../../services/patientService';
import type { PatientReport } from '../../types';
import { useTranslation } from 'react-i18next';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
  path?: string;
}

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('last30days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [patientReports, setPatientReports] = useState<PatientReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPatient = user?.role === 'patient';

  const getReportTypes = (): ReportType[] => {
    const reportKeys = isPatient
      ? ['my-reports', 'my-appointments']
      : ['appointments', 'patients', 'revenue', 'performance', 'custom'];

    return reportKeys.map(key => ({
      id: key,
      name: t(`reports.reportTypesConfig.${key}.name`),
      description: t(`reports.reportTypesConfig.${key}.description`),
      icon: { // Assuming you have a way to map icons or you can add them to translation
        'my-reports': '📋',
        'my-appointments': '📅',
        'appointments': '📅',
        'patients': '👥',
        'revenue': '💰',
        'performance': '📈',
        'custom': '⚙️'
      }[key] || '📄',
      path: key === 'patients' ? '/reports/patient-dashboard' : undefined
    }));
  };

  const reportTypes = getReportTypes();

  const dateRangeOptions = Object.keys(t('reports.dateRanges', { returnObjects: true })).map(key => ({
    value: key,
    label: t(`reports.dateRanges.${key}`)
  }));

  useEffect(() => {
    if (isPatient && selectedReportType === 'my-reports') {
      fetchPatientReports();
    }
  }, [selectedReportType, isPatient]);

  const fetchPatientReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const reports = await getPatientReports();
      setPatientReports(reports);
    } catch (err: any) {
      setError(err.message || t('reports.fetchingReportsError'));
    } finally {
      setLoading(false);
    }
  };

  const handleReportTypeSelect = (id: string) => {
    setSelectedReportType(id);
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value);
  };

  const handleGenerateReport = () => {
    console.log('Generating report:', {
      type: selectedReportType,
      dateRange,
      customRange: dateRange === 'custom' ? { start: customStartDate, end: customEndDate } : null
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => console.log('Export data')}
          >
            {t('reports.exportData')}
          </Button>
          <Button
            variant="outline"
            onClick={() => console.log('Save report')}
          >
            {t('reports.saveReport')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="h-full">
            <h2 className="text-lg font-semibold mb-4">{t('reports.reportTypes')}</h2>
            <div className="space-y-3">
              {reportTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedReportType === type.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                  onClick={() => handleReportTypeSelect(type.id)}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{type.icon}</span>
                    <div>
                      <h3 className="font-medium">{type.name}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold mb-4">
              {selectedReportType ? t('reports.configureReport', { reportName: reportTypes.find(t => t.id === selectedReportType)?.name }) : t('reports.selectReportType')}
            </h2>

            {selectedReportType ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.dateRange')}</label>
                    <Select
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      options={dateRangeOptions}
                    />
                  </div>

                  {dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="date"
                          label={t('reports.startDate')}
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          type="date"
                          label={t('reports.endDate')}
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {selectedReportType === 'appointments' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.status')}</label>
                      <Select
                        value="all"
                        onChange={() => {}}
                        options={Object.keys(t('reports.appointmentStatuses', { returnObjects: true })).map(key => ({ value: key, label: t(`reports.appointmentStatuses.${key}`) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.doctor')}</label>
                      <Select
                        value="all"
                        onChange={() => {}}
                        options={Object.keys(t('reports.doctors', { returnObjects: true })).map(key => ({ value: key, label: t(`reports.doctors.${key}`) }))}
                      />
                    </div>
                  </div>
                )}

                {selectedReportType === 'patients' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.ageGroup')}</label>
                      <Select
                        value="all"
                        onChange={() => {}}
                        options={Object.keys(t('reports.ageGroups', { returnObjects: true })).map(key => ({ value: key, label: t(`reports.ageGroups.${key}`) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.patientType')}</label>
                      <Select
                        value="all"
                        onChange={() => {}}
                        options={Object.keys(t('reports.patientTypes', { returnObjects: true })).map(key => ({ value: key, label: t(`reports.patientTypes.${key}`) }))}
                      />
                    </div>
                  </div>
                )}

                {selectedReportType === 'revenue' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.serviceType')}</label>
                      <Select
                        value="all"
                        onChange={() => {}}
                        options={Object.keys(t('reports.serviceTypes', { returnObjects: true })).map(key => ({ value: key, label: t(`reports.serviceTypes.${key}`) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.paymentMethod')}</label>
                      <Select
                        value="all"
                        onChange={() => {}}
                        options={Object.keys(t('reports.paymentMethods', { returnObjects: true })).map(key => ({ value: key, label: t(`reports.paymentMethods.${key}`) }))}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReportType('')}
                  >
                    {t('reports.cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleGenerateReport}
                  >
                    {t('reports.generateReport')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('reports.selectReportTypePrompt')}</p>
              </div>
            )}
          </Card>

          {isPatient && selectedReportType === 'my-reports' && (
            <Card className="mt-6">
              <h2 className="text-lg font-semibold mb-4">{t('reports.myMedicalReports')}</h2>
              {error && (
                <Alert variant="error" className="mb-4">
                  {error}
                </Alert>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : patientReports.length > 0 ? (
                <div className="space-y-4">
                  {patientReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{report.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {t('reports.reportDate')}: {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/reports/patient/${report.id}`, '_blank')}
                        >
                          {t('reports.viewReport')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t('reports.noMedicalReports')}</p>
                </div>
              )}
            </Card>
          )}

          {!isPatient && selectedReportType && (
            <Card className="mt-6">
              <h2 className="text-lg font-semibold mb-4">{t('reports.reportPreview')}</h2>
              <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">{t('reports.previewGenerated')}</p>
                  <Link to={`/reports/${selectedReportType}-detail`} className="text-blue-600 hover:underline">
                    {t('reports.viewSampleReport')}
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;