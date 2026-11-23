import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, User, Shield, Compass, Navigation, ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1769F4] text-white flex items-center justify-center shadow-xs">
              <Bus size={22} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#0F172A] leading-tight">
                Real-Time Public Transport Tracking System
              </h1>
              <p className="text-xs text-[#64748B]">MERN + Geoapify + Socket.IO + Leaflet</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                to={
                  user?.role === 'ADMIN'
                    ? '/admin/dashboard'
                    : user?.role === 'DRIVER'
                    ? '/driver/dashboard'
                    : '/passenger/search'
                }
                className="px-4 py-2 bg-[#1769F4] text-white text-xs font-semibold rounded-lg hover:bg-[#1256CC] transition-colors"
              >
                Go to Dashboard ({user?.role})
              </Link>
            ) : (
              <span className="text-xs text-[#64748B] font-medium hidden sm:inline">
                College Major Project
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero & Portal Cards */}
      <main className="max-w-6xl mx-auto px-6 py-10 sm:py-16 w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1769F4] border border-[#DBEAFE]">
            18-Screen Production UI & Backend
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Select Your Portal
          </h2>
          <p className="text-sm text-[#64748B]">
            Real GPS tracking, live road geometry via Geoapify, middle-of-route bus discovery, and approximate route ETA.
          </p>
        </div>

        {/* 3 Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Driver Portal */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs hover:border-[#1769F4] hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center">
                <Bus size={26} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">Driver Portal</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Register bus, preview actual road route, start trips, and broadcast live GPS coordinates from your device in real-time.
              </p>
              <ul className="space-y-2 text-xs text-[#0F172A] font-medium pt-2">
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 1: Driver Signup</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 2: Driver Login</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 3: Driver Dashboard</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 4: Add Bus Details</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 5: Route Preview</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 6: Active Trip</li>
              </ul>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Link
                to="/driver/login"
                className="flex-1 py-2.5 text-center bg-[#1769F4] text-white rounded-lg text-xs font-semibold hover:bg-[#1256CC] transition-colors"
              >
                Driver Login
              </Link>
              <Link
                to="/driver/signup"
                className="py-2.5 px-3 border border-[#E2E8F0] text-[#0F172A] rounded-lg text-xs font-semibold hover:bg-[#F8FAFC] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* Passenger Portal */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs hover:border-[#1769F4] hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center">
                <User size={26} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">Passenger Portal</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Middle-of-route bus discovery: find approaching buses, track live movement on Leaflet map, and view ETA and route stops.
              </p>
              <ul className="space-y-2 text-xs text-[#0F172A] font-medium pt-2">
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 7: Passenger Signup</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 8: Passenger Login</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 9: Search Buses</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 10: Available Buses</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 11: Live Tracking</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 12: My Trip / Progress</li>
              </ul>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Link
                to="/passenger/login"
                className="flex-1 py-2.5 text-center bg-[#1769F4] text-white rounded-lg text-xs font-semibold hover:bg-[#1256CC] transition-colors"
              >
                Passenger Login
              </Link>
              <Link
                to="/passenger/signup"
                className="py-2.5 px-3 border border-[#E2E8F0] text-[#0F172A] rounded-lg text-xs font-semibold hover:bg-[#F8FAFC] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* Admin Portal */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs hover:border-[#1769F4] hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center">
                <Shield size={26} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">Admin Portal</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Full fleet oversight: manage buses, assign drivers, define routes and stops, authorize students (CSV import), and view fleet live map.
              </p>
              <ul className="space-y-2 text-xs text-[#0F172A] font-medium pt-2">
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 13: Admin Login</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 14: Admin Dashboard</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 15: Manage Buses</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 16: Add Route & Stops</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 17: Authorize Students</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2" /> Screen 18: Fleet Live Map</li>
              </ul>
            </div>
            <div className="pt-2">
              <Link
                to="/admin/login"
                className="block w-full py-2.5 text-center bg-[#1E304C] text-white rounded-lg text-xs font-semibold hover:bg-[#284166] transition-colors"
              >
                Admin Panel Login
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-6 text-center text-xs text-[#64748B]">
        <p>Real-Time Public Transport Tracking System &bull; Designed & Built for College Major Project Presentation</p>
      </footer>
    </div>
  );
};
