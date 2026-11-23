import React, { useState, useEffect } from 'react';
import { Users, Upload, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { InputField } from '../../components/common/InputField';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { studentService } from '../../services/studentService';

export const AuthorizeStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  // New Student state
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [mobile, setMobile] = useState('');

  // CSV text
  const [csvText, setCsvText] = useState(
    'studentId,name,collegeEmail,mobile\n22CS001,Aarav Sharma,aarav@college.edu,9876543210\n22CS002,Diya Patel,diya@college.edu,9876543211\n22CS003,Rohit Singh,rohit@college.edu,9876543212\n22CS004,Sneha Verma,sneha@college.edu,9876543213\n22CS005,Karan Mehta,karan@college.edu,9876543214'
  );

  const fetchStudents = async () => {
    try {
      const res = await studentService.getStudents();
      setStudents(res.students || []);
    } catch (err) {
      setError('Failed to fetch students list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await studentService.addStudent({
        studentId,
        name,
        collegeEmail,
        mobile,
      });
      setAddModalOpen(false);
      setStudentId('');
      setName('');
      setCollegeEmail('');
      setMobile('');
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      await studentService.updateStudentStatus(id, newStatus);
      fetchStudents();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleCsvImport = async () => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map((h) => h.trim());
      const parsed = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((c) => c.trim());
        if (row.length >= 3) {
          parsed.push({
            studentId: row[0],
            name: row[1],
            collegeEmail: row[2],
            mobile: row[3] || '',
          });
        }
      }

      await studentService.importCsv(parsed);
      setCsvModalOpen(false);
      fetchStudents();
    } catch (err) {
      setError('Failed to import CSV');
    }
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title="Manage Students"
      headerAction={
        <div className="flex items-center space-x-2">
          <PrimaryButton
            fullWidth={false}
            variant="outline"
            icon={Upload}
            onClick={() => setCsvModalOpen(true)}
          >
            Upload CSV
          </PrimaryButton>
          <PrimaryButton
            fullWidth={false}
            icon={Plus}
            onClick={() => setAddModalOpen(true)}
          >
            Add Student
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 max-w-5xl mx-auto">
        {error && (
          <div className="p-4 bg-[#FEE2E2] text-[#EF4444] rounded-xl border border-[#FECACA] flex items-center space-x-2 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner text="Loading authorized students..." />
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Authorized Students Yet"
              description="Click 'Upload CSV' or 'Add Student' to authorize college students for transit tracking."
              actionLabel="Add Student"
              onAction={() => setAddModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase bg-[#F8FAFC]">
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-5">Student ID</th>
                    <th className="py-3 px-5">College Email</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-[#F8FAFC]">
                      <td className="py-4 px-5 font-bold text-[#0F172A]">{s.name}</td>
                      <td className="py-4 px-5 font-mono text-xs text-[#1769F4] font-semibold">{s.studentId}</td>
                      <td className="py-4 px-5 text-[#64748B]">{s.collegeEmail}</td>
                      <td className="py-4 px-5">
                        <StatusBadge
                          status={s.authorizationStatus === 'ACTIVE' ? 'Authorized' : 'Revoked'}
                        />
                      </td>
                      <td className="py-4 px-5">
                        <button
                          onClick={() => handleToggleStatus(s._id, s.authorizationStatus)}
                          className="text-xs font-semibold text-[#1769F4] hover:underline"
                        >
                          {s.authorizationStatus === 'ACTIVE' ? 'Revoke Access' : 'Authorize'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Modal */}
      {csvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[#0F172A]">Import Students CSV</h3>
            <p className="text-xs text-[#64748B]">
              Paste CSV records below. Format: studentId,name,collegeEmail,mobile
            </p>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full font-mono text-xs p-3 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1769F4]"
            />
            <div className="flex justify-end space-x-3">
              <PrimaryButton variant="outline" fullWidth={false} onClick={() => setCsvModalOpen(false)}>
                Cancel
              </PrimaryButton>
              <PrimaryButton fullWidth={false} onClick={handleCsvImport}>
                Import Records
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[#0F172A]">Add Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <InputField
                label="Student ID"
                placeholder="e.g. 22CS001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
              <InputField
                label="Full Name"
                placeholder="e.g. Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <InputField
                label="College Email"
                type="email"
                placeholder="e.g. aarav@college.edu"
                value={collegeEmail}
                onChange={(e) => setCollegeEmail(e.target.value)}
                required
              />
              <InputField
                label="Mobile Number"
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />

              <div className="flex justify-end space-x-3 pt-2">
                <PrimaryButton variant="outline" fullWidth={false} onClick={() => setAddModalOpen(false)}>
                  Cancel
                </PrimaryButton>
                <PrimaryButton type="submit" fullWidth={false}>
                  Save Student
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
