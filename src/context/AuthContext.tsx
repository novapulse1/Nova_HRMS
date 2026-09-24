// ====================================================================
// NovaPulse HRMS — Authentication, Multi-Tenant SaaS & RBAC Context
// Linked to Supabase Auth & Tenant Isolation
// ====================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Employee, PermissionSet, Tenant, AdminImpersonationSession } from '../database/schema';
import { AuthService } from '../services/authService';
import { EmployeeService } from '../services/employeeService';
import { TenantService } from '../services/tenantService';
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { SupabaseAuthService, TenantUserProfile } from '../services/supabaseAuthService';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface AuthContextType {
  currentUser: User;
  currentEmployee?: Employee;
  userRole?: Role;
  availableUsers: User[];
  switchUser: (userId: string) => void;
  can: (module: string, action: keyof PermissionSet) => boolean;

  // Role Access Levels
  isSuperAdmin: boolean;
  isClientAdmin: boolean;
  isHR: boolean;
  isManager: boolean;
  isEmployee: boolean;

  // Multi-Tenant SaaS State
  appEnvironment: 'super_admin' | 'client';
  setAppEnvironment: (env: 'super_admin' | 'client') => void;
  activeTenant: Tenant;
  setActiveTenantId: (tenantId: string) => void;
  allTenants: Tenant[];
  impersonationSession: AdminImpersonationSession | null;
  loginAsClient: (tenantId: string, reason?: string) => void;
  exitAdminMode: () => void;
  isImpersonating: boolean;

  // Supabase Auth Methods
  signIn: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  isSupabaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User>(() => AuthService.getCurrentUser());
  const [availableUsers, setAvailableUsers] = useState<User[]>(() => AuthService.getUsers());
  const [appEnvironment, setAppEnvironmentState] = useState<'super_admin' | 'client'>(() =>
    StorageEngine.getAppEnvironment()
  );
  const [activeTenant, setActiveTenantState] = useState<Tenant>(() => AuthService.getActiveTenant());
  const [impersonationSession, setImpersonationSessionState] = useState<AdminImpersonationSession | null>(() =>
    StorageEngine.getImpersonationSession()
  );
  const [allTenants, setAllTenants] = useState<Tenant[]>(() => TenantService.getAll());

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setCurrentUserState(AuthService.getCurrentUser());
      setAvailableUsers(AuthService.getUsers());
      setAppEnvironmentState(StorageEngine.getAppEnvironment());
      setActiveTenantState(AuthService.getActiveTenant());
      setImpersonationSessionState(StorageEngine.getImpersonationSession());
      setAllTenants(TenantService.getAll());
    });
    return unsub;
  }, []);

  // Securely resolve active employee record for the authenticated user within the active tenant scope
  const activeTenantId = StorageEngine.getActiveTenantId();
  let currentEmployee = currentUser.employeeId ? EmployeeService.getById(currentUser.employeeId) : undefined;
  if (!currentEmployee && currentUser.email) {
    currentEmployee = EmployeeService.getAll().find(
      e => e.email?.toLowerCase() === currentUser.email?.toLowerCase() &&
           (e.organizationId === activeTenantId || (e as any).tenantId === activeTenantId || activeTenantId === 'NP-000001')
    );
  }
  // When active tenant is a specific client tenant, ensure employee belongs strictly to that tenant
  if (currentEmployee && activeTenantId && activeTenantId !== 'NP-000001') {
    if (currentEmployee.organizationId && currentEmployee.organizationId !== activeTenantId && (currentEmployee as any).tenantId !== activeTenantId) {
      currentEmployee = undefined;
    }
  }

  const roles = AuthService.getRoles();
  const userRole = roles.find(r => r.name === currentUser.roleName || r.id === currentUser.roleId);

  const switchUser = (userId: string) => {
    const u = AuthService.setCurrentUser(userId);
    setCurrentUserState(u);
    // Securely align tenant to authenticated user's organizationId
    if (u.organizationId && u.organizationId !== 'NP-000001' && u.roleName !== 'Super Admin') {
      const t = TenantService.getById(u.organizationId);
      if (t) {
        setActiveTenantState(t);
        StorageEngine.setActiveTenantId(t.tenantId);
      }
    }
  };

  const setAppEnvironment = (env: 'super_admin' | 'client') => {
    StorageEngine.setAppEnvironment(env);
    setAppEnvironmentState(env);
  };

  const setActiveTenantId = (tenantId: string) => {
    const t = AuthService.setActiveTenant(tenantId);
    setActiveTenantState(t);
  };

  const loginAsClient = (tenantId: string, reason: string = 'Super Admin Administrative Access') => {
    const { session, clientUser } = AuthService.loginAsClient(tenantId, currentUser, reason);
    setImpersonationSessionState(session);
    setCurrentUserState(clientUser);
    setAppEnvironmentState('client');
    const t = AuthService.getActiveTenant();
    setActiveTenantState(t);
  };

  const exitAdminMode = () => {
    AuthService.exitAdminMode('user-001');
    setImpersonationSessionState(null);
    setAppEnvironmentState('super_admin');
    setCurrentUserState(AuthService.getCurrentUser());
    setActiveTenantState(AuthService.getActiveTenant());
  };

  const signIn = async (email: string, password?: string) => {
    const res = await SupabaseAuthService.signIn(email, password);
    if (res.success && res.user) {
      // Find matching local user or adapt
      const u: User = {
        id: res.user.id,
        organizationId: res.user.tenantId,
        employeeId: res.user.employeeId || `emp-${res.user.id}`,
        email: res.user.email,
        fullName: res.user.fullName,
        roleId: `role-${res.user.role}`,
        roleName: res.user.role === 'super_admin' ? 'Super Admin' : res.user.role === 'client_admin' ? 'HR Admin' : res.user.role === 'manager' ? 'Manager' : 'Employee',
        avatar: res.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: 'active',
      };
      setCurrentUserState(u);
      StorageEngine.set(STORAGE_KEYS.CURRENT_USER_ID, u.id);

      if (res.tenant) {
        setActiveTenantState(res.tenant);
        StorageEngine.setActiveTenantId(res.tenant.tenantId);
      }

      if (res.user.role === 'super_admin') {
        setAppEnvironment('super_admin');
      } else {
        setAppEnvironment('client');
      }

      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const signOut = async () => {
    await SupabaseAuthService.signOut();
    StorageEngine.setActiveTenantId('NP-000001');
    StorageEngine.setAppEnvironment('super_admin');
    setCurrentUserState(availableUsers[0]);
  };

  const resetPassword = async (email: string) => {
    return SupabaseAuthService.resetPassword(email);
  };

  const can = (module: string, action: keyof PermissionSet): boolean => {
    if (currentUser.roleName === 'Super Admin') return true;
    return AuthService.hasPermission(module, action, currentUser.roleName);
  };

  const isSuperAdmin = currentUser.roleName === 'Super Admin' || appEnvironment === 'super_admin';
  const isClientAdmin = isSuperAdmin || currentUser.roleName === 'HR Admin' || currentUser.roleName === 'Payroll Admin' || currentUser.roleName === 'IT Admin';
  const isHR = isSuperAdmin || currentUser.roleName === 'HR Admin' || currentUser.roleName === 'HR Executive';
  const isManager = isSuperAdmin || isHR || currentUser.roleName === 'Manager' || currentUser.roleName === 'Team Leader';
  const isEmployee = currentUser.roleName === 'Employee';
  const isImpersonating = !!impersonationSession;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentEmployee,
        userRole,
        availableUsers,
        switchUser,
        can,
        isSuperAdmin,
        isClientAdmin,
        isHR,
        isManager,
        isEmployee,
        appEnvironment,
        setAppEnvironment,
        activeTenant,
        setActiveTenantId,
        allTenants,
        impersonationSession,
        loginAsClient,
        exitAdminMode,
        isImpersonating,
        signIn,
        signOut,
        resetPassword,
        isSupabaseActive: isSupabaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
