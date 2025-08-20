import React, { useState } from 'react';
import { Card, Button, Select } from '../../components/ui';

// Mock data for detailed patient report
const patientReportData = {
  totalPatients: 1248,
  newPatients: 387,
  returningPatients: 861,
  retentionRate: 69.0,
  averageVisits: 2.8,
  
  demographics: {
    byAgeGroup: [
      { group: '0-18', count: 142, percentage: 11.4 },
      { group: '19-35', count: 328, percentage: 26.3 },
      { group: '36-50', count: 412, percentage: 33.0 },
      { group: '51-65', count: 296, percentage: 23.7 },
      { group: '65+', count: 70, percentage: 5.6 }
    ],
    byGender: [
      { gender: 'Male', count: 542, percentage: 43.4 },
      { gender: 'Female', count: 706, percentage: 56.6 }
    ],
    byLocation: [
      { location: 'Local', count: 892, percentage: 71.5 },
      { location: 'Regional', count: 356, percentage: 28.5 }
    ]
  },
  
  monthlyTrends: [
    { month: 'Jan', new: 32, returning: 68 },
    { month: 'Feb', new: 28, returning: 72 },
    { month: 'Mar', new: 35, returning: 74 },
    { month: 'Apr', new: 42, returning: 78 },
    { month: 'May', new: 38, returning: 82 },
    { month: 'Jun', new: 45, returning: 85 },
    { month: 'Jul', new: 50, returning: 88 },
    { month: 'Aug', new: 48, returning: 92 },
    { month: 'Sep', new: 52, returning: 95 },
    { month: 'Oct', new: 55, returning: 98 },
    { month: 'Nov', new: 60, returning: 102 },
    { month: 'Dec', new: 62, returning: 108 }
  ],
  
  topConditions: [
    { condition: 'Hypertension', count: 248, percentage: 19.9 },
    { condition: 'Diabetes', count: 186, percentage: 14.9 },
    { condition: 'Arthritis', count: 142, percentage: 11.4 },
    { condition: 'Asthma', count: 98, percentage: 7.9 },
    { condition: 'Migraine', count: 76, percentage: 6.1 }
  ]
};

const PatientReportDetail: React.FC = () => {
  const [dateRange, setDateRange] = useState<string>('last30days');
  
  // Date range options
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' }
  ];

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient Demographics Report</h1>
        <div className="flex space-x-2">
          <Select
            value={dateRange}
            onChange={handleDateRangeChange}
            options={dateRangeOptions}
            className="w-40"
          />
          <Button variant="secondary" onClick={() => console.log('Export data')}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => console.log('Print report')}>
            Print
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-1">Total Patients</h3>
          <p className="text-3xl font-bold">{patientReportData.totalPatients.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-1">New Patients</h3>
          <p className="text-3xl font-bold text-blue-600">{patientReportData.newPatients.toLocaleString()}</p>
          <p className="text-sm text-gray-600">
            {Math.round((patientReportData.newPatients / patientReportData.totalPatients) * 100)}% of total
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-1">Returning Patients</h3>
          <p className="text-3xl font-bold text-green-600">{patientReportData.returningPatients.toLocaleString()}</p>
          <p className="text-sm text-gray-600">
            {Math.round((patientReportData.returningPatients / patientReportData.totalPatients) * 100)}% of total
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-1">Retention Rate</h3>
          <p className="text-3xl font-bold text-purple-600">{patientReportData.retentionRate}%</p>
          <p className="text-sm text-gray-600">
            Average visits: {patientReportData.averageVisits}
          </p>
        </Card>
      </div>

      {/* Demographics Section */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Patient Demographics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Age Distribution</h3>
            <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
              <p className="text-gray-500">Age Group Chart Placeholder</p>
            </div>
            <div className="mt-4 space-y-2">
              {patientReportData.demographics.byAgeGroup.map((ageGroup) => (
                <div key={ageGroup.group} className="flex justify-between">
                  <span>{ageGroup.group} years</span>
                  <span>{ageGroup.count} ({ageGroup.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Gender Distribution</h3>
            <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
              <p className="text-gray-500">Gender Chart Placeholder</p>
            </div>
            <div className="mt-4 space-y-2">
              {patientReportData.demographics.byGender.map((gender) => (
                <div key={gender.gender} className="flex justify-between">
                  <span>{gender.gender}</span>
                  <span>{gender.count} ({gender.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Location Distribution</h3>
            <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
              <p className="text-gray-500">Location Chart Placeholder</p>
            </div>
            <div className="mt-4 space-y-2">
              {patientReportData.demographics.byLocation.map((location) => (
                <div key={location.location} className="flex justify-between">
                  <span>{location.location}</span>
                  <span>{location.count} ({location.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Monthly Trends */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Patient Trends</h2>
        <div className="bg-gray-100 rounded-lg p-4 h-80 flex items-center justify-center">
          <p className="text-gray-500">Monthly Trends Chart Placeholder</p>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium mb-2">Highest New Patients</h3>
            <p className="text-lg">December: {patientReportData.monthlyTrends[11].new}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Highest Returning Patients</h3>
            <p className="text-lg">December: {patientReportData.monthlyTrends[11].returning}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Growth Rate</h3>
            <p className="text-lg">+15.2% year-over-year</p>
          </div>
        </div>
      </Card>

      {/* Top Conditions */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Top Patient Conditions</h2>
        <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center mb-4">
          <p className="text-gray-500">Conditions Chart Placeholder</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patientReportData.topConditions.map((condition, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{condition.condition}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{condition.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{condition.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PatientReportDetail;