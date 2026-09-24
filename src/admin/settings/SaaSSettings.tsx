import React, { useState } from 'react';
import { Sliders, Shield, Save, CheckCircle2, Lock, Server } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PageHeader } from '../../components/common/PageHeader';

export const SaaSSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    defaultTrialDays: 30,
    defaultLicencePriceMonthly: 120,
    defaultLicencePriceAnnual: 100,
    enforceStrictLicenceLimit: true,
    allowNegativeLeaveBalance: false,
    sessionTimeoutMinutes: 60,
    enablePublicRegistration: false,
    clusterRegion: 'ap-south-1 (Mumbai, India)',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 text-slate-100 max-w-4xl">
      <PageHeader title="Settings" />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Default Commercial Terms */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-extrabold text-white">Default SaaS Commercial Defaults</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-900">
            <Input
              label="Default Trial Period (Days)"
              type="number"
              value={settings.defaultTrialDays}
              onChange={e => setSettings({ ...settings, defaultTrialDays: Number(e.target.value) })}
            />
            <Input
              label="Standard Monthly Rate (₹/Seat)"
              type="number"
              value={settings.defaultLicencePriceMonthly}
              onChange={e => setSettings({ ...settings, defaultLicencePriceMonthly: Number(e.target.value) })}
            />
            <Input
              label="Discounted Annual Rate (₹/Seat)"
              type="number"
              value={settings.defaultLicencePriceAnnual}
              onChange={e => setSettings({ ...settings, defaultLicencePriceAnnual: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Section 2: Security & Tenant Isolation Enforcement */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white">Security & Strict Quota Enforcement</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enforceStrictLicenceLimit}
                onChange={e => setSettings({ ...settings, enforceStrictLicenceLimit: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <div>
                <div className="font-bold text-white">Hard Licence Enforcement at Data Layer</div>
                <div className="text-[11px] text-slate-400">
                  Strictly rejects active employee creation when a tenant reaches capacity quota.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enablePublicRegistration}
                onChange={e => setSettings({ ...settings, enablePublicRegistration: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <div>
                <div className="font-bold text-white">Controlled Tenant Creation (Invite-Only)</div>
                <div className="text-[11px] text-slate-400">
                  Only authorized Super Administrators can provision customer tenant IDs.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Cloud Infrastructure */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Server className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-extrabold text-white">Infrastructure & Encryption</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Primary Cluster Location</span>
              <span className="font-mono text-purple-300 font-bold">{settings.clusterRegion}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Encryption Standard</span>
              <span className="font-mono text-emerald-400 font-bold">AES-256 GCM (At Rest & In Transit)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              SaaS Policies Saved & Propagated Globally!
            </span>
          )}
          <div className="ml-auto">
            <Button
              type="submit"
              variant="primary"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save SaaS Settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
