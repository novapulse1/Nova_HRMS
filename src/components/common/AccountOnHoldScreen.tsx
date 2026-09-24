import React from 'react';
import { AlertTriangle, Lock, Mail, Phone, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { TenantService } from '../../services/tenantService';

export const AccountOnHoldScreen: React.FC = () => {
  const { activeTenant, setAppEnvironment, isSuperAdmin, isImpersonating, exitAdminMode } = useAuth();

  const isSuspended = activeTenant.status === 'SUSPENDED';
  const isCancelled = activeTenant.status === 'CANCELLED';

  const title = isSuspended
    ? 'Account Access Suspended'
    : isCancelled
    ? 'Account Cancelled & Archived'
    : 'Account Temporarily On Hold';

  const reason =
    activeTenant.holdDetails?.reason ||
    (isSuspended
      ? 'Account suspended due to terms violation or administrative action.'
      : 'Subscription renewal payment is pending or under verification.');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-900/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-center relative z-10">
        {/* NovaPulse Logo & Icon */}
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="NovaPulse" className="h-10 w-auto object-contain" />
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mt-2 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
        </div>

        {/* Company & Status Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {activeTenant.status} • {activeTenant.tenantId}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h2>
          <p className="text-sm font-semibold text-slate-300">
            {activeTenant.companyName}
          </p>
        </div>

        {/* Reason Box */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            Official Administrative Notice
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {reason}
          </p>
          {activeTenant.holdDetails?.heldAt && (
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
              Action recorded on: {new Date(activeTenant.holdDetails.heldAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Data Preservation Guarantee */}
        <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
          <p>
            🔒 <strong className="text-slate-200">Data Safe & Intact:</strong> All employee records, attendance logs, and payroll archives remain securely preserved according to data retention policies.
          </p>
        </div>

        {/* Support Contact Info */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-400">
          <a
            href="mailto:support@novapulse.co.in"
            className="flex items-center gap-1.5 hover:text-brand-300 transition-colors"
          >
            <Mail className="w-4 h-4 text-brand-400" />
            support@novapulse.co.in
          </a>
          <a
            href="tel:+918796623604"
            className="flex items-center gap-1.5 hover:text-brand-300 transition-colors"
          >
            <Phone className="w-4 h-4 text-brand-400" />
            +91 87966 23604
          </a>
        </div>

        {/* Super Admin Control Actions */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          {isImpersonating && (
            <Button
              variant="outline"
              size="sm"
              onClick={exitAdminMode}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Exit Admin Impersonation
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setAppEnvironment('super_admin')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go to NovaPulse Super Admin
          </Button>
        </div>
      </div>
    </div>
  );
};
