import React, { useState } from 'react';
import { KeyRound, Plus, TrendingUp, AlertTriangle, CheckCircle2, History, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TenantService } from '../../services/tenantService';
import { EmployeeService } from '../../services/employeeService';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { PageHeader } from '../../components/common/PageHeader';
import { Tenant } from '../../database/schema';

export const LicenceManagement: React.FC = () => {
  const { allTenants } = useAuth();
  const stats = TenantService.getStats();
  const licenseHistory = TenantService.getLicenseChanges();

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLimit, setNewLimit] = useState(25);
  const [reason, setReason] = useState('');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    const res = TenantService.updateLicence(
      selectedTenant.tenantId,
      Number(newLimit),
      'Super Admin',
      reason
    );
    if (res.success) {
      setIsModalOpen(false);
      setReason('');
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <PageHeader
        title="Licence Management"
        badge={
          <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 font-bold px-2.5 py-0.5 rounded-full">
            {stats.totalLicences} Total Seats
          </span>
        }
      />

      {/* Global Quota KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Pool Capacity</span>
          <div className="text-2xl font-black text-white mt-1">{stats.totalLicences} Seats</div>
        </div>
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Active Employees Enrolled</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{stats.totalUsedLicences} Active</div>
        </div>
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Available Unallocated Seats</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{stats.availableLicences} Free</div>
        </div>
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Cluster Utilization</span>
          <div className="text-2xl font-black text-purple-400 mt-1">{stats.utilizationPercent}%</div>
        </div>
      </div>

      {/* Client Capacity Breakdown Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden space-y-4 p-5">
        <h3 className="text-base font-extrabold text-white">Customer Licence Distribution</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Tenant</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Licence Quota</th>
                <th className="px-5 py-3">Enrolled Active</th>
                <th className="px-5 py-3">Remaining</th>
                <th className="px-5 py-3">Utilization</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allTenants.map(t => {
                const usage = EmployeeService.getLicenceUsage(t.tenantId);
                return (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-purple-300 font-bold">{t.tenantId}</td>
                    <td className="px-5 py-3.5 font-bold text-white">{t.companyName}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-200">{t.licensedEmployees} Seats</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-400">{usage.used}</td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400 font-bold">{usage.available}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              usage.percentage >= 90
                                ? 'bg-rose-500'
                                : usage.percentage >= 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, usage.percentage)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-300">{usage.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTenant(t);
                          setNewLimit(t.licensedEmployees);
                          setIsModalOpen(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-purple-300 border-slate-700"
                        leftIcon={<KeyRound className="w-3.5 h-3.5 text-purple-400" />}
                      >
                        Adjust
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Licence History Log */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <h3 className="text-base font-extrabold text-white">Licence Modification Audit Log</h3>
        </div>

        <div className="divide-y divide-slate-800/60">
          {licenseHistory.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">No recent licence changes recorded.</div>
          ) : (
            licenseHistory.map(l => (
              <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-white">{l.companyName} ({l.tenantId})</span>
                  <div className="text-slate-400 mt-0.5">Reason: {l.reason} • By: {l.changedBy}</div>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">{l.previousLimit} ➔ <strong className="text-purple-300">{l.newLimit} Licences</strong></span>
                  <span className="text-[10px] text-slate-500">{new Date(l.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADJUST MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Adjust Licences: ${selectedTenant?.companyName}`}
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-slate-900">
          <Input
            label="New Employee Licence Quota"
            type="number"
            min="1"
            max="10000"
            value={newLimit}
            onChange={e => setNewLimit(Number(e.target.value))}
            required
          />

          <Input
            label="Reason for Licence Modification"
            placeholder="e.g. Plan upgrade to 100 seats / company branch expansion"
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
              Confirm Quota Change
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
