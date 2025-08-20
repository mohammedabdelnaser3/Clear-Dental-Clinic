import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, Alert, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

interface SecurityLog {
  id: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
}

const SecuritySettings: React.FC = () => {
  const { t } = useTranslation();
  const { user, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [showQRCode, setShowQRCode] = useState(false);

  // Mock security logs - would come from API in real app
  const securityLogs: SecurityLog[] = [
    {
      id: '1',
      action: 'login',
      timestamp: '2023-06-20T10:30:00Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 114.0.0.0',
      location: 'New York, NY'
    },
    {
      id: '2',
      action: 'passwordchanged',
      timestamp: '2023-06-15T14:22:00Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 114.0.0.0',
      location: 'New York, NY'
    },
    {
      id: '3',
      action: 'login',
      timestamp: '2023-06-14T09:15:00Z',
      ipAddress: '10.0.0.50',
      userAgent: 'Safari 16.5.0',
      location: 'Los Angeles, CA'
    }
  ];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: t('settings.security.changePassword.messages.passwordsDoNotMatch') });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: t('settings.security.changePassword.messages.passwordTooShort') });
      return;
    }

    setLoading(true);

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMessage({ type: 'success', text: t('settings.security.changePassword.messages.updateSuccess') });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (_error) {
      setMessage({ type: 'error', text: t('settings.security.changePassword.messages.updateError') });
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    if (!twoFactorEnabled) {
      setShowQRCode(true);
    } else {
      // Disable 2FA
      try {
        // API call to disable 2FA
        setTwoFactorEnabled(false);
        setMessage({ type: 'success', text: t('settings.security.twoFactorAuth.messages.disableSuccess') });
      } catch (_error) {
        setMessage({ type: 'error', text: t('settings.security.twoFactorAuth.messages.disableError') });
      }
    }
  };

  const handleEnable2FA = async () => {
    try {
      // API call to enable 2FA with verification code
      setTwoFactorEnabled(true);
      setShowQRCode(false);
      setMessage({ type: 'success', text: t('settings.security.twoFactorAuth.messages.enableSuccess') });
    } catch (_error) {
      setMessage({ type: 'error', text: t('settings.security.twoFactorAuth.messages.invalidCode') });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'password changed':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <Alert
          variant={message.type}
          dismissible
        >
          {message.text}
        </Alert>
      )}

      {/* Change Password */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings.security.changePassword.title')}</h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label={t('settings.security.changePassword.currentPassword')}
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            required
          />
          
          <Input
            label={t('settings.security.changePassword.newPassword')}
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            required
            minLength={8}
            helperText={t('settings.security.changePassword.passwordLengthHelper')}
          />
          
          <Input
            label={t('settings.security.changePassword.confirmNewPassword')}
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            required
            minLength={8}
          />
          
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={loading}
              disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              {t('settings.security.changePassword.buttons.changePassword')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{t('settings.security.twoFactorAuth.title')}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {t('settings.security.twoFactorAuth.description')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={twoFactorEnabled ? 'success' : 'gray'}>
              {twoFactorEnabled ? t('settings.security.twoFactorAuth.status.enabled') : t('settings.security.twoFactorAuth.status.disabled')}
            </Badge>
            <Button
              variant={twoFactorEnabled ? 'outline' : 'primary'}
              onClick={handleTwoFactorToggle}
            >
              {twoFactorEnabled ? t('settings.security.twoFactorAuth.buttons.disable') : t('settings.security.twoFactorAuth.buttons.enable')}
            </Button>
          </div>
        </div>

        {showQRCode && (
          <div className="border-t border-gray-200 pt-6">
            <div className="max-w-md">
              <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.security.twoFactorAuth.setupTitle')}</h4>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    1. {t('settings.security.twoFactorAuth.installApp')}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    2. {t('settings.security.twoFactorAuth.scanQrCode')}
                  </p>
                  <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300 text-center">
                    <div className="w-32 h-32 mx-auto bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">{t('settings.security.twoFactorAuth.qrCodePlaceholder')}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    3. {t('settings.security.twoFactorAuth.enterCode')}
                  </p>
                </div>
                
                <Input
                  label={t('settings.security.twoFactorAuth.verificationCode')}
                  placeholder={t('settings.security.twoFactorAuth.verificationCodePlaceholder')}
                  maxLength={6}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.length === 6) {
                      handleEnable2FA();
                    }
                  }}
                />
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowQRCode(false)}
                  >
                    {t('common.buttons.cancel')}
                  </Button>
                  <Button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Enter 6-digit code"]') as HTMLInputElement;
                      if (input?.value.length === 6) {
                        handleEnable2FA();
                      }
                    }}
                  >
                    {t('settings.security.twoFactorAuth.buttons.verifyAndEnable')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Active Sessions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{t('settings.security.activeSessions.title')}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {t('settings.security.activeSessions.description')}
            </p>
          </div>
          <Button variant="outline" size="sm">
            {t('settings.security.activeSessions.signOutAll')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('settings.security.activeSessions.currentSession')}</p>
                <p className="text-xs text-gray-600">{t('settings.security.activeSessions.sessionInfo', { browser: 'Chrome 114.0.0.0', location: 'New York, NY' })}</p>
              </div>
            </div>
            <Badge variant="success" size="sm">{t('settings.security.activeSessions.active')}</Badge>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('settings.security.activeSessions.mobileApp')}</p>
                <p className="text-xs text-gray-600">{t('settings.security.activeSessions.mobileSessionInfo', { app: 'iOS App', lastSeen: '2 hours ago' })}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {t('settings.security.activeSessions.signOut')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Security Log */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings.security.securityActivity.title')}</h3>
        
        <div className="space-y-4">
          {securityLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{t(`settings.security.securityActivity.actions.${log.action.toLowerCase().replace(/ /g, '')}`)}</p>
                  <p className="text-xs text-gray-500">{formatDate(log.timestamp)}</p>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  <span>{log.ipAddress}</span>
                  {log.location && <span> • {log.location}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">{log.userAgent}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm">
            {t('settings.security.securityActivity.viewAll')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SecuritySettings;