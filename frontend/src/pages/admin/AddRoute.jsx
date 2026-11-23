import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, MapPin, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { InputField } from '../../components/common/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { routeService } from '../../services/routeService';

export const AddRoute = () => {
  const [routeName, setRouteName] = useState('Indore → Ujjain');
  const [stops, setStops] = useState([
    'Indore',
    'Rajendra Nagar',
    'Freeganj',
    'Ujjain',
  ]);
  const [newStop, setNewStop] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleAddStop = () => {
    if (newStop.trim()) {
      setStops([...stops, newStop.trim()]);
      setNewStop('');
    }
  };

  const handleRemoveStop = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const handleMoveStop = (index, direction) => {
    const newStops = [...stops];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;
    setStops(newStops);
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    if (!routeName.trim()) return setError('Route name is required');
    if (stops.length < 2) return setError('At least start and destination stops are required');

    setLoading(true);
    setError('');

    try {
      const originName = stops[0];
      const destName = stops[stops.length - 1];

      // Preview road geometry via Geoapify
      const previewRes = await routeService.previewRoute(originName, destName);
      const preview = previewRes.preview;

      // Create Route with stops
      const formattedStops = stops.map((s, idx) => ({
        name: s,
        coordinates: idx === 0 ? preview.origin.coordinates : idx === stops.length - 1 ? preview.destination.coordinates : [preview.origin.coordinates[0] + 0.01 * idx, preview.origin.coordinates[1] + 0.01 * idx],
        order: idx,
      }));

      await routeService.createRoute({
        name: routeName,
        origin: preview.origin,
        destination: preview.destination,
        geometry: preview.geometry,
        totalDistanceKm: preview.totalDistanceKm,
        estimatedDurationMinutes: preview.estimatedDurationMinutes,
        stops: formattedStops,
        pickupPolicy: 'BOTH',
      });

      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save route. Ensure locations are valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title="Add Route & Stops"
      backTo="/admin/dashboard"
    >
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSaveRoute} className="space-y-5">
            {error && (
              <div className="p-3 text-xs font-medium text-[#EF4444] bg-[#FEE2E2] rounded-lg border border-[#FECACA] flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <InputField
              label="Route Name"
              placeholder="e.g. Indore → Ujjain"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              required
            />

            {/* Stops Reorderable Section */}
            <div>
              <label className="text-sm font-medium text-[#0F172A] mb-2 block">
                Ordered Stops
              </label>
              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col space-y-1">
                        <button
                          type="button"
                          onClick={() => handleMoveStop(index, -1)}
                          disabled={index === 0}
                          className="text-[#64748B] hover:text-[#0F172A] disabled:opacity-20 text-xs"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStop(index, 1)}
                          disabled={index === stops.length - 1}
                          className="text-[#64748B] hover:text-[#0F172A] disabled:opacity-20 text-xs"
                        >
                          ▼
                        </button>
                      </div>
                      <MapPin size={16} className="text-[#1769F4]" />
                      <span className="text-sm font-semibold text-[#0F172A]">{stop}</span>
                      {index === 0 && (
                        <span className="text-[10px] bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full font-medium">
                          Origin
                        </span>
                      )}
                      {index === stops.length - 1 && (
                        <span className="text-[10px] bg-[#FEE2E2] text-[#EF4444] px-2 py-0.5 rounded-full font-medium">
                          Destination
                        </span>
                      )}
                    </div>

                    {stops.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(index)}
                        className="text-[#94A3B8] hover:text-[#EF4444] transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Stop Input */}
              <div className="mt-3 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter stop name..."
                  value={newStop}
                  onChange={(e) => setNewStop(e.target.value)}
                  className="flex-1 rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1769F4]"
                />
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="px-4 py-2 bg-[#EFF6FF] text-[#1769F4] font-semibold text-sm rounded-lg hover:bg-[#DBEAFE] transition-colors"
                >
                  + Add Stop
                </button>
              </div>
            </div>

            <div className="pt-4">
              <PrimaryButton type="submit" loading={loading}>
                Save Route
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
