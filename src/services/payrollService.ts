// Payroll & Statutory Tax Compliance Engine (India-Ready)
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import {
  PayrollPeriod,
  Payslip,
  PayrollStatus,
  Employee,
  Branch,
  Department,
  Designation,
} from '../database/schema';
import { EmployeeService } from './employeeService';
import { AttendanceService } from './attendanceService';
import { LeaveService } from './leaveService';
import { AuditService } from './auditService';

export class PayrollService {
  public static getPeriods(): PayrollPeriod[] {
    return StorageEngine.getList<PayrollPeriod>(STORAGE_KEYS.PAYROLL_PERIODS);
  }

  public static getPeriodById(id: string): PayrollPeriod | undefined {
    return this.getPeriods().find(p => p.id === id);
  }

  public static getPayslips(periodId?: string): Payslip[] {
    const list = StorageEngine.getList<Payslip>(STORAGE_KEYS.PAYSLIPS);
    return periodId ? list.filter(p => p.payrollPeriodId === periodId) : list;
  }

  public static getEmployeePayslips(employeeId: string): Payslip[] {
    return this.getPayslips().filter(p => p.employeeId === employeeId);
  }

  public static getPayslipById(id: string): Payslip | undefined {
    return this.getPayslips().find(p => p.id === id);
  }

  /**
   * Converts number to Indian Currency Words (e.g. 1,45,200 -> "One Lakh Forty-Five Thousand Two Hundred Rupees Only")
   */
  public static numberToWordsINR(num: number): string {
    if (num <= 0) return 'Zero Rupees Only';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
    };

    return `${inWords(Math.round(num))} Rupees Only`;
  }

  /**
   * Run Monthly Payroll Calculation
   */
  public static processMonthlyPayroll(params: {
    month: number;
    year: number;
    processedByUserId: string;
  }): { period: PayrollPeriod; payslips: Payslip[] } {
    const periodId = `pay-${params.year}-${params.month.toString().padStart(2, '0')}`;
    const totalWorkingDays = 26; // Standard monthly working days

    const employees = EmployeeService.getAll().filter(e => e.employmentStatus === 'Active');
    const branches = StorageEngine.getList<Branch>(STORAGE_KEYS.BRANCHES);
    const departments = StorageEngine.getList<Department>(STORAGE_KEYS.DEPARTMENTS);
    const designations = StorageEngine.getList<Designation>(STORAGE_KEYS.DESIGNATIONS);
    const systemSettings = StorageEngine.get(STORAGE_KEYS.SYSTEM_SETTINGS, {
      payroll: { pfCeilingAmount: 15000, pfEmployeeRatePercent: 12, pfEmployerRatePercent: 12, esiWageThreshold: 21000, esiEmployeeRatePercent: 0.75, esiEmployerRatePercent: 3.25 },
    });

    const payslips: Payslip[] = [];
    let totalGrossAll = 0;
    let totalDeductionsAll = 0;
    let totalNetAll = 0;

    employees.forEach(emp => {
      const branch = branches.find(b => b.id === emp.branchId);
      const dept = departments.find(d => d.id === emp.departmentId);
      const desig = designations.find(d => d.id === emp.designationId);

      // Analyze attendance & leaves for that month
      const startMonth = `${params.year}-${params.month.toString().padStart(2, '0')}-01`;
      const endMonth = `${params.year}-${params.month.toString().padStart(2, '0')}-31`;
      const empAttendance = AttendanceService.getAll().filter(
        a => a.employeeId === emp.id && a.date >= startMonth && a.date <= endMonth
      );

      // Compute days
      let presentDays = 0;
      let halfDays = 0;
      let paidLeaveDays = 0;
      let lopDays = 0;

      empAttendance.forEach(a => {
        if (a.status === 'Present' || a.status === 'Late Arrival' || a.status === 'Work From Home' || a.status === 'On Duty') {
          presentDays += 1;
        } else if (a.status === 'Half-Day') {
          halfDays += 1;
        } else if (a.status === 'Leave') {
          paidLeaveDays += 1;
        } else if (a.status === 'Absent') {
          lopDays += 1;
        }
      });

      // Include half-days
      const effectivePresent = presentDays + halfDays * 0.5;
      const paymentDays = Math.min(totalWorkingDays, effectivePresent + paidLeaveDays + 4); // + 4 weekly offs
      const finalLopDays = Math.max(0, totalWorkingDays - paymentDays);

      const gross = emp.salaryStructure.grossSalary || 50000;
      const basic = emp.salaryStructure.basicSalary || Math.round(gross * 0.5);
      const hra = emp.salaryStructure.hra || Math.round(gross * 0.25);
      const conv = emp.salaryStructure.conveyanceAllowance || 4000;
      const special = emp.salaryStructure.specialAllowance || Math.max(0, gross - (basic + hra + conv));

      // LOP Deduction formula
      const perDaySalary = gross / totalWorkingDays;
      const lopDeduction = Math.round(finalLopDays * perDaySalary);

      // Provident Fund
      let pfEmployee = 0;
      let pfEmployer = 0;
      if (emp.statutoryDetails.pfEligible) {
        const pfWage = Math.min(basic, systemSettings.payroll.pfCeilingAmount || 15000);
        pfEmployee = Math.round((pfWage * (systemSettings.payroll.pfEmployeeRatePercent || 12)) / 100);
        pfEmployer = Math.round((pfWage * (systemSettings.payroll.pfEmployerRatePercent || 12)) / 100);
      }

      // ESI
      let esiEmployee = 0;
      let esiEmployer = 0;
      if (emp.statutoryDetails.esiEligible && gross <= (systemSettings.payroll.esiWageThreshold || 21000)) {
        esiEmployee = Math.round((gross * (systemSettings.payroll.esiEmployeeRatePercent || 0.75)) / 100);
        esiEmployer = Math.round((gross * (systemSettings.payroll.esiEmployerRatePercent || 3.25)) / 100);
      }

      // Professional Tax (State slab)
      let professionalTax = 200; // Standard monthly
      if (branch?.state === 'Maharashtra') professionalTax = 200;
      if (branch?.state === 'Karnataka') professionalTax = 200;

      // TDS Estimate
      let tds = 0;
      if (gross > 100000) tds = Math.round(gross * 0.1);
      else if (gross > 60000) tds = Math.round(gross * 0.05);

      const totalDeductions = lopDeduction + pfEmployee + esiEmployee + professionalTax + tds;
      const netSalary = Math.max(0, gross - totalDeductions);

      totalGrossAll += gross;
      totalDeductionsAll += totalDeductions;
      totalNetAll += netSalary;

      const payslip: Payslip = {
        id: `ps-${periodId}-${emp.id}`,
        organizationId: StorageEngine.getActiveTenantId(),
        payrollPeriodId: periodId,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        departmentName: dept?.name || 'General',
        designationName: desig?.title || 'Associate',
        branchName: branch?.name || 'Main Office',
        bankAccount: emp.bankDetails.accountNumber,
        bankName: emp.bankDetails.bankName,
        ifscCode: emp.bankDetails.ifscCode,
        pan: emp.statutoryDetails.pan,
        uan: emp.statutoryDetails.uan,
        month: params.month,
        year: params.year,
        totalWorkingDays,
        paymentDays,
        presentDays: effectivePresent,
        lopDays: finalLopDays,
        paidLeaveDays,
        weeklyOffDays: 4,
        holidayDays: 1,
        overtimeHours: 0,
        earnings: {
          basicSalary: basic,
          hra: hra,
          conveyanceAllowance: conv,
          specialAllowance: special,
          medicalAllowance: emp.salaryStructure.medicalAllowance || 0,
          overtimePay: 0,
          incentives: 0,
          bonus: 0,
          otherAllowances: 0,
          totalGross: gross,
        },
        deductions: {
          pfEmployee,
          esiEmployee,
          professionalTax,
          tds,
          lopDeduction,
          loanAdvanceDeduction: 0,
          otherDeductions: 0,
          totalDeductions,
        },
        employerContributions: {
          pfEmployer,
          esiEmployer,
        },
        netSalary,
        netSalaryInWords: this.numberToWordsINR(netSalary),
        status: 'Calculated',
        generatedAt: new Date().toISOString(),
      };

      payslips.push(payslip);
    });

    const periodRecord: PayrollPeriod = {
      id: periodId,
      organizationId: StorageEngine.getActiveTenantId(),
      month: params.month,
      year: params.year,
      totalWorkingDays,
      status: 'Calculated',
      processedDate: new Date().toISOString(),
      processedByUserId: params.processedByUserId,
      totalEmployees: employees.length,
      totalGrossPay: totalGrossAll,
      totalDeductions: totalDeductionsAll,
      totalNetPay: totalNetAll,
    };

    // Upsert Period & Payslips
    StorageEngine.insert<PayrollPeriod>(STORAGE_KEYS.PAYROLL_PERIODS, periodRecord);
    
    const existingPayslips = StorageEngine.getList<Payslip>(STORAGE_KEYS.PAYSLIPS).filter(
      p => p.payrollPeriodId !== periodId
    );
    StorageEngine.setList(STORAGE_KEYS.PAYSLIPS, [...existingPayslips, ...payslips]);

    AuditService.log(
      'PROCESS',
      'Payroll Management',
      `Calculated monthly payroll for ${periodId} (${employees.length} employees, Net Pay: ₹${totalNetAll.toLocaleString('en-IN')})`,
      { id: params.processedByUserId, name: 'Payroll Admin', role: 'Payroll Admin' },
      { recordId: periodId }
    );

    return { period: periodRecord, payslips };
  }

  public static updatePeriodStatus(periodId: string, status: PayrollStatus): PayrollPeriod | undefined {
    const updated = StorageEngine.update<PayrollPeriod>(STORAGE_KEYS.PAYROLL_PERIODS, periodId, {
      status,
    });

    // Update all payslips for this period
    const allPayslips = StorageEngine.getList<Payslip>(STORAGE_KEYS.PAYSLIPS);
    allPayslips.forEach(p => {
      if (p.payrollPeriodId === periodId) {
        p.status = status;
        if (status === 'Paid') {
          p.paymentDate = new Date().toISOString().split('T')[0];
          p.paymentReference = `NEFT-${Date.now()}`;
        }
      }
    });
    StorageEngine.setList(STORAGE_KEYS.PAYSLIPS, allPayslips);

    return updated;
  }
}
