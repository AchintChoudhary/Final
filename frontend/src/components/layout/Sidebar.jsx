import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bus,
  User,
  LayoutDashboard,
  Clock,
  Compass,
  LogOut,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ role = 'DRIVER', onCloseMobile }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onCloseMobile) onCloseMobile();
  };

  const navItemsByRole = {
    DRIVER: [
      { to: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/driver/bus-details', label: 'Bus Details', icon: Bus },
      { to: '/driver/active-trip', label: 'Trip', icon: Navigation },
      { to: '/driver/history', label: 'Trip History', icon: Clock },
    ],
    PASSENGER: [
      { to: '/passenger/search', label: 'Search Buses', icon: Compass },
      { to: '/passenger/history', label: 'My Trips', icon: Clock },
    ],
  };

  const roleHeaders = {
    DRIVER: { label: 'Driver', icon: Bus },
    PASSENGER: { label: 'Passenger', icon: User },
  };

  const currentRoleHeader = roleHeaders[role] || roleHeaders.DRIVER;
  const items = navItemsByRole[role] || [];
  const RoleIcon = currentRoleHeader.icon;

  return (
    <aside className="w-64 bg-[#1E304C] text-white flex flex-col h-full min-h-screen select-none">
      {/* Brand & Role Header */}
      <div className="p-6 border-b border-[#2A4269] flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-[#1769F4] flex items-center justify-center text-white shadow-xs">
          <RoleIcon size={20} />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">{currentRoleHeader.label}</h2>
          <p className="text-xs text-[#94A3B8] font-normal truncate max-w-[140px]">
            {user?.name || 'Portal'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1769F4] text-white shadow-xs'
                    : 'text-[#94A3B8] hover:bg-[#284166] hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="p-4 border-t border-[#2A4269]">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-[#EF4444]/20 hover:text-[#EF4444] transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
