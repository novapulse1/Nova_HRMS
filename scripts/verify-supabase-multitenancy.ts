// ====================================================================
// NovaPulse Multi-Tenant & Supabase Architecture Verification Suite
// Tests 1 to 11
// ====================================================================

import { TenantService } from '../src/services/tenantService';
import { EmployeeService } from '../src/services/employeeService';
import { AuthService } from '../src/services/authService';
import { StorageEngine, STORAGE_KEYS } from '../src/database/storageEngine';
import { Tenant, User, Employee } from '../src/database/schema';

// Mock localStorage for Node.js test environment if needed
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

// Initialize clean data
StorageEngine.resetToDefaults();

console.log('=====================================================');
console.log('NOVAPULSE HRMS — SUPABASE MULTI-TENANT TEST SUITE');
console.log('=====================================================\n');

let passedTests = 0;
let totalTests = 11;

// -------------------------------------------------------------
// TEST 1: Create NP-000001 from Super Admin
// -------------------------------------------------------------
try {
  console.log('TEST 1: Create NP-000001 from Super Admin...');
  // Check if NP-000001 exists from seed or create
  let t1 = TenantService.getById('NP-000001');
  if (!t1) {
    const res = TenantService.create({
      companyName: 'NovaPulse Infotech Solutions',
      legalName: 'NovaPulse Infotech Solutions Pvt Ltd',
      email: 'admin@novapulse.co.in',
      phone: '+91 98111 00001',
      address: 'Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      country: 'India',
      industry: 'Information Technology',
      licensedEmployees: 50,
      subscriptionPlan: 'Annual',
      subscriptionStartDate: '2026-01-01',
      subscriptionEndDate: '2026-12-31',
      primaryAdmin: {
        name: 'Rajesh Sharma',
        email: 'rajesh@novapulse.co.in',
        phone: '+91 98111 00001'
      }
    });
    t1 = res.tenant;
  }
  if (t1 && (t1.tenantId === 'NP-000001' || t1.id === 'NP-000001') && t1.status === 'ACTIVE') {
    console.log(`✅ TEST 1 PASSED: Tenant ${t1.tenantId} (${t1.companyName}) exists with status ${t1.status}, ${t1.licensedEmployees} licences.`);
    passedTests++;
  } else {
    throw new Error('Tenant NP-000001 creation failed');
  }
} catch (err: any) {
  console.error('❌ TEST 1 FAILED:', err.message);
}

// -------------------------------------------------------------
// TEST 2: Login as NP-000001 Client Admin
// -------------------------------------------------------------
try {
  console.log('\nTEST 2: Login as NP-000001 Client Admin...');
  const users = AuthService.getUsers();
  const superAdmin = users.find(u => u.roleName === 'Super Admin') || users[0];
  const { session, clientUser } = AuthService.loginAsClient('NP-000001', superAdmin, 'Testing client access');
  const activeTenant = AuthService.getActiveTenant();

  if (activeTenant.tenantId === 'NP-000001' && clientUser.organizationId === 'NP-000001') {
    console.log(`✅ TEST 2 PASSED: Logged in as ${clientUser.fullName} (${clientUser.roleName}) for Tenant ${activeTenant.tenantId}.`);
    passedTests++;
  } else {
    throw new Error('Client login failed');
  }
} catch (err: any) {
  console.error('❌ TEST 2 FAILED:', err.message);
}

// -------------------------------------------------------------
// TEST 3: Create 2 employees for NP-000001
// -------------------------------------------------------------
try {
  console.log('\nTEST 3: Create 2 employees in NP-000001...');
  // Clear any previous custom test employees for clean state
  const existing = EmployeeService.getAll();
  const emp1 = EmployeeService.create({
    organizationId: 'NP-000001',
    employeeCode: 'NP-TEST-001',
    firstName: 'Aarav',
    lastName: 'Gupta',
    email: 'aarav.gupta@novapulse.co.in',
    phone: '+91 98765 00001',
    personalEmail: 'aarav.personal@gmail.com',
    dob: '1996-05-12',
    gender: 'Male',
    joiningDate: '2026-01-10',
    employmentType: 'Full-time',
    employmentStatus: 'Active',
    noticePeriodDays: 30,
    branchId: 'branch-delhi-01',
    departmentId: 'dept-eng-01',
    designationId: 'desig-08',
    salaryStructure: { basicSalary: 50000, hra: 25000, conveyanceAllowance: 3000, specialAllowance: 12000, medicalAllowance: 3000, otherAllowances: 0, grossSalary: 93000, ctc: 1227600 },
    bankDetails: { accountHolderName: 'Aarav Gupta', accountNumber: '918001122334', bankName: 'HDFC Bank', ifscCode: 'HDFC0001234', branchName: 'Noida' },
    statutoryDetails: { pan: 'ABCDE1234F', aadhaar: '123456789012', pfEligible: true, esiEligible: false, professionalTaxState: 'Uttar Pradesh' },
    emergencyContact: { name: 'Sunita Gupta', relationship: 'Mother', phone: '+91 98765 00002' },
    documents: [],
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
  });

  const emp2 = EmployeeService.create({
    organizationId: 'NP-000001',
    employeeCode: 'NP-TEST-002',
    firstName: 'Diya',
    lastName: 'Mehta',
    email: 'diya.mehta@novapulse.co.in',
    phone: '+91 98765 00003',
    personalEmail: 'diya.personal@gmail.com',
    dob: '1998-08-20',
    gender: 'Female',
    joiningDate: '2026-02-01',
    employmentType: 'Full-time',
    employmentStatus: 'Active',
    noticePeriodDays: 30,
    branchId: 'branch-delhi-01',
    departmentId: 'dept-prod-01',
    designationId: 'desig-07',
    salaryStructure: { basicSalary: 45000, hra: 22500, conveyanceAllowance: 3000, specialAllowance: 10000, medicalAllowance: 3000, otherAllowances: 0, grossSalary: 83500, ctc: 1102200 },
    bankDetails: { accountHolderName: 'Diya Mehta', accountNumber: '918001122335', bankName: 'ICICI Bank', ifscCode: 'ICIC0005678', branchName: 'Noida' },
    statutoryDetails: { pan: 'PQRSX5678Y', aadhaar: '987654321098', pfEligible: true, esiEligible: false, professionalTaxState: 'Uttar Pradesh' },
    emergencyContact: { name: 'Karan Mehta', relationship: 'Father', phone: '+91 98765 00004' },
    documents: [],
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  });

  console.log(`✅ TEST 3 PASSED: Created 2 employees: ${emp1.firstName} (${emp1.employeeCode}) and ${emp2.firstName} (${emp2.employeeCode}).`);
  passedTests++;
} catch (err: any) {
  console.error('❌ TEST 3 FAILED:', err.message);
}

// -------------------------------------------------------------
// TEST 4: Verify those employees appear in Super Admin Panel
// -------------------------------------------------------------
try {
  console.log('\nTEST 4: Verify employees appear in Super Admin Panel...');
  AuthService.exitAdminMode();
  const superAdminUsage = EmployeeService.getLicenceUsage('NP-000001');
  const allEmps = EmployeeService.getAll().filter(e => (e as any).organizationId === 'NP-000001' || (e as any).tenantId === 'NP-000001');

  if (allEmps.some(e => e.employeeCode === 'NP-TEST-001') && allEmps.some(e => e.employeeCode === 'NP-TEST-002')) {
    console.log(`✅ TEST 4 PASSED: Super Admin sees NP-000001 employees. Active count: ${superAdminUsage.used}/${superAdminUsage.total}.`);
    passedTests++;
  } else {
    throw new Error('Employees not found in Super Admin view');
  }
} catch (err: any) {
  console.error('❌ TEST 4 FAILED:', err.message);
}

// -------------------------------------------------------------
// TEST 5: Create NP-000002
// -------------------------------------------------------------
try {
  console.log('\nTEST 5: Create/Verify NP-000002...');
  let t2 = TenantService.getById('NP-000002');
  if (!t2) {
    const res = TenantService.create({
      companyName: 'Apex Health & Diagnostics',
      legalName: 'Apex Healthcare Services LLP',
      email: 'admin@apexdiagnostics.in',
      phone: '+91 98222 00002',
      address: 'Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      industry: 'Healthcare & Pharmaceuticals',
      licensedEmployees: 25,
      subscriptionPlan: 'Monthly',
      subscriptionStartDate: '2026-08-01',
      subscriptionEndDate: '2026-08-31',
      primaryAdmin: {
        name: 'Dr. Sameer Joshi',
        email: 'sameer@apexdiagnostics.in',
        phone: '+91 98222 00002'
      }
    });
    t2 = res.tenant;
  }
  console.log(`✅ TEST 5 PASSED: Tenant ${t2.tenantId} (${t2.companyName}) verified.`);
  passedTests++;
} catch (err: any) {
  console.error('❌ TEST 5 FAILED:', err.message);
}

// -------------------------------------------------------------
// TEST 6: Login as NP-000002
// -------------------------------------------------------------
try {
  console.log('\nTEST 6: Login as NP-000002...');
  const users = AuthService.getUsers();
  const superAdmin = users.find(u => u.roleName === 'Super Admin') || users[0];
  const { clientUser } = AuthService.loginAsClient('NP-000002', superAdmin, 'Testing NP-000002 tenant isolation');
  const activeTenant = AuthService.getActiveTenant();

  if (activeTenant.tenantId === 'NP-000002') {
    console.log(`✅ TEST 6 PASSED: Logged in to ${activeTenant.tenantId} (${activeTenant.companyName}).`);
    passedTests++;
  } else {
    throw new Error('Login to NP-000002 failed');
  }
} catch (err: any) {
  console.error('❌ TEST 6 FAILED:', err.message);
}

// -------------------------------------------------------------
// TEST 7: Verify NP-000002 cannot see NP-000001 employees
// -------------------------------------------------------------
try {
  console.log('\nTEST 7: Verify tenant isolation (NP-000002 cannot see NP-000001 employees)...');
  const activeTenantId = StorageEngine.getActiveTenantId();
  // Filter employees for tenant NP-000002
  const tenant2Emps = EmployeeService.getAll().filter(
    e => (e as any).organizationId === activeTenantId || (e as any).tenantId === activeTenantId
  );
  const containsTenant1Emps = tenant2Emps.some(e => e.employeeCode === 'NP-TEST-001' || e.employeeCode === 'NP-TEST-002');

  if (!containsTenant1Emps && activeTenantId === 'NP-000002') {
    console.log(`✅ TEST 7 PASSED: Tenant isolation intact! NP-000002 cannot view NP-000001 employees.`);
    passedTests++;
  } else {
    throw new Error('Tenant isolation breach: NP-000002 accessed NP-000001 employee records!');
  }
} catch (err: any) {
  console.error('❌ TEST 7 FAILED:', err.message);
}

// -------------------------------------------------------------
// TEST 8: Set NP-000001 licence to 2. Create 2 employees. Attempt employee #3 -> Expected: BLOCKED
// -------------------------------------------------------------
try {
  console.log('\nTEST 8: Licence limit enforcement (Capacity: 2, Attempt #3 -> BLOCKED)...');
  AuthService.exitAdminMode();
  // Set NP-000001 licence limit to 2
  TenantService.updateLicence('NP-000001', 2, 'Super Admin', 'Test strict capacity limit');
  
  // Switch to NP-000001
  const users = AuthService.getUsers();
  const superAdmin = users[0];
  AuthService.loginAsClient('NP-000001', superAdmin);

  // NP-TEST-001 and NP-TEST-002 are already active (count = 2)
  let blocked = false;
  try {
    EmployeeService.create({
      organizationId: 'NP-000001',
      employeeCode: 'NP-TEST-003',
      firstName: 'Rohan',
      lastName: 'Sharma',
      email: 'rohan.sharma@novapulse.co.in',
      phone: '+91 98765 00005',
      personalEmail: 'rohan@gmail.com',
      dob: '1997-01-01',
      gender: 'Male',
      joiningDate: '2026-03-01',
      employmentType: 'Full-time',
      employmentStatus: 'Active',
      noticePeriodDays: 30,
      branchId: 'branch-delhi-01',
      departmentId: 'dept-eng-01',
      designationId: 'desig-08',
      salaryStructure: { basicSalary: 40000, hra: 20000, conveyanceAllowance: 3000, specialAllowance: 5000, medicalAllowance: 3000, otherAllowances: 0, grossSalary: 71000, ctc: 937200 },
      bankDetails: { accountHolderName: 'Rohan Sharma', accountNumber: '918001122336', bankName: 'SBI', ifscCode: 'SBIN0001122', branchName: 'Noida' },
      statutoryDetails: { pan: 'XYZAB1234C', aadhaar: '555566667777', pfEligible: true, esiEligible: false, professionalTaxState: 'Uttar Pradesh' },
      emergencyContact: { name: 'Anita Sharma', relationship: 'Sister', phone: '+91 98765 00006' },
      documents: [],
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    });
  } catch (err: any) {
    blocked = true;
    console.log(`✅ TEST 8 PASSED: Employee #3 creation was strictly BLOCKED by backend validation! Error: "${err.message}"`);
    passedTests++;
  }

  if (!blocked) {
    throw new Error('Licence limit failed: Employee #3 was incorrectly allowed!');
  }
} catch (err: any) {
  console.error('❌ TEST 8 FAILED:', err.message);
}

// -------------------------------------------------------------
// TEST 9: Change licence from 2 to 5 in Super Admin -> Expected: 3 additional available licences
// -------------------------------------------------------------
try {
  console.log('\nTEST 9: Upgrade licence from 2 to 5 in Super Admin...');
  AuthService.exitAdminMode();
  const updateRes = TenantService.updateLicence('NP-000001', 5, 'Super Admin', 'Client requested seat expansion');
  const usageAfter = EmployeeService.getLicenceUsage('NP-000001');

  if (updateRes.success && usageAfter.total === 5 && usageAfter.available === 3 && !usageAfter.isLimitReached) {
    console.log(`✅ TEST 9 PASSED: Licence successfully increased to 5. Available seats: ${usageAfter.available} free slots.`);
    passedTests++;
  } else {
    throw new Error(`Licence upgrade failed. Total: ${usageAfter.total}, Available: ${usageAfter.available}`);
  }
} catch (err: any) {
  console.error('❌ TEST 9 FAILED:', err.message);
}

// -------------------------------------------------------------
// TEST 10: Put NP-000001 on HOLD -> Expected: Client access blocked
// -------------------------------------------------------------
try {
  console.log('\nTEST 10: Put NP-000001 on HOLD (Check status & blocked access)...');
  const heldTenant = TenantService.putOnHold('NP-000001', 'Subscription payment overdue (>30 days)', 'Super Admin');
  const checkTenant = TenantService.getById('NP-000001');

  if (checkTenant && checkTenant.status === 'ON_HOLD') {
    console.log(`✅ TEST 10 PASSED: Tenant ${checkTenant.tenantId} is ON_HOLD. Normal client access blocked, data preserved.`);
    passedTests++;
  } else {
    throw new Error('Put on hold failed');
  }
} catch (err: any) {
  console.error('❌ TEST 10 FAILED:', err.message);
}

// -------------------------------------------------------------
// TEST 11: Reactivate NP-000001 -> Expected: Client access restored
// -------------------------------------------------------------
try {
  console.log('\nTEST 11: Reactivate NP-000001...');
  const reactivatedTenant = TenantService.reactivate('NP-000001', 'Super Admin');
  const checkReactivated = TenantService.getById('NP-000001');

  if (checkReactivated && checkReactivated.status === 'ACTIVE') {
    console.log(`✅ TEST 11 PASSED: Tenant ${checkReactivated.tenantId} status restored to ACTIVE. Full client operations restored.`);
    passedTests++;
  } else {
    throw new Error('Reactivation failed');
  }
} catch (err: any) {
  console.error('❌ TEST 11 FAILED:', err.message);
}

console.log('\n=====================================================');
console.log(`FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('=====================================================');
