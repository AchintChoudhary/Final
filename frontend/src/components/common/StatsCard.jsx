import React from 'react';

export const StatsCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">
          {title}
        </p>
        <h4 className="text-2xl font-bold text-[#0F172A]">{value ?? 0}</h4>
      </div>
      {Icon && (
        <div className="w-11 h-11 rounded-lg bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center">
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};
