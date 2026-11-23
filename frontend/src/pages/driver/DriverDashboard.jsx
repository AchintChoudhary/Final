import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Clock, ArrowRight, Play, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { busService } from '../../services/busService';
import { tripService } from '../../services/tripService';
import { routeService } from '../../services/routeService';

export const DriverDashboard = () => {
  const [buses, setBuses] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [busRes, tripRes, routeRes] = await Promise.all([
          busService.getMyBuses(),
          tripService.getMyActiveTrip(),
          routeService.getAllRoutes(),
        ]);
        setBuses(busRes.buses || []);
        setActiveTrip(tripRes.trip || null);
        setRoutes(routeRes.routes || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="DRIVER" title="Dashboard">
        <LoadingSpinner text="Loading driver dashboard..." />
      </DashboardLayout>
    );
  }

  const primaryBus = buses[0] || null;

  return (
    <DashboardLayout
      role="DRIVER"
      title="Hello, Driver!"
      subtitle="Manage your trips and bus details"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-[#FEE2E2] text-[#EF4444] rounded-xl border border-[#FECACA] flex items-center space-x-2 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Current Trip Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-5">
            <h2 className="text-base font-bold text-[#0F172A]">Current Trip</h2>
            <StatusBadge status={activeTrip ? 'Trip Active' : 'Not Started'} />
          </div>

          {activeTrip ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#64748B]">Bus Name</p>
                  <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                    {activeTrip.busId?.busName || 'Bus'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Plate No.</p>
                  <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                    {activeTrip.busId?.plateNumber || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Route</p>
                  <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                    {activeTrip.routeId?.name || 'Active Route'}
                  </p>
                </div>
              </div>

              <PrimaryButton onClick={() => navigate('/driver/active-trip')}>
                View Active Trip Map
              </PrimaryButton>
            </div>
          ) : primaryBus ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#64748B]">Bus Name</p>
                  <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                    {primaryBus.busName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Plate No.</p>
                  <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                    {primaryBus.plateNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Route</p>
                  <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                    {primaryBus.startLocation && primaryBus.finalDestination
                      ? `${primaryBus.startLocation} → ${primaryBus.finalDestination}`
                      : 'Route not assigned'}
                  </p>
                </div>
              </div>

              <PrimaryButton
                icon={Play}
                onClick={() => {
                  if (primaryBus.startLocation && primaryBus.finalDestination) {
                    navigate(`/driver/route-preview?busId=${primaryBus._id}&origin=${encodeURIComponent(primaryBus.startLocation)}&destination=${encodeURIComponent(primaryBus.finalDestination)}`);
                  } else {
                    navigate('/driver/bus-details');
                  }
                }}
              >
                Start Trip
              </PrimaryButton>
            </div>
          ) : (
            <EmptyState
              icon={Bus}
              title="No Bus Registered Yet"
              description="Please add your bus details before you can preview routes and start real-time tracking."
              actionLabel="Add Bus Details"
              onAction={() => navigate('/driver/bus-details')}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/driver/bus-details')}
              className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs text-left hover:border-[#1769F4] transition-all group flex flex-col items-center justify-center py-6"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Bus size={22} />
              </div>
              <span className="text-sm font-semibold text-[#0F172A]">Bus Details</span>
            </button>

            <button
              onClick={() => {
                if (primaryBus && primaryBus.startLocation && primaryBus.finalDestination) {
                  navigate(`/driver/route-preview?busId=${primaryBus._id}&origin=${encodeURIComponent(primaryBus.startLocation)}&destination=${encodeURIComponent(primaryBus.finalDestination)}`);
                } else {
                  navigate('/driver/bus-details');
                }
              }}
              className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs text-left hover:border-[#1769F4] transition-all group flex flex-col items-center justify-center py-6"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <MapPin size={22} />
              </div>
              <span className="text-sm font-semibold text-[#0F172A]">View Route</span>
            </button>

            <button
              onClick={() => navigate('/driver/history')}
              className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs text-left hover:border-[#1769F4] transition-all group flex flex-col items-center justify-center py-6"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Clock size={22} />
              </div>
              <span className="text-sm font-semibold text-[#0F172A]">Trip History</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
