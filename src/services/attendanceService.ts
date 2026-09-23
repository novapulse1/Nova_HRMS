// Attendance Management & Real-time Calculation Service
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { Attendance, AttendanceRegularization, AttendanceStatus, Shift } from '../database/schema';
import { ShiftService } from './shiftService';
import { EmployeeService } from './employeeService';

export class AttendanceService {
  public static getAll(): Attendance[] {
    return StorageEngine.getList<Attendance>(STORAGE_KEYS.ATTENDANCE);
  }

  public static getByEmployee(employeeId: string): Attendance[] {
    return this.getAll().filter(a => a.employeeId === employeeId);
  }

  public static getByDate(date: string): Attendance[] {
    return this.getAll().filter(a => a.date === date);
  }

  public static getByDateRange(startDate: string, endDate: string): Attendance[] {
    return this.getAll().filter(a => a.date >= startDate && a.date <= endDate);
  }

  public static getTodayAttendance(): Attendance[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDate(today);
  }

  public static recordPunch(params: {
    employeeId: string;
    type: 'IN' | 'OUT';
    time?: string; // "09:05:00"
    source?: Attendance['punchSource'];
    location?: Attendance['checkInLocation'];
    notes?: string;
  }): Attendance {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = params.time || new Date().toTimeString().split(' ')[0];
    const emp = EmployeeService.getById(params.employeeId);
    const shift = emp ? ShiftService.getShiftById(emp.assignedShiftId) : undefined;

    const existingRecords = this.getAll();
    const index = existingRecords.findIndex(a => a.employeeId === params.employeeId && a.date === today);

    if (params.type === 'IN') {
      let lateMinutes = 0;
      let calculatedStatus: AttendanceStatus = 'Present';

      if (shift) {
        const [shiftH, shiftM] = shift.startTime.split(':').map(Number);
        const [inH, inM] = currentTime.split(':').map(Number);
        const shiftStartMin = shiftH * 60 + shiftM;
        const inMin = inH * 60 + inM;
        const diff = inMin - shiftStartMin;

        if (diff > shift.gracePeriodMinutes) {
          lateMinutes = diff;
          calculatedStatus = 'Late Arrival';
        }
      }

      const newRecord: Attendance = {
        id: `att-${Date.now()}`,
        organizationId: 'org-novapulse-01',
        employeeId: params.employeeId,
        date: today,
        shiftId: shift ? shift.id : 'shift-gen-01',
        checkIn: currentTime,
        status: calculatedStatus,
        workDurationMinutes: 0,
        lateMinutes,
        earlyDepartureMinutes: 0,
        overtimeMinutes: 0,
        isRegularized: false,
        punchSource: params.source || 'Web Portal',
        checkInLocation: params.location,
        notes: params.notes,
      };

      if (index >= 0) {
        existingRecords[index] = { ...existingRecords[index], checkIn: currentTime, status: calculatedStatus, lateMinutes };
        StorageEngine.setList(STORAGE_KEYS.ATTENDANCE, existingRecords);
        return existingRecords[index];
      } else {
        return StorageEngine.insert<Attendance>(STORAGE_KEYS.ATTENDANCE, newRecord);
      }
    } else {
      // Punch OUT
      let record = index >= 0 ? existingRecords[index] : null;
      if (!record) {
        record = {
          id: `att-${Date.now()}`,
          organizationId: 'org-novapulse-01',
          employeeId: params.employeeId,
          date: today,
          shiftId: shift ? shift.id : 'shift-gen-01',
          checkIn: '09:00:00',
          status: 'Present',
          workDurationMinutes: 0,
          lateMinutes: 0,
          earlyDepartureMinutes: 0,
          overtimeMinutes: 0,
          isRegularized: false,
          punchSource: params.source || 'Web Portal',
        };
      }

      // Calculate work duration
      let durationMinutes = 0;
      let status = record.status;
      if (record.checkIn) {
        const [inH, inM] = record.checkIn.split(':').map(Number);
        const [outH, outM] = currentTime.split(':').map(Number);
        durationMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));

        if (shift && durationMinutes < shift.halfDayThresholdHours * 60) {
          status = 'Half-Day';
        }
      }

      const updatedRecord: Attendance = {
        ...record,
        checkOut: currentTime,
        workDurationMinutes: durationMinutes,
        status,
        checkOutLocation: params.location,
      };

      if (index >= 0) {
        existingRecords[index] = updatedRecord;
        StorageEngine.setList(STORAGE_KEYS.ATTENDANCE, existingRecords);
        return updatedRecord;
      } else {
        return StorageEngine.insert<Attendance>(STORAGE_KEYS.ATTENDANCE, updatedRecord);
      }
    }
  }

  // --- Regularization Requests ---

  public static getRegularizations(): AttendanceRegularization[] {
    return StorageEngine.getList<AttendanceRegularization>(STORAGE_KEYS.REGULARIZATIONS);
  }

  public static submitRegularization(params: {
    employeeId: string;
    date: string;
    requestedCheckIn: string;
    requestedCheckOut: string;
    requestedStatus: AttendanceStatus;
    reason: string;
  }): AttendanceRegularization {
    const newReg: AttendanceRegularization = {
      id: `reg-${Date.now()}`,
      organizationId: 'org-novapulse-01',
      employeeId: params.employeeId,
      date: params.date,
      requestedCheckIn: params.requestedCheckIn,
      requestedCheckOut: params.requestedCheckOut,
      requestedStatus: params.requestedStatus,
      reason: params.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return StorageEngine.insert<AttendanceRegularization>(STORAGE_KEYS.REGULARIZATIONS, newReg);
  }

  public static approveRegularization(
    regId: string,
    approverEmployeeId: string,
    approve: boolean,
    comment?: string
  ): AttendanceRegularization | undefined {
    const regList = this.getRegularizations();
    const reg = regList.find(r => r.id === regId);
    if (!reg) return undefined;

    const newStatus = approve ? 'approved' : 'rejected';
    const updated = StorageEngine.update<AttendanceRegularization>(STORAGE_KEYS.REGULARIZATIONS, regId, {
      status: newStatus,
      approverEmployeeId,
      approverComment: comment,
      resolvedAt: new Date().toISOString(),
    });

    if (approve) {
      // Find or create attendance record for that date
      const allAtt = this.getAll();
      const attIndex = allAtt.findIndex(a => a.employeeId === reg.employeeId && a.date === reg.date);

      const [inH, inM] = reg.requestedCheckIn.split(':').map(Number);
      const [outH, outM] = reg.requestedCheckOut.split(':').map(Number);
      const duration = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));

      if (attIndex >= 0) {
        allAtt[attIndex] = {
          ...allAtt[attIndex],
          checkIn: reg.requestedCheckIn,
          checkOut: reg.requestedCheckOut,
          status: reg.requestedStatus,
          workDurationMinutes: duration,
          lateMinutes: 0,
          isRegularized: true,
        };
        StorageEngine.setList(STORAGE_KEYS.ATTENDANCE, allAtt);
      } else {
        StorageEngine.insert<Attendance>(STORAGE_KEYS.ATTENDANCE, {
          id: `att-${Date.now()}`,
          organizationId: 'org-novapulse-01',
          employeeId: reg.employeeId,
          date: reg.date,
          shiftId: 'shift-gen-01',
          checkIn: reg.requestedCheckIn,
          checkOut: reg.requestedCheckOut,
          status: reg.requestedStatus,
          workDurationMinutes: duration,
          lateMinutes: 0,
          earlyDepartureMinutes: 0,
          overtimeMinutes: 0,
          isRegularized: true,
          punchSource: 'Manual HR',
        });
      }
    }

    return updated;
  }
}
