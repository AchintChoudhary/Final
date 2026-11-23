import React, { useState, useEffect } from 'react';
import { Bus, Plus, Trash2, Edit, AlertCircle, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { InputField } from '../../components/common/InputField';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { adminService } from '../../services/adminService';
import { busService } from '../../services/busService';

export const ManageBuses = () => {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // New bus form state
  const [busName, setBusName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [finalDestination, setFinalDestination] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBusesAndDrivers = async () => {
    try {
      const [busRes, driverRes] = await Promise.all([
        adminService.getAllBuses(),
        adminService.getAllDrivers(),
      ]);
      setBuses(busRes.buses || []);
      setDrivers(driverRes.drivers || []);
    } catch (err) {
      setError('Failed to fetch buses data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusesAndDrivers();
  }, []);

  const handleCreateBus = async (e) => {
    e.preventDefault();
    if (!busName || !plateNumber) return;
    setSaving(true);
    try {
      await busService.createBus({
        busName,
        plateNumber,
        startLocation,
        finalDestination,
      });
      setModalOpen(false);
      setBusName('');
      setPlateNumber('');
      setStartLocation('');
      setFinalDestination('');
      fetchBusesAndDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bus');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignDriver = async (busId, driverId) => {
    try {
      await adminService.assignDriver(busId, driverId || null);
      fetchBusesAndDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign driver');
    }
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title="Manage Buses"
      headerAction={
        <PrimaryButton
          fullWidth={false}
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Add Bus
        </PrimaryButton>
      }
    >
      <div className="space-y-4 max-w-6xl mx-auto">
        {error && (
          <div className="p-4 bg-[#FEE2E2] text-[#EF4444] rounded-xl border border-[#FECACA] flex items-center space-x-2 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner text="Loading buses..." />
            </div>
          ) : buses.length === 0 ? (
            <EmptyState
              icon={Bus}
              title="No Buses Registered"
              description="Click '+ Add Bus' to register buses into the tracking fleet."
              actionLabel="Add First Bus"
              onAction={() => setModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase bg-[#F8FAFC]">
                    <th className="py-3 px-5">Bus Name</th>
                    <th className="py-3 px-5">Plate No.</th>
                    <th className="py-3 px-5">Driver</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Assign Driver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {buses.map((bus) => (
                    <tr key={bus._id} className="hover:bg-[#F8FAFC]">
                      <td className="py-4 px-5 font-bold text-[#0F172A]">{bus.busName}</td>
                      <td className="py-4 px-5 text-[#64748B] font-mono">{bus.plateNumber}</td>
                      <td className="py-4 px-5 text-[#0F172A]">
                        {bus.assignedDriver?.name || bus.driverId?.name || 'Unassigned'}
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={bus.isActiveTrip ? 'Active' : 'Inactive'} />
                      </td>
                      <td className="py-4 px-5">
                        <select
                          value={bus.assignedDriver?._id || bus.driverId?._id || ''}
                          onChange={(e) => handleAssignDriver(bus._id, e.target.value)}
                          className="text-xs bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1769F4]"
                        >
                          <option value="">Select Driver</option>
                          {drivers.map((d) => (
                            <option key={d._id} value={d._id}>
                              {d.name} ({d.mobile})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Bus Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[#0F172A]">Add New Bus</h3>
            <form onSubmit={handleCreateBus} className="space-y-4">
              <InputField
                label="Bus Name"
                placeholder="e.g. City Express"
                value={busName}
                onChange={(e) => setBusName(e.target.value)}
                required
              />
              <InputField
                label="Plate Number"
                placeholder="e.g. MP09AB1234"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                required
              />
              <InputField
                label="Starting Location"
                placeholder="e.g. Indore"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
              />
              <InputField
                label="Final Destination"
                placeholder="e.g. Ujjain"
                value={finalDestination}
                onChange={(e) => setFinalDestination(e.target.value)}
              />

              <div className="flex items-center justify-end space-x-3 pt-2">
                <PrimaryButton
                  type="button"
                  variant="outline"
                  fullWidth={false}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </PrimaryButton>
                <PrimaryButton type="submit" fullWidth={false} loading={saving}>
                  Save Bus
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
