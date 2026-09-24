import React from 'react';
import {
  Building2,
  Users,
  CreditCard,
  KeyRound,
  Receipt,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { TenantService } from '../../services/tenantService';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  TRIAL: '#8b5cf6',
  ON_HOLD: '#f59e0b',
  SUSPENDED: '#ef4444',
  PAYMENT_PENDING: '#06b6d4',
  CANCELLED: '#64748b',
};

export const SuperAdminDashboard: React.FC<{ onNavigate: (section: string) => void }> = ({ onNavigate }) => {
  const { loginAsClient } = useAuth();
  const stats = TenantService.getStats();
  const tenants = TenantService.getAll();
  const subscriptions = TenantService.getSubscriptions();
  const payments = TenantService.getPayments();

  // Status breakdown data for chart
  const statusData = [
    { name: 'Active', value: stats.activeClients, color: '#10b981' },
    { name: 'Trial', value: stats.trialClients, color: '#8b5cf6' },
    { name: 'On Hold', value: stats.onHoldClients, color: '#f59e0b' },
    { name: 'Suspended', value: stats.suspendedClients, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Growth Trend (Past 6 Months)
  const growthData = [
    { month: 'Apr', clients: 2, mrr: 25000, licences: 70 },
    { month: 'May', clients: 3, mrr: 47500, licences: 120 },
    { month: 'Jun', clients: 3, mrr: 47500, licences: 120 },
    { month: 'Jul', clients: 4, mrr: 75000, licences: 175 },
    { month: 'Aug', clients: 5, mrr: 95000, licences: 225 },
    { month: 'Sep', clients: stats.totalClients, mrr: stats.mrr, licences: stats.totalLicences },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Executive SaaS Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-900/60 border border-purple-700/60 text-purple-200 text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Multi-Tenant Cluster Operational • Global Control Room
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              NovaPulse Super Admin Dashboard
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="primary"
              onClick={() => onNavigate('clients')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              leftIcon={<Building2 className="w-4 h-4" />}
            >
              Manage Tenants
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('licences')}
              className="bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200 font-bold text-xs"
              leftIcon={<KeyRound className="w-4 h-4 text-purple-400" />}
            >
              Licence Quotas
            </Button>
          </div>
        </div>
      </div>

      {/* Top 4 Primary SaaS KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Clients */}
        <div
          onClick={() => onNavigate('clients')}
          className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg hover:border-purple-500 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Total Customers
              </span>
              <div className="text-3xl font-black text-white">{stats.totalClients}</div>
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 pt-1">
                <span>{stats.activeClients} Active</span> • <span className="text-purple-400">{stats.trialClients} Trial</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400 text-xl group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Licence Utilization */}
        <div
          onClick={() => onNavigate('licences')}
          className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg hover:border-purple-500 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Licences Allocated
              </span>
              <div className="text-3xl font-black text-white">{stats.totalLicences}</div>
              <div className="text-xs text-slate-300 font-semibold flex items-center gap-1 pt-1">
                <span className="text-amber-400 font-bold">{stats.totalUsedLicences} Used</span> ({stats.utilizationPercent}%)
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400 text-xl group-hover:scale-105 transition-transform">
              <KeyRound className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div
          onClick={() => onNavigate('subscriptions')}
          className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg hover:border-purple-500 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Estimated MRR
              </span>
              <div className="text-3xl font-black text-white">₹{stats.mrr.toLocaleString()}</div>
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 pt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Across Active Plans</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 text-xl group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Overdue / On Hold Attention */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg hover:border-purple-500 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Action Required
              </span>
              <div className="text-3xl font-black text-amber-400">
                {stats.onHoldClients + stats.suspendedClients}
              </div>
              <div className="text-xs text-rose-400 font-semibold flex items-center gap-1 pt-1">
                <span>{stats.overduePayments} Overdue Invoices</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400 text-xl group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts: Growth & Tenant Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MRR & Licence Growth */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white">SaaS Growth & Capacity Scaling</h3>
            <span className="text-xs font-bold text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-800">
              6-Month Trend
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorLicence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="licences" stroke="#a855f7" fillOpacity={1} fill="url(#colorLicence)" name="Workforce Licences" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tenant Status Donut */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
          <h3 className="text-base font-extrabold text-white">Customer Account Status</h3>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-400">{d.name}:</span>
                <span className="font-bold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Quick Access & Health Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white">Managed Customer Accounts</h3>
          <Button size="sm" variant="ghost" onClick={() => onNavigate('clients')} className="text-purple-400 hover:text-purple-300">
            View All Clients <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {tenants.map(tenant => (
            <div key={tenant.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-purple-400 shrink-0 font-mono text-xs">
                  {tenant.tenantId.split('-')[1] || 'NP'}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>{tenant.companyName}</span>
                    <span className="text-xs font-mono text-purple-400 font-normal">({tenant.tenantId})</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{tenant.industry}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-300 font-bold">{tenant.licensedEmployees} Licences</span>
                    <span>•</span>
                    <span className="text-slate-400">{tenant.subscriptionPlan} Plan</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center">
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                    tenant.status === 'ACTIVE'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : tenant.status === 'TRIAL'
                      ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                      : tenant.status === 'ON_HOLD'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                      : 'bg-rose-950/80 text-rose-300 border-rose-800'
                  }`}
                >
                  {tenant.status}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loginAsClient(tenant.tenantId, 'Super Admin Dashboard Access')}
                  className="bg-slate-800 hover:bg-purple-900/60 border-slate-700 hover:border-purple-600 text-purple-300 text-xs font-bold"
                  leftIcon={<ExternalLink className="w-3.5 h-3.5 text-purple-400" />}
                >
                  Login as Client
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
