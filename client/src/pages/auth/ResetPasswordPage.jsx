import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { validatePassword } from '@/utils/validators';
import authService from '@/services/authService';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      setErrors({ general: 'Invalid or expired reset token. Please request a new link.' });
      return;
    }

    const newErrors = {};
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, formData.password);
      setIsSuccess(true);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Failed to reset password. Link may have expired.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Password Reset!</h2>
          <p className="text-sm text-slate-500">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
        </div>
        <Button onClick={() => navigate('/login')} className="w-full">
          Sign In Now
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Set New Password</h2>
        <p className="text-sm text-slate-500 mt-1">Please enter your new password below</p>
      </div>

      {(errors.general || !token) && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-medium">{errors.general || 'Missing reset token'}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          disabled={isLoading || !token}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
          disabled={isLoading || !token}
        />

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isLoading}
          disabled={!token}
        >
          Reset Password
        </Button>
      </form>

      <div className="text-center">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
