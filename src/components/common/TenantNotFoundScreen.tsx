import React from 'react';
import { Building2, ArrowLeft, Mail, ShieldAlert } from 'lucide-react';
import { PLATFORM_DOMAIN, ROOT_DOMAIN } from '../../config/appConfig';
import { Button } from './Button';

interface TenantNotFoundScreenProps {
  subdomain?: string | null;
  identifier?: string | null;
}

export const TenantNotFoundScreen: React.FC<TenantNotFoundScreenProps> = ({
  subdomain,
  identifier,
}) => {
  const targetName = subdomain || identifier || 'workspace';

  const handleGoPlatform = () => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';
      
      // If in local dev e.g. foo.localhost:5173
      if (window.location.hostname.endsWith('.localhost')) {
        window.location.href = `${protocol}//localhost${port}`;
      } else {
        window.location.href = `${protocol}//${PLATFORM_DOMAIN}${port}`;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative z-10 backdrop-blur-xl">
        {/* NovaPulse Branding */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="NovaPulse HRMS" className="h-10 w-auto object-contain" />
        </div>

        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Building2 className="w-8 h-8 text-amber-400" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold mb-4">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          404 • ORGANIZATION NOT FOUND
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
          Organization Not Found
        </h1>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The requested organization workspace <span className="font-mono text-amber-300 font-bold">"{targetName}"</span> does not exist or may have been decommissioned.
          <br /><br />
          Please check your organization URL or contact your administrator.
        </p>

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={handleGoPlatform}
          >
            Go to Platform Portal
          </Button>

          <a
            href="mailto:support@novapulse.co.in"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800 transition-colors"
          >
            <Mail className="w-4 h-4 text-purple-400" />
            Contact Platform Support
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/60 text-[11px] text-slate-600 font-mono">
          NovaPulse HRMS Multi-Tenant SaaS
        </div>
      </div>
    </div>
  );
};

