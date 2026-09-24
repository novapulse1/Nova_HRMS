import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './layouts/AppLayout';

// Super Admin Layout & Modules
import { SuperAdminLayout } from './admin/layouts/SuperAdminLayout';
import { SuperAdminDashboard } from './admin/dashboard/SuperAdminDashboard';
import { ClientManagement } from './admin/clients/ClientManagement';
import { SubscriptionManagement } from './admin/subscriptions/SubscriptionManagement';
import { LicenceManagement } from './admin/licences/LicenceManagement';
import { PaymentManagement } from './admin/payments/PaymentManagement';
import { AuditLogViewer } from './admin/audit/AuditLogViewer';
import { AdminUserManagement } from './admin/users/AdminUserManagement';
import { SaaSSettings } from './admin/settings/SaaSSettings';

// 11 Core Client HRMS Modules
import { DashboardModule } from './modules/dashboard/DashboardModule';
import { ShiftModule } from './modules/shift-management/ShiftModule';
import { AttendanceModule } from './modules/attendance/AttendanceModule';
import { LeaveModule } from './modules/leave-management/LeaveModule';
import { EmployeeModule } from './modules/employee-management/EmployeeModule';
import { TicketModule } from './modules/ticket-management/TicketModule';
import { OnboardingModule } from './modules/onboarding/OnboardingModule';
import { InventoryModule } from './modules/inventory-management/InventoryModule';
import { GeoLocationModule } from './modules/geo-location/GeoLocationModule';
import { PayrollModule } from './modules/payroll/PayrollModule';
import { SettingsModule } from './modules/settings/SettingsModule';
import { SetupWizardModal } from './components/common/SetupWizardModal';

export const AppContent: React.FC = () => {
  const { appEnvironment, activeTenant } = useAuth();

  // Super Admin Navigation state
  const [activeAdminSection, setActiveAdminSection] = useState('dashboard');
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);

  // Client HRMS Navigation state
  const [activeClientModule, setActiveClientModule] = useState('dashboard');
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  // -------------------------------------------------------------
  // 1. SUPER ADMIN CONTROL ROOM ENVIRONMENT
  // -------------------------------------------------------------
  if (appEnvironment === 'super_admin') {
    const renderAdminContent = () => {
      switch (activeAdminSection) {
        case 'dashboard':
          return <SuperAdminDashboard onNavigate={setActiveAdminSection} />;
        case 'clients':
          return (
            <ClientManagement
              isCreateModalOpenExternal={isCreateClientOpen}
              onCloseCreateModalExternal={() => setIsCreateClientOpen(false)}
            />
          );
        case 'subscriptions':
          return <SubscriptionManagement />;
        case 'licences':
          return <LicenceManagement />;
        case 'payments':
          return <PaymentManagement />;
        case 'support':
          return <TicketModule />;
        case 'audit':
          return <AuditLogViewer />;
        case 'users':
          return <AdminUserManagement />;
        case 'settings':
          return <SaaSSettings />;
        default:
          return <SuperAdminDashboard onNavigate={setActiveAdminSection} />;
      }
    };

    return (
      <SuperAdminLayout
        activeSection={activeAdminSection}
        setActiveSection={setActiveAdminSection}
        onOpenCreateClient={() => {
          setActiveAdminSection('clients');
          setIsCreateClientOpen(true);
        }}
      >
        {renderAdminContent()}
      </SuperAdminLayout>
    );
  }

  // -------------------------------------------------------------
  // 2. CLIENT HRMS ENVIRONMENT
  // -------------------------------------------------------------
  const renderClientModule = () => {
    switch (activeClientModule) {
      case 'dashboard':
        return <DashboardModule onNavigate={setActiveClientModule} />;
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
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardModule onNavigate={setActiveClientModule} />;
    }
  };

  return (
    <AppLayout activeModule={activeClientModule} setActiveModule={setActiveClientModule}>
      {renderClientModule()}

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

export default function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
