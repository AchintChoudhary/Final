import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InputField } from './InputField';

export const PasswordInput = ({
  label = 'Password',
  id = 'password',
  value,
  onChange,
  placeholder = 'Enter your password',
  error,
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputField
      label={label}
      id={id}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      required={required}
      rightElement={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-[#64748B] hover:text-[#0F172A] transition-colors focus:outline-none"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
      {...props}
    />
  );
};
