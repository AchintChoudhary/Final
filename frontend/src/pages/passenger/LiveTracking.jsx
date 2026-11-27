import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Bus, Clock, MapPin, ListOrdered, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LeafletMap } from '../../components/maps/LeafletMap';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { tripService } from '../../services/tripService';
import { useSocket } from '../../hooks/useSocket';

export const LiveTracking = () => {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
  const pickupName = searchParams.get('pickup') || 'Pickup Point';
  const destName = searchParams.get('dest') || 'Destination';
  const pickupLng = searchParams.get('pickupLng');
  const pickupLat = searchParams.get('pickupLat');
  const destLng = searchParams.get('destLng');
  const destLat = searchParams.get('destLat');

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eta, setEta] = useState(null);

  const navigate = useNavigate();

  // Real-time Socket.IO subscription
  const { liveLocation, trackingStatus, lastUpdate, isTripEnded } = useSocket(tripId);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await tripService.getTripById(tripId);
        setTrip(res.trip);

        // Fetch ETA
        const pickupCoords =
          pickupLng && pickupLat ? [Number(pickupLng), Number(pickupLat)] : null;
        if (pickupCoords) {
          const etaRes = await tripService.getTripEta(tripId, pickupCoords);
          setEta(etaRes.eta);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch trip details');
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, pickupLng, pickupLat]);

  useEffect(() => {
    if (!pickupLng || !pickupLat || isTripEnded) return;
    let active = true;
    const refreshEta = async () => {
      try {
        const pickupCoords = [Number(pickupLng), Number(pickupLat)];
        const etaRes = await tripService.getTripEta(tripId, pickupCoords);
        if (active) setEta(etaRes.eta);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to refresh pickup ETA.');
      }
    };
    refreshEta();
    const interval = window.setInterval(refreshEta, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [tripId, pickupLng, pickupLat, isTripEnded]);

  if (loading) {
    return (
      <DashboardLayout role="PASSENGER" title="Live Tracking">
        <LoadingSpinner text="Connecting to bus live tracking..." />
      </DashboardLayout>
    );
  }

  if (!trip) {
    return (
      <DashboardLayout role="PASSENGER" title="Live Tracking" backTo="/passenger/search">
        <div className="p-8 bg-white rounded-2xl border border-[#E2E8F0] text-center max-w-md mx-auto">
          <p className="text-sm font-semibold text-[#0F172A]">Trip Not Found</p>
          <p className="text-xs text-[#64748B] mt-1">This trip may have ended or is no longer active.</p>
        </div>
      </DashboardLayout>
    );
  }

  const bus = trip.busId;
  const route = trip.routeId;
  const tripEnded =
    isTripEnded || trip.status === 'COMPLETED' || trip.status === 'CANCELLED';
  const currentCoords =
    liveLocation ||
    (trip.status === 'ACTIVE' ? trip.currentLocation?.coordinates : null);

  return (
    <DashboardLayout
      role="PASSENGER"
      title="Live Tracking"
      backTo="/passenger/search"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {error && (
          <div className="p-4 bg-[#FEE2E2] text-[#EF4444] rounded-xl border border-[#FECACA] flex items-center space-x-2 text-sm">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        {/* Warning if trip has ended */}
        {tripEnded && (
          <div className="p-4 bg-[#FEE2E2] text-[#EF4444] rounded-xl border border-[#FECACA] flex items-center space-x-2 text-sm font-medium">
            <AlertTriangle size={18} />
            <span>The driver has ended this trip. Live tracking is no longer available.</span>
          </div>
        )}

        {/* Selected Bus Header Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center shrink-0">
              <Bus size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#0F172A]">{bus?.busName || 'Bus'}</h2>
                <span className="text-xs text-[#64748B] font-medium">{bus?.plateNumber || '-'}</span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Route: {route?.name || `${bus?.startLocation} → ${bus?.finalDestination}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <StatusBadge
              status={
                tripEnded
                  ? 'Trip Ended'
                  : trackingStatus !== 'ONLINE'
                    ? trackingStatus
                    : eta?.status === 'PASSED'
                      ? 'Bus Passed Pickup'
                      : eta?.etaMinutes != null
                        ? `ETA ${eta.etaMinutes} min`
                        : 'ETA Unavailable'
              }
            />
          </div>
        </div>

        {/* Live Tracking Map Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="p-4">
            <LeafletMap
              routeCoordinates={route?.geometry?.coordinates}
              origin={route?.origin}
              destination={route?.destination}
              busLocation={currentCoords}
              stops={route?.stops || []}
              pickupLocation={
                pickupLng && pickupLat ? [Number(pickupLng), Number(pickupLat)] : null
              }
              passengerDestination={
                destLng && destLat ? [Number(destLng), Number(destLat)] : null
              }
              height="380px"
            />
          </div>

          {/* Bottom Location & Last Update Bar */}
          <div className="p-4 bg-[#F8FAFC] border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#64748B]">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-[#1769F4] shrink-0" />
              <div>
                <span className="font-semibold text-[#0F172A]">Current Location: </span>
                <span>Along {route?.name || 'confirmed route'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:justify-end">
              <Clock size={16} className="text-[#1769F4] shrink-0" />
              <div>
                <span className="font-semibold text-[#0F172A]">Last Update: </span>
                <span>
                  {lastUpdate
                    ? new Date(lastUpdate).toLocaleTimeString()
                    : 'Waiting for GPS update'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action to switch to My Trip / Stops Progress */}
        <div className="pt-1">
          <PrimaryButton
            variant="outline"
            icon={ListOrdered}
            onClick={() =>
              navigate(
                `/passenger/trip/${tripId}?pickup=${encodeURIComponent(pickupName)}&dest=${encodeURIComponent(destName)}&pickupLng=${encodeURIComponent(pickupLng || '')}&pickupLat=${encodeURIComponent(pickupLat || '')}&destLng=${encodeURIComponent(destLng || '')}&destLat=${encodeURIComponent(destLat || '')}`
              )
            }
          >
            View Route Stops & Progress (My Trip)
          </PrimaryButton>
        </div>
      </div>
    </DashboardLayout>
  );
};
