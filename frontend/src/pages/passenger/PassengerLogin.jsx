import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputField } from '../../components/common/InputField';
import { PasswordInput } from '../../components/common/PasswordInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

export const PassengerLogin = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mobile.trim()) return setError('Please enter your mobile number');
    if (!password) return setError('Please enter your password');

    setLoading(true);
    try {
      const user = await login(mobile, password);
      if (user.role !== 'PASSENGER') {
        setError('This account is not a Passenger. Please use Driver or Admin login.');
        return;
      }
      navigate('/passenger/search');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid mobile number or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={User}
      title="Passenger Login"
      subtitle="Welcome back!"
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkTo="/passenger/signup"
    >
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
