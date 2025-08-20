import React, { useState } from 'react';
import { Card, Button, Select } from '../../components/ui';

// Mock data for charts
const appointmentData = {
  totalAppointments: 248,
  completed: 187,
  cancelled: 42,
  noShow: 19,
  byDoctor: [
    { name: 'Dr. Smith', completed: 68, cancelled: 12, noShow: 5 },
    { name: 'Dr. Johnson', completed: 54, cancelled: 15, noShow: 8 },
    { name: 'Dr. Williams', completed: 65, cancelled: 15, noShow: 6 }
  ],
  byDay: [
    { day: 'Monday', count: 42 },
    { day: 'Tuesday', count: 38 },
    { day: 'Wednesday', count: 45 },
    { day: 'Thursday', count: 39 },
    { day: 'Friday', count: 52 },
    { day: 'Saturday', count: 32 },
    { day: 'Sunday', count: 0 }
  ],
  byTime: [
    { time: '8:00 - 10:00', count: 58 },
    { time: '10:00 - 12:00', count: 72 },
    { time: '12:00 - 14:00', count: 35 },
    { time: '14:00 - 16:00', count: 48 },
    { time: '16:00 - 18:00', count: 35 }
  ],
  monthlyTrend: [
    { month: 'Jan', count: 210 },
    { month: 'Feb', count: 195 },
    { month: 'Mar', count: 241 },
    { month: 'Apr', count: 248 },
    { month: 'May', count: 220 },
    { month: 'Jun', count: 236 }
  ]
};

const AppointmentReportDetail: React.FC = () => {
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

  // In a real application, we would use a charting library like Chart.js or Recharts
  // For this mockup, we'll create simple visual representations

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Appointment Reports</h1>
        <div className="flex space-x-2">
          <Select
            value={dateRange}
            onChange={handleDateRangeChange}
            options={dateRangeOptions.map(option => ({
              value: option.value,
              label: option.label
            }))}
            className="w-40"
          />
          <Button
            variant="outline"
            onClick={() => console.log('Print report')}
          >
            Print
          </Button>
          <Button
            variant="outline"
            onClick={() => console.log('Export data')}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Appointments</h3>
          <p className="text-3xl font-bold">{appointmentData.totalAppointments}</p>
          <p className="text-sm text-green-600">+12% from previous period</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="text-3xl font-bold">{appointmentData.completed}</p>
          <p className="text-sm text-gray-600">{Math.round(appointmentData.completed / appointmentData.totalAppointments * 100)}% completion rate</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Cancelled</h3>
          <p className="text-3xl font-bold">{appointmentData.cancelled}</p>
          <p className="text-sm text-gray-600">{Math.round(appointmentData.cancelled / appointmentData.totalAppointments * 100)}% cancellation rate</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">No-Shows</h3>
          <p className="text-3xl font-bold">{appointmentData.noShow}</p>
          <p className="text-sm text-red-600">{Math.round(appointmentData.noShow / appointmentData.totalAppointments * 100)}% no-show rate</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Appointments by Doctor</h2>
            <div className="space-y-4">
              {appointmentData.byDoctor.map((doctor, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{doctor.name}</span>
                    <span>{doctor.completed + doctor.cancelled + doctor.noShow} appointments</span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(doctor.completed / (doctor.completed + doctor.cancelled + doctor.noShow)) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-yellow-500" 
                        style={{ width: `${(doctor.cancelled / (doctor.completed + doctor.cancelled + doctor.noShow)) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${(doctor.noShow / (doctor.completed + doctor.cancelled + doctor.noShow)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex text-xs mt-1 text-gray-600 space-x-4">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Completed
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span> Cancelled
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span> No-show
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Monthly Trend</h2>
            <div className="h-64 flex items-end space-x-2">
              {appointmentData.monthlyTrend.map((item, index) => {
                const maxCount = Math.max(...appointmentData.monthlyTrend.map(i => i.count));
                const height = (item.count / maxCount) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs mt-1">{item.month}</div>
                    <div className="text-xs font-medium">{item.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Appointments by Day of Week</h2>
            <div className="h-64 flex items-end space-x-2">
              {appointmentData.byDay.map((item, index) => {
                const maxCount = Math.max(...appointmentData.byDay.map(i => i.count));
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-purple-500 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs mt-1">{item.day.substring(0, 3)}</div>
                    <div className="text-xs font-medium">{item.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Appointments by Time of Day</h2>
            <div className="h-64 flex items-end space-x-2">
              {appointmentData.byTime.map((item, index) => {
                const maxCount = Math.max(...appointmentData.byTime.map(i => i.count));
                const height = (item.count / maxCount) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-teal-500 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs mt-1 text-center">{item.time}</div>
                    <div className="text-xs font-medium">{item.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="mt-6">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Appointment Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelled</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No-Show</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointmentData.byDoctor.map((doctor, index) => {
                  const total = doctor.completed + doctor.cancelled + doctor.noShow;
                  const completionRate = Math.round((doctor.completed / total) * 100);
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doctor.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.completed}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.cancelled}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.noShow}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">{completionRate}%</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appointmentData.totalAppointments}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appointmentData.completed}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appointmentData.cancelled}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appointmentData.noShow}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <span className="mr-2">{Math.round((appointmentData.completed / appointmentData.totalAppointments) * 100)}%</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${Math.round((appointmentData.completed / appointmentData.totalAppointments) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AppointmentReportDetail;