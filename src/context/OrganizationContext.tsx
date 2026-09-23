// Organization & Branch Multi-Tenant Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization, Branch, Department, Designation } from '../database/schema';
import { SettingsService } from '../services/settingsService';
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';

interface OrganizationContextType {
  organization: Organization;
  branches: Branch[];
  departments: Department[];
  designations: Designation[];
  activeBranchId: string; // 'all' or specific branch id
  setActiveBranchId: (id: string) => void;
  refreshOrgData: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization>(() => SettingsService.getOrganization());
  const [branches, setBranches] = useState<Branch[]>(() => SettingsService.getBranches());
  const [departments, setDepartments] = useState<Department[]>(() => SettingsService.getDepartments());
  const [designations, setDesignations] = useState<Designation[]>(() => SettingsService.getDesignations());
  const [activeBranchId, setActiveBranchIdState] = useState<string>(() =>
    StorageEngine.get(STORAGE_KEYS.ACTIVE_BRANCH_ID, 'all')
  );

  const refreshOrgData = () => {
    setOrganization(SettingsService.getOrganization());
    setBranches(SettingsService.getBranches());
    setDepartments(SettingsService.getDepartments());
    setDesignations(SettingsService.getDesignations());
  };

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      refreshOrgData();
    });
    return unsub;
  }, []);

  const setActiveBranchId = (id: string) => {
    StorageEngine.set(STORAGE_KEYS.ACTIVE_BRANCH_ID, id);
    setActiveBranchIdState(id);
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        branches,
        departments,
        designations,
        activeBranchId,
        setActiveBranchId,
        refreshOrgData,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error('useOrganization must be used within an OrganizationProvider');
  return context;
};
