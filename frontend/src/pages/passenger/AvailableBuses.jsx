import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Bus, ChevronRight, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { tripService } from '../../services/tripService';

export const AvailableBuses = () => {
  const [searchParams] = useSearchParams();
  const pickup = searchParams.get('pickup') || '';
  const destination = searchParams.get('destination') || '';
  const pickupLng = searchParams.get('pickupLng');
  const pickupLat = searchParams.get('pickupLat');
  const destLng = searchParams.get('destLng');
  const destLat = searchParams.get('destLat');

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestSequenceRef = useRef(0);
  const refreshInProgressRef = useRef(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBuses = async (background = false) => {
      if (refreshInProgressRef.current) return;
      refreshInProgressRef.current = true;
      const sequence = ++requestSequenceRef.current;
      if (!background) setLoading(true);
      setError('');
      try {
        const params = { pickup, destination };
        if (pickupLng && pickupLat) {
          params.pickupLng = pickupLng;
          params.pickupLat = pickupLat;
        }
        if (destLng && destLat) {
          params.destLng = destLng;
          params.destLat = destLat;
        }
        const res = await tripService.searchBuses(params);
        if (sequence === requestSequenceRef.current) {
          setBuses(res.buses || []);
        }
      } catch (err) {
        if (sequence === requestSequenceRef.current) {
          setError(
            err.response?.data?.message ||
              'Failed to search active buses. Please ensure valid locations.'
          );
        }
      } finally {
        refreshInProgressRef.current = false;
        if (!background && sequence === requestSequenceRef.current) setLoading(false);
      }
    };

    fetchBuses(false);
    const refreshInterval = window.setInterval(() => fetchBuses(true), 15000);
    return () => window.clearInterval(refreshInterval);
  }, [pickup, destination, pickupLng, pickupLat, destLng, destLat]);

  return (
    <DashboardLayout
      role="PASSENGER"
      title="Available Buses"
      subtitle={loading ? 'Searching live active buses...' : `${buses.length} buses found for your route`}
      backTo="/passenger/search"
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {error && (
          <div className="p-4 bg-[#FEE2E2] text-[#EF4444] rounded-xl border border-[#FECACA] flex items-center space-x-2 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-xs">
            <LoadingSpinner text="Searching approaching buses on the confirmed road route..." />
          </div>
        ) : buses.length === 0 ? (
          <EmptyState
            icon={Bus}
            title="No Active Buses Found"
            description={`No active buses are currently approaching "${pickup}" towards "${destination}". Buses that have already passed your pickup or operate on different routes are excluded.`}
            actionLabel="Try Another Search"
            onAction={() => navigate('/passenger/search')}
          />
        ) : (
          <div className="space-y-3">
            {buses.map((bus) => (
              <div
                key={bus.tripId}
                onClick={async () => {
                  try {
                    await tripService.startTrackingHistory({
                      tripId: bus.tripId,
                      pickupName: pickup,
                      pickupCoordinates:
                        pickupLng && pickupLat ? [Number(pickupLng), Number(pickupLat)] : undefined,
                      destinationName: destination,
                      destinationCoordinates:
                        destLng && destLat ? [Number(destLng), Number(destLat)] : undefined,
                    });
                  } catch {
                    // Live tracking remains available if history persistence is temporarily unavailable.
                  }
                  navigate(
                    `/passenger/tracking/${bus.tripId}?pickup=${encodeURIComponent(pickup)}&dest=${encodeURIComponent(destination)}&pickupLng=${encodeURIComponent(pickupLng || '')}&pickupLat=${encodeURIComponent(pickupLat || '')}&destLng=${encodeURIComponent(destLng || '')}&destLat=${encodeURIComponent(destLat || '')}`
                  );
                }}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:border-[#1769F4] hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center shrink-0 group-hover:bg-[#1769F4] group-hover:text-white transition-colors">
                    <Bus size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-[#0F172A]">{bus.busName}</h3>
                      <span className="text-xs text-[#64748B] font-medium">{bus.plateNumber}</span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Route: {bus.routeName || `${pickup} → ${destination}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <StatusBadge status={`ETA ${bus.etaMinutes} min`} />
                  <ChevronRight size={18} className="text-[#94A3B8] group-hover:text-[#1769F4] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
