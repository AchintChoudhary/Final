import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Bus, User, Phone } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputField } from '../../components/common/InputField';
import { PasswordInput } from '../../components/common/PasswordInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

export const Signup = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() === 'DRIVER' ? 'DRIVER' : 'PASSENGER';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { driverSignup, passengerSignup } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    setSearchParams({ role: newRole.toLowerCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      return setError('Please enter your full name');
    }
    const cleanDigits = mobile.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      return setError('Please enter a valid 10-digit mobile number');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const payload = { name: name.trim(), mobile: cleanDigits, password };
      if (role === 'DRIVER') {
        await driverSignup(payload);
        navigate('/driver/dashboard');
      } else {
        await passengerSignup(payload);
        navigate('/passenger/search');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDriver = role === 'DRIVER';

  return (
    <AuthLayout
      icon={isDriver ? Bus : User}
      title={isDriver ? 'Driver Signup' : 'Passenger Signup'}
      subtitle={isDriver ? 'Create your account to start' : 'Join to track buses'}
      footerText="Already have an account?"
      footerLinkText="Login"
      footerLinkTo={`/login?role=${role.toLowerCase()}`}
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
          label="Full Name"
          id="name"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={User}
          required
        />

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
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <PasswordInput
          label="Confirm Password"
          id="confirmPassword"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="pt-2">
          <PrimaryButton type="submit" loading={loading}>
            Sign Up
          </PrimaryButton>
        </div>
      </form>
    </AuthLayout>
  );
};
