import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Alert, Modal } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { getClinics, createClinic, updateClinic, deleteClinic } from '../../services/clinicService';
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
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
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
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    fetchClinics();
  }, [isAdmin]);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getClinics();
      setClinics(Array.isArray(response) ? response : (response.data || []));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clinics');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      if (editingClinic) {
        await updateClinic(editingClinic.id, formData);
      } else {
        await createClinic({
          ...formData,
          staff: [],
          operatingHours: [],
          services: [],
          isActive: true
        });
      }
      await fetchClinics();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save clinic');
    }
  };

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
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
    setShowCreateModal(true);
  };

  const handleDelete = async (clinicId: string) => {
    if (!window.confirm('Are you sure you want to delete this clinic?')) {
      return;
    }
    try {
      setError(null);
      await deleteClinic(clinicId);
      await fetchClinics();
    } catch (err: any) {
      setError(err.message || 'Failed to delete clinic');
    }
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
    setEditingClinic(null);
    setShowCreateModal(false);
  };

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.address.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.address.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          Access denied. You need admin privileges to manage clinics.
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clinic Management</h1>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          Add New Clinic
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search clinics by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Clinics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClinics.map((clinic) => (
          <Card key={clinic.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{clinic.name}</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(clinic)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(clinic.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Address:</strong> {clinic.address.street}, {clinic.address.city}, {clinic.address.state} {clinic.address.zipCode}</p>
              <p><strong>Phone:</strong> {clinic.phone}</p>
              <p><strong>Email:</strong> {clinic.email}</p>
              {clinic.description && (
                <p><strong>Description:</strong> {clinic.description}</p>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Link
                to={`/settings/clinic/${clinic.id}`}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                View Settings →
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {filteredClinics.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm ? 'No clinics found matching your search.' : 'No clinics found. Create your first clinic to get started.'}
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={resetForm}
        title={editingClinic ? 'Edit Clinic' : 'Create New Clinic'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Clinic Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Address</h4>
            <Input
              label="Street Address"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                required
              />
              <Input
                label="State"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="ZIP Code"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Country"
                name="address.country"
                value={formData.address.country}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the clinic..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {editingClinic ? 'Update Clinic' : 'Create Clinic'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Clinics;