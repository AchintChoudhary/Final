import React, { useState, useEffect } from 'react';
import { Users, Phone, Bus, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { adminService } from '../../services/adminService';

export const ManageDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getAllDrivers()
      .then((res) => setDrivers(res.drivers || []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      role="ADMIN"
      title="Drivers"
      subtitle="All registered bus drivers"
      backTo="/admin/dashboard"
    >
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner text="Loading drivers..." />
            </div>
          ) : drivers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Drivers Registered"
              description="Drivers who register via Driver Signup will be listed here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase bg-[#F8FAFC]">
                    <th className="py-3 px-5">Driver Name</th>
                    <th className="py-3 px-5">Mobile Number</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {drivers.map((d) => (
                    <tr key={d._id} className="hover:bg-[#F8FAFC]">
                      <td className="py-4 px-5 font-bold text-[#0F172A]">{d.name}</td>
                      <td className="py-4 px-5 text-[#64748B] font-mono">{d.mobile || '-'}</td>
                      <td className="py-4 px-5">
                        <span className="text-xs font-semibold text-[#1769F4] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full">
                          {d.role}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-[#64748B]">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
