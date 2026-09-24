import React, { useState } from 'react';
import {
  Menu,
  Building2,
  Bell,
  Search,
  Plus,
  RotateCcw,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { StorageEngine } from '../../database/storageEngine';

interface SuperAdminTopbarProps {
  onToggleSidebar: () => void;
  activeSectionTitle: string;
  onOpenCreateClient: () => void;
}

export const SuperAdminTopbar: React.FC<SuperAdminTopbarProps> = ({
  onToggleSidebar,
  activeSectionTitle,
  onOpenCreateClient,
}) => {
  const { currentUser, setAppEnvironment, allTenants, loginAsClient } = useAuth();
  const [showTenantMenu, setShowTenantMenu] = useState(false);

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all multi-tenant databases to initial factory defaults?')) {
      StorageEngine.resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-sm px-4 sm:px-6 flex items-center justify-between gap-4 text-slate-100">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{activeSectionTitle}</span>
          </h1>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Fast Client Impersonation Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTenantMenu(!showTenantMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700/60 text-purple-200 text-xs font-bold transition-all shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Jump to Client HRMS</span>
            <ChevronDown className="w-3 h-3 text-purple-300" />
          </button>

          {showTenantMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200">
              <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Customer Tenant
                </span>
                <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded font-bold">
                  {allTenants.length} Total
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-800/50">
                {allTenants.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      loginAsClient(t.tenantId, 'Super Admin Quick Jump');
                      setShowTenantMenu(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800 transition-colors text-left group"
                  >
                    <div className="overflow-hidden pr-2">
                      <div className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                        {t.companyName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {t.tenantId} • {t.licensedEmployees} Licences
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : t.status === 'TRIAL'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : t.status === 'ON_HOLD'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Client Quick Button */}
        <Button
          size="sm"
          variant="primary"
          onClick={onOpenCreateClient}
          className="bg-gradient-to-r from-brand-600 to-purple-600 text-white font-bold text-xs"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Client
        </Button>

        {/* Factory Reset */}
        <button
          onClick={handleResetData}
          title="Reset All SaaS Demo Data to Defaults"
          className="p-2 rounded-xl text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
