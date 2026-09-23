// MODULE 10: Payroll Management & Statutory Tax Compliance
import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Play,
  CheckCircle,
  Download,
  Eye,
  Printer,
  ShieldCheck,
  CreditCard,
  Building,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { PayrollService } from '../../services/payrollService';
import { EmployeeService } from '../../services/employeeService';
import { Payslip, PayrollPeriod, PayrollStatus } from '../../database/schema';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { exportToExcel } from '../../utils/exportUtils';
import { formatDate, formatCurrencyINR } from '../../utils/dateUtils';
import { StorageEngine } from '../../database/storageEngine';

export const PayrollModule: React.FC = () => {
  const { currentUser, currentEmployee, isSuperAdmin, isHR, isEmployee } = useAuth();
  const { organization } = useOrganization();
  const [dataVersion, setDataVersion] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState(9); // September
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const periodId = `pay-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  let payslips = PayrollService.getPayslips(periodId);
  const currentPeriod = PayrollService.getPeriodById(periodId);

  // If employee, show only their own payslips
  if (isEmployee && currentEmployee) {
    payslips = payslips.filter(p => p.employeeId === currentEmployee.id);
  }

  const handleRunPayroll = () => {
    PayrollService.processMonthlyPayroll({
      month: selectedMonth,
      year: selectedYear,
      processedByUserId: currentUser.id,
    });
    setDataVersion(v => v + 1);
    alert(`Successfully processed payroll for ${selectedMonth}/${selectedYear}!`);
  };

  const handleUpdatePeriodStatus = (status: PayrollStatus) => {
    PayrollService.updatePeriodStatus(periodId, status);
    setDataVersion(v => v + 1);
    alert(`Payroll status updated to ${status}!`);
  };

  const handleExportPayroll = () => {
    const rows = payslips.map(p => ({
      'Employee Code': p.employeeCode,
      'Employee Name': p.employeeName,
      'Department': p.departmentName,
      'Designation': p.designationName,
      'Total Working Days': p.totalWorkingDays,
      'Present Days': p.presentDays,
      'LOP Days': p.lopDays,
      'Basic Salary': p.earnings.basicSalary,
      'HRA': p.earnings.hra,
      'Special Allowance': p.earnings.specialAllowance,
      'Gross Salary': p.earnings.totalGross,
      'PF (Employee)': p.deductions.pfEmployee,
      'ESI (Employee)': p.deductions.esiEmployee,
      'Professional Tax': p.deductions.professionalTax,
      'TDS / Tax': p.deductions.tds,
      'LOP Deduction': p.deductions.lopDeduction,
      'Total Deductions': p.deductions.totalDeductions,
      'Net Payable': p.netSalary,
      'Status': p.status,
    }));
    exportToExcel(`NovaPulse_Payroll_Register_${periodId}.xlsx`, 'Payroll Register', rows);
  };

  const payslipColumns: Column<Payslip>[] = [
    {
      key: 'employee',
      header: 'Employee Details',
      render: (p) => (
        <div>
          <div className="font-extrabold text-sm text-slate-900">{p.employeeName}</div>
          <div className="text-xs text-slate-400 font-mono">{p.employeeCode} • {p.designationName}</div>
        </div>
      ),
    },
    {
      key: 'days',
      header: 'Attendance & LOP',
      render: (p) => (
        <div className="text-xs">
          <div className="font-bold text-slate-800">{p.presentDays} / {p.totalWorkingDays} Days</div>
          {p.lopDays > 0 ? (
            <span className="text-[11px] font-bold text-rose-600">{p.lopDays} LOP Days</span>
          ) : (
            <span className="text-[11px] font-bold text-emerald-600">0 LOP (Full Month)</span>
          )}
        </div>
      ),
    },
    {
      key: 'gross',
      header: 'Gross Earnings',
      render: (p) => (
        <span className="font-bold text-xs text-slate-900">
          {formatCurrencyINR(p.earnings.totalGross)}
        </span>
      ),
    },
    {
      key: 'deductions',
      header: 'Statutory & LOP',
      render: (p) => (
        <span className="font-bold text-xs text-rose-600">
          -{formatCurrencyINR(p.deductions.totalDeductions)}
        </span>
      ),
    },
    {
      key: 'net',
      header: 'Net Payable Salary',
      render: (p) => (
        <span className="font-extrabold text-sm text-emerald-700 font-mono">
          {formatCurrencyINR(p.netSalary)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => {
        const mapVariant: any = {
          Paid: 'success',
          Approved: 'info',
          Calculated: 'warning',
          Draft: 'default',
        };
        return <Badge variant={mapVariant[p.status] || 'default'}>{p.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Payslip',
      align: 'right',
      render: (p) => (
        <Button
          size="sm"
          variant="outline"
          className="text-xs px-2.5 py-1"
          onClick={() => setSelectedPayslip(p)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View Payslip
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Processing Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Payroll Management
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month/Year selectors */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value={8}>August (08)</option>
              <option value={9}>September (09)</option>
              <option value={10}>October (10)</option>
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
            </select>
          </div>

          {(isSuperAdmin || isHR || currentUser.roleName === 'Payroll Admin') && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleRunPayroll}
              leftIcon={<Play className="w-4 h-4" />}
            >
              Calculate Monthly Payroll
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPayroll}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Register
          </Button>
        </div>
      </div>

      {/* Monthly Summary & Approval Pipeline */}
      {currentPeriod && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900">
                Payroll Period: {selectedMonth}/2026
              </span>
              <Badge variant={currentPeriod.status === 'Paid' ? 'success' : 'warning'}>
                {currentPeriod.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
              <div>Employees: <span className="font-bold text-slate-900">{currentPeriod.totalEmployees}</span></div>
              <div>Gross Total: <span className="font-bold text-slate-900">{formatCurrencyINR(currentPeriod.totalGrossPay)}</span></div>
              <div>Deductions: <span className="font-bold text-rose-600">-{formatCurrencyINR(currentPeriod.totalDeductions)}</span></div>
              <div>Net Disbursed: <span className="font-extrabold text-emerald-700">{formatCurrencyINR(currentPeriod.totalNetPay)}</span></div>
            </div>
          </div>

          {(isSuperAdmin || isHR || currentUser.roleName === 'Payroll Admin') && (
            <div className="flex flex-wrap items-center gap-2">
              {currentPeriod.status === 'Calculated' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleUpdatePeriodStatus('Approved')}
                >
                  Approve Payroll Run
                </Button>
              )}
              {currentPeriod.status === 'Approved' && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleUpdatePeriodStatus('Paid')}
                >
                  Disburse & Mark as Paid
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payslips Table */}
      <Table
        columns={payslipColumns}
        data={payslips}
        keyExtractor={p => p.id}
        pageSize={10}
        emptyMessage={`No payroll calculated for ${selectedMonth}/${selectedYear} yet. Click 'Calculate Monthly Payroll' above.`}
      />

      {/* Official Printable Payslip Modal */}
      {selectedPayslip && (
        <Modal
          isOpen={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
          title="Employee Salary Slip"
          subtitle={`Period: ${selectedPayslip.month}/${selectedPayslip.year} • ${selectedPayslip.employeeName}`}
          size="2xl"
        >
          <div className="p-8 bg-white text-slate-900 space-y-6 border border-slate-200 rounded-2xl print:border-none print:p-0">
            {/* Header with NovaPulse Branding */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-brand-900 tracking-tight">
                  NovaPulse Technologies Pvt. Ltd.
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                  Plot 42, Sector 62, Electronic City, Noida, Delhi NCR - 201309
                </p>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  GST: 07JTGPK2862G1ZF • PAN: AAACN9824P
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Payslip For Month
                </div>
                <div className="text-base font-black text-brand-800">
                  {formatDate(`${selectedPayslip.year}-${selectedPayslip.month.toString().padStart(2, '0')}-01`, 'MMMM yyyy')}
                </div>
              </div>
            </div>

            {/* Employee Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block">Employee Code</span>
                <span className="font-bold text-slate-900 font-mono">{selectedPayslip.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Employee Name</span>
                <span className="font-bold text-slate-900">{selectedPayslip.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Department</span>
                <span className="font-bold text-slate-900">{selectedPayslip.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Designation</span>
                <span className="font-bold text-slate-900">{selectedPayslip.designationName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Bank Account</span>
                <span className="font-bold text-slate-900 font-mono">{selectedPayslip.bankAccount}</span>
              </div>
              <div>
                <span className="text-slate-400 block">PAN Number</span>
                <span className="font-bold text-slate-900 font-mono">{selectedPayslip.pan}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Working Days</span>
                <span className="font-bold text-slate-900">{selectedPayslip.totalWorkingDays}</span>
              </div>
              <div>
                <span className="text-slate-400 block">LOP Days</span>
                <span className="font-bold text-rose-600">{selectedPayslip.lopDays}</span>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Earnings Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-900 flex justify-between">
                  <span>Earnings (₹)</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-slate-100 p-2 space-y-1.5">
                  <div className="flex justify-between px-2">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-semibold">{formatCurrencyINR(selectedPayslip.earnings.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-semibold">{formatCurrencyINR(selectedPayslip.earnings.hra)}</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-600">Conveyance Allowance</span>
                    <span className="font-semibold">{formatCurrencyINR(selectedPayslip.earnings.conveyanceAllowance)}</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-semibold">{formatCurrencyINR(selectedPayslip.earnings.specialAllowance)}</span>
                  </div>
                  <div className="flex justify-between px-2 pt-2 border-t border-slate-200 font-bold text-slate-900">
                    <span>Total Gross Earnings</span>
                    <span>{formatCurrencyINR(selectedPayslip.earnings.totalGross)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-900 flex justify-between">
                  <span>Deductions (₹)</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-slate-100 p-2 space-y-1.5">
                  <div className="flex justify-between px-2">
                    <span className="text-slate-600">Provident Fund (PF - 12%)</span>
                    <span className="font-semibold">{formatCurrencyINR(selectedPayslip.deductions.pfEmployee)}</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-600">ESI (Employee)</span>
                    <span className="font-semibold">{formatCurrencyINR(selectedPayslip.deductions.esiEmployee)}</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-600">Professional Tax (PT)</span>
                    <span className="font-semibold">{formatCurrencyINR(selectedPayslip.deductions.professionalTax)}</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span className="text-slate-600">TDS / Income Tax</span>
                    <span className="font-semibold">{formatCurrencyINR(selectedPayslip.deductions.tds)}</span>
                  </div>
                  {selectedPayslip.deductions.lopDeduction > 0 && (
                    <div className="flex justify-between px-2 text-rose-600 font-semibold">
                      <span>Loss of Pay (LOP) Deduction</span>
                      <span>{formatCurrencyINR(selectedPayslip.deductions.lopDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-2 pt-2 border-t border-slate-200 font-bold text-rose-600">
                    <span>Total Deductions</span>
                    <span>-{formatCurrencyINR(selectedPayslip.deductions.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Box */}
            <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">
                  Net Payable Salary
                </span>
                <div className="text-2xl font-black text-brand-900 font-mono">
                  {formatCurrencyINR(selectedPayslip.netSalary)}
                </div>
                <div className="text-xs text-slate-600 italic mt-0.5">
                  {selectedPayslip.netSalaryInWords}
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
