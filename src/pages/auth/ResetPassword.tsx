import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Alert, Card } from '../../components/ui';
import { resetPassword } from '../../services/authService';
import { useTranslation } from 'react-i18next';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const tokenParam = queryParams.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError(t('resetPassword.invalidToken'));
    }
  }, [location]);

  const validateForm = () => {
    if (!password) {
      setError(t('resetPassword.passwordRequired'));
      return false;
    }
    
    if (password.length < 8) {
      setError(t('resetPassword.passwordTooShort'));
      return false;
    }
    
    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordsDoNotMatch'));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: t('resetPassword.passwordResetSuccessMessage') } });
      }, 3000);
    } catch (error: any) {
      setError(error.message || t('resetPassword.genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{t('resetPassword.title')}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('resetPassword.description')}
          </p>
        </div>

        <Card>
          {error && (
            <Alert variant="error" onClose={() => setError(null)} className="mb-4">
              {error}
            </Alert>
          )}

          {success ? (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">{t('resetPassword.successTitle')}</h3>
              <p className="mt-2 text-sm text-gray-600">
                {t('resetPassword.successDescription')}
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Input
                  label={t('resetPassword.newPassword')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('common.placeholders.password')}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <Input
                  label={t('resetPassword.confirmNewPassword')}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('common.placeholders.password')}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full" 
                  isLoading={isSubmitting}
                  disabled={!token}
                >
                  {t('resetPassword.resetPasswordButton')}
                </Button>
              </div>

              <div className="text-sm text-center">
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  {t('resetPassword.backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;