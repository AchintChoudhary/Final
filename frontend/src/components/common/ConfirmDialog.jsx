import { AlertTriangle, X } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger', // danger or primary
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F172A]"
        >
          <X size={18} />
        </button>

        <div className="flex items-start space-x-3.5 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              variant === 'danger' ? 'bg-[#FEE2E2] text-[#EF4444]' : 'bg-[#EFF6FF] text-[#1769F4]'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
            <p className="text-sm text-[#64748B] mt-1">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 mt-6">
          <PrimaryButton
            type="button"
            variant="outline"
            fullWidth={false}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </PrimaryButton>
          <PrimaryButton
            type="button"
            variant={variant}
            fullWidth={false}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
