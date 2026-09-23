// MODULE 11: Enterprise Settings & RBAC Administration
import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Users,
  Shield,
  Calendar,
  Sliders,
  History,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { SettingsService } from '../../services/settingsService';
import { AuditService } from '../../services/auditService';
import { Role, Branch, Department, Holiday, SystemPolicySettings } from '../../database/schema';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { StorageEngine } from '../../database/storageEngine';

export const SettingsModule: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { organization, branches, departments, designations, refreshOrgData } = useOrganization();
  const [dataVersion, setDataVersion] = useState(0);

  const [activeTab, setActiveTab] = useState<
    'company' | 'branches' | 'departments' | 'roles' | 'holidays' | 'policies' | 'audit'
  >('company');

  // Forms
  const [orgForm, setOrgForm] = useState(organization);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    country: 'India',
    address: '',
    latitude: 28.6280,
    longitude: 77.3649,
    geofenceRadiusMeters: 250,
    isHeadquarters: false,
  });

  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    headEmployeeName: '',
    color: '#8b5cf6',
  });

  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    isOptional: false,
    description: '',
  });

  const [policies, setPolicies] = useState<SystemPolicySettings>(() =>
    SettingsService.getSystemPolicies()
  );

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const roles = SettingsService.getRoles();
  const holidays = SettingsService.getHolidays();
  const auditLogs = AuditService.getLogs();

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    SettingsService.updateOrganization(orgForm);
    refreshOrgData();
    alert('Organization profile updated successfully!');
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    SettingsService.createBranch({
      organizationId: 'org-novapulse-01',
      ...branchForm,
    });
    setIsBranchModalOpen(false);
    refreshOrgData();
  };

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    SettingsService.createDepartment({
      organizationId: 'org-novapulse-01',
      ...deptForm,
    });
    setIsDeptModalOpen(false);
    refreshOrgData();
  };

  const handleCreateHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    SettingsService.createHoliday({
      organizationId: 'org-novapulse-01',
      ...holidayForm,
    });
    setIsHolidayModalOpen(false);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    SettingsService.updateSystemPolicies(policies);
    alert('System & Statutory policies saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'company', label: 'Company Profile', icon: <Building className="w-3.5 h-3.5" /> },
          { id: 'branches', label: 'Branches', icon: <Building className="w-3.5 h-3.5" /> },
          { id: 'departments', label: 'Departments', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'roles', label: 'RBAC Roles', icon: <Shield className="w-3.5 h-3.5" /> },
          { id: 'holidays', label: 'Holidays', icon: <Calendar className="w-3.5 h-3.5" /> },
          { id: 'policies', label: 'Statutory Policies', icon: <Sliders className="w-3.5 h-3.5" /> },
          { id: 'audit', label: 'Audit Logs', icon: <History className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: COMPANY PROFILE */}
      {activeTab === 'company' && (
        <Card title="Organization & Legal Entity Profile" subtitle="Company legal details, registration numbers, and official branding">
          <form onSubmit={handleSaveOrg} className="space-y-4 max-w-2xl">
            <Input
              label="Legal Company Name"
              value={orgForm.name}
              onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Official Website"
                value={orgForm.website}
                onChange={e => setOrgForm({ ...orgForm, website: e.target.value })}
              />
              <Input
                label="Official Contact Phone"
                value={orgForm.phone}
                onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })}
              />
            </div>
            <Input
              label="Registered Corporate Address"
              value={orgForm.address}
              onChange={e => setOrgForm({ ...orgForm, address: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="GST Number"
                value={orgForm.gstNumber}
                onChange={e => setOrgForm({ ...orgForm, gstNumber: e.target.value })}
              />
              <Input
                label="UDYAM Registration"
                value={orgForm.udyamNumber}
                onChange={e => setOrgForm({ ...orgForm, udyamNumber: e.target.value })}
              />
              <Input
                label="Corporate PAN"
                value={orgForm.panNumber}
                onChange={e => setOrgForm({ ...orgForm, panNumber: e.target.value })}
              />
            </div>

            {isSuperAdmin && (
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Organization Profile
              </Button>
            )}
          </form>
        </Card>
      )}

      {/* TAB 2: BRANCHES */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Configured Office Branches</h3>
            {isSuperAdmin && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsBranchModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Branch
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map(b => (
              <div key={b.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-brand-800">{b.code}</span>
                  {b.isHeadquarters && <Badge variant="purple">Corporate HQ</Badge>}
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">{b.name}</h4>
                <p className="text-xs text-slate-500">{b.address}</p>
                <div className="pt-2 text-[11px] text-slate-400 font-mono">
                  {b.city}, {b.state} • Geofence: {b.geofenceRadiusMeters}m
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Organizational Departments</h3>
            {isSuperAdmin && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsDeptModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Department
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departments.map(d => (
              <div key={d.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="font-mono text-xs font-bold text-slate-400">{d.code}</span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">{d.name}</h4>
                <p className="text-xs text-slate-500">Head: <span className="font-semibold text-slate-800">{d.headEmployeeName || '—'}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ROLES & PERMISSIONS */}
      {activeTab === 'roles' && (
        <Card title="Role-Based Access Control (RBAC)" subtitle="Configured system roles and authorized module permissions">
          <div className="space-y-4">
            {roles.map(r => (
              <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand-700" />
                    <span className="font-extrabold text-sm text-slate-900">{r.name}</span>
                  </div>
                  <Badge variant={r.isSystem ? 'purple' : 'default'}>
                    {r.isSystem ? 'System Core Role' : 'Custom'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">{r.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {Object.entries(r.permissions).map(([mod, perms]) => (
                    <span key={mod} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono">
                      {mod}: {perms.view ? 'View' : '—'} {perms.create ? '+Create' : ''} {perms.approve ? '+Approve' : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 5: HOLIDAYS */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Annual Holidays Calendar (2026)</h3>
            {isSuperAdmin && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsHolidayModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Holiday
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {holidays.map(h => (
              <div key={h.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                <span className="font-mono text-xs font-bold text-brand-800">{h.date}</span>
                <h4 className="font-bold text-slate-900 text-sm">{h.name}</h4>
                <div className="text-[11px] text-slate-500">{h.description || 'Public Holiday'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: STATUTORY POLICIES */}
      {activeTab === 'policies' && (
        <Card title="Configurable Statutory & System Policies" subtitle="Indian statutory thresholds, PF ceiling, and attendance grace period parameters">
          <form onSubmit={handleSavePolicies} className="space-y-6 max-w-2xl text-xs">
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 border-b pb-1">Provident Fund (PF) Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="PF Ceiling Wage (₹)"
                  type="number"
                  value={policies.payroll?.pfCeilingAmount}
                  onChange={e => setPolicies({
                    ...policies,
                    payroll: { ...policies.payroll, pfCeilingAmount: Number(e.target.value) }
                  })}
                />
                <Input
                  label="Employee PF Rate (%)"
                  type="number"
                  value={policies.payroll?.pfEmployeeRatePercent}
                  onChange={e => setPolicies({
                    ...policies,
                    payroll: { ...policies.payroll, pfEmployeeRatePercent: Number(e.target.value) }
                  })}
                />
                <Input
                  label="Employer PF Rate (%)"
                  type="number"
                  value={policies.payroll?.pfEmployerRatePercent}
                  onChange={e => setPolicies({
                    ...policies,
                    payroll: { ...policies.payroll, pfEmployerRatePercent: Number(e.target.value) }
                  })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 border-b pb-1">Attendance & Punctuality Policy</h4>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Grace Period (Mins)"
                  type="number"
                  value={policies.attendance?.defaultGracePeriodMinutes}
                  onChange={e => setPolicies({
                    ...policies,
                    attendance: { ...policies.attendance, defaultGracePeriodMinutes: Number(e.target.value) }
                  })}
                />
                <Input
                  label="Half-Day Threshold (Hrs)"
                  type="number"
                  value={policies.attendance?.halfDayWorkHours}
                  onChange={e => setPolicies({
                    ...policies,
                    attendance: { ...policies.attendance, halfDayWorkHours: Number(e.target.value) }
                  })}
                />
                <Input
                  label="Full-Day Threshold (Hrs)"
                  type="number"
                  value={policies.attendance?.fullDayWorkHours}
                  onChange={e => setPolicies({
                    ...policies,
                    attendance: { ...policies.attendance, fullDayWorkHours: Number(e.target.value) }
                  })}
                />
              </div>
            </div>

            {isSuperAdmin && (
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Policy Configurations
              </Button>
            )}
          </form>
        </Card>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <Card title="System Activity & Security Audit Trail" subtitle="Immutable audit logs recording user actions, modules, and changes">
          <div className="divide-y divide-slate-100">
            {auditLogs.map(log => (
              <div key={log.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.userName}</span>
                    <span className="text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded font-semibold">{log.userRole}</span>
                    <span className="text-slate-400 font-mono">[{log.module}]</span>
                  </div>
                  <div className="text-slate-600 mt-0.5">{log.description}</div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                  {formatDateTime(log.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Branch Modal */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title="Add New Office Branch"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <Input
            label="Branch Name"
            placeholder="e.g. Hyderabad Tech Hub"
            value={branchForm.name}
            onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
            required
          />
          <Input
            label="Branch Code"
            placeholder="e.g. HYD-01"
            value={branchForm.code}
            onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
            required
          />
          <Input
            label="City"
            value={branchForm.city}
            onChange={e => setBranchForm({ ...branchForm, city: e.target.value })}
            required
          />
          <Input
            label="Address"
            value={branchForm.address}
            onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
            required
          />
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsBranchModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Branch</Button>
          </div>
        </form>
      </Modal>

      {/* Add Dept Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Add New Department"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Quality Assurance"
            value={deptForm.name}
            onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
            required
          />
          <Input
            label="Department Code"
            placeholder="e.g. QA"
            value={deptForm.code}
            onChange={e => setDeptForm({ ...deptForm, code: e.target.value })}
            required
          />
          <Input
            label="Department Head Name"
            value={deptForm.headEmployeeName}
            onChange={e => setDeptForm({ ...deptForm, headEmployeeName: e.target.value })}
          />
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Department</Button>
          </div>
        </form>
      </Modal>

      {/* Add Holiday Modal */}
      <Modal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title="Add Company Holiday"
      >
        <form onSubmit={handleCreateHoliday} className="space-y-4">
          <Input
            label="Holiday Name"
            placeholder="e.g. Raksha Bandhan"
            value={holidayForm.name}
            onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })}
            required
          />
          <Input
            label="Date"
            type="date"
            value={holidayForm.date}
            onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })}
            required
          />
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsHolidayModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Holiday</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
