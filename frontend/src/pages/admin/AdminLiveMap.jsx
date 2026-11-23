import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Navigation, Radio, Circle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LeafletMap } from '../../components/maps/LeafletMap';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { adminService } from '../../services/adminService';
import { useSocket } from '../../hooks/useSocket';

export const AdminLiveMap = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Connect to socket and listen for live updates
  const { socket } = useSocket();

  useEffect(() => {
    adminService
      .getActiveTrips()
      .then((res) => setTrips(res.trips || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));

    if (socket) {
      socket.emit('admin:joinLive');
      socket.on('admin:busLocationUpdated', (data) => {
        setTrips((prevTrips) =>
          prevTrips.map((t) =>
            t._id === data.tripId
              ? {
                  ...t,
                  currentLocation: { type: 'Point', coordinates: data.coordinates },
                  trackingStatus: data.trackingStatus,
                  lastLocationUpdatedAt: data.lastLocationUpdatedAt,
                }
              : t
          )
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('admin:busLocationUpdated');
      }
    };
  }, [socket]);

  // Format buses for LeafletMap
  const busesForMap = trips.map((t) => ({
    tripId: t._id,
    busName: t.busId?.busName || 'Bus',
    plateNumber: t.busId?.plateNumber || '-',
    routeName: t.routeId?.name || 'Active Route',
    coordinates: t.currentLocation?.coordinates || t.routeId?.origin?.coordinates,
    trackingStatus: t.trackingStatus,
  }));

  const primaryRouteCoords = trips[0]?.routeId?.geometry?.coordinates || null;

  return (
    <DashboardLayout
      role="ADMIN"
      title="Live Map"
      backTo="/admin/dashboard"
    >
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-16 text-center">
              <LoadingSpinner text="Connecting to fleet live GPS tracking..." />
            </div>
          ) : (
            <>
              <div className="p-4">
                <LeafletMap
                  routeCoordinates={primaryRouteCoords}
                  buses={busesForMap}
                  height="500px"
                />
              </div>

              {/* Bottom Legend matching Screen 18 */}
              <div className="p-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex flex-wrap items-center justify-center gap-6 text-xs text-[#0F172A] font-semibold">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-[#1769F4] text-white flex items-center justify-center">
                    <Bus size={12} />
                  </div>
                  <span>Bus Location ({trips.length} active)</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-6 h-1 bg-[#1769F4] rounded-full" />
                  <span>Route</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#EF4444] border-2 border-white shadow-xs" />
                  <span>Stop</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
