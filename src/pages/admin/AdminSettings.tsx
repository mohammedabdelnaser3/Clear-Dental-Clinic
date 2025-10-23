import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, Button } from '../../components/ui';
import { Shield, KeyRound } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const { user, changePassword } = useAuth();

  const handlePasswordReset = async () => {
    try {
      // For demo purposes, we simply prompt. In production, use a proper form.
      const current = window.prompt('Enter current password');
      const next = window.prompt('Enter new password');
      if (current && next) {
        await changePassword(current, next);
        alert('Password updated successfully');
      }
    } catch (err) {
      console.error('Failed to change password:', err);
      alert('Failed to change password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Admin Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your admin account settings.</p>

          <div className="mt-6">
            <p className="text-gray-700"><strong>User:</strong> {user?.firstName} {user?.lastName} ({user?.email})</p>
            <p className="text-gray-700"><strong>Role:</strong> {user?.role}</p>
          </div>

          <div className="mt-6">
            <Button variant="primary" onClick={handlePasswordReset} className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Change Password
            </Button>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-800 mb-2">Notes</h2>
            <ul className="list-disc pl-6 text-gray-600">
              <li>Admin settings are separate from patient and dentist settings.</li>
              <li>No patient API calls are made on this page.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;