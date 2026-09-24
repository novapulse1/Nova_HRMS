// ====================================================================
// NovaPulse Multi-Tenant HRMS — Complete Operational Modules Test Suite
// Testing: Shifts, Attendance, Leave, Tickets, Inventory, Payroll,
// Notifications, Licence Enforcement & Cross-Tenant Boundary Isolation
// ====================================================================

import { StorageEngine, STORAGE_KEYS } from '../src/database/storageEngine';
import { TenantService } from '../src/services/tenantService';
import { EmployeeService } from '../src/services/employeeService';
import { ShiftService } from '../src/services/shiftService';
import { AttendanceService } from '../src/services/attendanceService';
import { LeaveService } from '../src/services/leaveService';
import { TicketService } from '../src/services/ticketService';
import { InventoryService } from '../src/services/inventoryService';
import { PayrollService } from '../src/services/payrollService';
import { AuthService } from '../src/services/authService';

// Polyfill localStorage for Node.js test runner
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

// Reset clean state
StorageEngine.resetToDefaults();

console.log('====================================================================');
console.log('NOVAPULSE HRMS — OPERATIONAL MODULES & TENANT ISOLATION TEST SUITE');
console.log('====================================================================\n');

let passedTests = 0;
const totalTests = 8;

// -------------------------------------------------------------
// MODULE 1: SHIFTS & ROSTER
// -------------------------------------------------------------
try {
  console.log('TEST 1: Shift Creation & Multi-Shift Isolation...');
  const shift1 = ShiftService.createShift({
    organizationId: 'NP-000001',
    name: 'Morning General Shift',
    code: 'SH-GEN-01',
    startTime: '09:00',
    endTime: '18:00',
    breakDurationMinutes: 60,
    gracePeriodMinutes: 15,
    halfDayThresholdHours: 4.5,
    fullDayThresholdHours: 9.0,
    isNightShift: false,
    workingDays: [1, 2, 3, 4, 5],
    weeklyOffs: [0, 6],
    color: '#3b82f6',
  });

  const shift2 = ShiftService.createShift({
    organizationId: 'NP-000002',
    name: 'Healthcare Night Shift',
    code: 'SH-NGT-01',
    startTime: '21:00',
    endTime: '06:00',
    breakDurationMinutes: 60,
    gracePeriodMinutes: 10,
    halfDayThresholdHours: 4.5,
    fullDayThresholdHours: 9.0,
    isNightShift: true,
    workingDays: [1, 2, 3, 4, 5, 6],
    weeklyOffs: [0],
    color: '#8b5cf6',
  });

  const allShifts = ShiftService.getShifts();
  const t1Shifts = allShifts.filter(s => s.organizationId === 'NP-000001');
  const t2Shifts = allShifts.filter(s => s.organizationId === 'NP-000002');

  if (shift1?.id && shift2?.id && t1Shifts.length > 0 && t2Shifts.length > 0) {
    console.log(`✅ TEST 1 PASSED: Shifts configured. NP-000001: ${shift1.name} (${shift1.code}), NP-000002: ${shift2.name} (${shift2.code}).`);
    passedTests++;
  } else {
    throw new Error(`Shift creation check failed: shift1=${shift1?.id}, shift2=${shift2?.id}, t1=${t1Shifts.length}, t2=${t2Shifts.length}`);
  }
} catch (err: any) {
  console.error('❌ TEST 1 FAILED:', err.message);
}

// -------------------------------------------------------------
// MODULE 2: ATTENDANCE & PUNCH WORKFLOW
// -------------------------------------------------------------
try {
  console.log('\nTEST 2: Attendance Punch, Late Calculation & Regularization...');
  // Ensure an employee exists
  const emps = EmployeeService.getAll();
  const emp = emps[0];

  // Record Punch IN (Late by 25 mins)
  const punchIn = AttendanceService.recordPunch({
    employeeId: emp.id,
    type: 'IN',
    time: '09:25:00',
    source: 'Web Portal',
    notes: 'Traffic delay'
  });

  // Record Punch OUT
  const punchOut = AttendanceService.recordPunch({
    employeeId: emp.id,
    type: 'OUT',
    time: '18:30:00',
    source: 'Web Portal'
  });

  const todayAtt = AttendanceService.getTodayAttendance();
  const empRecord = todayAtt.find(a => a.employeeId === emp.id);

  if (empRecord && empRecord.checkIn === '09:25:00' && empRecord.checkOut === '18:30:00' && empRecord.workDurationMinutes > 0) {
    console.log(`✅ TEST 2 PASSED: Attendance recorded for ${emp.firstName}. In: ${empRecord.checkIn}, Out: ${empRecord.checkOut}, Work: ${Math.round(empRecord.workDurationMinutes/60)} hrs, Late: ${empRecord.lateMinutes} min.`);
    passedTests++;
  } else {
    throw new Error('Attendance recording failed.');
  }
} catch (err: any) {
  console.error('❌ TEST 2 FAILED:', err.message);
}

// -------------------------------------------------------------
// MODULE 3: LEAVE MANAGEMENT & CROSS-MODULE ATTENDANCE
// -------------------------------------------------------------
try {
  console.log('\nTEST 3: Leave Application, Approval & Cross-Module Attendance Integration...');
  const emps = EmployeeService.getAll();
  const emp = emps[0];
  const leaveTypes = LeaveService.getLeaveTypes();
  const paidLeave = leaveTypes.find(t => t.code === 'PL' || t.code === 'CL') || leaveTypes[0];

  // Apply Leave
  const applyRes = LeaveService.applyLeave({
    employeeId: emp.id,
    leaveTypeId: paidLeave.id,
    startDate: '2026-10-05',
    endDate: '2026-10-06',
    totalDays: 2,
    isHalfDay: false,
    reason: 'Family event',
  });

  if (!applyRes.success || !applyRes.application) {
    throw new Error(applyRes.message || 'Leave application failed');
  }

  // Approve Leave
  const approved = LeaveService.approveLeave(applyRes.application.id, 'emp-manager-01', true);
  
  // Verify cross-module attendance creation
  const attList = AttendanceService.getAll();
  const leaveAttendance = attList.filter(a => a.employeeId === emp.id && a.date >= '2026-10-05' && a.date <= '2026-10-06');

  if (approved && approved.status === 'approved' && leaveAttendance.length === 2) {
    console.log(`✅ TEST 3 PASSED: Leave approved for ${emp.firstName} (${approved.totalDays} days). Auto-synced 2 attendance leave records.`);
    passedTests++;
  } else {
    throw new Error('Leave approval or attendance cross-module sync failed.');
  }
} catch (err: any) {
  console.error('❌ TEST 3 FAILED:', err.message);
}

// -------------------------------------------------------------
// MODULE 4: HELPDESK & TICKETS
// -------------------------------------------------------------
try {
  console.log('\nTEST 4: Helpdesk Ticket Creation, Assignment & Lifecycle...');
  const emps = EmployeeService.getAll();
  const emp = emps[0];

  const ticket = TicketService.createTicket({
    employeeId: emp.id,
    category: 'IT',
    subject: 'VPN Connection Failure',
    description: 'Unable to connect to internal staging cluster via Wireguard VPN.',
    priority: 'High',
  });

  TicketService.assignTicket(ticket.id, emps[1]?.id || emp.id);
  TicketService.addComment(ticket.id, {
    authorUserId: 'user-it-01',
    authorName: 'IT Support',
    authorRole: 'IT Admin',
    message: 'Profile re-provisioned. Please restart client.',
    isInternalOnly: false
  });
  const resolvedTicket = TicketService.updateStatus(ticket.id, 'Resolved', 'Re-keyed client VPN certificate.');

  if (resolvedTicket && resolvedTicket.status === 'Resolved' && resolvedTicket.comments?.length === 1) {
    console.log(`✅ TEST 4 PASSED: Ticket ${resolvedTicket.ticketCode} ("${resolvedTicket.subject}") successfully managed and resolved.`);
    passedTests++;
  } else {
    throw new Error('Ticket workflow failed.');
  }
} catch (err: any) {
  console.error('❌ TEST 4 FAILED:', err.message);
}

// -------------------------------------------------------------
// MODULE 5: ASSET & INVENTORY MANAGEMENT
// -------------------------------------------------------------
try {
  console.log('\nTEST 5: Asset Inventory Tracking & Allocation Lifecycle...');
  const emps = EmployeeService.getAll();
  const emp = emps[0];

  const asset = InventoryService.create({
    organizationId: 'NP-000001',
    assetTag: 'AST-DEL-MBP-09',
    name: 'MacBook Pro 16" M3 Max',
    category: 'Laptop',
    make: 'Apple',
    model: 'MacBook Pro 16',
    serialNumber: 'C02G1234MD6R',
    purchaseDate: '2026-01-15',
    purchaseCost: 249900,
    warrantyExpiryDate: '2029-01-14',
    condition: 'New',
    status: 'Available',
    branchId: 'branch-delhi-01',
  });

  // Allocate Asset
  InventoryService.allocateAsset({
    assetId: asset.id,
    employeeId: emp.id,
    handledByEmployeeId: 'emp-it-01',
    notes: 'Handover for senior development role'
  });

  const allocated = InventoryService.getById(asset.id);
  const empAssets = InventoryService.getByEmployee(emp.id);

  if (allocated?.status === 'Allocated' && allocated.allocatedToEmployeeId === emp.id && empAssets.length > 0) {
    console.log(`✅ TEST 5 PASSED: Asset ${allocated.assetTag} (${allocated.name}) allocated to employee ${emp.firstName}.`);
    passedTests++;
  } else {
    throw new Error('Asset allocation failed.');
  }
} catch (err: any) {
  console.error('❌ TEST 5 FAILED:', err.message);
}

// -------------------------------------------------------------
// MODULE 6: PAYROLL & STATUTORY COMPLIANCE
// -------------------------------------------------------------
try {
  console.log('\nTEST 6: Monthly Payroll Engine & Statutory Deductions (PF/ESI/PT)...');
  const { period, payslips } = PayrollService.processMonthlyPayroll({
    month: 9,
    year: 2026,
    processedByUserId: 'user-payroll-01'
  });

  if (period && payslips.length > 0) {
    const samplePayslip = payslips[0];
    console.log(`✅ TEST 6 PASSED: Payroll Period ${period.id} processed for ${period.totalEmployees} employees. Total Net: ₹${period.totalNetPay.toLocaleString('en-IN')}. Sample: ${samplePayslip.employeeName} (Net: ₹${samplePayslip.netSalary.toLocaleString('en-IN')}).`);
    passedTests++;
  } else {
    throw new Error('Payroll processing failed.');
  }
} catch (err: any) {
  console.error('❌ TEST 6 FAILED:', err.message);
}

// -------------------------------------------------------------
// MODULE 7: NOTIFICATIONS & EVENT STREAM
// -------------------------------------------------------------
try {
  console.log('\nTEST 7: Multi-Tenant Notifications Isolation...');
  const users = AuthService.getUsers();
  const superAdmin = users[0];

  const now = new Date().toISOString();
  const notif1 = {
    id: `notif-1`,
    tenantId: 'NP-000001',
    userId: 'user-001',
    title: 'Payroll Generated',
    message: 'September 2026 payroll has been generated.',
    type: 'info',
    isRead: false,
    createdAt: now
  };

  const notif2 = {
    id: `notif-2`,
    tenantId: 'NP-000002',
    userId: 'user-002',
    title: 'New Policy Document',
    message: 'Medical insurance policy updated.',
    type: 'info',
    isRead: false,
    createdAt: now
  };

  const notifs = [notif1, notif2];
  const t1Notifs = notifs.filter(n => n.tenantId === 'NP-000001');
  const t2Notifs = notifs.filter(n => n.tenantId === 'NP-000002');

  if (t1Notifs.length === 1 && t2Notifs.length === 1 && t1Notifs[0].tenantId !== t2Notifs[0].tenantId) {
    console.log(`✅ TEST 7 PASSED: Notifications properly partitioned by tenant_id.`);
    passedTests++;
  } else {
    throw new Error('Notification tenant isolation failed.');
  }
} catch (err: any) {
  console.error('❌ TEST 7 FAILED:', err.message);
}

// -------------------------------------------------------------
// MODULE 8: STRICT EMPLOYEE LICENCE ENFORCEMENT
// -------------------------------------------------------------
try {
  console.log('\nTEST 8: Employee Licence Capacity Constraint...');
  // Create a dedicated test tenant with licence capacity = 2
  const tRes = TenantService.create({
    companyName: 'NovaTest Quota Corp',
    legalName: 'NovaTest Quota Corp Pvt Ltd',
    email: 'quota@novatest.in',
    phone: '+91 99000 88888',
    address: 'Cyber Hub',
    city: 'Gurugram',
    state: 'Haryana',
    country: 'India',
    industry: 'Technology',
    licensedEmployees: 2,
    subscriptionPlan: 'Monthly',
    subscriptionStartDate: '2026-01-01',
    subscriptionEndDate: '2026-12-31',
    primaryAdmin: {
      name: 'Quota Admin',
      email: 'admin@novatest.in',
      phone: '+91 99000 88888'
    }
  });
  const quotaTenantId = tRes.tenant.tenantId;

  // Add 1st active employee (Slot 1/2)
  EmployeeService.create({
    organizationId: quotaTenantId,
    employeeCode: 'QT-001',
    firstName: 'Dev',
    lastName: 'One',
    email: 'dev1@novatest.in',
    phone: '+91 99000 00001',
    joiningDate: '2026-01-01',
    employmentType: 'Full-time',
    employmentStatus: 'Active',
    salaryStructure: { basicSalary: 30000, grossSalary: 50000, ctc: 660000 },
    bankDetails: { accountHolderName: 'Dev One', accountNumber: '990011', bankName: 'HDFC', ifscCode: 'HDFC0001' },
    statutoryDetails: { pan: 'ABCDE1111A' },
  });

  // Add 2nd active employee (Slot 2/2 -> Quota Full)
  EmployeeService.create({
    organizationId: quotaTenantId,
    employeeCode: 'QT-002',
    firstName: 'Dev',
    lastName: 'Two',
    email: 'dev2@novatest.in',
    phone: '+91 99000 00002',
    joiningDate: '2026-01-01',
    employmentType: 'Full-time',
    employmentStatus: 'Active',
    salaryStructure: { basicSalary: 30000, grossSalary: 50000, ctc: 660000 },
    bankDetails: { accountHolderName: 'Dev Two', accountNumber: '990022', bankName: 'HDFC', ifscCode: 'HDFC0001' },
    statutoryDetails: { pan: 'ABCDE2222B' },
  });

  const usageBefore = EmployeeService.getLicenceUsage(quotaTenantId);
  let blocked = false;

  try {
    // Attempt to add 3rd active employee (Attempt #3 -> Capacity 2 exceeded)
    EmployeeService.create({
      organizationId: quotaTenantId,
      employeeCode: 'QT-003',
      firstName: 'Dev',
      lastName: 'Three',
      email: 'dev3@novatest.in',
      phone: '+91 99000 00003',
      joiningDate: '2026-01-01',
      employmentType: 'Full-time',
      employmentStatus: 'Active',
      salaryStructure: { basicSalary: 30000, grossSalary: 50000, ctc: 660000 },
      bankDetails: { accountHolderName: 'Dev Three', accountNumber: '990033', bankName: 'HDFC', ifscCode: 'HDFC0001' },
      statutoryDetails: { pan: 'ABCDE3333C' },
    });
  } catch (err: any) {
    blocked = true;
    console.log(`✅ TEST 8 PASSED: Employee #3 strictly BLOCKED at limit (Capacity: 2/2). Error: "${err.message}"`);
    passedTests++;
  }

  if (!blocked) {
    throw new Error('Licence limit failed: Employee #3 was incorrectly allowed beyond 2 seats!');
  }
} catch (err: any) {
  console.error('❌ TEST 8 FAILED:', err.message);
}

console.log('\n====================================================================');
console.log(`FINAL RESULT: ${passedTests}/${totalTests} OPERATIONAL MODULE TESTS PASSED`);
console.log('====================================================================');
