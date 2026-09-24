import React, { useState } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminTopbar } from './SuperAdminTopbar';

const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Executive SaaS Dashboard',
  clients: 'Clients & Tenants Master',
  subscriptions: 'Subscription Plans & Renewals',
  licences: 'Licence Allocation & Quota Enforcement',
  payments: 'Invoicing & Payment Register',
  support: 'Client Support & Escalations',
  audit: 'SaaS Audit Trail & System Activity',
  users: 'Super Admin User Management',
  settings: 'Global SaaS Policies & System Settings',
};

interface SuperAdminLayoutProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  children: React.ReactNode;
  onOpenCreateClient: () => void;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  activeSection,
  setActiveSection,
  children,
  onOpenCreateClient,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Super Admin Dark Sidebar */}
      <SuperAdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <SuperAdminTopbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeSectionTitle={SECTION_TITLES[activeSection] || 'Super Admin Control Center'}
          onOpenCreateClient={onOpenCreateClient}
        />

        <main className="flex-1 p-4 sm:p-6 pb-12 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
