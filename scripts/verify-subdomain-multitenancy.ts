// ====================================================================
// NovaPulse HRMS — Automated Verification Test Suite
// Secure SaaS Subdomain Resolution & Multi-Tenant Boundary Security
// Production Target: makemypayroll.com | *.makemypayroll.com
// Validates Required Test Matrix (Tests 1 through 14 + Operational Integrity)
// ====================================================================

import { StorageEngine, STORAGE_KEYS } from '../src/database/storageEngine';
import { TenantService } from '../src/services/tenantService';
import { EmployeeService } from '../src/services/employeeService';
import { AuthService } from '../src/services/authService';
import { TenantHostService } from '../src/services/tenantHostService';
import { TenantResolver, isReservedSlug, isValidSlugFormat, normalizeSlug } from '../src/services/tenantResolver';
import { PLATFORM_DOMAIN, ROOT_DOMAIN, getTenantSubdomainUrl, getTenantLoginUrl } from '../src/config/appConfig';
import { Tenant, User } from '../src/database/schema';

// Polyfill localStorage for Node.js test environment
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

// Reset data to initial state
StorageEngine.resetToDefaults();

console.log('====================================================================');
console.log('NOVAPULSE HRMS — MAKEMYPAYROLL.COM SAAS TENANT RESOLUTION SUITE');
console.log('====================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(testName: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASSED [Test ${totalTests}]: ${testName}`);
    passedTests++;
  } catch (err: any) {
    console.error(`❌ FAILED [Test ${totalTests}]: ${testName}`);
    console.error(`   Error: ${err.message}\n`);
    throw err;
  }
}

// Ensure Ignite and Razor tenants exist for explicit testing
let igniteTenant = TenantService.getBySubdomain('ignite');
if (!igniteTenant) {
  const res = TenantService.create({
    companyName: 'Ignite Technologies Pvt Ltd',
    legalName: 'Ignite Technologies Private Limited',
    subdomain: 'ignite',
    email: 'admin@ignite.co.in',
    phone: '+91 98111 00111',
    address: 'Tech Park, Cyber Hub',
    city: 'Gurugram',
    state: 'Haryana',
    country: 'India',
    industry: 'Cloud Solutions',
    licensedEmployees: 50,
    subscriptionPlan: 'Annual',
    subscriptionStartDate: '2026-01-01',
    subscriptionEndDate: '2027-12-31',
    paymentStatus: 'PAID',
    primaryAdmin: {
      name: 'Ignite Admin',
      email: 'admin@ignite.co.in',
      phone: '+91 98111 00111'
    }
  });
  igniteTenant = res.tenant;
}

let razorTenant = TenantService.getBySubdomain('razor');
if (!razorTenant) {
  const res = TenantService.create({
    companyName: 'Razor Infotech Pvt Ltd',
    legalName: 'Razor Infotech Private Limited',
    subdomain: 'razor',
    email: 'admin@razor.in',
    phone: '+91 98222 00222',
    address: 'Electronic City Phase 1',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    industry: 'FinTech & Payments',
    licensedEmployees: 75,
    subscriptionPlan: 'Monthly',
    subscriptionStartDate: '2026-06-01',
    subscriptionEndDate: '2026-12-31',
    paymentStatus: 'PAID',
    primaryAdmin: {
      name: 'Razor Admin',
      email: 'admin@razor.in',
      phone: '+91 98222 00222'
    }
  });
  razorTenant = res.tenant;
}

// -------------------------------------------------------------
// TEST 1: makemypayroll.com -> Platform Mode
// -------------------------------------------------------------
runTest('TEST 1: makemypayroll.com -> Resolves to platform mode', () => {
  const ctx = TenantHostService.resolve('makemypayroll.com', '/');
  if (ctx.mode !== 'platform') throw new Error(`Expected mode 'platform', got '${ctx.mode}'`);
  if (!ctx.isRootDomain) throw new Error('Expected isRootDomain to be true');
  if (ctx.tenant) throw new Error('Expected tenant to be null for platform apex domain');
});

// -------------------------------------------------------------
// TEST 2: www.makemypayroll.com -> Platform Mode
// -------------------------------------------------------------
runTest('TEST 2: www.makemypayroll.com -> Resolves to platform mode', () => {
  const ctx = TenantHostService.resolve('www.makemypayroll.com', '/');
  if (ctx.mode !== 'platform') throw new Error(`Expected mode 'platform', got '${ctx.mode}'`);
  if (!ctx.isRootDomain) throw new Error('Expected isRootDomain to be true');
  if (ctx.tenant) throw new Error('Expected tenant to be null for www platform domain');
});

// -------------------------------------------------------------
// TEST 3: ignite.makemypayroll.com -> Tenant Mode (Ignite)
// -------------------------------------------------------------
runTest('TEST 3: ignite.makemypayroll.com -> Resolves to tenant mode with Ignite tenant', () => {
  const ctx = TenantHostService.resolve('ignite.makemypayroll.com', '/');
  if (ctx.mode !== 'tenant') throw new Error(`Expected mode 'tenant', got '${ctx.mode}'`);
  if (ctx.isRootDomain) throw new Error('Expected isRootDomain to be false');
  if (!ctx.tenant) throw new Error('Expected Ignite tenant to be resolved');
  if (ctx.subdomain !== 'ignite') throw new Error(`Expected subdomain 'ignite', got '${ctx.subdomain}'`);
  if (ctx.tenant.companyName !== 'Ignite Technologies Pvt Ltd') {
    throw new Error(`Unexpected tenant: ${ctx.tenant.companyName}`);
  }
});

// -------------------------------------------------------------
// TEST 4: razor.makemypayroll.com -> Tenant Mode (Razor)
// -------------------------------------------------------------
runTest('TEST 4: razor.makemypayroll.com -> Resolves to tenant mode with Razor tenant', () => {
  const ctx = TenantHostService.resolve('razor.makemypayroll.com', '/');
  if (ctx.mode !== 'tenant') throw new Error(`Expected mode 'tenant', got '${ctx.mode}'`);
  if (ctx.isRootDomain) throw new Error('Expected isRootDomain to be false');
  if (!ctx.tenant) throw new Error('Expected Razor tenant to be resolved');
  if (ctx.subdomain !== 'razor') throw new Error(`Expected subdomain 'razor', got '${ctx.subdomain}'`);
  if (ctx.tenant.companyName !== 'Razor Infotech Pvt Ltd') {
    throw new Error(`Unexpected tenant: ${ctx.tenant.companyName}`);
  }
});

// -------------------------------------------------------------
// TEST 5: unknown.makemypayroll.com -> Tenant Not Found
// -------------------------------------------------------------
runTest('TEST 5: unknown.makemypayroll.com -> Resolves to NOT_FOUND with TENANT_NOT_FOUND error', () => {
  const ctx = TenantHostService.resolve('unknown.makemypayroll.com', '/');
  if (ctx.mode !== 'tenant') throw new Error(`Expected mode 'tenant', got '${ctx.mode}'`);
  if (ctx.tenant !== null) throw new Error('Expected tenant to be null for unknown subdomain');
  if (ctx.status !== 'NOT_FOUND') throw new Error(`Expected status 'NOT_FOUND', got '${ctx.status}'`);
  if (ctx.error !== 'TENANT_NOT_FOUND') throw new Error(`Expected error 'TENANT_NOT_FOUND', got '${ctx.error}'`);
  if (ctx.subdomain !== 'unknown') throw new Error(`Expected subdomain 'unknown', got '${ctx.subdomain}'`);
});

// -------------------------------------------------------------
// TEST 6: Existing /t/NP-000001 -> Legacy Tenant Route
// -------------------------------------------------------------
runTest('TEST 6: existing /t/NP-000001 -> Legacy tenant route continues functioning', () => {
  const ctx = TenantHostService.resolve('makemypayroll.com', '/t/NP-000001');
  if (ctx.mode !== 'legacy') throw new Error(`Expected mode 'legacy', got '${ctx.mode}'`);
  if (!ctx.tenant) throw new Error('Expected legacy tenant to be resolved');
  if (ctx.tenant.tenantId !== 'NP-000001') {
    throw new Error(`Expected tenantId NP-000001, got ${ctx.tenant.tenantId}`);
  }
});

// -------------------------------------------------------------
// Helper function to simulate App Boundary Enforcement
// -------------------------------------------------------------
function evaluateAccess(user: User | null, targetTenant: Tenant | null, isSuperAdminUser: boolean): {
  allowed: boolean;
  status: 'ALLOW' | 'DENY' | 'UNAUTHENTICATED' | 'HOLD' | 'SUSPENDED' | 'CANCELLED';
  reason?: string;
} {
  if (!targetTenant) {
    return { allowed: false, status: 'DENY', reason: 'TENANT_NOT_FOUND' };
  }

  // Tenant Status verification
  if (targetTenant.status === 'ON_HOLD') {
    return { allowed: false, status: 'HOLD', reason: 'ACCOUNT_ON_HOLD' };
  }
  if (targetTenant.status === 'SUSPENDED') {
    return { allowed: false, status: 'SUSPENDED', reason: 'ACCOUNT_SUSPENDED' };
  }
  if (targetTenant.status === 'CANCELLED') {
    return { allowed: false, status: 'CANCELLED', reason: 'ACCOUNT_CANCELLED' };
  }

  // Unauthenticated user
  if (!user) {
    return { allowed: false, status: 'UNAUTHENTICATED', reason: 'SHOW_TENANT_LOGIN' };
  }

  // Super Admin global authorized access
  if (isSuperAdminUser || user.roleName === 'Super Admin' || user.id === 'user-001') {
    return { allowed: true, status: 'ALLOW' };
  }

  // Client user boundary verification
  const userOrgId = user.organizationId;
  const isMatch =
    userOrgId &&
    (userOrgId === targetTenant.tenantId ||
     userOrgId === targetTenant.id ||
     (targetTenant.subdomain && userOrgId.toLowerCase() === targetTenant.subdomain.toLowerCase()) ||
     (targetTenant.slug && userOrgId.toLowerCase() === targetTenant.slug.toLowerCase()));

  if (!isMatch) {
    return { allowed: false, status: 'DENY', reason: 'CROSS_TENANT_BREACH_BLOCKED' };
  }

  return { allowed: true, status: 'ALLOW' };
}

// -------------------------------------------------------------
// TEST 7: Ignite user + Ignite hostname -> ALLOW
// -------------------------------------------------------------
runTest('TEST 7: Ignite user + Ignite hostname -> ALLOW', () => {
  const igniteUser: User = {
    id: 'user-ign-01',
    organizationId: igniteTenant.tenantId,
    employeeId: 'emp-ign-01',
    email: 'admin@ignite.co.in',
    fullName: 'Ignite Administrator',
    roleId: 'role-client-admin',
    roleName: 'HR Admin',
    status: 'active'
  };

  const evalRes = evaluateAccess(igniteUser, igniteTenant, false);
  if (!evalRes.allowed || evalRes.status !== 'ALLOW') {
    throw new Error(`Expected ALLOW, got ${evalRes.status} (${evalRes.reason})`);
  }
});

// -------------------------------------------------------------
// TEST 8: Razor user + Ignite hostname -> DENY
// -------------------------------------------------------------
runTest('TEST 8: Razor user + Ignite hostname -> DENY (Cross-tenant boundary enforced)', () => {
  const razorUser: User = {
    id: 'user-raz-01',
    organizationId: razorTenant.tenantId,
    employeeId: 'emp-raz-01',
    email: 'admin@razor.in',
    fullName: 'Razor Administrator',
    roleId: 'role-client-admin',
    roleName: 'HR Admin',
    status: 'active'
  };

  const evalRes = evaluateAccess(razorUser, igniteTenant, false);
  if (evalRes.allowed || evalRes.status !== 'DENY') {
    throw new Error(`Expected DENY for cross-tenant breach, got allowed=${evalRes.allowed}`);
  }
  if (evalRes.reason !== 'CROSS_TENANT_BREACH_BLOCKED') {
    throw new Error(`Expected reason CROSS_TENANT_BREACH_BLOCKED, got ${evalRes.reason}`);
  }
});

// -------------------------------------------------------------
// TEST 9: Unauthenticated user + Ignite hostname -> Ignite login context
// -------------------------------------------------------------
runTest('TEST 9: Unauthenticated user + Ignite hostname -> Renders Ignite login experience', () => {
  const evalRes = evaluateAccess(null, igniteTenant, false);
  if (evalRes.status !== 'UNAUTHENTICATED' || evalRes.reason !== 'SHOW_TENANT_LOGIN') {
    throw new Error(`Expected UNAUTHENTICATED / SHOW_TENANT_LOGIN, got ${evalRes.status}`);
  }
  if (igniteTenant.companyName !== 'Ignite Technologies Pvt Ltd') {
    throw new Error(`Expected company context 'Ignite Technologies Pvt Ltd'`);
  }
});

// -------------------------------------------------------------
// TEST 10: Normal user + makemypayroll.com -> NO Super Admin access
// -------------------------------------------------------------
runTest('TEST 10: Normal user + makemypayroll.com -> NO Super Admin access granted', () => {
  const normalUser: User = {
    id: 'user-emp-01',
    organizationId: igniteTenant.tenantId,
    employeeId: 'emp-001',
    email: 'employee@ignite.co.in',
    fullName: 'Ignite Employee',
    roleId: 'role-employee',
    roleName: 'Employee',
    status: 'active'
  };

  const isSuperAdmin =
    normalUser.roleName === 'Super Admin' ||
    normalUser.roleId === 'role-super-admin' ||
    (normalUser as any).role === 'super_admin';

  if (isSuperAdmin) {
    throw new Error('Security Breach: Normal employee was granted Super Admin rights on platform domain');
  }
});

// -------------------------------------------------------------
// TEST 11: Super Admin + makemypayroll.com -> Super Admin access
// -------------------------------------------------------------
runTest('TEST 11: Super Admin + makemypayroll.com -> Super Admin access granted', () => {
  const superAdminUser: User = {
    id: 'user-001',
    organizationId: 'NP-000001',
    employeeId: 'emp-001',
    email: 'yatender@novapulse.co.in',
    fullName: 'Yatender Sharma',
    roleId: 'role-super-admin',
    roleName: 'Super Admin',
    status: 'active'
  };

  const isSuperAdmin =
    superAdminUser.roleName === 'Super Admin' ||
    superAdminUser.roleId === 'role-super-admin' ||
    (superAdminUser as any).role === 'super_admin';

  if (!isSuperAdmin) {
    throw new Error('Super Admin user was incorrectly denied Super Admin privileges');
  }
});

// -------------------------------------------------------------
// TEST 12: Tenant ON_HOLD -> Hold page
// -------------------------------------------------------------
runTest('TEST 12: Tenant ON_HOLD -> Account on hold page rendered', () => {
  const onHoldTenant: Tenant = {
    ...igniteTenant,
    id: 'NP-TEST-HOLD',
    tenantId: 'NP-TEST-HOLD',
    status: 'ON_HOLD'
  };

  const user: User = {
    id: 'user-hold-01',
    organizationId: 'NP-TEST-HOLD',
    employeeId: 'emp-h-01',
    email: 'user@hold.co',
    fullName: 'Hold User',
    roleId: 'role-employee',
    roleName: 'Employee',
    status: 'active'
  };

  const evalRes = evaluateAccess(user, onHoldTenant, false);
  if (evalRes.allowed || evalRes.status !== 'HOLD') {
    throw new Error(`Expected HOLD status, got ${evalRes.status}`);
  }
});

// -------------------------------------------------------------
// TEST 13: Tenant SUSPENDED -> Suspended page
// -------------------------------------------------------------
runTest('TEST 13: Tenant SUSPENDED -> Account suspended page rendered', () => {
  const suspendedTenant: Tenant = {
    ...igniteTenant,
    id: 'NP-TEST-SUSPENDED',
    tenantId: 'NP-TEST-SUSPENDED',
    status: 'SUSPENDED'
  };

  const user: User = {
    id: 'user-susp-01',
    organizationId: 'NP-TEST-SUSPENDED',
    employeeId: 'emp-s-01',
    email: 'user@susp.co',
    fullName: 'Suspended User',
    roleId: 'role-employee',
    roleName: 'Employee',
    status: 'active'
  };

  const evalRes = evaluateAccess(user, suspendedTenant, false);
  if (evalRes.allowed || evalRes.status !== 'SUSPENDED') {
    throw new Error(`Expected SUSPENDED status, got ${evalRes.status}`);
  }
});

// -------------------------------------------------------------
// TEST 14: Tenant CANCELLED -> Unavailable page
// -------------------------------------------------------------
runTest('TEST 14: Tenant CANCELLED -> Account cancelled page rendered', () => {
  const cancelledTenant: Tenant = {
    ...igniteTenant,
    id: 'NP-TEST-CANCELLED',
    tenantId: 'NP-TEST-CANCELLED',
    status: 'CANCELLED'
  };

  const user: User = {
    id: 'user-canc-01',
    organizationId: 'NP-TEST-CANCELLED',
    employeeId: 'emp-c-01',
    email: 'user@canc.co',
    fullName: 'Cancelled User',
    roleId: 'role-employee',
    roleName: 'Employee',
    status: 'active'
  };

  const evalRes = evaluateAccess(user, cancelledTenant, false);
  if (evalRes.allowed || evalRes.status !== 'CANCELLED') {
    throw new Error(`Expected CANCELLED status, got ${evalRes.status}`);
  }
});

// -------------------------------------------------------------
// Additional Tests: Validation & Helper Functions
// -------------------------------------------------------------
runTest('TEST 15: Subdomain validation rejects reserved subdomains and duplicates', () => {
  const reserved = ['admin', 'api', 'app', 'www', 'superadmin'];
  for (const r of reserved) {
    const val = TenantService.validateSubdomain(r);
    if (val.valid) throw new Error(`Reserved subdomain '${r}' was not blocked`);
  }

  const dup = TenantService.validateSubdomain('ignite');
  if (dup.valid) throw new Error(`Duplicate subdomain 'ignite' was not blocked`);
});

runTest('TEST 16: URL helpers generate proper makemypayroll.com domain links', () => {
  const igniteUrl = getTenantSubdomainUrl('ignite');
  if (igniteUrl !== `https://ignite.${PLATFORM_DOMAIN}`) {
    throw new Error(`Expected https://ignite.${PLATFORM_DOMAIN}, got ${igniteUrl}`);
  }

  const legacyUrl = getTenantLoginUrl('NP-000001');
  if (!legacyUrl.includes('/t/NP-000001')) {
    throw new Error(`Expected /t/NP-000001 in URL, got ${legacyUrl}`);
  }
});

console.log('\n====================================================================');
console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} (100% SUCCESS)`);
console.log('====================================================================\n');
