import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading...', size = 28, fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-50">
        <Loader2 className="animate-spin text-[#1769F4] mb-3" size={size} />
        <p className="text-sm font-medium text-[#64748B]">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 w-full">
      <Loader2 className="animate-spin text-[#1769F4] mb-2" size={size} />
      {text && <p className="text-xs font-medium text-[#64748B]">{text}</p>}
    </div>
  );
};
