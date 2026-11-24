import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MapPin, Navigation, AlertCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LeafletMap } from '../../components/maps/LeafletMap';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { routeService } from '../../services/routeService';
import { tripService } from '../../services/tripService';

// Haversine distance in km between two [lng, lat] points
const calculateDistanceKm = (coord1, coord2) => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const RoutePreview = () => {
  const [searchParams] = useSearchParams();
  const busId = searchParams.get('busId');
  const originName = searchParams.get('origin');
  const destinationName = searchParams.get('destination');

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(Boolean(originName && destinationName));
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [gpsWarning, setGpsWarning] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (!originName || !destinationName) {
      setLoading(false);
      return;
    }

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
    setGpsWarning('');

    try {
      // 1. Acquire fresh device GPS reading
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          return reject(
            new Error('Geolocation is not supported by your browser. Live device GPS is required.')
          );
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => {
            let msg = 'Failed to acquire device GPS position.';
            if (err.code === 1) {
              msg = 'Location permission was denied. Please allow location access in your browser settings to start live trip tracking.';
            } else if (err.code === 2) {
              msg = 'GPS position unavailable. Please ensure your device GPS is turned on.';
            } else if (err.code === 3) {
              msg = 'GPS location request timed out. Please try again in an area with good reception.';
            }
            reject(new Error(msg));
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      });

      const { longitude, latitude, accuracy } = position.coords;
      const initialCoords = [longitude, latitude];

      // Check distance from real GPS to route origin
      if (preview.origin?.coordinates) {
        const distanceToOriginKm = calculateDistanceKm(initialCoords, preview.origin.coordinates);
        if (distanceToOriginKm > 5) {
          setGpsWarning(
            `Notice: Your current GPS position is ${distanceToOriginKm.toFixed(1)} km away from the route origin. The trip will begin from your actual device coordinates.`
          );
        }
      }

      if (accuracy > 100) {
        console.warn(`[RoutePreview] GPS accuracy is ${Math.round(accuracy)}m`);
      }

      // 2. Persist confirmed route
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

      // 3. Start trip with real driver device GPS coordinates
      if (busId) {
        await tripService.startTrip({
          busId,
          routeId: confirmedRoute._id,
          pickupPolicy: 'BOTH',
          initialCoords,
        });
        navigate('/driver/active-trip');
      } else {
        navigate('/driver/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start trip with confirmed route.');
    } finally {
      setConfirming(false);
    }
  };

  if (!originName || !destinationName) {
    return (
      <DashboardLayout role="DRIVER" title="Route Preview" backTo="/driver/bus-details">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-[#0F172A]">No Route Specified</h3>
          <p className="text-sm text-[#64748B]">
            Please enter your bus start location and final destination to preview the road route before starting a trip.
          </p>
          <div>
            <Link
              to="/driver/bus-details"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#1769F4] text-white text-sm font-semibold rounded-xl hover:bg-[#1256CC] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Go to Bus Details</span>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="DRIVER"
      title="Route Preview"
      backTo="/driver/bus-details"
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {error && (
          <div className="p-4 bg-[#FEE2E2] text-[#EF4444] rounded-xl border border-[#FECACA] flex items-center space-x-2 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {gpsWarning && (
          <div className="p-4 bg-[#FEF3C7] text-[#92400E] rounded-xl border border-[#FDE68A] flex items-center space-x-2 text-sm">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{gpsWarning}</span>
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
