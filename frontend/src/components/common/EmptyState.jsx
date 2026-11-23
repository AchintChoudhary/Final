import React from 'react';
import { Inbox } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data available',
  description = 'There are currently no items to display.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-[#E2E8F0] shadow-xs ${className}`}
    >
      <div className="w-12 h-12 mb-3 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
        <Icon size={24} />
      </div>
      <h3 className="text-base font-semibold text-[#0F172A] mb-1">{title}</h3>
      <p className="text-sm text-[#64748B] max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <PrimaryButton fullWidth={false} onClick={onAction}>
          {actionLabel}
        </PrimaryButton>
      )}
    </div>
  );
};
