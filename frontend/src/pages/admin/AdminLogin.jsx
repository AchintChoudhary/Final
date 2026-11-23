import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { InputField } from '../../components/common/InputField';
import { PasswordInput } from '../../components/common/PasswordInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin = () => {
  const [email, setEmail] = useState('admin@college.edu');
  const [password, setPassword] = useState('AdminPassword@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your admin email');
    if (!password) return setError('Please enter your admin password');

    setLoading(true);
    try {
      const user = await adminLogin(email, password);
      if (user.role !== 'ADMIN') {
        setError('This account does not have Administrator privileges');
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Shield}
      title="Admin Login"
      subtitle="Access the admin panel"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-[#EF4444] bg-[#FEE2E2] rounded-lg border border-[#FECACA]">
            {error}
          </div>
        )}

        <InputField
          label="Email"
          id="email"
          type="email"
          placeholder="admin@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={Mail}
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
