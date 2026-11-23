import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Users, GraduationCap, Navigation, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatsCard } from '../../components/common/StatsCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { adminService } from '../../services/adminService';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBuses: 0,
    totalDrivers: 0,
    totalPassengers: 0,
    totalStudents: 0,
    activeTrips: 0,
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    adminService
      .getDashboardStats()
      .then((res) => {
        if (res.stats) setStats(res.stats);
        if (res.recentActiveTrips) setRecentTrips(res.recentActiveTrips);
      })
      .catch((err) => {
        setError('Failed to fetch admin stats');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      role="ADMIN"
      title="Dashboard"
      subtitle="Welcome, Admin"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-[#FEE2E2] text-[#EF4444] rounded-xl border border-[#FECACA] flex items-center space-x-2 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Buses"
            value={stats.totalBuses}
            icon={Bus}
          />
          <StatsCard
            title="Total Drivers"
            value={stats.totalDrivers}
            icon={Users}
          />
          <StatsCard
            title="Total Students"
            value={stats.totalStudents}
            icon={GraduationCap}
          />
          <StatsCard
            title="Active Trips"
            value={stats.activeTrips}
            icon={Navigation}
          />
        </div>

        {/* Recent Active Trips Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-4">
            <h3 className="text-base font-bold text-[#0F172A]">Currently Active Trips</h3>
            <button
              onClick={() => navigate('/admin/live-map')}
              className="text-xs font-semibold text-[#1769F4] hover:underline"
            >
              Open Full Live Map →
            </button>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading active trips..." />
          ) : recentTrips.length === 0 ? (
            <EmptyState
              icon={Bus}
              title="No Trips Currently Active"
              description="When drivers start a trip, live tracking details and coordinates will show here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase">
                    <th className="py-3 px-4">Bus</th>
                    <th className="py-3 px-4">Plate No.</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {recentTrips.map((trip) => (
                    <tr key={trip._id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        {trip.busId?.busName || 'Bus'}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">{trip.busId?.plateNumber || '-'}</td>
                      <td className="py-3.5 px-4 text-[#0F172A]">{trip.driverId?.name || 'Driver'}</td>
                      <td className="py-3.5 px-4 text-[#64748B]">{trip.routeId?.name || '-'}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status="Trip Active" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
