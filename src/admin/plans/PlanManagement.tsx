// ====================================================================
// NovaPulse / MakeMyPayroll — Client Module Access Management
// Super Admin manually controls per-organisation module entitlements
// ====================================================================

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Check,
  Shield,
  Building2,
  Users,
  CheckSquare,
  Sparkles,
  Clock,
  CalendarCheck,
  CalendarDays,
  LifeBuoy,
  UserPlus,
  Package,
  MapPin,
  FileSpreadsheet,
  Settings,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RotateCcw,
  Sliders,
  Globe,
  ChevronRight,
  LayoutDashboard,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import { TenantService } from '../../services/tenantService';
import { useAuth } from '../../context/AuthContext';
import { Tenant } from '../../database/schema';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { getTenantSubdomainUrl } from '../../config/appConfig';

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  category: 'Core HR' | 'Workforce' | 'Operations' | 'Productivity' | 'Administration';
  icon: React.ReactNode;
  isCore?: boolean;
}

export const ALL_HRMS_MODULES: ModuleDefinition[] = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    description: 'Executive KPI cards, workforce metrics summary, departmental distribution & alerts',
    category: 'Core HR',
    icon: <LayoutDashboard className="w-5 h-5 text-purple-400" />,
    isCore: true,
  },
  {
    key: 'employees',
    name: 'Employee Master',
    description: 'Complete employee database, personal files, KYC records & hierarchy mapping',
    category: 'Core HR',
    icon: <Users className="w-5 h-5 text-indigo-400" />,
  },
  {
    key: 'attendance',
    name: 'Attendance',
    description: 'Real-time punch tracking, biometric sync, daily attendance logs & regularization',
    category: 'Workforce',
    icon: <CalendarCheck className="w-5 h-5 text-emerald-400" />,
  },
  {
    key: 'leaves',
    name: 'Leave Management',
    description: 'Leave applications, managerial approval pipeline, paid/unpaid balance rules',
    category: 'Workforce',
    icon: <CalendarDays className="w-5 h-5 text-teal-400" />,
  },
  {
    key: 'shifts',
    name: 'Shift Management',
    description: 'Multi-shift roster scheduling, rotational shifts & peer shift swap requests',
    category: 'Workforce',
    icon: <Clock className="w-5 h-5 text-amber-400" />,
  },
  {
    key: 'payroll',
    name: 'Payroll',
    description: 'Monthly payroll runs, statutory compliance (PF, ESI, TDS), salary computation & digital payslips',
    category: 'Operations',
    icon: <FileSpreadsheet className="w-5 h-5 text-rose-400" />,
  },
  {
    key: 'tickets',
    name: 'Ticket Management',
    description: 'IT & HR internal helpdesk, employee issue resolution & category SLAs',
    category: 'Operations',
    icon: <LifeBuoy className="w-5 h-5 text-sky-400" />,
  },
  {
    key: 'onboarding',
    name: 'Onboarding',
    description: 'Candidate self-service verification, pre-joining documentation, conversion to master',
    category: 'Core HR',
    icon: <UserPlus className="w-5 h-5 text-violet-400" />,
  },
  {
    key: 'inventory',
    name: 'Inventory',
    description: 'Hardware asset inventory, IT device allocation, serial number logs & returns',
    category: 'Operations',
    icon: <Package className="w-5 h-5 text-orange-400" />,
  },
  {
    key: 'geolocation',
    name: 'Geolocation',
    description: 'Geo-fenced attendance radius validation & GPS-tagged punch coordinates',
    category: 'Workforce',
    icon: <MapPin className="w-5 h-5 text-cyan-400" />,
  },
  {
    key: 'tasks',
    name: 'Task Management',
    description: 'Task assignments, deliverables, subtasks, sequential department project workflows',
    category: 'Productivity',
    icon: <CheckSquare className="w-5 h-5 text-purple-400" />,
  },
  {
    key: 'insights',
    name: 'MMP Insights',
    description: 'AI-assisted productivity trends, overtime velocity & workforce anomaly detection',
    category: 'Productivity',
    icon: <Sparkles className="w-5 h-5 text-pink-400" />,
  },
  {
    key: 'settings',
    name: 'Settings & Admin',
    description: 'Organization master details, office branches, working policies & holiday calendars',
    category: 'Administration',
    icon: <Settings className="w-5 h-5 text-slate-400" />,
  },
];

export const PlanManagement: React.FC = () => {
  const { currentUser, loginAsClient } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>(() => TenantService.getAll());
  
  // Choose default tenant: Prefer Silaris (NP-000006) or first tenant
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    const silaris = tenants.find(t => t.tenantId === 'NP-000006' || t.slug === 'silaris');
    return silaris ? silaris.tenantId : (tenants[0]?.tenantId || 'NP-000001');
  });

  const selectedTenant = tenants.find(t => t.tenantId === selectedTenantId) || tenants[0];

  const [selectedModules, setSelectedModules] = useState<string[]>(() => {
    return selectedTenant?.enabledModules || ALL_HRMS_MODULES.map(m => m.key);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Sync selected modules when active tenant changes
  useEffect(() => {
    if (selectedTenant) {
      setSelectedModules(selectedTenant.enabledModules || []);
      setIsSaved(false);
    }
  }, [selectedTenantId]);

  const refreshTenants = () => {
    const all = TenantService.getAll();
    setTenants(all);
  };

  const handleToggleModule = (moduleKey: string) => {
    setIsSaved(false);
    setSelectedModules(prev => {
      if (prev.includes(moduleKey)) {
        return prev.filter(k => k !== moduleKey);
      } else {
        return [...prev, moduleKey];
      }
    });
  };

  const handleSelectAll = () => {
    setIsSaved(false);
    setSelectedModules(ALL_HRMS_MODULES.map(m => m.key));
  };

  const handleClearAll = () => {
    setIsSaved(false);
    setSelectedModules(['dashboard']); // Keep dashboard as minimal core
  };

  const handleReset = () => {
    setIsSaved(false);
    if (selectedTenant) {
      setSelectedModules(selectedTenant.enabledModules || []);
    }
  };

  const handleSaveChanges = () => {
    if (!selectedTenant) return;

    const res = TenantService.updateEnabledModules(
      selectedTenant.tenantId,
      selectedModules,
      currentUser?.fullName || 'Super Admin'
    );

    if (res.success) {
      refreshTenants();
      setIsSaved(true);
      setSaveMessage('Module access updated successfully.');
      setTimeout(() => {
        setIsSaved(false);
      }, 4000);
    }
  };

  const filteredModules = ALL_HRMS_MODULES.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.key.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' || m.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'Core HR', 'Workforce', 'Operations', 'Productivity', 'Administration'];

  const isModuleActive = (key: string) => selectedModules.includes(key);

  const hasUnsavedChanges = selectedTenant
    ? JSON.stringify(selectedModules.slice().sort()) !==
      JSON.stringify((selectedTenant.enabledModules || []).slice().sort())
    : false;

  return (
    <div className="space-y-6 text-slate-100 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Client Module Access"
        subtitle="Manage and configure active HRMS module entitlements per customer organization"
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-purple-300 bg-purple-950/80 px-3.5 py-1.5 rounded-xl border border-purple-800 shadow-sm">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Super Admin Entitlement Authority</span>
            </div>

            <Button
              variant="primary"
              onClick={handleSaveChanges}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        }
      />

      {/* Success Notification Alert */}
      {isSaved && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-700/80 text-emerald-200 flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-900/80 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">{saveMessage}</div>
              <div className="text-xs text-emerald-300">
                {selectedTenant?.companyName} ({selectedTenant?.tenantId}) active module list updated to {selectedModules.length} modules.
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSaved(false)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-emerald-900/60"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Organization Selector & Client Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Organization Selector Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <h3 className="font-extrabold text-sm text-white">Select Client / Organisation</h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                {tenants.length} Tenants
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Choose Organisation:</label>
              <select
                value={selectedTenantId}
                onChange={e => setSelectedTenantId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.tenantId}>
                    {t.companyName} ({t.tenantId}) — {t.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Tenant Switcher Pills */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                Quick Select:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tenants.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTenantId(t.tenantId)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      selectedTenantId === t.tenantId
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {t.slug || t.tenantId}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Client Overview Card */}
          {selectedTenant && (
            <div className="bg-slate-900/90 border border-purple-800/60 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-base text-white">{selectedTenant.companyName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-purple-300 font-bold">
                      {selectedTenant.tenantId}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        selectedTenant.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : selectedTenant.status === 'TRIAL'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {selectedTenant.status}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loginAsClient(selectedTenant.tenantId, 'Client Module Access Panel')}
                  className="bg-purple-950/60 hover:bg-purple-900 border-purple-700 text-purple-300 text-xs px-2.5 py-1.5"
                  title="Open Client Portal View"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Subdomain URL Info */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Dedicated Subdomain</div>
                <div className="text-xs font-mono text-emerald-400 truncate">
                  https://{selectedTenant.slug || 'tenant'}.makemypayroll.com
                </div>
              </div>

              {/* Module Entitlement Progress */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Active Entitlements:</span>
                  <span className="font-mono font-bold text-white">
                    {selectedModules.length} / {ALL_HRMS_MODULES.length} Modules
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round((selectedModules.length / ALL_HRMS_MODULES.length) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Unsaved Changes Banner */}
              {hasUnsavedChanges && (
                <div className="p-2.5 bg-amber-950/60 border border-amber-800 rounded-xl text-amber-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>You have unsaved module changes for this client.</span>
                </div>
              )}
            </div>
          )}

          {/* Live Simulated Client Sidebar Preview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-extrabold text-slate-300">Live Sidebar Preview</span>
              <span className="text-[10px] text-purple-400 font-mono">
                {selectedModules.length} visible items
              </span>
            </div>

            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 space-y-1 max-h-72 overflow-y-auto">
              {ALL_HRMS_MODULES.filter(m => isModuleActive(m.key)).map(m => (
                <div
                  key={m.key}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 text-xs text-slate-200"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="shrink-0">{m.icon}</span>
                    <span className="font-semibold truncate">{m.name}</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                </div>
              ))}
              {selectedModules.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-500">
                  No modules enabled.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Module Checklist & Management */}
        <div className="lg:col-span-8 space-y-6">
          {/* Control Bar: Search & Actions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter modules (e.g. Task, Payroll, Attendance)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Quick Preset Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAll}
                  className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearAll}
                  className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  title="Reset to currently saved configuration"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveChanges}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Module Access</span>
                </Button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    categoryFilter === cat
                      ? 'bg-purple-950 text-purple-200 border border-purple-700 shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Module Checklist Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredModules.map(module => {
              const active = isModuleActive(module.key);
              return (
                <div
                  key={module.key}
                  onClick={() => handleToggleModule(module.key)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    active
                      ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 border-purple-600/80 shadow-lg shadow-purple-950/20'
                      : 'bg-slate-900/60 border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          active
                            ? 'bg-purple-950/80 border-purple-700/80 text-purple-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        {module.icon}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-white">{module.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                            {module.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {module.description}
                        </p>
                      </div>
                    </div>

                    {/* Checkbox / Switch Indicator */}
                    <div className="pt-0.5 shrink-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          active
                            ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-900'
                            : 'bg-slate-950 border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">module: &quot;{module.key}&quot;</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        active ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Disabled</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredModules.length === 0 && (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="font-bold text-sm text-slate-400">No modules match your query</div>
              <p className="text-xs text-slate-500">Try changing your search terms or category filter.</p>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Configuring module access for{' '}
              <span className="font-bold text-white">{selectedTenant?.companyName}</span> ({selectedTenant?.tenantId})
            </div>

            <Button
              variant="primary"
              onClick={handleSaveChanges}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Module Access</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
