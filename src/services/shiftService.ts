// Shift Management & Swap Workflow Service
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { Shift, ShiftSwapRequest, ShiftRoster } from '../database/schema';
import { EmployeeService } from './employeeService';
import { AuditService } from './auditService';

export class ShiftService {
  public static getShifts(): Shift[] {
    return StorageEngine.getList<Shift>(STORAGE_KEYS.SHIFTS);
  }

  public static getShiftById(id: string): Shift | undefined {
    return this.getShifts().find(s => s.id === id);
  }

  public static createShift(shift: Omit<Shift, 'id'>): Shift {
    const newShift: Shift = {
      ...shift,
      id: `shift-${Date.now()}`,
    };
    return StorageEngine.insert<Shift>(STORAGE_KEYS.SHIFTS, newShift);
  }

  public static updateShift(id: string, updates: Partial<Shift>): Shift | undefined {
    return StorageEngine.update<Shift>(STORAGE_KEYS.SHIFTS, id, updates);
  }

  public static deleteShift(id: string): boolean {
    return StorageEngine.remove<Shift>(STORAGE_KEYS.SHIFTS, id);
  }

  // --- Shift Swap Workflow ---

  public static getSwapRequests(): ShiftSwapRequest[] {
    return StorageEngine.getList<ShiftSwapRequest>(STORAGE_KEYS.SHIFT_SWAPS);
  }

  public static getSwapRequestById(id: string): ShiftSwapRequest | undefined {
    return this.getSwapRequests().find(r => r.id === id);
  }

  public static createSwapRequest(params: {
    requesterEmployeeId: string;
    targetEmployeeId: string;
    requesterDate: string;
    requesterShiftId: string;
    targetDate: string;
    targetShiftId: string;
    reason: string;
    managerId?: string;
  }): ShiftSwapRequest {
    const newSwap: ShiftSwapRequest = {
      id: `swap-${Date.now()}`,
      organizationId: 'org-novapulse-01',
      requesterEmployeeId: params.requesterEmployeeId,
      targetEmployeeId: params.targetEmployeeId,
      requesterDate: params.requesterDate,
      requesterShiftId: params.requesterShiftId,
      targetDate: params.targetDate,
      targetShiftId: params.targetShiftId,
      reason: params.reason,
      status: 'pending_peer',
      managerId: params.managerId,
      createdAt: new Date().toISOString(),
    };

    return StorageEngine.insert<ShiftSwapRequest>(STORAGE_KEYS.SHIFT_SWAPS, newSwap);
  }

  public static respondSwapPeer(swapId: string, accept: boolean): ShiftSwapRequest | undefined {
    const status = accept ? 'peer_accepted' : 'peer_rejected';
    return StorageEngine.update<ShiftSwapRequest>(STORAGE_KEYS.SHIFT_SWAPS, swapId, {
      status,
      peerResponseDate: new Date().toISOString(),
    });
  }

  public static approveSwapManager(
    swapId: string,
    managerEmployeeId: string,
    approve: boolean,
    comment?: string
  ): ShiftSwapRequest | undefined {
    const swap = this.getSwapRequestById(swapId);
    if (!swap) return undefined;

    const newStatus = approve ? 'approved_by_manager' : 'rejected_by_manager';
    const updated = StorageEngine.update<ShiftSwapRequest>(STORAGE_KEYS.SHIFT_SWAPS, swapId, {
      status: newStatus,
      managerId: managerEmployeeId,
      managerComment: comment,
      managerApprovedAt: new Date().toISOString(),
    });

    if (approve) {
      // Execute the shift swap on employee profiles / assignments
      const empA = EmployeeService.getById(swap.requesterEmployeeId);
      const empB = EmployeeService.getById(swap.targetEmployeeId);

      if (empA && empB) {
        // Swap their assigned shifts
        EmployeeService.update(empA.id, { assignedShiftId: swap.targetShiftId });
        EmployeeService.update(empB.id, { assignedShiftId: swap.requesterShiftId });

        AuditService.log(
          'APPROVE',
          'Shift Management',
          `Manager approved shift swap between ${empA.firstName} ${empA.lastName} and ${empB.firstName} ${empB.lastName}`,
          { id: managerEmployeeId, name: 'Reporting Manager', role: 'Manager' },
          { recordId: swapId }
        );
      }
    }

    return updated;
  }

  public static cancelSwap(swapId: string): ShiftSwapRequest | undefined {
    return StorageEngine.update<ShiftSwapRequest>(STORAGE_KEYS.SHIFT_SWAPS, swapId, {
      status: 'cancelled',
    });
  }
}
