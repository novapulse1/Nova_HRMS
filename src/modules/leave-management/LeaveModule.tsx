// MODULE 4: Leave Management & Cross-Module Attendance Integration
import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Filter,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { LeaveService } from '../../services/leaveService';
import { EmployeeService } from '../../services/employeeService';
import { LeaveApplication, LeaveType, LeaveBalance } from '../../database/schema';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { exportToExcel } from '../../utils/exportUtils';
import { formatDate } from '../../utils/dateUtils';
import { StorageEngine } from '../../database/storageEngine';

export const LeaveModule: React.FC = () => {
  const { currentUser, currentEmployee, isSuperAdmin, isHR, isManager, isEmployee } = useAuth();
  const { departments } = useOrganization();
  const [dataVersion, setDataVersion] = useState(0);

  const [activeTab, setActiveTab] = useState<'applications' | 'balances' | 'types'>('applications');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [applyForm, setApplyForm] = useState({
    leaveTypeId: 'lt-cl-01',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    isHalfDay: false,
    halfDaySession: 'first_half' as 'first_half' | 'second_half',
    reason: '',
  });

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const leaveTypes = LeaveService.getLeaveTypes();
  const allApplications = LeaveService.getApplications();
  const employees = EmployeeService.getAll();

  // Current employee's leave balances
  const myBalances = currentEmployee ? LeaveService.getEmployeeBalances(currentEmployee.id) : [];

  // Filter applications
  let filteredApps = allApplications;
  if (isEmployee && currentEmployee) {
    filteredApps = filteredApps.filter(a => a.employeeId === currentEmployee.id);
  }
  if (statusFilter !== 'all') {
    filteredApps = filteredApps.filter(a => a.status === statusFilter);
  }

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;

    const res = LeaveService.applyLeave({
      employeeId: currentEmployee.id,
      leaveTypeId: applyForm.leaveTypeId,
      startDate: applyForm.startDate,
      endDate: applyForm.endDate,
      totalDays: applyForm.isHalfDay ? 0.5 : applyForm.totalDays,
      isHalfDay: applyForm.isHalfDay,
      halfDaySession: applyForm.isHalfDay ? applyForm.halfDaySession : undefined,
      reason: applyForm.reason,
    });

    if (!res.success) {
      alert(res.message);
      return;
    }

    setIsApplyModalOpen(false);
    setApplyForm({
      leaveTypeId: 'lt-cl-01',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      totalDays: 1,
      isHalfDay: false,
      halfDaySession: 'first_half',
      reason: '',
    });
    alert('Leave application submitted successfully.');
  };

  const handleApprove = (appId: string) => {
    LeaveService.approveLeave(appId, currentUser.employeeId, true);
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAppId) {
      LeaveService.approveLeave(selectedAppId, currentUser.employeeId, false, rejectionReason);
      setIsRejectModalOpen(false);
      setSelectedAppId(null);
      setRejectionReason('');
    }
  };

  const handleExportLeaves = () => {
    const rows = filteredApps.map(a => {
      const emp = EmployeeService.getById(a.employeeId);
      const lt = LeaveService.getLeaveTypeById(a.leaveTypeId);
      return {
        'Application ID': a.id,
        'Employee Code': emp?.employeeCode || '—',
        'Employee Name': `${emp?.firstName} ${emp?.lastName}`,
        'Leave Type': lt?.name || 'Leave',
        'From Date': a.startDate,
        'To Date': a.endDate,
        'Total Days': a.totalDays,
        'Status': a.status.toUpperCase(),
        'Reason': a.reason,
        'Applied Date': formatDate(a.createdAt),
      };
    });
    exportToExcel('NovaPulse_Leave_Applications.xlsx', 'Leave Applications', rows);
  };

  const applicationColumns: Column<LeaveApplication>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (app) => {
        const emp = EmployeeService.getById(app.employeeId);
        return (
          <div className="flex items-center gap-3">
            <img src={emp?.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <div className="font-bold text-slate-900">{emp?.firstName} {emp?.lastName}</div>
              <div className="text-xs text-slate-400 font-mono">{emp?.employeeCode}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'leaveType',
      header: 'Leave Type & Days',
      render: (app) => {
        const lt = LeaveService.getLeaveTypeById(app.leaveTypeId);
        return (
          <div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md text-white inline-block mb-0.5"
              style={{ backgroundColor: lt?.color || '#8b5cf6' }}
            >
              {lt?.name || 'Leave'}
            </span>
            <div className="text-xs font-semibold text-slate-700">
              {app.totalDays} day{app.totalDays > 1 ? 's' : ''} {app.isHalfDay ? `(Half-Day)` : ''}
            </div>
          </div>
        );
      },
    },
    {
      key: 'dates',
      header: 'Period & Reason',
      render: (app) => (
        <div className="max-w-xs">
          <div className="text-xs font-bold text-slate-900">
            {app.startDate} ➔ {app.endDate}
          </div>
          <div className="text-xs text-slate-500 truncate" title={app.reason}>
            "{app.reason}"
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (app) => {
        const mapVariant: any = {
          approved: 'success',
          pending: 'warning',
          rejected: 'danger',
          cancelled: 'default',
        };
        return <Badge variant={mapVariant[app.status] || 'default'}>{app.status.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (app) => {
        const isPending = app.status === 'pending';
        const canApprove = (isSuperAdmin || isHR || isManager) && isPending;

        return (
          canApprove && (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="success"
                className="text-xs px-2.5 py-1"
                onClick={() => handleApprove(app.id)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="text-xs px-2.5 py-1"
                onClick={() => {
                  setSelectedAppId(app.id);
                  setIsRejectModalOpen(true);
                }}
              >
                Reject
              </Button>
            </div>
          )
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Leave Balance Cards (for currently logged in user) */}
      {currentEmployee && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {myBalances.map(b => {
            const lt = leaveTypes.find(t => t.id === b.leaveTypeId);
            if (!lt) return null;
            return (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase">{lt.code}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: lt.color }}
                    />
                  </div>
                  <div className="text-xl font-black text-slate-900">{b.balance} Days</div>
                  <div className="text-[11px] text-slate-500">{lt.name}</div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Used: {b.used}</span>
                  <span>Quota: {b.allocated}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'applications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 inline mr-1.5" />
            Leave Applications ({allApplications.filter(a => a.status === 'pending').length} Pending)
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'types' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
            Leave Policies & Entitlements
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentEmployee && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsApplyModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Apply for Leave
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportLeaves}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Leaves
          </Button>
        </div>
      </div>

      {/* TAB 1: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm w-fit">
            <span className="text-xs font-bold text-slate-500 uppercase px-2">Filter:</span>
            {['all', 'pending', 'approved', 'rejected'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                  statusFilter === st ? 'bg-brand-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <Table
            columns={applicationColumns}
            data={filteredApps}
            keyExtractor={a => a.id}
            pageSize={10}
            emptyMessage="No leave applications found."
          />
        </div>
      )}

      {/* TAB 2: POLICIES */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaveTypes.map(lt => (
            <div
              key={lt.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: lt.color }}
                  />
                  <Badge variant={lt.isPaid ? 'success' : 'default'}>
                    {lt.isPaid ? 'Paid Leave' : 'Unpaid (LOP)'}
                  </Badge>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">{lt.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{lt.description}</p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Annual Quota:</span>
                  <span className="font-bold text-slate-900">{lt.annualQuota} Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Accrual Frequency:</span>
                  <span className="font-bold text-slate-900 capitalize">{lt.accrualFrequency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Carry Forward:</span>
                  <span className="font-bold text-slate-900">{lt.carryForwardMax} Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Half-Day Permitted:</span>
                  <span className="font-bold text-slate-900">{lt.isHalfDayAllowed ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        subtitle="Submit your leave application for reporting manager review"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <Select
            label="Leave Type"
            value={applyForm.leaveTypeId}
            onChange={e => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
            required
          >
            {leaveTypes.map(lt => {
              const bal = myBalances.find(b => b.leaveTypeId === lt.id);
              return (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({bal ? `Balance: ${bal.balance} days` : ''})
                </option>
              );
            })}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={applyForm.startDate}
              onChange={e => {
                const s = e.target.value;
                setApplyForm({ ...applyForm, startDate: s, endDate: s >= applyForm.endDate ? s : applyForm.endDate });
              }}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={applyForm.endDate}
              min={applyForm.startDate}
              onChange={e => setApplyForm({ ...applyForm, endDate: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="halfDayCheck"
              checked={applyForm.isHalfDay}
              onChange={e => setApplyForm({ ...applyForm, isHalfDay: e.target.checked })}
              className="w-4 h-4 text-brand-700 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="halfDayCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
              Apply as Half-Day Leave
            </label>
          </div>

          <Input
            label="Reason for Leave"
            placeholder="e.g. Personal family engagement / medical recovery..."
            value={applyForm.reason}
            onChange={e => setApplyForm({ ...applyForm, reason: e.target.value })}
            required
          />

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Leave Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Leave Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Leave Application"
        subtitle="Please specify a constructive reason for rejection"
      >
        <form onSubmit={handleRejectConfirm} className="space-y-4">
          <Input
            label="Rejection Reason"
            placeholder="e.g. Critical release deadline / overlapping team member leave..."
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            required
          />

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
