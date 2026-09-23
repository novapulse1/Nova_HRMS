// MODULE 7: Self-Service Employee Onboarding Master
import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Link,
  Copy,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  Download,
  FileCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { OnboardingService } from '../../services/onboardingService';
import { EmployeeService } from '../../services/employeeService';
import { OnboardingInvite } from '../../database/schema';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { exportToExcel } from '../../utils/exportUtils';
import { formatDate, formatCurrencyINR } from '../../utils/dateUtils';
import { StorageEngine } from '../../database/storageEngine';

export const OnboardingModule: React.FC = () => {
  const { currentUser, isSuperAdmin, isHR } = useAuth();
  const { departments, designations, branches } = useOrganization();
  const [dataVersion, setDataVersion] = useState(0);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<OnboardingInvite | null>(null);
  const [isSelfServiceModalOpen, setIsSelfServiceModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Quick HR Invite Form
  const [inviteForm, setInviteForm] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    departmentId: '',
    designationId: '',
    branchId: '',
    expectedJoiningDate: new Date().toISOString().split('T')[0],
    offeredGrossSalary: 65000,
  });

  // Candidate Self-Service Form state (for simulated candidate filling)
  const [selfServiceForm, setSelfServiceForm] = useState({
    dob: '1996-05-20',
    gender: 'Male' as any,
    currentAddress: 'Sector 62, Noida, UP',
    bankAccount: '501004928102',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0000182',
    pan: 'ABCDE1234F',
    aadhaar: 'XXXX-XXXX-9821',
    emergencyName: 'Ramesh Kumar',
    emergencyPhone: '+91 98100 00000',
  });

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const invites = OnboardingService.getAll();

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    OnboardingService.createInvite({
      candidateName: inviteForm.candidateName,
      candidateEmail: inviteForm.candidateEmail,
      candidatePhone: inviteForm.candidatePhone,
      departmentId: inviteForm.departmentId || departments[0]?.id || 'dept-eng-01',
      designationId: inviteForm.designationId || designations[0]?.id || 'desig-08',
      branchId: inviteForm.branchId || branches[0]?.id || 'branch-delhi-01',
      expectedJoiningDate: inviteForm.expectedJoiningDate,
      offeredGrossSalary: Number(inviteForm.offeredGrossSalary),
    });

    setIsInviteModalOpen(false);
    setInviteForm({
      candidateName: '',
      candidateEmail: '',
      candidatePhone: '',
      departmentId: '',
      designationId: '',
      branchId: '',
      expectedJoiningDate: new Date().toISOString().split('T')[0],
      offeredGrossSalary: 65000,
    });
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/onboard/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvite) return;

    OnboardingService.submitCandidateData(selectedInvite.token, {
      firstName: selectedInvite.candidateName.split(' ')[0],
      lastName: selectedInvite.candidateName.split(' ').slice(1).join(' ') || 'Candidate',
      personalEmail: selectedInvite.candidateEmail,
      phone: selectedInvite.candidatePhone,
      dob: selfServiceForm.dob,
      gender: selfServiceForm.gender,
      currentAddress: selfServiceForm.currentAddress,
      permanentAddress: selfServiceForm.currentAddress,
      bankDetails: {
        accountHolderName: selectedInvite.candidateName,
        accountNumber: selfServiceForm.bankAccount,
        bankName: selfServiceForm.bankName,
        ifscCode: selfServiceForm.ifscCode,
        branchName: 'Main Branch',
      },
      statutoryDetails: {
        pan: selfServiceForm.pan,
        aadhaar: selfServiceForm.aadhaar,
        pfEligible: true,
        esiEligible: false,
        professionalTaxState: 'Uttar Pradesh',
      },
      emergencyContact: {
        name: selfServiceForm.emergencyName,
        relationship: 'Family',
        phone: selfServiceForm.emergencyPhone,
      },
      education: [{ degree: 'Bachelor of Technology', institution: 'State University', passingYear: 2020, percentage: '80%' }],
      previousExperience: [],
      documents: [
        { type: 'PAN', name: 'PAN_Card.pdf', fileUrl: '/docs/pan.pdf', uploadDate: '2026-09-21' },
        { type: 'Aadhaar', name: 'Aadhaar_Card.pdf', fileUrl: '/docs/aadhaar.pdf', uploadDate: '2026-09-21' },
      ],
      photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedInvite.candidateName}`,
    });

    setIsSelfServiceModalOpen(false);
    alert('Candidate self-service onboarding submitted successfully for HR review!');
  };

  const handleApproveIntoMaster = (inviteId: string) => {
    const res = OnboardingService.approveOnboarding(inviteId, currentUser.employeeId, 'Documents verified and approved.');
    if (res.success) {
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  const inviteColumns: Column<OnboardingInvite>[] = [
    {
      key: 'candidate',
      header: 'Candidate Name & Contact',
      render: (inv) => (
        <div>
          <div className="font-extrabold text-sm text-slate-900">{inv.candidateName}</div>
          <div className="text-xs text-slate-400 font-mono">{inv.candidateEmail} • {inv.candidatePhone}</div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Offered Role & Joining',
      render: (inv) => {
        const dept = departments.find(d => d.id === inv.departmentId);
        const desig = designations.find(d => d.id === inv.designationId);
        return (
          <div>
            <div className="text-xs font-bold text-slate-800">{desig?.title || '—'}</div>
            <div className="text-[11px] text-slate-500">
              {dept?.name || '—'} • Joining: {inv.expectedJoiningDate}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Onboarding Status',
      render: (inv) => {
        const mapVariant: any = {
          sent: 'warning',
          submitted: 'info',
          approved: 'success',
          rejected: 'danger',
        };
        return <Badge variant={mapVariant[inv.status] || 'default'}>{inv.status.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (inv) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="text-xs px-2.5 py-1"
            onClick={() => handleCopyLink(inv.token)}
            title="Copy Invite Link"
          >
            {copiedToken === inv.token ? 'Copied!' : 'Copy Link'}
          </Button>

          {inv.status === 'sent' && (
            <Button
              size="sm"
              variant="secondary"
              className="text-xs px-2.5 py-1"
              onClick={() => {
                setSelectedInvite(inv);
                setIsSelfServiceModalOpen(true);
              }}
            >
              Fill Form
            </Button>
          )}

          {inv.status === 'submitted' && (isSuperAdmin || isHR) && (
            <Button
              size="sm"
              variant="success"
              className="text-xs px-2.5 py-1"
              onClick={() => handleApproveIntoMaster(inv.id)}
            >
              Approve & Onboard
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Onboarding Master
          </h2>
        </div>

        {(isSuperAdmin || isHR) && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Send Onboarding Invitation
          </Button>
        )}
      </div>

      <Table
        columns={inviteColumns}
        data={invites}
        keyExtractor={i => i.id}
        pageSize={10}
        emptyMessage="No onboarding invitations found."
      />

      {/* Quick HR Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Create Onboarding Invitation"
        subtitle="Provide 4-5 basic candidate details to generate a secure self-service link"
      >
        <form onSubmit={handleCreateInvite} className="space-y-4">
          <Input
            label="Candidate Full Name"
            placeholder="e.g. Akash Deep"
            value={inviteForm.candidateName}
            onChange={e => setInviteForm({ ...inviteForm, candidateName: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Candidate Email"
              type="email"
              placeholder="candidate@gmail.com"
              value={inviteForm.candidateEmail}
              onChange={e => setInviteForm({ ...inviteForm, candidateEmail: e.target.value })}
              required
            />
            <Input
              label="Contact Phone"
              placeholder="+91 98712 34560"
              value={inviteForm.candidatePhone}
              onChange={e => setInviteForm({ ...inviteForm, candidatePhone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              value={inviteForm.departmentId}
              onChange={e => setInviteForm({ ...inviteForm, departmentId: e.target.value })}
              required
            >
              <option value="">-- Choose Dept --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Designation"
              value={inviteForm.designationId}
              onChange={e => setInviteForm({ ...inviteForm, designationId: e.target.value })}
              required
            >
              <option value="">-- Choose Designation --</option>
              {designations.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expected Joining Date"
              type="date"
              value={inviteForm.expectedJoiningDate}
              onChange={e => setInviteForm({ ...inviteForm, expectedJoiningDate: e.target.value })}
              required
            />
            <Input
              label="Offered Gross Salary (₹)"
              type="number"
              value={inviteForm.offeredGrossSalary}
              onChange={e => setInviteForm({ ...inviteForm, offeredGrossSalary: Number(e.target.value) })}
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Generate & Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Candidate Self-Service Simulation Modal */}
      {selectedInvite && (
        <Modal
          isOpen={isSelfServiceModalOpen}
          onClose={() => setIsSelfServiceModalOpen(false)}
          title={`Candidate Self-Service Form — ${selectedInvite.candidateName}`}
          subtitle="Simulate candidate entering bank details, PAN, Aadhaar, and emergency contacts"
          size="xl"
        >
          <form onSubmit={handleCandidateSubmit} className="space-y-4">
            <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 text-xs text-brand-900">
              Candidate Token: <span className="font-mono font-bold">{selectedInvite.token}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                value={selfServiceForm.dob}
                onChange={e => setSelfServiceForm({ ...selfServiceForm, dob: e.target.value })}
                required
              />
              <Select
                label="Gender"
                value={selfServiceForm.gender}
                onChange={e => setSelfServiceForm({ ...selfServiceForm, gender: e.target.value as any })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <Input
              label="Current Residential Address"
              value={selfServiceForm.currentAddress}
              onChange={e => setSelfServiceForm({ ...selfServiceForm, currentAddress: e.target.value })}
              required
            />

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <Input
                label="Bank Name"
                value={selfServiceForm.bankName}
                onChange={e => setSelfServiceForm({ ...selfServiceForm, bankName: e.target.value })}
                required
              />
              <Input
                label="Account Number"
                value={selfServiceForm.bankAccount}
                onChange={e => setSelfServiceForm({ ...selfServiceForm, bankAccount: e.target.value })}
                required
              />
              <Input
                label="IFSC Code"
                value={selfServiceForm.ifscCode}
                onChange={e => setSelfServiceForm({ ...selfServiceForm, ifscCode: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="PAN Card Number"
                value={selfServiceForm.pan}
                onChange={e => setSelfServiceForm({ ...selfServiceForm, pan: e.target.value })}
                required
              />
              <Input
                label="Aadhaar Card Number"
                value={selfServiceForm.aadhaar}
                onChange={e => setSelfServiceForm({ ...selfServiceForm, aadhaar: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Emergency Contact Name"
                value={selfServiceForm.emergencyName}
                onChange={e => setSelfServiceForm({ ...selfServiceForm, emergencyName: e.target.value })}
                required
              />
              <Input
                label="Emergency Phone"
                value={selfServiceForm.emergencyPhone}
                onChange={e => setSelfServiceForm({ ...selfServiceForm, emergencyPhone: e.target.value })}
                required
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsSelfServiceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="success">
                Submit Candidate Onboarding
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
