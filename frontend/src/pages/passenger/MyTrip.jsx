import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Bus, CheckCircle2, Circle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { tripService } from '../../services/tripService';
import { useSocket } from '../../hooks/useSocket';

export const MyTrip = () => {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
  const pickupName = searchParams.get('pickup') || '';
  const destName = searchParams.get('dest') || '';

  const [trip, setTrip] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isTripEnded } = useSocket(tripId);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await tripService.getTripById(tripId);
        setTrip(res.trip);
        const etaRes = await tripService.getTripEta(tripId);
        setEta(etaRes.eta);
      } catch {
        // quiet catch
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);

  if (loading) {
    return (
      <DashboardLayout role="PASSENGER" title="My Trip">
        <LoadingSpinner text="Loading route progress..." />
      </DashboardLayout>
    );
  }

  const bus = trip?.busId;
  const route = trip?.routeId;
  const stops =
    route?.stops && route.stops.length > 0
      ? route.stops
      : [
          ...(route?.origin ? [{ name: route.origin.name || 'Origin', progressKm: 0, order: 0 }] : []),
          ...(route?.destination ? [{ name: route.destination.name || destName || 'Destination', progressKm: route?.totalDistanceKm || 0, order: 1 }] : []),
        ];

  const currentBusProgress = trip?.routeProgressKm || 0;

  return (
    <DashboardLayout
      role="PASSENGER"
      title="Route Progress"
      backTo={`/passenger/tracking/${tripId}`}
    >
      <div className="max-w-xl mx-auto space-y-5">
        {(isTripEnded || trip?.status === 'COMPLETED' || trip?.status === 'CANCELLED') && (
          <div className="p-4 bg-[#FEE2E2] text-[#EF4444] rounded-xl border border-[#FECACA] text-sm font-medium">
            The driver has ended this trip. Live route updates and ETA are no longer available.
          </div>
        )}
        {/* Top Bus Card */}
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

          <StatusBadge status={eta ? `ETA ${eta.etaMinutes} min` : 'Approaching'} />
        </div>

        {/* Ordered Route Stops Timeline */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#0F172A] mb-6">Route Stops & Arrival Progress</h3>

          <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E2E8F0]">
            {stops.map((stop, index) => {
              const isPassed = currentBusProgress >= stop.progressKm;
              const isNext = !isPassed && (index === 0 || currentBusProgress >= stops[index - 1]?.progressKm);

              return (
                <div key={index} className="relative flex items-start space-x-4">
                  {/* Status Indicator Icon */}
                  <div className="absolute -left-[30px] top-0 bg-white p-0.5">
                    {isPassed ? (
                      <CheckCircle2 size={20} className="text-[#16A34A] fill-[#DCFCE7]" />
                    ) : isNext ? (
                      <div className="relative flex items-center justify-center">
                        <span className="w-4 h-4 rounded-full bg-[#1769F4] animate-ping opacity-40 absolute" />
                        <span className="w-4 h-4 rounded-full bg-[#1769F4] border-2 border-white shadow-xs" />
                      </div>
                    ) : (
                      <Circle size={18} className="text-[#94A3B8]" />
                    )}
                  </div>

                  {/* Stop Details */}
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${isNext ? 'text-[#1769F4]' : 'text-[#0F172A]'}`}>
                        {stop.name}
                        {stop.name === pickupName && (
                          <span className="ml-2 text-xs font-normal text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                            Your Pickup
                          </span>
                        )}
                        {isNext && (
                          <span className="ml-2 text-xs font-normal text-[#1769F4] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                            Next Stop
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {isPassed ? 'Passed' : isNext ? 'Approaching now' : 'Upcoming'}
                      </p>
                    </div>

                    <div className="text-xs font-medium text-[#64748B]">
                      {stop.progressKm ? `${stop.progressKm.toFixed(1)} km` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <PrimaryButton
          onClick={() => navigate(`/passenger/tracking/${tripId}`)}
          variant="outline"
        >
          Return to Live Map
        </PrimaryButton>
      </div>
    </DashboardLayout>
  );
};
