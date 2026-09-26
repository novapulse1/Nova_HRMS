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
import { AccessDeniedScreen } from './components/common/AccessDeniedScreen';
import { TenantNotFoundScreen } from './components/common/TenantNotFoundScreen';
import { AccountOnHoldScreen } from './components/common/AccountOnHoldScreen';
import { SecurityGateLoading } from './components/common/SecurityGateLoading';
import { LoginScreen } from './components/auth/LoginScreen';
import { TenantService } from './services/tenantService';
import { TenantResolver } from './services/tenantResolver';
import { TenantHostService } from './services/tenantHostService';

export const AppContent: React.FC = () => {
  const {
    appEnvironment,
    activeTenant,
    currentUser,
    setActiveTenantId,
    setAppEnvironment,
    isSuperAdmin,
    isAuthenticated,
    isLoading
  } = useAuth();

  // Super Admin Navigation state
  const [activeAdminSection, setActiveAdminSection] = useState('dashboard');
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);

  // Client HRMS Navigation state
  const [activeClientModule, setActiveClientModule] = useState('dashboard');
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  // Centralized Multi-Tenant Hostname & Path Resolution
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const resolvedTenantContext = TenantHostService.resolve(currentHostname, currentPathname);

  // 1. Unknown Subdomain or Invalid /t/ path
  if (resolvedTenantContext.error === 'TENANT_NOT_FOUND' || resolvedTenantContext.status === 'NOT_FOUND') {
    return (
      <TenantNotFoundScreen
        subdomain={resolvedTenantContext.subdomain}
        identifier={resolvedTenantContext.pathTenantId || undefined}
      />
    );
  }

  // 2. Security Gate Loading state
  if (isLoading) {
    return <SecurityGateLoading />;
  }

  // 3. Unauthenticated User Gate (Renders context-specific Login)
  if (!isAuthenticated) {
    return <LoginScreen tenantContext={resolvedTenantContext} />;
  }

  // 4. Tenant Context Resolution & Boundary Enforcement
  const targetTenant = resolvedTenantContext.tenant;

  if (targetTenant) {
    // Block operational access if tenant account is on hold, suspended, or cancelled
    if (targetTenant.status === 'ON_HOLD' || targetTenant.status === 'SUSPENDED' || targetTenant.status === 'CANCELLED') {
      return <AccountOnHoldScreen />;
    }

    const userOrgId = currentUser.organizationId;
    const isOwnerOfTenant =
      userOrgId &&
      (userOrgId === targetTenant.tenantId ||
       userOrgId === targetTenant.id ||
       (targetTenant.slug && userOrgId.toLowerCase() === targetTenant.slug.toLowerCase()) ||
       (targetTenant.subdomain && userOrgId.toLowerCase() === targetTenant.subdomain.toLowerCase()));

    // Cross-tenant boundary check: If logged in user belongs to Tenant A and attempts to access Tenant B
    if (!isSuperAdmin && userOrgId && !isOwnerOfTenant) {
      return (
        <AccessDeniedScreen
          attemptedTenantId={targetTenant.companyName || targetTenant.tenantId}
          userTenantId={userOrgId}
          onGoHome={() => {
            if (currentUser.organizationId) {
              setActiveTenantId(currentUser.organizationId);
              setAppEnvironment('client');
            }
          }}
        />
      );
    }
  }

  React.useEffect(() => {
    if (targetTenant) {
      const userOrgId = currentUser.organizationId;
      const isAuthorized =
        isSuperAdmin ||
        (userOrgId &&
          (userOrgId === targetTenant.tenantId ||
           userOrgId === targetTenant.id ||
           (targetTenant.slug && userOrgId.toLowerCase() === targetTenant.slug.toLowerCase())));

      if (isAuthorized && activeTenant.tenantId !== targetTenant.tenantId) {
        setActiveTenantId(targetTenant.tenantId);
        setAppEnvironment('client');
      }
    }
  }, [targetTenant?.tenantId, isSuperAdmin, currentUser.organizationId]);


  // -------------------------------------------------------------
  // 1. SUPER ADMIN CONTROL ROOM ENVIRONMENT (Strict Role Enforcement)
  // -------------------------------------------------------------
  if (appEnvironment === 'super_admin' && isSuperAdmin) {
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
