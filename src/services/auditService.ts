// Audit Service — Immutable Activity Logging
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { AuditLog } from '../database/schema';

export class AuditService {
  public static getAll(): AuditLog[] {
    return StorageEngine.getList<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
  }

  public static getLogs(): AuditLog[] {
    return this.getAll();
  }

  public static log(
    actionOrData: AuditLog['action'] | Partial<AuditLog>,
    module?: string,
    description?: string,
    user?: { id: string; name: string; role: string },
    options?: { recordId?: string; previousValue?: any; newValue?: any }
  ): AuditLog {
    if (typeof actionOrData === 'object') {
      const data = actionOrData;
      const newLog: AuditLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        organizationId: data.organizationId || 'NP-000001',
        userId: data.userId || 'user-001',
        userName: data.userName || 'Super Admin',
        userRole: data.userRole || 'Super Admin',
        module: data.module || 'System',
        action: data.action || 'UPDATE',
        description: data.description || '',
        recordId: data.recordId,
        previousValue: data.previousValue,
        newValue: data.newValue,
        timestamp: data.timestamp || new Date().toISOString(),
        ipAddress: data.ipAddress || '192.168.1.100',
      };
      return StorageEngine.insert<AuditLog>(STORAGE_KEYS.AUDIT_LOGS, newLog);
    }

    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      organizationId: 'NP-000001',
      userId: user?.id || 'user-001',
      userName: user?.name || 'Super Admin',
      userRole: user?.role || 'Super Admin',
      module: module || 'System',
      action: actionOrData,
      description: description || '',
      recordId: options?.recordId,
      previousValue: options?.previousValue ? JSON.stringify(options.previousValue) : undefined,
      newValue: options?.newValue ? JSON.stringify(options.newValue) : undefined,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
    };

    return StorageEngine.insert<AuditLog>(STORAGE_KEYS.AUDIT_LOGS, newLog);
  }
}

