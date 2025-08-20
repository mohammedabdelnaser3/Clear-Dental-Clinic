import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input, Alert, Card } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    age: 0,
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!formData.firstName.trim()) {
      errors.firstName = t('register.firstNameRequired');
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName)) {
      errors.firstName = t('register.firstNameInvalid');
      isValid = false;
    } else if (formData.firstName.length < 2 || formData.firstName.length > 50) {
      errors.firstName = t('register.firstNameLength');
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = t('register.lastNameRequired');
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
      errors.lastName = t('register.lastNameInvalid');
      isValid = false;
    } else if (formData.lastName.length < 2 || formData.lastName.length > 50) {
      errors.lastName = t('register.lastNameLength');
      isValid = false;
    }

    if (!formData.email) {
      errors.email = t('register.emailRequired');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('register.emailInvalid');
      isValid = false;
    }

    if (!formData.phoneNumber) {
      errors.phoneNumber = t('register.phoneNumberRequired');
      isValid = false;
    }

    if (!formData.gender) {
      errors.gender = t('register.genderRequired');
      isValid = false;
    }

    if (!formData.age || formData.age < 1 || formData.age > 120) {
      errors.age = t('register.ageInvalid');
      isValid = false;
    }

    if (!formData.password) {
      errors.password = t('register.passwordRequired');
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = t('register.passwordTooShort');
      isValid = false;
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(formData.password)) {
      errors.password = t('register.passwordInvalid');
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('register.passwordsDoNotMatch');
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (validateForm()) {
      try {
        // const approximateDob = new Date(currentYear - formData.age, 6, 1).toISOString();

        await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phoneNumber,
          gender: formData.gender,
          // dateOfBirth: approximateDob
        });
        navigate('/login', { state: { message: t('register.registrationSuccess') } });
      } catch {
        // Error is handled by the auth context
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{t('register.title')}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('register.or')}{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('register.signIn')}
            </Link>
          </p>
        </div>

        <Card>
          {error && (
            <Alert variant="error" dismissible className="mb-4">
              {error}
            </Alert>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <Input
                  label={t('register.firstName')}
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={formErrors.firstName}
                  required
                />
              </div>

              <div>
                <Input
                  label={t('register.lastName')}
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={formErrors.lastName}
                  required
                />
              </div>
            </div>

            <div>
              <Input
                label={t('register.email')}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={formErrors.email}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Input
                label={t('register.phoneNumber')}
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={formErrors.phoneNumber}
                placeholder="(123) 456-7890"
                required
                autoComplete="tel"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700">{t('register.gender')}</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">{t('register.male')}</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">{t('register.female')}</span>
                </label>
              </div>
              {formErrors.gender && (
                <p className="mt-1 text-sm text-red-600">{formErrors.gender}</p>
              )}
            </div>
            <div>
              <Input
                label={t('register.age')}
                type="number"
                name="age"
                value={formData.age > 0 ? formData.age.toString() : ''}
                onChange={handleChange}
                error={formErrors.age}
                placeholder="18"
                required
                min="1"
                max="120"
                autoComplete="off"
              />
            </div>
            <div>
              <Input
                label={t('register.password')}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <Input
                label={t('register.confirmPassword')}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={formErrors.confirmPassword}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
                {t('register.createAccount')}
              </Button>
            </div>

            <div className="text-sm text-center">
              <p className="text-gray-600">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="font-medium text-blue-600 hover:text-blue-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;