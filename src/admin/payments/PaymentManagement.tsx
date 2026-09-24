import React, { useState } from 'react';
import { Receipt, Plus, CheckCircle2, AlertTriangle, Download, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TenantService } from '../../services/tenantService';
import { TenantPayment, PaymentStatus } from '../../database/schema';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { exportToExcel } from '../../utils/exportUtils';

export const PaymentManagement: React.FC = () => {
  const { allTenants } = useAuth();
  const payments = TenantService.getPayments();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    tenantId: allTenants[0]?.tenantId || 'NP-000001',
    plan: 'Monthly Subscription',
    amount: 5000,
    taxAmount: 900,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'PAID' as PaymentStatus,
    paymentMethod: 'NEFT / Net Banking',
    transactionId: 'TXN-998231',
  });

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = allTenants.find(t => t.tenantId === payForm.tenantId);
    const count = payments.length + 1;
    TenantService.createPayment({
      invoiceNumber: `INV-NP-2026-${String(count).padStart(3, '0')}`,
      tenantId: payForm.tenantId,
      companyName: tenant?.companyName || 'NovaPulse Organization',
      plan: payForm.plan,
      amount: Number(payForm.amount),
      taxAmount: Number(payForm.taxAmount),
      totalAmount: Number(payForm.amount) + Number(payForm.taxAmount),
      paymentDate: payForm.status === 'PAID' ? payForm.paymentDate : '',
      dueDate: payForm.dueDate,
      status: payForm.status,
      paymentMethod: payForm.paymentMethod,
      transactionId: payForm.transactionId,
    });
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const rows = payments.map(p => ({
      'Invoice #': p.invoiceNumber,
      'Tenant ID': p.tenantId,
      'Company Name': p.companyName,
      'Plan': p.plan,
      'Base Amount (₹)': p.amount,
      'Tax Amount (₹)': p.taxAmount,
      'Total Amount (₹)': p.totalAmount,
      'Due Date': p.dueDate,
      'Payment Date': p.paymentDate || 'N/A',
      'Status': p.status,
      'Payment Method': p.paymentMethod,
      'Transaction Ref': p.transactionId || 'N/A',
    }));
    exportToExcel('NovaPulse_SaaS_Payments_Register.xlsx', 'Payments', rows);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Customer Invoicing & Payment Register
          </h2>
          <p className="text-xs text-slate-400">
            Track subscription payments, tax invoices (GST), overdue collections, and receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="bg-slate-800 text-slate-200 border-slate-700"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Invoices
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Invoice / Payment
          </Button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Tenant & Company</th>
                <th className="px-5 py-3.5">Plan Description</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Payment Status</th>
                <th className="px-5 py-3.5 text-right">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-purple-300">{p.invoiceNumber}</td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-white text-xs">{p.companyName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.tenantId}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{p.plan}</td>
                  <td className="px-5 py-4 font-mono font-bold text-emerald-400 text-xs">
                    ₹{p.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-slate-300">{p.dueDate}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        p.status === 'PAID'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : p.status === 'OVERDUE'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <select
                      value={p.status}
                      onChange={e => {
                        TenantService.updatePaymentStatus(p.id, e.target.value as PaymentStatus);
                      }}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="PAID">Mark PAID</option>
                      <option value="PENDING">Mark PENDING</option>
                      <option value="OVERDUE">Mark OVERDUE</option>
                      <option value="WAIVED">Mark WAIVED</option>
                      <option value="REFUNDED">Mark REFUNDED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Tax Invoice / Payment"
        size="lg"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4 text-slate-900">
          <Select
            label="Customer Tenant"
            value={payForm.tenantId}
            onChange={e => setPayForm({ ...payForm, tenantId: e.target.value })}
            options={allTenants.map(t => ({ value: t.tenantId, label: `${t.companyName} (${t.tenantId})` }))}
          />

          <Input
            label="Plan Description"
            value={payForm.plan}
            onChange={e => setPayForm({ ...payForm, plan: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Amount (₹)"
              type="number"
              value={payForm.amount}
              onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })}
              required
            />
            <Input
              label="GST Tax 18% (₹)"
              type="number"
              value={payForm.taxAmount}
              onChange={e => setPayForm({ ...payForm, taxAmount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Due Date"
              type="date"
              value={payForm.dueDate}
              onChange={e => setPayForm({ ...payForm, dueDate: e.target.value })}
              required
            />
            <Select
              label="Payment Status"
              value={payForm.status}
              onChange={e => setPayForm({ ...payForm, status: e.target.value as PaymentStatus })}
              options={[
                { value: 'PAID', label: 'Paid' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'OVERDUE', label: 'Overdue' },
                { value: 'WAIVED', label: 'Waived' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Payment Method"
              value={payForm.paymentMethod}
              onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}
            />
            <Input
              label="Transaction / Bank Reference"
              value={payForm.transactionId}
              onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
              Save Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
