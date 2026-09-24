import React, { useState } from 'react';
import { Activity, ShieldCheck, Download, Search, Filter } from 'lucide-react';
import { AuditService } from '../../services/auditService';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { exportToExcel } from '../../utils/exportUtils';

export const AuditLogViewer: React.FC = () => {
  const auditLogs = AuditService.getAll();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const filtered = auditLogs.filter(a => {
    if (moduleFilter !== 'ALL' && a.module !== moduleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.description.toLowerCase().includes(q) ||
        a.userName.toLowerCase().includes(q) ||
        a.module.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const rows = filtered.map(a => ({
      Timestamp: a.timestamp,
      User: a.userName,
      Role: a.userRole,
      Module: a.module,
      Action: a.action,
      Description: a.description,
      RecordId: a.recordId || 'N/A',
      IPAddress: a.ipAddress || '127.0.0.1',
    }));
    exportToExcel('NovaPulse_Global_SaaS_Audit_Log.xlsx', 'Audit Log', rows);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <PageHeader
        title="Audit Logs"
        actions={
          <Button
            variant="outline"
            onClick={handleExport}
            className="bg-slate-800 text-slate-200 border-slate-700"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Audit Trail
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit descriptions, users, actions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-purple-500"
          >
            <option value="ALL">All Modules</option>
            <option value="Client Provisioning">Client Provisioning</option>
            <option value="Licence Management">Licence Management</option>
            <option value="Account Lifecycle">Account Lifecycle</option>
            <option value="Employee Management">Employee Management</option>
            <option value="Payroll Management">Payroll Management</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {filtered.length} Recorded Events
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor & Role</th>
                <th className="px-5 py-3.5">Module</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Event Description</th>
                <th className="px-5 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-white">{a.userName}</div>
                    <div className="text-[10px] text-purple-400 font-semibold">{a.userRole}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-300">{a.module}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                        a.action === 'CREATE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : a.action === 'UPDATE'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : a.action === 'DELETE'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-purple-950 text-purple-300 border border-purple-800'
                      }`}
                    >
                      {a.action}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-200">{a.description}</td>
                  <td className="px-5 py-4 font-mono text-[11px] text-slate-500">
                    {a.ipAddress || '192.168.1.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
