import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './layouts/AppLayout';

// 11 Core Navigation Modules
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

export const AppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
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
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardModule onNavigate={setActiveModule} />;
    }
  };

  return (
    <AppLayout activeModule={activeModule} setActiveModule={setActiveModule}>
      {renderModule()}
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
