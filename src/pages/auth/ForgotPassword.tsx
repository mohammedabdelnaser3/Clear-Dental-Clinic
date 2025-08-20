import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, Input, Alert, Card } from '../../components/ui';
import { requestPasswordReset } from '../../services/authService';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError(t('forgotPassword.emailRequired'));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('forgotPassword.emailInvalid'));
      return;
    }

    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || t('forgotPassword.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{t('forgotPassword.title')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('forgotPassword.description')}</p>
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
              <h3 className="text-lg font-medium text-gray-900">{t('forgotPassword.successTitle')}</h3>
              <p className="mt-2 text-sm text-gray-600">{t('forgotPassword.successDescription', { email })}</p>
              <div className="mt-6">
                <Link to="/login">
                  <Button variant="primary">{t('forgotPassword.returnToLogin')}</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Input
                  label={t('forgotPassword.emailLabel')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>{t('forgotPassword.sendResetLink')}</Button>
              </div>

              <div className="text-sm text-center">
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">{t('forgotPassword.backToLogin')}</Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;