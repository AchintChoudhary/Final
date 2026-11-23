import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, Bus } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { tripService } from '../../services/tripService';

export const DriverHistory = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tripService
      .getTripHistory()
      .then((res) => setTrips(res.trips || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      role="DRIVER"
      title="Trip History"
      subtitle="View your past completed trips"
      backTo="/driver/dashboard"
    >
      {loading ? (
        <LoadingSpinner text="Loading trip history..." />
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Past Trips Yet"
          description="Your completed trips will appear here once you start and complete a route."
        />
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {trips.map((t) => (
            <div
              key={t._id}
              className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center shrink-0">
                  <Bus size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">{t.busId?.busName || 'Bus'} ({t.busId?.plateNumber || '-'})</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">{t.routeId?.name || 'Route'}</p>
                </div>
              </div>

              <div className="text-xs text-[#64748B] sm:text-right">
                <p className="font-semibold text-[#0F172A]">
                  {t.endedAt ? new Date(t.endedAt).toLocaleDateString() : 'Recent'}
                </p>
                <p className="mt-0.5">
                  Started: {t.startedAt ? new Date(t.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
