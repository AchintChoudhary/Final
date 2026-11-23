import React from 'react';

export const InputField = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightElement,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#0F172A]">
          {label} {required && <span className="text-[#EF4444]">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3.5 text-[#64748B] pointer-events-none">
            <LeftIcon size={18} />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1769F4]/20 focus:border-[#1769F4] ${
            LeftIcon ? 'pl-10' : ''
          } ${rightElement ? 'pr-11' : ''} ${
            error ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20' : 'border-[#E2E8F0]'
          } ${disabled ? 'bg-[#F1F5F9] cursor-not-allowed text-[#94A3B8]' : ''}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[#EF4444] font-normal">{error}</p>}
    </div>
  );
};
