
export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const normalized = status.toUpperCase();

  // Green active trip badge
  if (normalized === 'TRIP ACTIVE' || normalized === 'ACTIVE') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5 animate-pulse"></span>
        {status}
      </span>
    );
  }

  // Not started or pending
  if (normalized === 'NOT STARTED' || normalized === 'PENDING') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] ${className}`}
      >
        {status}
      </span>
    );
  }

  // Inactive or Unavailable
  if (normalized === 'INACTIVE' || normalized === 'UNAVAILABLE' || normalized === 'REVOKED') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#EF4444] border border-[#FECACA] ${className}`}
      >
        {status}
      </span>
    );
  }

  // Stale
  if (normalized === 'STALE') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] ${className}`}
      >
        {status}
      </span>
    );
  }

  // ETA Badge
  if (normalized.startsWith('ETA')) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] ${className}`}
      >
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] ${className}`}
    >
      {status}
    </span>
  );
};
