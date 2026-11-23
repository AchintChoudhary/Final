import React from 'react';
import { Link } from 'react-router-dom';

export const AuthLayout = ({
  icon: Icon,
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 sm:p-10">
        {/* Brand Icon Badge */}
        {Icon && (
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#1769F4] shadow-xs">
              <Icon size={26} strokeWidth={2.2} />
            </div>
          </div>
        )}

        {/* Headings */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-[#64748B] mt-1.5">{subtitle}</p>}
        </div>

        {/* Form Body */}
        {children}

        {/* Footer Link */}
        {footerText && footerLinkTo && (
          <div className="mt-7 text-center text-sm text-[#64748B]">
            {footerText}{' '}
            <Link
              to={footerLinkTo}
              className="font-semibold text-[#1769F4] hover:text-[#1256CC] hover:underline"
            >
              {footerLinkText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
