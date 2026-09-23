// Leave Management & Cross-Module Attendance Integration Service
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { LeaveType, LeaveBalance, LeaveApplication, Attendance } from '../database/schema';
import { AuditService } from './auditService';
import { EmployeeService } from './employeeService';

export class LeaveService {
  public static getLeaveTypes(): LeaveType[] {
    return StorageEngine.getList<LeaveType>(STORAGE_KEYS.LEAVE_TYPES);
  }

  public static getLeaveTypeById(id: string): LeaveType | undefined {
    return this.getLeaveTypes().find(t => t.id === id);
  }

  public static createLeaveType(type: Omit<LeaveType, 'id'>): LeaveType {
    const newType: LeaveType = {
      ...type,
      id: `lt-${Date.now()}`,
    };
    return StorageEngine.insert<LeaveType>(STORAGE_KEYS.LEAVE_TYPES, newType);
  }

  // --- Leave Balances ---

  public static getLeaveBalances(): LeaveBalance[] {
    return StorageEngine.getList<LeaveBalance>(STORAGE_KEYS.LEAVE_BALANCES);
  }

  public static getEmployeeBalances(employeeId: string, year = 2026): LeaveBalance[] {
    return this.getLeaveBalances().filter(b => b.employeeId === employeeId && b.year === year);
  }

  public static updateBalance(id: string, updates: Partial<LeaveBalance>): LeaveBalance | undefined {
    return StorageEngine.update<LeaveBalance>(STORAGE_KEYS.LEAVE_BALANCES, id, updates);
  }

  // --- Leave Applications ---

  public static getApplications(): LeaveApplication[] {
    return StorageEngine.getList<LeaveApplication>(STORAGE_KEYS.LEAVE_APPLICATIONS);
  }

  public static getApplicationById(id: string): LeaveApplication | undefined {
    return this.getApplications().find(a => a.id === id);
  }

  public static getEmployeeApplications(employeeId: string): LeaveApplication[] {
    return this.getApplications().filter(a => a.employeeId === employeeId);
  }

  public static applyLeave(params: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    isHalfDay: boolean;
    halfDaySession?: 'first_half' | 'second_half';
    reason: string;
    attachmentUrl?: string;
  }): { success: boolean; message: string; application?: LeaveApplication } {
    // 1. Check for overlapping applications
    const existing = this.getEmployeeApplications(params.employeeId);
    const overlap = existing.some(
      a => a.status !== 'rejected' && a.status !== 'cancelled' &&
      ((params.startDate >= a.startDate && params.startDate <= a.endDate) ||
       (params.endDate >= a.startDate && params.endDate <= a.endDate))
    );

    if (overlap) {
      return { success: false, message: 'You already have an active leave application for these dates.' };
    }

    // 2. Check balance
    const balances = this.getEmployeeBalances(params.employeeId);
    const balanceRecord = balances.find(b => b.leaveTypeId === params.leaveTypeId);
    const leaveType = this.getLeaveTypeById(params.leaveTypeId);

    if (leaveType && leaveType.code !== 'LOP') {
      if (!balanceRecord || balanceRecord.balance < params.totalDays) {
        return { success: false, message: `Insufficient leave balance for ${leaveType.name}. Available: ${balanceRecord?.balance || 0} days.` };
      }
    }

    const emp = EmployeeService.getById(params.employeeId);

    const newApp: LeaveApplication = {
      id: `la-${Date.now()}`,
      organizationId: 'org-novapulse-01',
      employeeId: params.employeeId,
      leaveTypeId: params.leaveTypeId,
      startDate: params.startDate,
      endDate: params.endDate,
      totalDays: params.totalDays,
      isHalfDay: params.isHalfDay,
      halfDaySession: params.halfDaySession,
      reason: params.reason,
      attachmentUrl: params.attachmentUrl,
      status: 'pending',
      approverEmployeeId: emp?.reportingManagerId,
      createdAt: new Date().toISOString(),
    };

    const inserted = StorageEngine.insert<LeaveApplication>(STORAGE_KEYS.LEAVE_APPLICATIONS, newApp);

    // Update pending balance
    if (balanceRecord) {
      this.updateBalance(balanceRecord.id, {
        pending: (balanceRecord.pending || 0) + params.totalDays,
      });
    }

    return { success: true, message: 'Leave application submitted successfully.', application: inserted };
  }

  public static approveLeave(
    applicationId: string,
    approverEmployeeId: string,
    approve: boolean,
    rejectionReason?: string
  ): LeaveApplication | undefined {
    const app = this.getApplicationById(applicationId);
    if (!app) return undefined;

    const newStatus = approve ? 'approved' : 'rejected';
    const updated = StorageEngine.update<LeaveApplication>(STORAGE_KEYS.LEAVE_APPLICATIONS, applicationId, {
      status: newStatus,
      approverEmployeeId,
      rejectionReason,
      approvedAt: approve ? new Date().toISOString() : undefined,
    });

    const balances = this.getEmployeeBalances(app.employeeId);
    const balanceRecord = balances.find(b => b.leaveTypeId === app.leaveTypeId);

    if (approve) {
      // 1. Deduct from balance
      if (balanceRecord) {
        this.updateBalance(balanceRecord.id, {
          used: balanceRecord.used + app.totalDays,
          pending: Math.max(0, (balanceRecord.pending || 0) - app.totalDays),
          balance: Math.max(0, balanceRecord.balance - app.totalDays),
        });
      }

      // 2. Cross-module: Populate Attendance records as 'Leave'
      const start = new Date(app.startDate);
      const end = new Date(app.endDate);
      const allAtt = StorageEngine.getList<Attendance>(STORAGE_KEYS.ATTENDANCE);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay(); // 0 is Sunday
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

        const existingIdx = allAtt.findIndex(a => a.employeeId === app.employeeId && a.date === dateStr);
        if (existingIdx >= 0) {
          allAtt[existingIdx] = {
            ...allAtt[existingIdx],
            status: app.isHalfDay ? 'Half-Day' : 'Leave',
            notes: `Approved Leave (${app.reason})`,
          };
        } else {
          allAtt.push({
            id: `att-leave-${Date.now()}-${dateStr}`,
            organizationId: 'org-novapulse-01',
            employeeId: app.employeeId,
            date: dateStr,
            shiftId: 'shift-gen-01',
            status: app.isHalfDay ? 'Half-Day' : 'Leave',
            workDurationMinutes: 0,
            lateMinutes: 0,
            earlyDepartureMinutes: 0,
            overtimeMinutes: 0,
            isRegularized: false,
            punchSource: 'Manual HR',
            notes: `Approved Leave (${app.reason})`,
          });
        }
      }
      StorageEngine.setList(STORAGE_KEYS.ATTENDANCE, allAtt);

      AuditService.log(
        'APPROVE',
        'Leave Management',
        `Approved ${app.totalDays} day(s) leave for employee ${app.employeeId}`,
        { id: approverEmployeeId, name: 'Approving Authority', role: 'Manager' },
        { recordId: applicationId }
      );
    } else {
      // Revert pending balance
      if (balanceRecord) {
        this.updateBalance(balanceRecord.id, {
          pending: Math.max(0, (balanceRecord.pending || 0) - app.totalDays),
        });
      }
    }

    return updated;
  }

  public static cancelLeave(applicationId: string): LeaveApplication | undefined {
    return StorageEngine.update<LeaveApplication>(STORAGE_KEYS.LEAVE_APPLICATIONS, applicationId, {
      status: 'cancelled',
    });
  }
}
