import React, { useState, useEffect } from 'react';
import { Button, Card, Alert } from '../../components/ui';
import { ReportsDashboard } from '../../components/reports/ReportsDashboard';
import { useAuth } from '../../hooks/useAuth';
import { getPatientReports } from '../../services/patientService';
import type { PatientReport } from '../../types';
import { useTranslation } from 'react-i18next';
import { BarChart3, FileText, Users, TrendingUp, Calendar } from 'lucide-react';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component?: React.ReactNode;
}

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'custom' | 'patient'>('dashboard');
  const [patientReports, setPatientReports] = useState<PatientReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPatient = user?.role === 'patient';
  const canViewDashboard = ['admin', 'dentist', 'staff'].includes(user?.role || '');

  useEffect(() => {
    if (isPatient) {
      setActiveView('patient');
      fetchPatientReports();
    }
  }, [isPatient]);

  const fetchPatientReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const reports = await getPatientReports(user?.id);
      setPatientReports(reports);
    } catch (err: any) {
      setError(err.message || t('reports.fetchingReportsError'));
    } finally {
      setLoading(false);
    }
  };

  const reportTypes: ReportType[] = [
    {
      id: 'dashboard',
      name: t('reports.views.dashboard.name'),
      description: t('reports.views.dashboard.description'),
      icon: <BarChart3 className="h-6 w-6" />,
      component: <ReportsDashboard />
    },
    {
      id: 'appointments',
      name: t('reports.views.appointments.name'),
      description: t('reports.views.appointments.description'),
      icon: <Calendar className="h-6 w-6" />
    },
    {
      id: 'revenue',
      name: t('reports.views.revenue.name'),
      description: t('reports.views.revenue.description'),
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      id: 'patients',
      name: t('reports.views.patients.name'),
      description: t('reports.views.patients.description'),
      icon: <Users className="h-6 w-6" />
    },
    {
      id: 'custom',
      name: t('reports.views.custom.name'),
      description: t('reports.views.custom.description'),
      icon: <FileText className="h-6 w-6" />
    }
  ];


  const renderPatientReports = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          {t('reports.patient.title')}
        </h2>
        <p className="text-gray-600 mb-6">{t('reports.patient.description')}</p>
        
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">{t('reports.loading')}</span>
          </div>
        ) : patientReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patientReports.map((report) => (
              <Card key={report.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{report.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                    <div className="flex items-center mt-3 text-xs text-gray-500">
                      <span>{t('reports.reportDate')}: {new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/reports/patient/${report.id}`, '_blank')}
                  >
                    {t('reports.viewReport')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('reports.patient.noReports')}</h3>
            <p className="text-gray-600">{t('reports.patient.noReportsDescription')}</p>
          </div>
        )}
      </Card>
    </div>
  );

  const renderCustomReports = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t('reports.custom.title')}</h2>
        <p className="text-gray-600 mb-6">{t('reports.custom.description')}</p>
        
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('reports.custom.comingSoon')}</h3>
          <p className="text-gray-600">{t('reports.custom.comingSoonDescription')}</p>
        </div>
      </Card>
    </div>
  );

  const renderMainContent = () => {
    if (isPatient) {
      return renderPatientReports();
    }

    switch (activeView) {
      case 'dashboard':
        return <ReportsDashboard />;
      case 'custom':
        return renderCustomReports();
      default:
        return <ReportsDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-600">{t('reports.subtitle')}</p>
        </div>
      </div>

      {/* Navigation for non-patients */}
      {canViewDashboard && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {reportTypes.map((type) => (
              <Button
                key={type.id}
                variant={activeView === type.id ? "primary" : "outline"}
                onClick={() => setActiveView(type.id as any)}
                className="flex items-center gap-2"
              >
                {type.icon}
                <span className="hidden sm:inline">{type.name}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Main Content */}
      {renderMainContent()}
    </div>
  );
};

export default Reports;