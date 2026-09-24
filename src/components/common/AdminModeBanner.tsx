import React from 'react';
import { ShieldAlert, LogOut, Building2, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';

export const AdminModeBanner: React.FC = () => {
  const { isImpersonating, impersonationSession, activeTenant, exitAdminMode } = useAuth();

  if (!isImpersonating || !impersonationSession) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-slate-950 px-4 py-2.5 shadow-md sticky top-0 z-50 flex items-center justify-between border-b border-amber-400">
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
        <div className="w-7 h-7 rounded-lg bg-black text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
          <ShieldAlert className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
          <span className="font-extrabold uppercase tracking-wide bg-black text-amber-400 px-2 py-0.5 rounded text-[11px]">
            ADMIN MODE
          </span>
          <span className="font-bold text-slate-950 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-900 inline" />
            Viewing: <strong className="underline font-black">{activeTenant.companyName}</strong>
          </span>
          <span className="hidden md:inline text-xs font-mono font-bold bg-amber-700/30 px-2 py-0.5 rounded text-slate-950">
            Tenant ID: {activeTenant.tenantId}
          </span>
          <span className="hidden lg:inline text-xs text-slate-900">
            (Impersonated by {impersonationSession.superAdminName})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={exitAdminMode}
          className="bg-black hover:bg-slate-900 text-white font-bold text-xs shadow-md border border-amber-300 flex items-center gap-1.5"
          leftIcon={<LogOut className="w-3.5 h-3.5 text-amber-400" />}
        >
          Exit Admin Mode
        </Button>
      </div>
    </div>
  );
};
