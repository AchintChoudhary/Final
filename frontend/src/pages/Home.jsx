import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, User, Compass, Navigation, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1769F4] text-white flex items-center justify-center shadow-xs">
              <Bus size={22} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#0F172A] leading-tight">
                Real-Time Public Transport Tracking System
              </h1>
              <p className="text-xs text-[#64748B]">Driver GPS Tracking &bull; Passenger Discovery &bull; Road Routes</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                to={user?.role === 'DRIVER' ? '/driver/dashboard' : '/passenger/search'}
                className="px-4 py-2 bg-[#1769F4] text-white text-xs font-semibold rounded-lg hover:bg-[#1256CC] transition-colors"
              >
                Go to Dashboard ({user?.role})
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Hero & 2 Portal Cards */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16 w-full space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1769F4] border border-[#DBEAFE]">
            Driver & Passenger Real-Time Transit
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Select Your Role
          </h2>
          <p className="text-sm text-[#64748B]">
            Real device GPS tracking, confirmed Geoapify road geometry, middle-of-route bus discovery, and approximate route ETA.
          </p>
        </div>

        {/* 2 Roles Grid: DRIVER and PASSENGER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Driver Portal */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-7 shadow-xs hover:border-[#1769F4] hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center">
                <Bus size={26} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">Driver Portal</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Register your bus, preview and confirm the road route, start trips, and broadcast your real device GPS in real-time.
              </p>
              <ul className="space-y-2 text-xs text-[#0F172A] font-medium pt-2">
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2 shrink-0" /> Driver Signup & Login</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2 shrink-0" /> Bus Details Registration</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2 shrink-0" /> Route Preview on Leaflet Map</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2 shrink-0" /> Active Trip with Real Device GPS</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2 shrink-0" /> Stop Trip & Trip History</li>
              </ul>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <Link
                to="/driver/login"
                className="flex-1 py-2.5 text-center bg-[#1769F4] text-white rounded-lg text-xs font-semibold hover:bg-[#1256CC] transition-colors"
              >
                Driver Login
              </Link>
              <Link
                to="/driver/signup"
                className="py-2.5 px-4 border border-[#E2E8F0] text-[#0F172A] rounded-lg text-xs font-semibold hover:bg-[#F8FAFC] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* Passenger Portal */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-7 shadow-xs hover:border-[#1769F4] hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center">
                <User size={26} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">Passenger Portal</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Find approaching buses along your travel route, track live bus movement on the map, and view stops & estimated arrival times.
              </p>
              <ul className="space-y-2 text-xs text-[#0F172A] font-medium pt-2">
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2 shrink-0" /> Passenger Signup & Login</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2 shrink-0" /> Search Buses (with Current Location GPS)</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2 shrink-0" /> Middle-of-Route Approaching Bus Discovery</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2 shrink-0" /> Real-Time Live Bus Tracking</li>
                <li className="flex items-center"><CheckCircle2 size={14} className="text-[#16A34A] mr-2 shrink-0" /> Route Stops Timeline & Trip Progress</li>
              </ul>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <Link
                to="/passenger/login"
                className="flex-1 py-2.5 text-center bg-[#1769F4] text-white rounded-lg text-xs font-semibold hover:bg-[#1256CC] transition-colors"
              >
                Passenger Login
              </Link>
              <Link
                to="/passenger/signup"
                className="py-2.5 px-4 border border-[#E2E8F0] text-[#0F172A] rounded-lg text-xs font-semibold hover:bg-[#F8FAFC] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-6 text-center text-xs text-[#64748B]">
        <p>Real-Time Public Transport Tracking System</p>
      </footer>
    </div>
  );
};
