// Authentication, Multi-Tenant SaaS, and RBAC Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Employee, PermissionSet, Tenant, AdminImpersonationSession } from '../database/schema';
import { AuthService } from '../services/authService';
import { EmployeeService } from '../services/employeeService';
import { TenantService } from '../services/tenantService';
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';

interface AuthContextType {
  currentUser: User;
  currentEmployee?: Employee;
  userRole?: Role;
  availableUsers: User[];
  switchUser: (userId: string) => void;
  can: (module: string, action: keyof PermissionSet) => boolean;
  isSuperAdmin: boolean;
  isHR: boolean;
  isManager: boolean;
  isEmployee: boolean;

  // Multi-Tenant SaaS context
  appEnvironment: 'super_admin' | 'client';
  setAppEnvironment: (env: 'super_admin' | 'client') => void;
  activeTenant: Tenant;
  setActiveTenantId: (tenantId: string) => void;
  allTenants: Tenant[];
  impersonationSession: AdminImpersonationSession | null;
  loginAsClient: (tenantId: string, reason?: string) => void;
  exitAdminMode: () => void;
  isImpersonating: boolean;
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

  const currentEmployee = EmployeeService.getById(currentUser.employeeId);
  const roles = AuthService.getRoles();
  const userRole = roles.find(r => r.name === currentUser.roleName || r.id === currentUser.roleId);

  const switchUser = (userId: string) => {
    const u = AuthService.setCurrentUser(userId);
    setCurrentUserState(u);
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

  const can = (module: string, action: keyof PermissionSet): boolean => {
    if (currentUser.roleName === 'Super Admin') return true;
    return AuthService.hasPermission(module, action, currentUser.roleName);
  };

  const isSuperAdmin = currentUser.roleName === 'Super Admin' || appEnvironment === 'super_admin';
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
