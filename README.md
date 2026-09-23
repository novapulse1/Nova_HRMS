# NovaPulse HRMS — Enterprise Human Resource Management System

NovaPulse HRMS is a commercial-grade, multi-tenant, and modular Human Resource Management Platform designed for small, medium, and large enterprise organizations.

---

## 🎨 Brand Identity & Design System
- **Product Name**: NovaPulse HRMS
- **Website**: [https://www.novapulse.co.in/](https://www.novapulse.co.in/)
- **Brand Colors**:
  - Primary Royal Purple: `#6b21a8` (`brand-800`), `#3b0764` (`brand-900`), `#7e22ce` (`brand-700`)
  - Accent Purples: `#faf5ff` (`brand-50`), `#f3e8ff` (`brand-100`), `#c084fc` (`brand-400`)
  - Status Indicators: Emerald (`#10b981`), Amber (`#f59e0b`), Rose (`#f43f5e`), Sky (`#0ea5e9`)

---

## 🏗 Modular Code Architecture

The codebase strictly isolates UI, business logic, and services per module:

```
src/
├── components/                 # Reusable Shared UI Kit
│   ├── common/                 # Button, Badge, Modal, Card, Input, Select, StatCard, Table
│   └── feedback/               # Toast, Skeletons, Alerts
├── layouts/                    # App Layout & Navigation
│   ├── AppLayout.tsx           # Shell layout wrapper
│   ├── Sidebar.tsx             # 11 Module Navigation with Role-based Filtering & Badges
│   ├── Topbar.tsx              # Role switcher, Branch selector, Notifications, Reset
│   └── NotificationDrawer.tsx  # In-App Real-Time Alerts Drawer
├── modules/                    # 11 Independent HRMS Modules
│   ├── dashboard/              # MODULE 1: Executive KPI Dashboard & Punctuality Charts
│   ├── shift-management/       # MODULE 2: Shifts, Rosters & 2-Step Peer/Manager Swaps
│   ├── attendance/             # MODULE 3: Multi-Status Attendance, Regularization & Biometrics
│   ├── leave-management/       # MODULE 4: Leave Types, Quotas, Applications & Attendance Sync
│   ├── employee-management/    # MODULE 5: Master Directory, Statutory, Bank, Documents & Lifecycle
│   ├── ticket-management/      # MODULE 6: Internal Helpdesk, SLA Timers, Reassignment & Replies
│   ├── onboarding/             # MODULE 7: HR Quick Invites, Candidate Portal & 1-Click Approval
│   ├── inventory-management/   # MODULE 8: Asset Register, Custodian Handover & QR Code Tags
│   ├── geo-location/           # MODULE 9: Office Geofences, Coordinates & GPS Punch Simulator
│   ├── payroll/                # MODULE 10: Salary Engine, LOP Deductions, PF/ESI/PT & Payslips
│   └── settings/               # MODULE 11: Multi-Branch, Departments, RBAC Roles, Policies & Logs
├── services/                   # Modular API / Storage Data Services
│   ├── authService.ts
│   ├── employeeService.ts
│   ├── shiftService.ts
│   ├── attendanceService.ts
│   ├── leaveService.ts
│   ├── ticketService.ts
│   ├── onboardingService.ts
│   ├── inventoryService.ts
│   ├── geoLocationService.ts
│   ├── payrollService.ts
│   ├── settingsService.ts
│   └── auditService.ts
├── database/                   # Normalized Schema & Seed Engine
│   ├── schema.ts               # Complete TypeScript interfaces for all entities
│   ├── seedData.ts             # Realistic multi-branch seed dataset
│   └── storageEngine.ts        # Persistent transactional storage engine
├── context/                    # Centralized React Contexts (Auth, Organization, Notifications)
└── utils/                      # Export CSV/Excel, Date/Currency formatters, ClassName merger
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## ⚡ Core Features & Cross-Module Workflows

1. **Multi-Persona Testing Switcher**: Instant switcher in the Topbar between **Super Admin**, **HR Admin**, **Engineering Manager**, **Payroll Admin**, and **Employee** to experience customized views and permission boundaries.
2. **Shift Swap Workflow**: Employee initiates swap with peer → Peer accepts/declines → Reporting Manager receives notification and approves → Both employee schedules update automatically and audit history is recorded.
3. **Leave to Attendance & Payroll Synchronization**: Approved leaves automatically reflect as 'Leave' on attendance logs and are factored into monthly payroll calculations (paid vs unpaid LOP deductions).
4. **Candidate Self-Service Onboarding**: HR sends a 4-5 field digital invite → Candidate fills personal, bank, statutory, and document details via unique link → HR verifies and converts into Employee Master with 1 click without duplicate entries.
5. **Indian Statutory Payroll Engine**: Calculates monthly payroll including Basic, HRA, Conveyance, Special Allowances, PF (12%), ESI (0.75%), Professional Tax, TDS, and generates printable PDF-ready Payslips with numbers-to-words currency formatting.
6. **Biometric Push Gateway & Geofencing**: Simulated TCP/LAN hardware log ingestion and Haversine GPS perimeter checking for branch attendance.
7. **Complete Audit Trail**: Immutable system logs recording every creation, update, approval, and payroll disbursement.
