// ====================================================================
// NovaPulse / MakeMyPayroll — Portal Y: Client HRMS Portal
// Dedicated Multi-Tenant Customer Workspace (*.makemypayroll.com)
// ====================================================================

import React, { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { DashboardModule } from '../../modules/dashboard/DashboardModule';
import { ShiftModule } from '../../modules/shift-management/ShiftModule';
import { AttendanceModule } from '../../modules/attendance/AttendanceModule';
import { LeaveModule } from '../../modules/leave-management/LeaveModule';
import { EmployeeModule } from '../../modules/employee-management/EmployeeModule';
import { TicketModule } from '../../modules/ticket-management/TicketModule';
import { OnboardingModule } from '../../modules/onboarding/OnboardingModule';
import { InventoryModule } from '../../modules/inventory-management/InventoryModule';
import { GeoLocationModule } from '../../modules/geo-location/GeoLocationModule';
import { PayrollModule } from '../../modules/payroll/PayrollModule';
import { TaskManagementModule } from '../../modules/task-management/TaskManagementModule';
import { MMPInsightsModule } from '../../modules/mmp-insights/MMPInsightsModule';
import { SettingsModule } from '../../modules/settings/SettingsModule';
import { SetupWizardModal } from '../../components/common/SetupWizardModal';
import { useAuth } from '../../context/AuthContext';

export const ClientPortal: React.FC = () => {
  const { activeTenant, isSuperAdmin } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  // Security layer: Verify tenant module entitlement
  const isModuleEntitled = (modKey: string): boolean => {
    if (isSuperAdmin) return true;
    if (activeTenant?.enabledModules !== undefined && Array.isArray(activeTenant.enabledModules)) {
      return activeTenant.enabledModules.includes(modKey);
    }
    return true;
  };

  const renderModuleContent = () => {
    // Prevent unauthorized direct route access if module is disabled for tenant
    if (activeModule !== 'dashboard' && !isModuleEntitled(activeModule)) {
      return (
        <div className="p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 my-auto">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800 flex items-center justify-center mx-auto text-purple-400 shadow-xl">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Module Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The <strong className="text-slate-200 capitalize">{activeModule}</strong> module is currently not enabled for <strong className="text-purple-300">{activeTenant?.companyName || 'this organisation'}</strong>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveModule('dashboard')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition-all cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule onNavigate={setActiveModule} />;
      case 'shifts':
        return <ShiftModule />;
      case 'attendance':
        return <AttendanceModule />;
      case 'leaves':
        return <LeaveModule />;
      case 'employees':
        return <EmployeeModule />;
      case 'tickets':
        return <TicketModule />;
      case 'onboarding':
        return <OnboardingModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'geolocation':
        return <GeoLocationModule />;
      case 'payroll':
        return <PayrollModule />;
      case 'tasks':
        return <TaskManagementModule />;
      case 'insights':
        return <MMPInsightsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardModule onNavigate={setActiveModule} />;
    }
  };

  return (
    <AppLayout activeModule={activeModule} setActiveModule={setActiveModule}>
      {renderModuleContent()}

      {/* 10-Step Setup Wizard for New Client Tenants */}
      {activeTenant && !activeTenant.setupCompleted && isSetupWizardOpen && (
        <SetupWizardModal
          isOpen={isSetupWizardOpen}
          onClose={() => setIsSetupWizardOpen(false)}
        />
      )}
    </AppLayout>
  );
};
