import { useState } from 'react';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export const DashboardLayout = ({
  children,
  role,
  title,
  subtitle,
  backTo,
  headerAction,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentRole = role || user?.role || 'DRIVER';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar role={currentRole} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64">
            <Sidebar role={currentRole} onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-md hover:bg-[#F1F5F9]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Back button */}
            {backTo && (
              <button
                onClick={() => navigate(backTo)}
                className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-md hover:bg-[#F1F5F9] transition-colors"
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <div>
              {title && <h1 className="text-xl font-bold text-[#0F172A] leading-tight">{title}</h1>}
              {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* Optional right header action */}
          {headerAction && <div>{headerAction}</div>}
        </header>

        {/* Main page content container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
