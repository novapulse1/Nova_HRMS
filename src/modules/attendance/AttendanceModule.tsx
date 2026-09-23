// MODULE 3: Attendance Management & Regularization Workflow
import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  Fingerprint,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  UploadCloud,
  MapPin,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { AttendanceService } from '../../services/attendanceService';
import { EmployeeService } from '../../services/employeeService';
import { ShiftService } from '../../services/shiftService';
import { GeoLocationService } from '../../services/geoLocationService';
import { Attendance, AttendanceStatus, AttendanceRegularization } from '../../database/schema';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { exportToExcel } from '../../utils/exportUtils';
import { formatDate, formatDurationMinutes } from '../../utils/dateUtils';
import { StorageEngine } from '../../database/storageEngine';

export const AttendanceModule: React.FC = () => {
  const { currentUser, currentEmployee, isSuperAdmin, isHR, isManager, isEmployee } = useAuth();
  const { departments, branches } = useOrganization();
  const [dataVersion, setDataVersion] = useState(0);

  const [activeTab, setActiveTab] = useState<'daily' | 'regularizations' | 'biometric'>('daily');
  const [selectedDate, setSelectedDate] = useState('2026-09-21');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  const [punchForm, setPunchForm] = useState({
    employeeId: currentEmployee?.id || 'emp-001',
    type: 'IN' as 'IN' | 'OUT',
    time: '09:00:00',
    source: 'Biometric Machine' as any,
  });

  const [regForm, setRegForm] = useState({
    date: selectedDate,
    requestedCheckIn: '09:00:00',
    requestedCheckOut: '18:00:00',
    requestedStatus: 'Present' as AttendanceStatus,
    reason: '',
  });

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const allAttendance = AttendanceService.getAll();
  const employees = EmployeeService.getAll();
  const shifts = ShiftService.getShifts();
  const regularizations = AttendanceService.getRegularizations();

  // Filter attendance
  let filteredRecords = allAttendance.filter(a => a.date === selectedDate);
  if (statusFilter !== 'all') {
    filteredRecords = filteredRecords.filter(a => a.status === statusFilter);
  }
  if (isEmployee && currentEmployee) {
    filteredRecords = filteredRecords.filter(a => a.employeeId === currentEmployee.id);
  }
  if (searchQuery) {
    filteredRecords = filteredRecords.filter(a => {
      const emp = EmployeeService.getById(a.employeeId);
      const name = `${emp?.firstName} ${emp?.lastName}`.toLowerCase();
      return name.includes(searchQuery.toLowerCase()) || emp?.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }

  const handleManualPunch = (e: React.FormEvent) => {
    e.preventDefault();
    AttendanceService.recordPunch({
      employeeId: punchForm.employeeId,
      type: punchForm.type,
      time: punchForm.time,
      source: punchForm.source,
      location: { lat: 28.6280, lng: 77.3649, inGeofence: true, address: 'Office Gate Terminal' },
    });
    setIsPunchModalOpen(false);
  };

  const [isGpsLocating, setIsGpsLocating] = useState(false);

  const handleGpsPunch = (type: 'IN' | 'OUT') => {
    if (!currentEmployee) return;
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this device.');
      return;
    }
    setIsGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const verification = GeoLocationService.verifyGeofence(lat, lng);

        AttendanceService.recordPunch({
          employeeId: currentEmployee.id,
          type,
          source: 'Mobile GPS',
          location: {
            lat,
            lng,
            inGeofence: verification.isAuthorized,
            address: verification.nearestBranch?.name || 'Mobile GPS Clock-In',
            distanceFromOfficeMeters: verification.distanceMeters,
          },
        });

        alert(
          `Clock-${type} successfully recorded via GPS!\n\n` +
          `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n` +
          `Status: ${verification.isAuthorized ? '✓ Within Office Geofence perimeter' : '⚠ Remote / Outside Geofence'}`
        );
      },
      (err) => {
        setIsGpsLocating(false);
        alert(`Could not fetch high-accuracy GPS coordinates (${err.message}). Recording standard mobile check-${type.toLowerCase()}.`);
        AttendanceService.recordPunch({
          employeeId: currentEmployee.id,
          type,
          source: 'Mobile GPS',
          location: { lat: 28.6280, lng: 77.3649, inGeofence: true, address: 'Office Location (Default GPS)' },
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleApplyRegularization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;

    AttendanceService.submitRegularization({
      employeeId: currentEmployee.id,
      date: regForm.date,
      requestedCheckIn: regForm.requestedCheckIn,
      requestedCheckOut: regForm.requestedCheckOut,
      requestedStatus: regForm.requestedStatus,
      reason: regForm.reason,
    });
    setIsRegModalOpen(false);
    setRegForm({
      date: selectedDate,
      requestedCheckIn: '09:00:00',
      requestedCheckOut: '18:00:00',
      requestedStatus: 'Present',
      reason: '',
    });
  };

  const handleExportAttendance = () => {
    const rows = filteredRecords.map(a => {
      const emp = EmployeeService.getById(a.employeeId);
      const shift = shifts.find(s => s.id === a.shiftId);
      return {
        'Date': a.date,
        'Employee Code': emp?.employeeCode || 'N/A',
        'Employee Name': `${emp?.firstName} ${emp?.lastName}`,
        'Assigned Shift': shift?.name || 'General',
        'Check In': a.checkIn || '—',
        'Check Out': a.checkOut || '—',
        'Status': a.status,
        'Late (Mins)': a.lateMinutes,
        'Work Duration': formatDurationMinutes(a.workDurationMinutes),
        'Source': a.punchSource,
        'Regularized': a.isRegularized ? 'Yes' : 'No',
      };
    });
    exportToExcel(`NovaPulse_Attendance_${selectedDate}.xlsx`, 'Daily Attendance', rows);
  };

  const attendanceColumns: Column<Attendance>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (att) => {
        const emp = EmployeeService.getById(att.employeeId);
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
      key: 'timing',
      header: 'Punches (In / Out)',
      render: (att) => (
        <div>
          <div className="font-mono text-xs font-bold text-slate-900">
            {att.checkIn ? att.checkIn : '—'} ➔ {att.checkOut ? att.checkOut : '—'}
          </div>
          <div className="text-[11px] text-slate-400">{att.punchSource}</div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Work Duration',
      render: (att) => (
        <div>
          <div className="text-xs font-bold text-slate-800">
            {formatDurationMinutes(att.workDurationMinutes)}
          </div>
          {att.lateMinutes > 0 && (
            <span className="text-[10px] font-bold text-rose-600">
              Late by {att.lateMinutes}m
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Attendance Status',
      render: (att) => {
        const mapVariant: any = {
          'Present': 'present',
          'Absent': 'absent',
          'Half-Day': 'halfday',
          'Late Arrival': 'late',
          'Leave': 'leave',
          'Work From Home': 'wfh',
        };
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={mapVariant[att.status] || 'default'}>{att.status}</Badge>
            {att.isRegularized && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Regularized
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 inline mr-1.5" />
            Daily Attendance Log
          </button>
          <button
            onClick={() => setActiveTab('regularizations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'regularizations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1.5" />
            Regularization Requests ({regularizations.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('biometric')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'biometric' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5 inline mr-1.5" />
            Biometric Hardware Gateway
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentEmployee && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="success"
                isLoading={isGpsLocating}
                onClick={() => handleGpsPunch('IN')}
                leftIcon={<MapPin className="w-4 h-4" />}
              >
                GPS Clock In
              </Button>
              <Button
                size="sm"
                variant="secondary"
                isLoading={isGpsLocating}
                onClick={() => handleGpsPunch('OUT')}
              >
                GPS Clock Out
              </Button>
            </div>
          )}

          {currentEmployee && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRegModalOpen(true)}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              Regularize
            </Button>
          )}

          {(isSuperAdmin || isHR) && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsPunchModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Manual Punch Record
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportAttendance}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Sheet
          </Button>
        </div>
      </div>

      {/* TAB 1: DAILY ATTENDANCE */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Late Arrival">Late Arrival</option>
                  <option value="Half-Day">Half-Day</option>
                  <option value="Leave">Leave</option>
                  <option value="Work From Home">Work From Home</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none w-full sm:w-60 focus:border-brand-700"
              />
            </div>
          </div>

          <Table
            columns={attendanceColumns}
            data={filteredRecords}
            keyExtractor={a => a.id}
            pageSize={10}
            emptyMessage={`No attendance records found for ${formatDate(selectedDate)}.`}
          />
        </div>
      )}

      {/* TAB 2: ATTENDANCE REGULARIZATION */}
      {activeTab === 'regularizations' && (
        <Card
          title="Attendance Regularization & Missing Punch Requests"
          subtitle="Employees can request punch corrections due to missed punches, field duty, or technical glitches"
        >
          <div className="divide-y divide-slate-100">
            {regularizations.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No attendance regularization requests pending.
              </div>
            ) : (
              regularizations.map(reg => {
                const emp = EmployeeService.getById(reg.employeeId);
                const isPending = reg.status === 'pending';
                return (
                  <div key={reg.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {emp?.firstName} {emp?.lastName}
                        </span>
                        <span className="text-xs text-slate-400">({emp?.employeeCode})</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Date: <span className="font-bold">{reg.date}</span> • Requested Time: {reg.requestedCheckIn} to {reg.requestedCheckOut} ({reg.requestedStatus})
                      </div>
                      <div className="text-xs text-slate-500 italic">
                        "Reason: {reg.reason}"
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          reg.status === 'approved'
                            ? 'success'
                            : reg.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {reg.status.toUpperCase()}
                      </Badge>

                      {isPending && (isSuperAdmin || isHR || isManager) && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => AttendanceService.approveRegularization(reg.id, currentUser.employeeId, true)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => AttendanceService.approveRegularization(reg.id, currentUser.employeeId, false, 'Invalid reason')}
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
      )}

      {/* TAB 3: BIOMETRIC HARDWARE GATEWAY */}
      {activeTab === 'biometric' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            title="Biometric Push Log Simulator"
            subtitle="Simulates real-time hardware punch ingestion from Face Recognition and Optical Scanners"
          >
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-2">
                <div className="text-brand-400 font-bold">[GATEWAY] NovaPulse Cloud Biometric Daemon Active</div>
                <div className="text-slate-400">Listening on port 8088 • TCP/LAN Push Protocol v2.4</div>
                <div className="text-emerald-400">✓ Delhi HQ Reception Face Terminal (Device ID: NP-BIO-DEL-0192) CONNECTED</div>
                <div className="text-emerald-400">✓ Mumbai Hub Biometric Gate 1 CONNECTED</div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    // Ingest simulated biometric batch
                    const sampleEmp = employees[Math.floor(Math.random() * employees.length)];
                    AttendanceService.recordPunch({
                      employeeId: sampleEmp.id,
                      type: 'IN',
                      time: '08:58:30',
                      source: 'Biometric Machine',
                    });
                    alert(`Received real-time biometric push packet for ${sampleEmp.firstName} ${sampleEmp.lastName}!`);
                  }}
                  leftIcon={<Fingerprint className="w-4 h-4" />}
                >
                  Simulate Random Biometric Clock-In Ingestion
                </Button>
              </div>
            </div>
          </Card>

          <Card
            title="Hardware Device Network Status"
            subtitle="Active biometric terminals and synchronization health"
          >
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Delhi HQ Main Reception</div>
                    <div className="text-[10px] text-slate-500">NP-FaceBio 5000 • IP 192.168.1.50</div>
                  </div>
                </div>
                <Badge variant="success">Online (99.9%)</Badge>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Mumbai Tech Hub Gate 1</div>
                    <div className="text-[10px] text-slate-500">NP-FaceBio 5000 • IP 192.168.2.40</div>
                  </div>
                </div>
                <Badge variant="success">Online (100%)</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Manual Punch Modal */}
      <Modal
        isOpen={isPunchModalOpen}
        onClose={() => setIsPunchModalOpen(false)}
        title="Record Manual Attendance Punch"
        subtitle="For authorized administrators to insert punch events"
      >
        <form onSubmit={handleManualPunch} className="space-y-4">
          <Select
            label="Employee"
            value={punchForm.employeeId}
            onChange={e => setPunchForm({ ...punchForm, employeeId: e.target.value })}
            required
          >
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Punch Event"
              value={punchForm.type}
              onChange={e => setPunchForm({ ...punchForm, type: e.target.value as any })}
            >
              <option value="IN">Clock IN</option>
              <option value="OUT">Clock OUT</option>
            </Select>

            <Input
              label="Time"
              type="time"
              step="1"
              value={punchForm.time}
              onChange={e => setPunchForm({ ...punchForm, time: e.target.value })}
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsPunchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Punch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Regularization Modal */}
      <Modal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        title="Submit Attendance Regularization"
        subtitle="Provide reason and corrected timings for manager review"
      >
        <form onSubmit={handleApplyRegularization} className="space-y-4">
          <Input
            label="Date to Regularize"
            type="date"
            value={regForm.date}
            onChange={e => setRegForm({ ...regForm, date: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Actual In Time"
              type="time"
              value={regForm.requestedCheckIn}
              onChange={e => setRegForm({ ...regForm, requestedCheckIn: e.target.value })}
              required
            />
            <Input
              label="Actual Out Time"
              type="time"
              value={regForm.requestedCheckOut}
              onChange={e => setRegForm({ ...regForm, requestedCheckOut: e.target.value })}
              required
            />
          </div>

          <Input
            label="Reason for Regularization"
            placeholder="e.g. Biometric machine punch missed due to network latency / on-site meeting..."
            value={regForm.reason}
            onChange={e => setRegForm({ ...regForm, reason: e.target.value })}
            required
          />

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsRegModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
