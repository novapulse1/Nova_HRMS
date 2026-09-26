import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Server,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Tenant } from '../../database/schema';
import { TenantHostContext } from '../../services/tenantHostService';
import { PLATFORM_DOMAIN } from '../../config/appConfig';

interface LoginScreenProps {
  tenantContext: TenantHostContext;
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  tenantContext,
  onLoginSuccess,
}) => {
  const { signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password view state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const isPlatformMode = tenantContext.mode === 'platform';
  const tenant = tenantContext.tenant;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email or user ID.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn(email.trim(), password.trim(), tenantContext);
      if (res.success) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setErrorMessage(res.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetSuccessMessage(null);

    if (!resetEmail.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsResetting(true);

    try {
      const res = await resetPassword(resetEmail.trim());
      if (res.success) {
        setResetSuccessMessage(res.message || `Password reset link sent to ${resetEmail}.`);
      } else {
        setErrorMessage(res.message || 'Unable to process password reset request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error requesting password reset.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Dynamic Background Ambient Lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <img
              src="/logo.png"
              alt="MakeMyPayroll / NovaPulse"
              className="h-10 w-auto object-contain max-w-[200px]"
            />
          </div>

          {isPlatformMode ? (
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800 text-purple-300 text-xs font-bold mb-2">
                <Server className="w-3.5 h-3.5" />
                <span>Executive SaaS Platform</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Super Admin Login
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Secure authentication gate for MakeMyPayroll infrastructure administrators.
              </p>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-800 text-brand-300 text-xs font-bold mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Organization Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Welcome to {tenant?.companyName || 'NovaPulse HRMS'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Sign in to access your organization's HRMS workspace.
              </p>
            </div>
          )}
        </div>

        {/* Main Authentication Card */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 flex items-start gap-3 text-rose-200 text-xs animate-in fade-in zoom-in-95">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner (for Password Reset) */}
          {resetSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 flex items-start gap-3 text-emerald-200 text-xs animate-in fade-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{resetSuccessMessage}</div>
            </div>
          )}

          {!isForgotPassword ? (
            /* Standard Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / User ID Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Email or User ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={isPlatformMode ? 'admin@novapulse.co.in' : 'name@company.com'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Password
                  </label>
                  {!isPlatformMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setResetEmail(email);
                        setErrorMessage(null);
                        setResetSuccessMessage(null);
                      }}
                      className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isPlatformMode
                    ? 'bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 shadow-purple-950/50'
                    : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-brand-950/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>{isPlatformMode ? 'Sign In to Super Admin' : 'Sign In to Workspace'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-brand-400" />
                  Reset Your Password
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your organization email. We will send you a secure verification link to create a new password.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Secure Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMessage(null);
                  setResetSuccessMessage(null);
                }}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </form>
          )}

          {/* Platform Access Note */}
          {isPlatformMode ? (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-bold text-purple-300">Notice:</span> Only accounts with verified{' '}
              <strong className="text-slate-200">SUPER_ADMIN</strong> credentials can access this platform. Client organization users must sign in via their assigned subdomain portal.
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>RLS Multi-Tenant Isolation</span>
              </div>
              <a
                href={`https://${PLATFORM_DOMAIN}`}
                className="hover:text-brand-400 transition-colors"
              >
                Platform Home
              </a>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>
            MakeMyPayroll SaaS • Protected by 256-bit TLS Encryption & Supabase Auth Gate
          </p>
          <p>© {new Date().getFullYear()} NovaPulse Technologies Pvt. Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
