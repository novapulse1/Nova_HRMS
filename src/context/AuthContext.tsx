// Authentication and RBAC Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Employee, PermissionSet } from '../database/schema';
import { AuthService } from '../services/authService';
import { EmployeeService } from '../services/employeeService';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User>(() => AuthService.getCurrentUser());
  const [availableUsers, setAvailableUsers] = useState<User[]>(() => AuthService.getUsers());

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setCurrentUserState(AuthService.getCurrentUser());
      setAvailableUsers(AuthService.getUsers());
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

  const can = (module: string, action: keyof PermissionSet): boolean => {
    if (currentUser.roleName === 'Super Admin') return true;
    return AuthService.hasPermission(module, action, currentUser.roleName);
  };

  const isSuperAdmin = currentUser.roleName === 'Super Admin';
  const isHR = isSuperAdmin || currentUser.roleName === 'HR Admin' || currentUser.roleName === 'HR Executive';
  const isManager = isSuperAdmin || isHR || currentUser.roleName === 'Manager' || currentUser.roleName === 'Team Leader';
  const isEmployee = currentUser.roleName === 'Employee';

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
