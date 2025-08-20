import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
import { useTranslation } from 'react-i18next';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
}

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Available report types
  const reportTypes: ReportType[] = [
    {
      id: 'appointments',
      title: t('reportsDashboard.appointmentReports.title'),
      description: t('reportsDashboard.appointmentReports.description'),
      icon: '📅',
      path: '/reports/appointments'
    },
    {
      id: 'patients',
      title: t('reportsDashboard.patientDemographics.title'),
      description: t('reportsDashboard.patientDemographics.description'),
      icon: '👥',
      path: '/reports/patient-dashboard'
    },
    {
      id: 'billing',
      title: t('reportsDashboard.billingAndRevenue.title'),
      description: t('reportsDashboard.billingAndRevenue.description'),
      icon: '💰',
      path: '/reports/billing'
    },
    {
      id: 'doctors',
      title: t('reportsDashboard.doctorPerformance.title'),
      description: t('reportsDashboard.doctorPerformance.description'),
      icon: '👨‍⚕️',
      path: '/reports/doctors'
    },
    {
      id: 'inventory',
      title: t('reportsDashboard.inventoryAndSupplies.title'),
      description: t('reportsDashboard.inventoryAndSupplies.description'),
      icon: '📦',
      path: '/reports/inventory'
    },
    {
      id: 'custom',
      title: t('reportsDashboard.customReports.title'),
      description: t('reportsDashboard.customReports.description'),
      icon: '⚙️',
      path: '/reports/custom'
    }
  ];

  // Filter reports based on search term
  const filteredReports = reportTypes.filter(report => 
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle report selection
  const handleReportSelect = (path: string) => {
    navigate(path);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('reportsDashboard.title')}</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder={t('reportsDashboard.searchPlaceholder')}
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/reports/custom/new')}
          >
            {t('reportsDashboard.createCustomReport')}
          </Button>
        </div>
      </div>

      {/* Recently Viewed Reports */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t('reportsDashboard.recentlyViewed')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleReportSelect('/reports/appointments')}
          >
            <Card className="p-4">
              <div className="flex items-start">
                <div className="text-3xl mr-4">📅</div>
                <div>
                  <h3 className="font-medium">{t('reportsDashboard.appointmentReports.title')}</h3>
                  <p className="text-sm text-gray-600">{t('reportsDashboard.lastViewed')}: {t('reportsDashboard.today')}, 10:45 AM</p>
                </div>
              </div>
            </Card>
          </div>
          <div 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleReportSelect('/reports/billing')}
          >
            <Card className="p-4">
              <div className="flex items-start">
                <div className="text-3xl mr-4">💰</div>
                <div>
                  <h3 className="font-medium">{t('reportsDashboard.billingAndRevenue.title')}</h3>
                  <p className="text-sm text-gray-600">{t('reportsDashboard.lastViewed')}: {t('reportsDashboard.yesterday')}, 3:20 PM</p>
                </div>
              </div>
            </Card>
          </div>
          <div 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleReportSelect('/reports/patients')}
          >
            <Card className="p-4">
              <div className="flex items-start">
                <div className="text-3xl mr-4">👥</div>
                <div>
                  <h3 className="font-medium">{t('reportsDashboard.patientDemographics.title')}</h3>
                  <p className="text-sm text-gray-600">{t('reportsDashboard.lastViewed')}: 2 {t('reportsDashboard.daysAgo')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* All Report Types */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('reportsDashboard.allReports')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div 
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleReportSelect(report.path)}
            >
              <Card className="p-4">
                <div className="flex items-start">
                  <div className="text-3xl mr-4">{report.icon}</div>
                  <div>
                    <h3 className="font-medium">{report.title}</h3>
                    <p className="text-sm text-gray-600">{report.description}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Report Favorites */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">{t('reportsDashboard.favorites')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleReportSelect('/reports/appointments/weekly')}
          >
            <Card className="p-4">
              <div className="flex items-start">
                <div className="text-3xl mr-4">⭐</div>
                <div>
                  <h3 className="font-medium">{t('reportsDashboard.weeklyAppointmentSummary')}</h3>
                  <p className="text-sm text-gray-600">{t('reportsDashboard.customReport')}</p>
                </div>
              </div>
            </Card>
          </div>
          <div 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleReportSelect('/reports/revenue/monthly')}
          >
            <Card className="p-4">
              <div className="flex items-start">
                <div className="text-3xl mr-4">⭐</div>
                <div>
                  <h3 className="font-medium">{t('reportsDashboard.monthlyRevenueAnalysis')}</h3>
                  <p className="text-sm text-gray-600">{t('reportsDashboard.customReport')}</p>
                </div>
              </div>
            </Card>
          </div>
          <div 
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => navigate('/reports/favorites/add')}
          >
            <Card className="border-2 border-dashed border-gray-300 p-4 flex items-center justify-center">
              <div className="text-center text-gray-500 hover:text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Favorite</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;