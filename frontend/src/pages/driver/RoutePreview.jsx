import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LeafletMap } from '../../components/maps/LeafletMap';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { routeService } from '../../services/routeService';
import { tripService } from '../../services/tripService';

export const RoutePreview = () => {
  const [searchParams] = useSearchParams();
  const busId = searchParams.get('busId');
  const originName = searchParams.get('origin') || 'Indore';
  const destinationName = searchParams.get('destination') || 'Ujjain';

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoute = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await routeService.previewRoute(originName, destinationName);
        setPreview(res.preview);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'Could not calculate road route. Ensure origin and destination locations are valid.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [originName, destinationName]);

  const handleConfirmRoute = async () => {
    if (!preview) return;
    setConfirming(true);
    setError('');

    try {
      // 1. Create or persist the confirmed route
      const routeRes = await routeService.createRoute({
        name: `${originName} → ${destinationName}`,
        origin: preview.origin,
        destination: preview.destination,
        geometry: preview.geometry,
        totalDistanceKm: preview.totalDistanceKm,
        estimatedDurationMinutes: preview.estimatedDurationMinutes,
        stops: [
          { name: originName, coordinates: preview.origin.coordinates, order: 0 },
          { name: destinationName, coordinates: preview.destination.coordinates, order: 1 },
        ],
        pickupPolicy: 'BOTH',
      });

      const confirmedRoute = routeRes.route;

      // 2. Start trip immediately or redirect to start
      if (busId) {
        await tripService.startTrip({
          busId,
          routeId: confirmedRoute._id,
          pickupPolicy: 'BOTH',
          initialCoords: preview.origin.coordinates,
        });
        navigate('/driver/active-trip');
      } else {
        navigate('/driver/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start trip with confirmed route.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <DashboardLayout
      role="DRIVER"
      title="Route Preview"
      backTo="/driver/bus-details"
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {error && (
          <div className="p-4 bg-[#FEE2E2] text-[#EF4444] rounded-xl border border-[#FECACA] flex items-center space-x-2 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-xs">
            <LoadingSpinner text="Calculating road route via Geoapify..." />
          </div>
        ) : preview ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            {/* Interactive Leaflet road route map */}
            <div className="p-4">
              <LeafletMap
                routeCoordinates={preview.geometry?.coordinates}
                origin={preview.origin}
                destination={preview.destination}
                height="380px"
              />
            </div>

            {/* Selected Route Info Card */}
            <div className="p-6 border-t border-[#F1F5F9] space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Selected Route
                </p>
                <h3 className="text-lg font-bold text-[#0F172A] mt-0.5">
                  {originName} → {destinationName}
                </h3>
                <p className="text-sm text-[#64748B] mt-1">
                  Distance: <span className="font-semibold text-[#0F172A]">{preview.totalDistanceKm} km</span> | Estimated Time:{' '}
                  <span className="font-semibold text-[#0F172A]">
                    {Math.floor(preview.estimatedDurationMinutes / 60) > 0
                      ? `${Math.floor(preview.estimatedDurationMinutes / 60)} hr ${preview.estimatedDurationMinutes % 60} min`
                      : `${preview.estimatedDurationMinutes} min`}
                  </span>
                </p>
              </div>

              <PrimaryButton
                onClick={handleConfirmRoute}
                loading={confirming}
                icon={Navigation}
              >
                Confirm Route & Start Trip
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};
