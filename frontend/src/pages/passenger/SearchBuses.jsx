import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Locate, AlertCircle, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LocationAutocomplete } from '../../components/common/LocationAutocomplete';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useGeolocation } from '../../hooks/useGeolocation';

export const SearchBuses = () => {
  const [pickup, setPickup] = useState('Vijay Nagar');
  const [destination, setDestination] = useState('Rau');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { getCurrentPosition } = useGeolocation();

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    setError('');
    try {
      const pos = await getCurrentPosition();
      setPickupCoords([pos.longitude, pos.latitude]);
      setPickup('My Current Location');
    } catch (err) {
      setError('Could not access current GPS location. Please check browser permissions.');
    } finally {
      setLocating(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!pickup.trim()) {
      return setError('Please enter or select a pickup location');
    }
    if (!destination.trim()) {
      return setError('Please enter a destination');
    }

    let url = `/passenger/available-buses?pickup=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}`;
    if (pickupCoords) {
      url += `&pickupLng=${pickupCoords[0]}&pickupLat=${pickupCoords[1]}`;
    }

    navigate(url);
  };

  return (
    <DashboardLayout
      role="PASSENGER"
      title="Find Your Bus"
      subtitle="Enter your pickup and destination"
    >
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSearch} className="space-y-5">
            {error && (
              <div className="p-3 text-xs font-medium text-[#EF4444] bg-[#FEE2E2] rounded-lg border border-[#FECACA] flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[#0F172A]">Pickup Location</label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  className="inline-flex items-center text-xs font-semibold text-[#1769F4] hover:text-[#1256CC] transition-colors"
                >
                  <Locate size={14} className={`mr-1 ${locating ? 'animate-spin' : ''}`} />
                  {locating ? 'Locating...' : 'Use Current Location'}
                </button>
              </div>
              <LocationAutocomplete
                value={pickup}
                onChange={(val) => {
                  setPickup(val);
                  setPickupCoords(null);
                }}
                onSelect={(item) => {
                  if (item.lon && item.lat) {
                    setPickupCoords([item.lon, item.lat]);
                  }
                }}
                
                required
              />
            </div>

            <LocationAutocomplete
              label="Final Destination"
              value={destination}
              onChange={(val) => setDestination(val)}
            
              required
            />

            <div className="pt-2">
              <PrimaryButton type="submit" icon={Compass}>
                Search Buses
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
