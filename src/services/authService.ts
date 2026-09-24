// Authentication & Authorization Service
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { User, Role, PermissionSet, Tenant, AdminImpersonationSession } from '../database/schema';

export class AuthService {
  public static getUsers(): User[] {
    return StorageEngine.getList<User>(STORAGE_KEYS.USERS);
  }

  public static getRoles(): Role[] {
    return StorageEngine.getList<Role>(STORAGE_KEYS.ROLES);
  }

  public static getCurrentUserId(): string {
    return StorageEngine.get<string>(STORAGE_KEYS.CURRENT_USER_ID, 'user-001');
  }

  public static getCurrentUser(): User {
    const userId = this.getCurrentUserId();
    const users = this.getUsers();
    return users.find(u => u.id === userId) || users[0];
  }

  public static setCurrentUser(userId: string): User {
    StorageEngine.set(STORAGE_KEYS.CURRENT_USER_ID, userId);
    return this.getCurrentUser();
  }

  public static getActiveTenant(): Tenant {
    const activeTenantId = StorageEngine.getActiveTenantId();
    const tenants = StorageEngine.getList<Tenant>(STORAGE_KEYS.TENANTS);
    return tenants.find(t => t.id === activeTenantId || t.tenantId === activeTenantId) || tenants[0];
  }

  public static setActiveTenant(tenantId: string): Tenant {
    StorageEngine.setActiveTenantId(tenantId);
    return this.getActiveTenant();
  }

  public static loginAsClient(
    tenantId: string,
    superAdminUser: User,
    reason: string = 'Super Admin Administrative Access'
  ): { session: AdminImpersonationSession; clientUser: User } {
    const tenants = StorageEngine.getList<Tenant>(STORAGE_KEYS.TENANTS);
    const tenant = tenants.find(t => t.id === tenantId || t.tenantId === tenantId) || tenants[0];

    const users = this.getUsers();
    // Find client admin user or create a session persona
    let clientUser = users.find(u => u.organizationId === tenant.tenantId || u.organizationId === tenant.id);
    if (!clientUser) {
      clientUser = {
        id: `user-adm-${tenant.tenantId.toLowerCase()}`,
        organizationId: tenant.tenantId,
        employeeId: `emp-adm-${tenant.tenantId.toLowerCase()}`,
        email: tenant.primaryAdmin?.email || `admin@${tenant.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        fullName: tenant.primaryAdmin?.name || `${tenant.companyName} Admin`,
        roleId: 'role-hr-admin',
        roleName: 'HR Admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: 'active'
      };
      StorageEngine.insert<User>(STORAGE_KEYS.USERS, clientUser);
    }

    const session: AdminImpersonationSession = {
      id: `imp-${Date.now()}`,
      superAdminId: superAdminUser.id,
      superAdminName: superAdminUser.fullName,
      tenantId: tenant.tenantId,
      companyName: tenant.companyName,
      startedAt: new Date().toISOString(),
      reason
    };

    StorageEngine.setImpersonationSession(session);
    StorageEngine.setActiveTenantId(tenant.tenantId);
    StorageEngine.set(STORAGE_KEYS.CURRENT_USER_ID, clientUser.id);
    StorageEngine.setAppEnvironment('client');

    return { session, clientUser };
  }

  public static exitAdminMode(superAdminUserId: string = 'user-001'): void {
    const session = StorageEngine.getImpersonationSession();
    if (session) {
      StorageEngine.setImpersonationSession(null);
    }
    StorageEngine.setActiveTenantId('NP-000001');
    StorageEngine.set(STORAGE_KEYS.CURRENT_USER_ID, superAdminUserId);
    StorageEngine.setAppEnvironment('super_admin');
  }

  public static getUserPermissions(roleIdOrName: string): Record<string, PermissionSet> {
    const roles = this.getRoles();
    const role = roles.find(r => r.id === roleIdOrName || r.name === roleIdOrName);
    return role ? role.permissions : {};
  }

  public static hasPermission(
    module: string,
    action: keyof PermissionSet,
    userRole: string
  ): boolean {
    const permissions = this.getUserPermissions(userRole);
    const modulePerms = permissions[module];
    if (!modulePerms) return false;
    return !!modulePerms[action];
  }
}
