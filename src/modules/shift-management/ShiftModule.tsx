// MODULE 2: Shift Management & Shift Swap Workflow
import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { ShiftService } from '../../services/shiftService';
import { EmployeeService } from '../../services/employeeService';
import { Shift, ShiftSwapRequest, Employee } from '../../database/schema';
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

export const ShiftModule: React.FC = () => {
  const { currentUser, currentEmployee, isSuperAdmin, isHR, isManager } = useAuth();
  const { departments, branches } = useOrganization();
  const [activeTab, setActiveTab] = useState<'roster' | 'templates' | 'swaps'>('roster');
  const [dataVersion, setDataVersion] = useState(0);

  // Modals
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  // Form states
  const [shiftForm, setShiftForm] = useState({
    name: '',
    code: '',
    startTime: '09:00',
    endTime: '18:00',
    breakDurationMinutes: 60,
    gracePeriodMinutes: 15,
    halfDayThresholdHours: 4.5,
    fullDayThresholdHours: 8.5,
    isNightShift: false,
    color: '#8b5cf6',
  });

  const [swapForm, setSwapForm] = useState({
    targetEmployeeId: '',
    requesterDate: new Date().toISOString().split('T')[0],
    targetDate: new Date().toISOString().split('T')[0],
    targetShiftId: 'shift-gen-01',
    reason: '',
  });

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const shifts = ShiftService.getShifts();
  const employees = EmployeeService.getAll();
  const swaps = ShiftService.getSwapRequests();

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    ShiftService.createShift({
      organizationId: 'org-novapulse-01',
      ...shiftForm,
      workingDays: [1, 2, 3, 4, 5],
      weeklyOffs: [0, 6],
    });
    setIsCreateShiftOpen(false);
    setShiftForm({
      name: '',
      code: '',
      startTime: '09:00',
      endTime: '18:00',
      breakDurationMinutes: 60,
      gracePeriodMinutes: 15,
      halfDayThresholdHours: 4.5,
      fullDayThresholdHours: 8.5,
      isNightShift: false,
      color: '#8b5cf6',
    });
  };

  const handleCreateSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;

    ShiftService.createSwapRequest({
      requesterEmployeeId: currentEmployee.id,
      targetEmployeeId: swapForm.targetEmployeeId,
      requesterDate: swapForm.requesterDate,
      requesterShiftId: currentEmployee.assignedShiftId,
      targetDate: swapForm.targetDate,
      targetShiftId: swapForm.targetShiftId,
      reason: swapForm.reason,
      managerId: currentEmployee.reportingManagerId,
    });
    setIsSwapModalOpen(false);
    setSwapForm({
      targetEmployeeId: '',
      requesterDate: new Date().toISOString().split('T')[0],
      targetDate: new Date().toISOString().split('T')[0],
      targetShiftId: 'shift-gen-01',
      reason: '',
    });
  };

  const handleExportShifts = () => {
    const rows = employees.map(emp => {
      const shift = shifts.find(s => s.id === emp.assignedShiftId);
      const dept = departments.find(d => d.id === emp.departmentId);
      const branch = branches.find(b => b.id === emp.branchId);
      return {
        'Employee Code': emp.employeeCode,
        'Full Name': `${emp.firstName} ${emp.lastName}`,
        'Department': dept?.name || 'N/A',
        'Branch': branch?.name || 'N/A',
        'Assigned Shift': shift?.name || 'General Shift',
        'Timing': shift ? `${shift.startTime} - ${shift.endTime}` : '09:00 - 18:00',
        'Grace Period': shift ? `${shift.gracePeriodMinutes} mins` : '15 mins',
      };
    });
    exportToExcel('NovaPulse_Shift_Roster.xlsx', 'Shift Allocation', rows);
  };

  const employeeColumns: Column<Employee>[] = [
    {
      key: 'employee',
      header: 'Employee Details',
      render: (emp) => (
        <div className="flex items-center gap-3">
          <img src={emp.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
            <div className="text-xs text-slate-400 font-mono">{emp.employeeCode}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (emp) => {
        const dept = departments.find(d => d.id === emp.departmentId);
        return <span className="text-xs font-semibold text-slate-600">{dept?.name || '—'}</span>;
      },
    },
    {
      key: 'shift',
      header: 'Assigned Shift & Timings',
      render: (emp) => {
        const shift = shifts.find(s => s.id === emp.assignedShiftId);
        return (
          <div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md text-white inline-block mb-0.5"
              style={{ backgroundColor: shift?.color || '#8b5cf6' }}
            >
              {shift?.name || 'General Shift'}
            </span>
            <div className="text-[11px] text-slate-500 font-mono">
              {shift?.startTime} - {shift?.endTime} ({shift?.gracePeriodMinutes}m grace)
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (emp) => (
        (isSuperAdmin || isHR || isManager) && (
          <select
            value={emp.assignedShiftId}
            onChange={(e) => {
              EmployeeService.update(emp.id, { assignedShiftId: e.target.value });
              setDataVersion(v => v + 1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700 outline-none focus:border-brand-700"
          >
            {shifts.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'roster' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1.5" />
            Staff Shift Roster
          </button>
          <button
            onClick={() => setActiveTab('swaps')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'swaps' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 inline mr-1.5" />
            Shift Swaps ({swaps.filter(s => s.status.includes('pending')).length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1.5" />
            Shift Master Templates
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'swaps' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsSwapModalOpen(true)}
              leftIcon={<ArrowRightLeft className="w-4 h-4" />}
            >
              Request Shift Swap
            </Button>
          )}

          {activeTab === 'templates' && (isSuperAdmin || isHR) && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCreateShiftOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Shift Template
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportShifts}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Roster
          </Button>
        </div>
      </div>

      {/* TAB 1: STAFF SHIFT ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <Table
            columns={employeeColumns}
            data={employees}
            keyExtractor={e => e.id}
            pageSize={10}
            emptyMessage="No employees found."
          />
        </div>
      )}

      {/* TAB 2: SHIFT SWAP WORKFLOW */}
      {activeTab === 'swaps' && (
        <div className="space-y-4">
          <Card
            title="Shift Swap Requests & Multi-Step Approvals"
            subtitle="Step 1: Peer Acceptance ➔ Step 2: Reporting Manager Approval ➔ Step 3: Automatic Roster Swap"
          >
            <div className="divide-y divide-slate-100">
              {swaps.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No shift swap requests recorded.
                </div>
              ) : (
                swaps.map(swap => {
                  const empA = EmployeeService.getById(swap.requesterEmployeeId);
                  const empB = EmployeeService.getById(swap.targetEmployeeId);
                  const shiftA = ShiftService.getShiftById(swap.requesterShiftId);
                  const shiftB = ShiftService.getShiftById(swap.targetShiftId);

                  const isTargetPeer = currentEmployee?.id === swap.targetEmployeeId;
                  const isAssignedManager = currentEmployee?.id === swap.managerId || isSuperAdmin || isHR;

                  return (
                    <div key={swap.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {empA?.firstName} {empA?.lastName}
                          </span>
                          <span className="text-xs text-slate-400">wants to swap with</span>
                          <span className="font-extrabold text-sm text-slate-900">
                            {empB?.firstName} {empB?.lastName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          Date: <span className="font-bold">{swap.requesterDate}</span> • Current Shift: {shiftA?.name} ➔ Proposed: {shiftB?.name}
                        </div>
                        <div className="text-xs text-slate-500 italic">
                          "Reason: {swap.reason}"
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            swap.status === 'approved_by_manager'
                              ? 'success'
                              : swap.status === 'peer_accepted'
                              ? 'warning'
                              : swap.status.includes('rejected')
                              ? 'danger'
                              : 'info'
                          }
                        >
                          {swap.status === 'pending_peer' && 'Awaiting Peer Acceptance'}
                          {swap.status === 'peer_accepted' && 'Awaiting Manager Approval'}
                          {swap.status === 'approved_by_manager' && 'Approved & Swapped'}
                          {swap.status === 'peer_rejected' && 'Rejected by Peer'}
                          {swap.status === 'rejected_by_manager' && 'Rejected by Manager'}
                          {swap.status === 'cancelled' && 'Cancelled'}
                        </Badge>

                        {/* Peer Action */}
                        {isTargetPeer && swap.status === 'pending_peer' && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => ShiftService.respondSwapPeer(swap.id, true)}
                            >
                              Accept Swap
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => ShiftService.respondSwapPeer(swap.id, false)}
                            >
                              Decline
                            </Button>
                          </div>
                        )}

                        {/* Manager Action */}
                        {isAssignedManager && swap.status === 'peer_accepted' && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => ShiftService.approveSwapManager(swap.id, currentUser.employeeId, true)}
                            >
                              Approve Swap
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => ShiftService.approveSwapManager(swap.id, currentUser.employeeId, false, 'Rejected by manager')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: SHIFT MASTER TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.map(shift => (
            <div
              key={shift.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: shift.color }}
                  />
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {shift.code}
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">{shift.name}</h4>
                <div className="text-2xl font-black text-brand-900 my-2">
                  {shift.startTime} - {shift.endTime}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Grace Period:</span>
                    <span className="font-bold text-slate-900">{shift.gracePeriodMinutes} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Break Duration:</span>
                    <span className="font-bold text-slate-900">{shift.breakDurationMinutes} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Full-Day Hours:</span>
                    <span className="font-bold text-slate-900">{shift.fullDayThresholdHours} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overnight / Night Shift:</span>
                    <span className="font-bold text-slate-900">{shift.isNightShift ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Shift Modal */}
      <Modal
        isOpen={isCreateShiftOpen}
        onClose={() => setIsCreateShiftOpen(false)}
        title="Create New Shift Template"
        subtitle="Define shift timings, breaks, grace periods, and weekly rules"
      >
        <form onSubmit={handleCreateShift} className="space-y-4">
          <Input
            label="Shift Name"
            placeholder="e.g. Afternoon Support Shift"
            value={shiftForm.name}
            onChange={e => setShiftForm({ ...shiftForm, name: e.target.value })}
            required
          />
          <Input
            label="Shift Code"
            placeholder="e.g. AFT-13"
            value={shiftForm.code}
            onChange={e => setShiftForm({ ...shiftForm, code: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={shiftForm.startTime}
              onChange={e => setShiftForm({ ...shiftForm, startTime: e.target.value })}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={shiftForm.endTime}
              onChange={e => setShiftForm({ ...shiftForm, endTime: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Grace Period (Mins)"
              type="number"
              value={shiftForm.gracePeriodMinutes}
              onChange={e => setShiftForm({ ...shiftForm, gracePeriodMinutes: Number(e.target.value) })}
              required
            />
            <Input
              label="Break Duration (Mins)"
              type="number"
              value={shiftForm.breakDurationMinutes}
              onChange={e => setShiftForm({ ...shiftForm, breakDurationMinutes: Number(e.target.value) })}
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateShiftOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Shift Template
            </Button>
          </div>
        </form>
      </Modal>

      {/* Request Shift Swap Modal */}
      <Modal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        title="Initiate Shift Swap Request"
        subtitle="Select a peer employee to exchange shifts with"
      >
        <form onSubmit={handleCreateSwap} className="space-y-4">
          <Select
            label="Select Peer Employee to Swap With"
            value={swapForm.targetEmployeeId}
            onChange={e => setSwapForm({ ...swapForm, targetEmployeeId: e.target.value })}
            required
          >
            <option value="">-- Choose Peer Employee --</option>
            {employees
              .filter(e => e.id !== currentEmployee?.id)
              .map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="My Shift Date"
              type="date"
              value={swapForm.requesterDate}
              onChange={e => setSwapForm({ ...swapForm, requesterDate: e.target.value })}
              required
            />
            <Select
              label="Proposed Target Shift"
              value={swapForm.targetShiftId}
              onChange={e => setSwapForm({ ...swapForm, targetShiftId: e.target.value })}
              required
            >
              {shifts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Reason for Swap"
            placeholder="e.g. Need to attend doctor appointment in morning..."
            value={swapForm.reason}
            onChange={e => setSwapForm({ ...swapForm, reason: e.target.value })}
            required
          />

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsSwapModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Send Swap Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
