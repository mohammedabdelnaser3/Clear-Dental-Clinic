import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Alert, Modal } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { getClinic } from '../../services/clinicService';
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

const Clinics: React.FC = () => {
  const { user } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
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
      } else {
        setError(response.message || 'Failed to fetch clinic');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clinic');
    } finally {
      setLoading(false);
    }
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clinic Information</h1>
        <Button
          variant="primary"
          onClick={() => handleEdit(clinic)}
        >
          Edit Clinic
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Single Clinic Display */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-semibold">{clinic.name}</h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(clinic)}
              >
                Edit
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Address</h4>
                <p className="text-gray-900">
                  {clinic.address.street}, {clinic.address.city}, {clinic.address.state} {clinic.address.zipCode}
                </p>
                <p className="text-gray-600">{clinic.address.country}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h4>
                <p className="text-gray-900">
                  <strong>Phone:</strong> {clinic.phone}
                </p>
                <p className="text-gray-900">
                  <strong>Email:</strong> {clinic.email}
                </p>
                {clinic.website && (
                  <p className="text-gray-900">
                    <strong>Website:</strong> {clinic.website}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              {clinic.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-900">{clinic.description}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  clinic.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {clinic.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Operating Hours</h4>
                {clinic.operatingHours && clinic.operatingHours.length > 0 ? (
                  <div className="space-y-1">
                    {clinic.operatingHours.map((hours, index) => (
                      <p key={index} className="text-sm text-gray-900">
                        {hours}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No operating hours set</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Link
              to={`/settings/clinic/${clinic.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View Detailed Settings →
            </Link>
          </div>
        </Card>
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