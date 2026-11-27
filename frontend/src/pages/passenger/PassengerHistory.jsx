import { useState, useEffect } from 'react';
import { Clock, Bus } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { tripService } from '../../services/tripService';

export const PassengerHistory = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tripService
      .getTripHistory()
      .then((res) => setTrips(res.entries || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      role="PASSENGER"
      title="Tracking History"
      subtitle="History of buses you selected for tracking"
      backTo="/passenger/search"
    >
      {loading ? (
        <LoadingSpinner text="Loading trips history..." />
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Tracked Trips"
          description="Your tracked trips will be saved here once you start exploring active buses."
        />
      ) : (
        <div className="space-y-3 max-w-3xl mx-auto">
          {trips.map((t) => (
            <div
              key={t._id}
              className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center shrink-0">
                  <Bus size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    {t.busSnapshot?.busName || 'Bus'} ({t.busSnapshot?.plateNumber || '-'})
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">{t.routeSnapshot?.name || 'Route'}</p>
                </div>
              </div>

              <div className="text-xs text-[#64748B] text-right">
                <p className="font-semibold text-[#0F172A]">
                  {t.lastViewedAt ? new Date(t.lastViewedAt).toLocaleDateString() : 'Tracking'}
                </p>
                <p className="mt-0.5">
                  {t.lastViewedAt ? new Date(t.lastViewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
