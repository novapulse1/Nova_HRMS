import React, { useState } from 'react';
import {
  Menu,
  Building2,
  Bell,
  Search,
  UserCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { useNotifications } from '../context/NotificationContext';
import { StorageEngine } from '../database/storageEngine';
import { EmployeeService } from '../services/employeeService';
import { Button } from '../components/common/Button';

interface TopbarProps {
  onToggleSidebar: () => void;
  onOpenNotifications: () => void;
  activeModuleTitle: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  onOpenNotifications,
  activeModuleTitle,
}) => {
  const { currentUser, availableUsers, switchUser, activeTenant, setAppEnvironment, isSuperAdmin } = useAuth();
  const { branches, activeBranchId, setActiveBranchId } = useOrganization();
  const { unreadCount } = useNotifications();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const licenceUsage = EmployeeService.getLicenceUsage(activeTenant.tenantId);

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all demo records to initial factory defaults?')) {
      StorageEngine.resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile menu button + Module Title + Tenant Badge */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 truncate">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
            {activeModuleTitle}
          </h1>

          {/* Tenant Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono shrink-0">
            <Building2 className="w-3.5 h-3.5 text-brand-700" />
            <span className="font-extrabold text-slate-900">{activeTenant.tenantId}</span>
          </div>

          {/* Real-time Licence Quota Badge */}
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
            licenceUsage.percentage >= 90
              ? 'bg-rose-50 border border-rose-200 text-rose-700'
              : licenceUsage.percentage >= 75
              ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}>
            <span className="font-mono">{licenceUsage.used} / {licenceUsage.total} Licences</span>
            <span className="text-[10px] font-normal">({licenceUsage.available} free)</span>
          </div>
        </div>
      </div>

      {/* Center/Right: Super Admin Switch, Branch selector, Role switcher, Search, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Switch to Super Admin Control Room */}
        <button
          onClick={() => setAppEnvironment('super_admin')}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700 text-xs font-bold transition-all shadow-xs"
          title="Open NovaPulse Super Admin Panel"
        >
          <span>Super Admin</span>
        </button>
        {/* Branch Selector */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200 rounded-xl px-3 py-1.5 transition-colors">
          <Building2 className="w-3.5 h-3.5 text-brand-700" />
          <select
            value={activeBranchId}
            onChange={e => setActiveBranchId(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Branches (Global)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Demo Persona / Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-900 text-xs font-bold transition-all shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-brand-700" />
            <span className="hidden sm:inline">Role:</span>
            <span className="text-brand-800">{currentUser.roleName}</span>
            <ChevronDown className="w-3 h-3 text-brand-600" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch User Persona
                </span>
                <p className="text-xs text-slate-600">Test different authorization views</p>
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {availableUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowRoleMenu(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <img
                      src={u.avatar}
                      alt={u.fullName}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                    />
                    <div className="overflow-hidden flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{u.fullName}</div>
                      <div className="text-[10px] text-brand-700 font-semibold">{u.roleName}</div>
                    </div>
                    {currentUser.id === u.id && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Factory Reset button for testing */}
        <button
          onClick={handleResetData}
          title="Reset All Demo Data to Defaults"
          className="hidden sm:flex items-center gap-1.5 p-2 rounded-xl text-slate-500 hover:text-brand-800 hover:bg-brand-50 transition-colors text-xs font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
