import React, { useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Filter,
  ExternalLink,
  KeyRound,
  PauseCircle,
  PlayCircle,
  Ban,
  Archive,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TenantService } from '../../services/tenantService';
import { EmployeeService } from '../../services/employeeService';
import { Tenant, SubscriptionPlan, PaymentStatus, TenantStatus } from '../../database/schema';
import { ROOT_DOMAIN, getTenantLoginUrl, getTenantSubdomainUrl } from '../../config/appConfig';
import { normalizeSlug } from '../../services/tenantResolver';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';

export const ClientManagement: React.FC<{ isCreateModalOpenExternal?: boolean; onCloseCreateModalExternal?: () => void }> = ({
  isCreateModalOpenExternal = false,
  onCloseCreateModalExternal
}) => {
  const { loginAsClient, allTenants } = useAuth();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isLicenceModalOpen, setIsLicenceModalOpen] = useState(false);
  const [isOnHoldModalOpen, setIsOnHoldModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [createdTenantSuccess, setCreatedTenantSuccess] = useState<Tenant | null>(null);
  const [copiedTenantId, setCopiedTenantId] = useState<string | null>(null);

  // Licence adjustment form
  const [newLicenceLimit, setNewLicenceLimit] = useState(20);
  const [licenceReason, setLicenceReason] = useState('');

  // Hold reason form
  const [holdReason, setHoldReason] = useState('Subscription payment overdue (>30 days)');

  // Create Client Form state
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [clientForm, setClientForm] = useState({
    companyName: '',
    legalName: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    gstin: '',
    industry: 'Information Technology',
    licensedEmployees: 25,
    subscriptionPlan: 'Monthly' as SubscriptionPlan,
    subscriptionStartDate: new Date().toISOString().split('T')[0],
    subscriptionEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    paymentStatus: 'PAID' as PaymentStatus,
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  });

  const showCreateModal = isCreateModalOpen || isCreateModalOpenExternal;
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setSlugEditedManually(false);
    setSlugError('');
    if (onCloseCreateModalExternal) onCloseCreateModalExternal();
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const newForm = { ...clientForm, companyName: name };
    if (!slugEditedManually) {
      const suggested = TenantService.generateSlug(name);
      newForm.slug = suggested;
      const validation = TenantService.validateSlug(suggested);
      setSlugError(validation.valid ? '' : (validation.error || ''));
    }
    setClientForm(newForm);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugEditedManually(true);
    const raw = e.target.value;
    const normalized = normalizeSlug(raw);
    setClientForm({ ...clientForm, slug: normalized });
    const validation = TenantService.validateSlug(normalized);
    setSlugError(validation.valid ? '' : (validation.error || ''));
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedTenantId(id);
    setTimeout(() => setCopiedTenantId(null), 2500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentSlug = clientForm.slug ? normalizeSlug(clientForm.slug) : TenantService.generateSlug(clientForm.companyName);
    const validation = TenantService.validateSlug(currentSlug);
    if (!validation.valid) {
      setSlugError(validation.error || 'Invalid slug');
      return;
    }

    try {
      const { tenant } = TenantService.create({
        companyName: clientForm.companyName,
        legalName: clientForm.legalName || clientForm.companyName,
        slug: currentSlug,
        email: clientForm.email,
        phone: clientForm.phone,
        address: clientForm.address,
        city: clientForm.city,
        state: clientForm.state,
        country: clientForm.country,
        gstin: clientForm.gstin,
        industry: clientForm.industry,
        licensedEmployees: Number(clientForm.licensedEmployees) || 20,
        subscriptionPlan: clientForm.subscriptionPlan,
        subscriptionStartDate: clientForm.subscriptionStartDate,
        subscriptionEndDate: clientForm.subscriptionEndDate,
        paymentStatus: clientForm.paymentStatus,
        primaryAdmin: {
          name: clientForm.adminName,
          email: clientForm.adminEmail,
          phone: clientForm.adminPhone
        }
      });

      handleCloseCreateModal();
      setCreatedTenantSuccess(tenant);
      setClientForm({
        companyName: '',
        legalName: '',
        slug: '',
        email: '',
        phone: '',
        address: '',
        city: 'Noida',
        state: 'Uttar Pradesh',
        country: 'India',
        gstin: '',
        industry: 'Information Technology',
        licensedEmployees: 25,
        subscriptionPlan: 'Monthly',
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        subscriptionEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        paymentStatus: 'PAID',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
      });
      setSlugEditedManually(false);
      setSlugError('');
    } catch (err: any) {
      setSlugError(err.message || 'Error provisioning tenant');
    }
  };

  const handleLicenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    const res = TenantService.updateLicence(
      selectedTenant.tenantId,
      Number(newLicenceLimit),
      'Super Admin',
      licenceReason
    );
    if (res.success) {
      setIsLicenceModalOpen(false);
      setLicenceReason('');
    } else {
      alert(res.message);
    }
  };

  const handleHoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    TenantService.putOnHold(selectedTenant.tenantId, holdReason, 'Super Admin');
    setIsOnHoldModalOpen(false);
  };

  // Filtered Clients
  const filteredTenants = allTenants.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (planFilter !== 'ALL' && t.subscriptionPlan !== planFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.companyName.toLowerCase().includes(q) ||
        t.tenantId.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.clientCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header & Quick Action */}
      <PageHeader
        title="Client Management"
        badge={
          <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 font-bold px-2.5 py-0.5 rounded-full">
            {allTenants.length} Total
          </span>
        }
        actions={
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Client
          </Button>
        }
      />

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by company name, Tenant ID (NP-000001), or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-purple-500"
          >
            <option value="ALL">All Plans</option>
            <option value="Trial">Trial</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
            <option value="Enterprise Custom">Enterprise Custom</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono self-end md:self-center">
          Showing {filteredTenants.length} of {allTenants.length} clients
        </div>
      </div>

      {/* Main Tenant Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Tenant ID & Code</th>
                <th className="px-5 py-3.5">Company Name</th>
                <th className="px-5 py-3.5">Primary Admin</th>
                <th className="px-5 py-3.5">Plan & Billing</th>
                <th className="px-5 py-3.5">Licence Usage</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No matching customer accounts found.
                  </td>
                </tr>
              ) : (
                filteredTenants.map(tenant => {
                  const usage = EmployeeService.getLicenceUsage(tenant.tenantId);
                  return (
                    <tr key={tenant.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Tenant ID */}
                      <td className="px-5 py-4">
                        <div className="font-mono font-extrabold text-purple-300 text-xs">
                          {tenant.tenantId}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{tenant.clientCode}</div>
                      </td>

                      {/* Company Name */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-xs">{tenant.companyName}</div>
                        <div className="text-[11px] text-slate-400">{tenant.city}, {tenant.state}</div>
                      </td>

                      {/* Primary Admin */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-200">{tenant.primaryAdmin?.name || 'Administrator'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{tenant.primaryAdmin?.email || tenant.email}</div>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{tenant.subscriptionPlan}</div>
                        <div className="text-[11px] text-slate-400">
                          Renews: {tenant.subscriptionEndDate}
                        </div>
                      </td>

                      {/* Licence Usage */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-200">
                            {usage.used} / {tenant.licensedEmployees}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            usage.percentage >= 90
                              ? 'bg-rose-950 text-rose-300'
                              : usage.percentage >= 75
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}>
                            {usage.percentage}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{usage.available} available</div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                            tenant.status === 'ACTIVE'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : tenant.status === 'TRIAL'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                              : tenant.status === 'ON_HOLD'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                              : 'bg-rose-950/80 text-rose-300 border-rose-800'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Login As Client */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loginAsClient(tenant.tenantId, 'Super Admin Table Action')}
                            className="bg-purple-950/60 hover:bg-purple-900 border-purple-800 text-purple-300 text-xs px-2.5 py-1"
                            title="Login as Client (Admin Impersonation)"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>

                          {/* Adjust Licences */}
                          <button
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setNewLicenceLimit(tenant.licensedEmployees);
                              setIsLicenceModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Change Employee Licences"
                          >
                            <KeyRound className="w-4 h-4 text-blue-400" />
                          </button>

                          {/* Put On Hold / Reactivate */}
                          {tenant.status === 'ON_HOLD' ? (
                            <button
                              onClick={() => {
                                TenantService.reactivate(tenant.tenantId, 'Super Admin');
                              }}
                              className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800"
                              title="Reactivate Account"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setIsOnHoldModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800"
                              title="Put Account On Hold"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* View Modal */}
                          <button
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE NEW CLIENT WIZARD */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Provision New Customer Tenant"
        size="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-slate-900">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
            <span>Tenant ID will be generated automatically as <strong>{TenantService.generateNextTenantId()}</strong></span>
            <span className="font-mono text-[11px] font-bold text-purple-700">Immutable SaaS ID</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Trade Name"
              placeholder="e.g. Ignite Technologies Pvt Ltd"
              value={clientForm.companyName}
              onChange={handleCompanyNameChange}
              required
            />
            <Input
              label="Legal Entity Name"
              placeholder="e.g. Ignite Technologies Private Limited"
              value={clientForm.legalName}
              onChange={e => setClientForm({ ...clientForm, legalName: e.target.value })}
            />
          </div>

          {/* Subdomain / Slug Input with Real-Time Validation */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Workspace Subdomain (Slug) <span className="text-rose-500">*</span>
            </label>
            <div className="flex rounded-xl shadow-xs border border-slate-300 bg-white overflow-hidden focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
              <span className="inline-flex items-center px-3 bg-slate-100 text-slate-500 text-xs font-mono border-r border-slate-200">
                https://
              </span>
              <input
                type="text"
                className="flex-1 min-w-0 block w-full px-3 py-2 text-xs font-mono font-bold text-purple-900 placeholder-slate-400 outline-none"
                placeholder="e.g. ignite"
                value={clientForm.slug}
                onChange={handleSlugChange}
                required
              />
              <span className="inline-flex items-center px-3 bg-slate-100 text-slate-500 text-xs font-mono border-l border-slate-200">
                .{ROOT_DOMAIN}
              </span>
            </div>
            {slugError ? (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {slugError}
              </p>
            ) : clientForm.slug ? (
              <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Valid Subdomain: <strong>https://{clientForm.slug}.{ROOT_DOMAIN}</strong>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Subdomain will be used by all employees to access the company workspace.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Official Email"
              type="email"
              placeholder="admin@company.com"
              value={clientForm.email}
              onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
              required
            />
            <Input
              label="Contact Phone"
              placeholder="+91 98765 43210"
              value={clientForm.phone}
              onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
              required
            />
            <Input
              label="Industry / Domain"
              placeholder="e.g. Manufacturing, Retail"
              value={clientForm.industry}
              onChange={e => setClientForm({ ...clientForm, industry: e.target.value })}
            />
          </div>

          <Input
            label="Corporate Office Address"
            placeholder="Plot / Street / Business Park"
            value={clientForm.address}
            onChange={e => setClientForm({ ...clientForm, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={clientForm.city}
              onChange={e => setClientForm({ ...clientForm, city: e.target.value })}
            />
            <Input
              label="State"
              value={clientForm.state}
              onChange={e => setClientForm({ ...clientForm, state: e.target.value })}
            />
            <Input
              label="GSTIN (Optional)"
              placeholder="07AAAAA0000A1Z5"
              value={clientForm.gstin}
              onChange={e => setClientForm({ ...clientForm, gstin: e.target.value })}
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Primary Client Administrator
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Admin Full Name"
                placeholder="e.g. Rajesh Sharma"
                value={clientForm.adminName}
                onChange={e => setClientForm({ ...clientForm, adminName: e.target.value })}
                required
              />
              <Input
                label="Admin Email"
                type="email"
                placeholder="rajesh@company.com"
                value={clientForm.adminEmail}
                onChange={e => setClientForm({ ...clientForm, adminEmail: e.target.value })}
                required
              />
              <Input
                label="Admin Phone"
                placeholder="+91 98111 22334"
                value={clientForm.adminPhone}
                onChange={e => setClientForm({ ...clientForm, adminPhone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Licence & Subscription Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Licence Quantity (Employees)"
                type="number"
                min="1"
                max="5000"
                value={clientForm.licensedEmployees}
                onChange={e => setClientForm({ ...clientForm, licensedEmployees: Number(e.target.value) })}
                required
              />
              <Select
                label="Subscription Plan"
                value={clientForm.subscriptionPlan}
                onChange={e => setClientForm({ ...clientForm, subscriptionPlan: e.target.value as SubscriptionPlan })}
                options={[
                  { value: 'Trial', label: '30-Day Trial (Free)' },
                  { value: 'Monthly', label: 'Monthly Regular' },
                  { value: 'Quarterly', label: 'Quarterly Pack' },
                  { value: 'Annual', label: 'Annual Enterprise (Discounted)' },
                  { value: 'Enterprise Custom', label: 'Enterprise Custom' },
                ]}
              />
              <Select
                label="Initial Payment Status"
                value={clientForm.paymentStatus}
                onChange={e => setClientForm({ ...clientForm, paymentStatus: e.target.value as PaymentStatus })}
                options={[
                  { value: 'PAID', label: 'Paid' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'WAIVED', label: 'Waived (Trial / Promo)' },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={handleCloseCreateModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!!slugError}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              Provision & Issue Client Credentials
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADJUST LICENCE QUOTA */}
      <Modal
        isOpen={isLicenceModalOpen}
        onClose={() => setIsLicenceModalOpen(false)}
        title={`Adjust Licence Quota: ${selectedTenant?.companyName}`}
        size="md"
      >
        <form onSubmit={handleLicenceSubmit} className="space-y-4 text-slate-900">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Quota:</span>
              <span className="font-bold text-slate-900 font-mono">{selectedTenant?.licensedEmployees} Licences</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Currently Active Employees:</span>
              <span className="font-bold text-purple-700 font-mono">
                {selectedTenant ? EmployeeService.getLicenceUsage(selectedTenant.tenantId).used : 0} Employees
              </span>
            </div>
          </div>

          <Input
            label="New Licensed Employees Capacity"
            type="number"
            min="1"
            max="10000"
            value={newLicenceLimit}
            onChange={e => setNewLicenceLimit(Number(e.target.value))}
            required
          />

          <Input
            label="Reason for Licence Change (Logged for Audit)"
            placeholder="e.g. Plan upgrade to 100 seats / contract expansion"
            value={licenceReason}
            onChange={e => setLicenceReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsLicenceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
              Update Quota
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: PUT ACCOUNT ON HOLD */}
      <Modal
        isOpen={isOnHoldModalOpen}
        onClose={() => setIsOnHoldModalOpen(false)}
        title={`Put Account on Hold: ${selectedTenant?.companyName}`}
        size="md"
      >
        <form onSubmit={handleHoldSubmit} className="space-y-4 text-slate-900">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirmation Required</span>
            </div>
            <p>
              Putting <strong>{selectedTenant?.companyName} ({selectedTenant?.tenantId})</strong> ON HOLD will immediately block client HRMS operations and display the professional on-hold notice. All historical employee and payroll data will remain completely safe.
            </p>
          </div>

          <Input
            label="Reason for Placing Account on Hold"
            value={holdReason}
            onChange={e => setHoldReason(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsOnHoldModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" className="bg-amber-600 hover:bg-amber-500 text-white font-bold">
              Put Account on Hold
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: VIEW FULL TENANT PROFILE */}
      {selectedTenant && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`${selectedTenant.companyName} (${selectedTenant.tenantId})`}
          size="lg"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tenant ID</span>
                <span className="font-mono font-bold text-slate-900">{selectedTenant.tenantId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Client Code</span>
                <span className="font-mono font-bold text-slate-900">{selectedTenant.clientCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Subdomain Slug</span>
                <span className="font-mono font-bold text-purple-700">{selectedTenant.slug || 'novapulse'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Plan</span>
                <span className="font-bold text-slate-900">{selectedTenant.subscriptionPlan}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Licence Quota</span>
                <span className="font-bold text-slate-900">{selectedTenant.licensedEmployees} Employees</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Status</span>
                <span className="font-bold uppercase text-slate-900">{selectedTenant.status}</span>
              </div>
            </div>

            {/* Subdomain URL Card with Copy Button */}
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Dedicated Workspace Subdomain URL</span>
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-purple-200">
                <span className="font-mono text-purple-700 font-bold truncate">
                  {getTenantSubdomainUrl(selectedTenant.slug || selectedTenant.tenantId.toLowerCase())}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(getTenantSubdomainUrl(selectedTenant.slug || selectedTenant.tenantId.toLowerCase()), selectedTenant.tenantId)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-semibold transition-colors shrink-0"
                >
                  {copiedTenantId === selectedTenant.tenantId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsViewModalOpen(false);
                  loginAsClient(selectedTenant.tenantId, 'Profile Modal Jump');
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white"
                leftIcon={<ExternalLink className="w-4 h-4" />}
              >
                Login as Client
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 5: CLIENT CREATION SUCCESS NOTIFICATION */}
      {createdTenantSuccess && (
        <Modal
          isOpen={!!createdTenantSuccess}
          onClose={() => setCreatedTenantSuccess(null)}
          title="Tenant Provisioned Successfully"
          size="md"
        >
          <div className="space-y-4 text-slate-900 text-center">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {createdTenantSuccess.companyName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tenant ID: <span className="font-mono font-bold text-purple-700">{createdTenantSuccess.tenantId}</span> • Client Code: <span className="font-mono font-bold">{createdTenantSuccess.clientCode}</span>
              </p>
            </div>

            {/* Generated Subdomain URL Box */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-left space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500">Dedicated Tenant Subdomain URL:</span>
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-purple-200">
                <span className="font-mono text-xs font-bold text-purple-800 truncate">
                  {getTenantSubdomainUrl(createdTenantSuccess.slug)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(getTenantSubdomainUrl(createdTenantSuccess.slug), createdTenantSuccess.tenantId)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shrink-0"
                >
                  {copiedTenantId === createdTenantSuccess.tenantId ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCreatedTenantSuccess(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                leftIcon={<ExternalLink className="w-4 h-4" />}
                onClick={() => {
                  const id = createdTenantSuccess.tenantId;
                  setCreatedTenantSuccess(null);
                  loginAsClient(id, 'Immediate Onboarding Jump');
                }}
              >
                Login as Client Now
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

