import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { InputField } from '../../components/common/InputField';
import { LocationAutocomplete } from '../../components/common/LocationAutocomplete';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { busService } from '../../services/busService';

export const AddBusDetails = () => {
  const [busName, setBusName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [finalDestination, setFinalDestination] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingBusId, setExistingBusId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if driver already has a bus registered
    busService.getMyBuses().then((res) => {
      if (res.buses && res.buses.length > 0) {
        const bus = res.buses[0];
        setExistingBusId(bus._id);
        setBusName(bus.busName || '');
        setPlateNumber(bus.plateNumber || '');
        if (bus.startLocation) setStartLocation(bus.startLocation);
        if (bus.finalDestination) setFinalDestination(bus.finalDestination);
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!busName.trim()) {
      return setError('Bus name is required');
    }
    if (!plateNumber.trim()) {
      return setError('Bus registration plate number is required');
    }
    if (!startLocation.trim() || !finalDestination.trim()) {
      return setError('Both start location and final destination are required');
    }

    setLoading(true);
    try {
      let savedBus;
      if (existingBusId) {
        const res = await busService.updateBus(existingBusId, {
          busName,
          plateNumber,
          startLocation,
          finalDestination,
        });
        savedBus = res.bus;
      } else {
        const res = await busService.createBus({
          busName,
          plateNumber,
          startLocation,
          finalDestination,
        });
        savedBus = res.bus;
      }

      // Proceed to Screen 5: Route Preview
      navigate(
        `/driver/route-preview?busId=${savedBus._id}&origin=${encodeURIComponent(
          startLocation
        )}&destination=${encodeURIComponent(finalDestination)}`
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bus details. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      role="DRIVER"
      title="Bus Details"
      backTo="/driver/dashboard"
    >
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-medium text-[#EF4444] bg-[#FEE2E2] rounded-lg border border-[#FECACA] flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <InputField
              label="Bus Name"
              id="busName"
              placeholder="e.g. City Express"
              value={busName}
              onChange={(e) => setBusName(e.target.value)}
              leftIcon={Bus}
              required
            />

            <InputField
              label="Plate Number"
              id="plateNumber"
              placeholder="e.g. MP09AB1234"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              required
            />

            <LocationAutocomplete
              label="Start Location"
              value={startLocation}
              onChange={(val) => setStartLocation(val)}
              placeholder="e.g. Indore"
              required
            />

            <LocationAutocomplete
              label="Final Destination"
              value={finalDestination}
              onChange={(val) => setFinalDestination(val)}
              placeholder="e.g. Ujjain"
              required
            />

            <div className="pt-4">
              <PrimaryButton type="submit" loading={loading}>
                Save & Continue
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
