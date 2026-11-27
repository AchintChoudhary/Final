import { Loader2 } from 'lucide-react';

export const PrimaryButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, danger, secondary, outline
  fullWidth = true,
  disabled = false,
  loading = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 px-4';

  const variantClasses = {
    primary:
      'bg-[#1769F4] hover:bg-[#1256CC] text-white shadow-sm focus:ring-[#1769F4]',
    danger:
      'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm focus:ring-[#EF4444]',
    secondary:
      'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] focus:ring-[#64748B]',
    outline:
      'border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] focus:ring-[#1769F4]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin mr-2" size={18} />
      ) : Icon ? (
        <Icon className="mr-2" size={18} />
      ) : null}
      {children}
    </button>
  );
};
