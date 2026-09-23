// Authentication & Authorization Service
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { User, Role, PermissionSet } from '../database/schema';

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
