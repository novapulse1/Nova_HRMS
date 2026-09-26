import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

export const SecurityGateLoading: React.FC<{ message?: string }> = ({
  message = 'Securing Multi-Tenant Session & Validating Authorization...',
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center space-y-4 max-w-sm text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-brand-950 border border-brand-700/60 flex items-center justify-center text-brand-400 shadow-xl shadow-brand-950/50">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-white">
            <ShieldCheck className="w-3 h-3" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white tracking-tight">
            NovaPulse SaaS Security Gate
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            {message}
          </p>
        </div>

        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-3/4" />
        </div>
      </div>
    </div>
  );
};
