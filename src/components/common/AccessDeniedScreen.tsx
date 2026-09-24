import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';

interface AccessDeniedScreenProps {
  attemptedTenantId: string;
  userTenantId?: string;
  onGoHome?: () => void;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  attemptedTenantId,
  userTenantId,
  onGoHome,
}) => {
  const { signOut, currentUser, activeTenant } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-red-950/50">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-xl font-bold text-slate-100 mb-2">
          Tenant Boundary Access Denied
        </h1>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          You are currently signed in as <span className="font-semibold text-slate-200">{currentUser.fullName}</span> ({currentUser.email}) with authorization restricted to company tenant <span className="font-mono text-purple-400 font-bold">{userTenantId || activeTenant.tenantId}</span>.
          <br /><br />
          Cross-company access to tenant <span className="font-mono text-red-400 font-bold">{attemptedTenantId}</span> has been blocked by NovaPulse Multi-Tenant Security Engine.
        </p>

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => {
              window.history.pushState({}, '', `/t/${userTenantId || activeTenant.tenantId}`);
              if (onGoHome) onGoHome();
              else window.location.reload();
            }}
          >
            Return to My Company Workspace
          </Button>

          <Button
            variant="outline"
            className="w-full border-slate-700 hover:bg-slate-800 text-slate-300"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={() => {
              signOut().then(() => {
                window.location.href = `/t/${attemptedTenantId}`;
              });
            }}
          >
            Sign In with Different Account
          </Button>
        </div>
      </div>
    </div>
  );
};
