import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, Alert, Modal, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { getClinic } from '../../services/clinicService';
import { 
  Building2, 
  Users, 
  Calendar, 
  DollarSign, 
  UserPlus, 
  Settings, 
  Clock, 
  Phone, 
  Mail, 
  MapPin,
  TrendingUp,
  Activity,
  Star,
  Edit,
  Plus,
  Eye,
  RefreshCw,
  FileText
} from 'lucide-react';
import type { Clinic } from '../../types';

interface ClinicFormData {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  description?: string;
}

interface ClinicStats {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  staffCount: number;
  todayAppointments: number;
  monthlyRevenue: number;
  averageRating: number;
  completedAppointments: number;
}

const Clinics: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ClinicStats>({
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    staffCount: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    completedAppointments: 0
  });
  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    phone: '',
    email: '',
    description: ''
  });

  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    fetchClinic();
  }, [isAdmin]);

  const fetchClinic = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getClinic();
      if (response.success && response.data) {
        setClinic(response.data);
        // Simulate fetching clinic statistics
        await fetchClinicStats();
      } else {
        setError(response.message || 'Failed to fetch clinic');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clinic');
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicStats = async () => {
    try {
      // Simulate API call for clinic statistics
      // In a real application, this would be an actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalPatients: 1247,
        totalAppointments: 3456,
        totalRevenue: 125000,
        staffCount: 12,
        todayAppointments: 24,
        monthlyRevenue: 15000,
        averageRating: 4.8,
        completedAppointments: 3201
      });
    } catch (err) {
      console.error('Failed to fetch clinic statistics:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClinic();
    setRefreshing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (clinic: Clinic) => {
    setFormData({
      name: clinic.name,
      address: {
        street: clinic.address.street || '',
        city: clinic.address.city || '',
        state: clinic.address.state || '',
        zipCode: clinic.address.zipCode || '',
        country: clinic.address.country || ''
      },
      phone: clinic.phone,
      email: clinic.email,
      description: clinic.description || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      phone: '',
      email: '',
      description: ''
    });
    setShowEditModal(false);
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          Access denied. You need admin privileges to manage clinic settings.
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          No clinic found. Please contact system administrator.
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              Clinic Management
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive overview and management of your clinic operations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              onClick={() => clinic && handleEdit(clinic)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Clinic
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Patients */}
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Patients</p>
                <p className="text-3xl font-bold mt-1">{stats.totalPatients.toLocaleString()}</p>
                <p className="text-blue-100 text-xs mt-1">Active registrations</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </Card>

          {/* Total Appointments */}
          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Appointments</p>
                <p className="text-3xl font-bold mt-1">{stats.totalAppointments.toLocaleString()}</p>
                <p className="text-green-100 text-xs mt-1">
                  {stats.completedAppointments} completed
                </p>
              </div>
              <Calendar className="w-12 h-12 text-green-200" />
            </div>
          </Card>

          {/* Total Revenue */}
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold mt-1">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-purple-100 text-xs mt-1">
                  ${stats.monthlyRevenue.toLocaleString()} this month
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-200" />
            </div>
          </Card>

          {/* Staff Count */}
          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Staff Members</p>
                <p className="text-3xl font-bold mt-1">{stats.staffCount}</p>
                <p className="text-orange-100 text-xs mt-1">Active team members</p>
              </div>
              <UserPlus className="w-12 h-12 text-orange-200" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Today's Schedule</h3>
                <p className="text-sm text-gray-600">{stats.todayAppointments} appointments</p>
              </div>
            </div>
            <Link to="/appointments">
              <Button variant="outline" size="sm" className="w-full">
                View Schedule
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Patient Management</h3>
                <p className="text-sm text-gray-600">Manage patient records</p>
              </div>
            </div>
            <Link to="/patients">
              <Button variant="outline" size="sm" className="w-full">
                View Patients
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Clinic Settings</h3>
                <p className="text-sm text-gray-600">Configure clinic details</p>
              </div>
            </div>
            <Link to={`/settings/clinic/${clinic?.id || ''}`}>
              <Button variant="outline" size="sm" className="w-full">
                Manage Settings
              </Button>
            </Link>
          </Card>
        </div>

      {/* Clinic Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Clinic Details */}
        <div className="lg:col-span-2">
          <Card className="p-8 shadow-lg border-0 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-600" />
                {clinic.name}
              </h2>
              <Badge 
                variant={clinic.isActive ? 'success' : 'secondary'}
                className="px-3 py-1"
              >
                {clinic.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
      
            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                  <p className="text-gray-600">
                    {clinic.address.street}, {clinic.address.city}, {clinic.address.state} {clinic.address.zipCode}
                  </p>
                  <p className="text-gray-500 text-sm">{clinic.address.country}</p>
                </div>
              </div>
      
              {/* Contact Information */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Contact</h3>
                  <p className="text-gray-600">{clinic.phone}</p>
                  <p className="text-gray-600">{clinic.email}</p>
                  {clinic.website && (
                    <p className="text-gray-600">{clinic.website}</p>
                  )}
                </div>
              </div>
      
              {/* Description */}
              {clinic.description && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                    <p className="text-gray-600">{clinic.description}</p>
                  </div>
                </div>
              )}
      
              {/* Operating Hours */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Operating Hours</h3>
                  <div className="space-y-1">
                    {clinic.operatingHours && clinic.operatingHours.length > 0 ? (
                      clinic.operatingHours.map((hours, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700 font-medium">
                            {typeof hours === 'object' ? (hours as any).day || 'Day' : 'Day'}:
                          </span>
                          <span className="text-gray-600">
                            {typeof hours === 'object' ? 
                              `${(hours as any).openTime || '9:00'} - ${(hours as any).closeTime || '17:00'}` : 
                              String(hours)
                            }
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No operating hours set</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      
        {/* Sidebar - Additional Information */}
        <div className="space-y-6">
          {/* Rating Card */}
          <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <span className="text-2xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-gray-600 text-sm">Average Rating</p>
              <p className="text-gray-500 text-xs mt-1">Based on patient reviews</p>
            </div>
          </Card>
      
          {/* Performance Metrics */}
          <Card className="p-6 shadow-lg border-0">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Patient Satisfaction</span>
                <span className="font-semibold text-green-600">94%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">On-time Appointments</span>
                <span className="font-semibold text-blue-600">87%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Treatment Success Rate</span>
                <span className="font-semibold text-purple-600">96%</span>
              </div>
            </div>
          </Card>
      
          {/* Quick Links */}
          <Card className="p-6 shadow-lg border-0">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link 
                to={`/settings/clinic/${clinic.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Detailed Settings</span>
              </Link>
              <Link 
                to="/staff"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Manage Staff</span>
              </Link>
              <Link 
                to="/services"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Activity className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Service Offerings</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={resetForm}
        title={t('clinics.editClinicInfo')}
        size="lg"
      >
        <div className="p-4">
          <Alert variant="info" className="mb-4">
            Note: Clinic updates are currently disabled in single clinic mode. 
            Please contact system administrator for any changes.
          </Alert>
          
          <div className="space-y-4">
            <Input
              label={t('clinics.name')}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled
            />
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Address</h4>
              <Input
                label={t('clinics.address')}
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                disabled
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  disabled
                />
                <Input
                  label="State"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="ZIP Code"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                  disabled
                />
                <Input
                  label="Country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
            </div>
            
            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              disabled
            />
            
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder={t('common.placeholders.description')}
                disabled
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Clinics;