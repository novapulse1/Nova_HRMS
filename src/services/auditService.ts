// Audit Service — Immutable Activity Logging
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { AuditLog } from '../database/schema';

export class AuditService {
  public static getLogs(): AuditLog[] {
    return StorageEngine.getList<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
  }

  public static log(
    action: AuditLog['action'],
    module: string,
    description: string,
    user: { id: string; name: string; role: string },
    options?: { recordId?: string; previousValue?: any; newValue?: any }
  ): AuditLog {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      organizationId: 'org-novapulse-01',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      module,
      action,
      description,
      recordId: options?.recordId,
      previousValue: options?.previousValue ? JSON.stringify(options.previousValue) : undefined,
      newValue: options?.newValue ? JSON.stringify(options.newValue) : undefined,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
    };

    return StorageEngine.insert<AuditLog>(STORAGE_KEYS.AUDIT_LOGS, newLog);
  }
}
