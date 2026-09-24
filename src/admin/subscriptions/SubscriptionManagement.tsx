import React, { useState } from 'react';
import { CreditCard, Plus, Calendar, CheckCircle2, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { TenantService } from '../../services/tenantService';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionPlan, PaymentStatus } from '../../database/schema';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { PageHeader } from '../../components/common/PageHeader';

export const SubscriptionManagement: React.FC = () => {
  const { allTenants } = useAuth();
  const subscriptions = TenantService.getSubscriptions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subForm, setSubForm] = useState({
    tenantId: allTenants[0]?.tenantId || 'NP-000001',
    planName: 'Monthly' as SubscriptionPlan,
    billingCycle: 'Monthly' as 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Custom',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    licensedEmployees: 25,
    amount: 3000,
    currency: 'INR',
    paymentStatus: 'PAID' as PaymentStatus,
    notes: 'Standard renewal plan',
  });

  const handleCreateSub = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = allTenants.find(t => t.tenantId === subForm.tenantId);
    TenantService.createSubscription({
      tenantId: subForm.tenantId,
      companyName: tenant?.companyName || 'NovaPulse Organization',
      planName: subForm.planName,
      billingCycle: subForm.billingCycle,
      startDate: subForm.startDate,
      endDate: subForm.endDate,
      licensedEmployees: Number(subForm.licensedEmployees),
      amount: Number(subForm.amount),
      currency: subForm.currency,
      paymentStatus: subForm.paymentStatus,
      renewalDate: subForm.endDate,
      notes: subForm.notes,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <PageHeader
        title="Subscriptions"
        actions={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add / Renew Subscription
          </Button>
        }
      />

      {/* Subscription Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Tenant & Client</th>
                <th className="px-5 py-3.5">Plan Name</th>
                <th className="px-5 py-3.5">Billing Cycle</th>
                <th className="px-5 py-3.5">Capacity</th>
                <th className="px-5 py-3.5">Contract Term</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {subscriptions.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-white text-xs">{s.companyName}</div>
                    <div className="text-[10px] text-purple-400 font-mono">{s.tenantId}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-slate-200">{s.planName}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-slate-300">{s.billingCycle}</span>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-slate-200">
                    {s.licensedEmployees} Licences
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-slate-300">{s.startDate} to {s.endDate}</div>
                    <div className="text-[10px] text-slate-500">Renews: {s.renewalDate}</div>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                    {s.amount > 0 ? `₹${s.amount.toLocaleString()}` : 'Free Trial'}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        s.paymentStatus === 'PAID'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : s.paymentStatus === 'OVERDUE'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {s.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / RENEW MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New / Renewed Subscription"
        size="lg"
      >
        <form onSubmit={handleCreateSub} className="space-y-4 text-slate-900">
          <Select
            label="Customer Tenant"
            value={subForm.tenantId}
            onChange={e => setSubForm({ ...subForm, tenantId: e.target.value })}
            options={allTenants.map(t => ({ value: t.tenantId, label: `${t.companyName} (${t.tenantId})` }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Plan"
              value={subForm.planName}
              onChange={e => setSubForm({ ...subForm, planName: e.target.value as SubscriptionPlan })}
              options={[
                { value: 'Trial', label: 'Trial' },
                { value: 'Monthly', label: 'Monthly' },
                { value: 'Quarterly', label: 'Quarterly' },
                { value: 'Annual', label: 'Annual' },
                { value: 'Enterprise Custom', label: 'Enterprise Custom' },
              ]}
            />
            <Select
              label="Billing Cycle"
              value={subForm.billingCycle}
              onChange={e => setSubForm({ ...subForm, billingCycle: e.target.value as any })}
              options={[
                { value: 'Monthly', label: 'Monthly' },
                { value: 'Quarterly', label: 'Quarterly' },
                { value: 'Half-Yearly', label: 'Half-Yearly' },
                { value: 'Annual', label: 'Annual' },
                { value: 'Custom', label: 'Custom' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Licensed Employees"
              type="number"
              value={subForm.licensedEmployees}
              onChange={e => setSubForm({ ...subForm, licensedEmployees: Number(e.target.value) })}
              required
            />
            <Input
              label="Amount (₹)"
              type="number"
              value={subForm.amount}
              onChange={e => setSubForm({ ...subForm, amount: Number(e.target.value) })}
              required
            />
            <Select
              label="Payment Status"
              value={subForm.paymentStatus}
              onChange={e => setSubForm({ ...subForm, paymentStatus: e.target.value as PaymentStatus })}
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
              label="Start Date"
              type="date"
              value={subForm.startDate}
              onChange={e => setSubForm({ ...subForm, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={subForm.endDate}
              onChange={e => setSubForm({ ...subForm, endDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Notes / Reference"
            placeholder="e.g. Purchase order number or wire transfer reference"
            value={subForm.notes}
            onChange={e => setSubForm({ ...subForm, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
              Save Subscription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
