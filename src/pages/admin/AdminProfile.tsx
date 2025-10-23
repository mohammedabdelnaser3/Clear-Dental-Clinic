import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, Button, Avatar, Badge } from '../../components/ui';
import { Shield, Home, Building2 } from 'lucide-react';

const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600">Loading admin profile...</p>
        </div>
      </div>
    );
  }

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Admin User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar src={user.profileImage} alt={fullName} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                {fullName}
                <Badge variant="primary" className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  {user.role}
                </Badge>
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="primary" onClick={() => navigate('/admin/homepage')} className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Admin Dashboard
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/multi-clinic')} className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Multi-Clinic Dashboard
            </Button>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-800 mb-2">About</h2>
            <p className="text-gray-600">
              This is the admin profile. Admin accounts do not have patient records and should not use patient APIs.
              Use the dashboard links above to manage clinics and homepage content.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile;