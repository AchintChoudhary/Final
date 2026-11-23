import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Clock, MapPin, StopCircle, Radio, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LeafletMap } from '../../components/maps/LeafletMap';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { tripService } from '../../services/tripService';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useSocket } from '../../hooks/useSocket';

export const ActiveTrip = () => {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdateText, setLastUpdateText] = useState('just now');

  const navigate = useNavigate();

  // Socket connection to trip room
  const { emitDriverLocation, isConnected } = useSocket(trip?._id);

  // Real device GPS watching
  const { location: gpsLocation, error: gpsError, startWatching, stopWatching } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 3000,
  });

  const sequenceRef = useRef(1);

  // Fetch current active trip
  useEffect(() => {
    const fetchActiveTrip = async () => {
      try {
        const res = await tripService.getMyActiveTrip();
        if (res.trip) {
          setTrip(res.trip);
          startWatching();
        }
      } catch (err) {
        setError('Failed to fetch active trip');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTrip();
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  // When real device GPS update arrives, transmit to backend via Socket.IO
  useEffect(() => {
    if (gpsLocation && trip && trip._id) {
      sequenceRef.current += 1;
      emitDriverLocation({
        tripId: trip._id,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        accuracy: Math.round(gpsLocation.accuracy),
        sequence: sequenceRef.current,
        timestamp: new Date().toISOString(),
      });
      setLastUpdateText('just now');
    }
  }, [gpsLocation, trip, emitDriverLocation]);

  const handleStopTrip = async () => {
    if (!trip) return;
    setStopping(true);
    try {
      await tripService.stopTrip(trip._id);
      stopWatching();
      setStopConfirmOpen(false);
      navigate('/driver/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop trip');
    } finally {
      setStopping(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="DRIVER" title="Active Trip">
        <LoadingSpinner text="Checking for active trips..." />
      </DashboardLayout>
    );
  }

  if (!trip) {
    return (
      <DashboardLayout role="DRIVER" title="Active Trip" backTo="/driver/dashboard">
        <EmptyState
          icon={Bus}
          title="No Active Trip In Progress"
          description="You do not have any live trip started currently."
          actionLabel="Go to Dashboard"
          onAction={() => navigate('/driver/dashboard')}
        />
      </DashboardLayout>
    );
  }

  const bus = trip.busId;
  const route = trip.routeId;
  const formattedStartTime = trip.startedAt
    ? new Date(trip.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '10:15 AM';

  const currentCoords = gpsLocation
    ? [gpsLocation.longitude, gpsLocation.latitude]
    : trip.currentLocation?.coordinates || route?.origin?.coordinates;

  return (
    <DashboardLayout
      role="DRIVER"
      title="Bus Active"
      backTo="/driver/dashboard"
      headerAction={<StatusBadge status="Trip Active" />}
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {(error || gpsError) && (
          <div className="p-3 text-xs font-medium text-[#EF4444] bg-[#FEE2E2] rounded-lg border border-[#FECACA] flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{error || gpsError}</span>
          </div>
        )}

        {/* Bus Info & Stop Trip Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769F4] flex items-center justify-center shrink-0">
                <Bus size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">{bus?.busName || 'Bus'}</h2>
                <p className="text-xs text-[#64748B]">{bus?.plateNumber || '-'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F1F5F9]">
            <div>
              <p className="text-xs text-[#64748B]">Route</p>
              <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                {route?.name || `${bus?.startLocation} → ${bus?.finalDestination}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Start Time</p>
              <p className="text-sm font-semibold text-[#0F172A] mt-0.5">{formattedStartTime}</p>
            </div>
          </div>

          <div>
            <PrimaryButton
              variant="danger"
              icon={StopCircle}
              onClick={() => setStopConfirmOpen(true)}
            >
              Stop Trip
            </PrimaryButton>
          </div>
        </div>

        {/* Live Location Card with Map */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A]">Live Location</h3>
            <div className="flex items-center space-x-1.5 text-xs text-[#16A34A] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
              <span>Sharing location...</span>
            </div>
          </div>

          <div className="p-4">
            <LeafletMap
              routeCoordinates={route?.geometry?.coordinates}
              origin={route?.origin}
              destination={route?.destination}
              busLocation={currentCoords}
              height="340px"
            />
          </div>

          <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center space-x-2">
              <Radio size={14} className="text-[#1769F4]" />
              <span>GPS Tracking: {gpsLocation ? 'Active Fix' : 'Awaiting GPS...'}</span>
            </div>
            <span>Last GPS update: {lastUpdateText}</span>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before stopping trip */}
      <ConfirmDialog
        isOpen={stopConfirmOpen}
        title="Stop Current Trip?"
        message="Are you sure you want to stop this trip? This will end real-time tracking for all passengers and complete the trip record."
        confirmText="Yes, Stop Trip"
        cancelText="Keep Trip Active"
        variant="danger"
        loading={stopping}
        onConfirm={handleStopTrip}
        onCancel={() => setStopConfirmOpen(false)}
      />
    </DashboardLayout>
  );
};
