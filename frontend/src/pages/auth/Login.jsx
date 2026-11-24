import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Bus, User, Phone } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputField } from '../../components/common/InputField';
import { PasswordInput } from '../../components/common/PasswordInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() === 'DRIVER' ? 'DRIVER' : 'PASSENGER';

  const [role, setRole] = useState(initialRole);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    setSearchParams({ role: newRole.toLowerCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mobile.trim()) {
      return setError('Please enter your mobile number');
    }
    if (!password) {
      return setError('Please enter your password');
    }

    setLoading(true);
    try {
      const user = await login(mobile, password, role);

      // Prompt for geolocation permission gracefully after login if supported
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { timeout: 5000 }
        );
      }

      if (user.role === 'DRIVER') {
        navigate('/driver/dashboard');
      } else {
        navigate('/passenger/search');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid mobile number or password for the selected role'
      );
    } finally {
      setLoading(false);
    }
  };

  const isDriver = role === 'DRIVER';

  return (
    <AuthLayout
      icon={isDriver ? Bus : User}
      title={isDriver ? 'Driver Login' : 'Passenger Login'}
      subtitle="Welcome back!"
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkTo={`/signup?role=${role.toLowerCase()}`}
    >
      {/* Role Segmented Switch */}
      <div className="mb-6 p-1 bg-[#F1F5F9] rounded-xl flex items-center">
        <button
          type="button"
          onClick={() => handleRoleChange('PASSENGER')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            !isDriver
              ? 'bg-white text-[#1769F4] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <User size={15} />
          <span>Passenger</span>
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange('DRIVER')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            isDriver
              ? 'bg-white text-[#1769F4] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Bus size={15} />
          <span>Driver</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-[#EF4444] bg-[#FEE2E2] rounded-lg border border-[#FECACA]">
            {error}
          </div>
        )}

        <InputField
          label="Mobile Number"
          id="mobile"
          placeholder="+91 98765 43210"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          leftIcon={Phone}
          required
        />

        <PasswordInput
          label="Password"
          id="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="pt-2">
          <PrimaryButton type="submit" loading={loading}>
            Login
          </PrimaryButton>
        </div>
      </form>
    </AuthLayout>
  );
};
