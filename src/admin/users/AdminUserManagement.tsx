import React, { useState } from 'react';
import { ShieldCheck, UserPlus, Key, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { PageHeader } from '../../components/common/PageHeader';
import { StorageEngine, STORAGE_KEYS } from '../../database/storageEngine';
import { User } from '../../database/schema';

export const AdminUserManagement: React.FC = () => {
  const { availableUsers, currentUser } = useAuth();
  const superAdminUsers = availableUsers.filter(u => u.roleName === 'Super Admin' || u.organizationId === 'org-novapulse-01' || u.organizationId === 'NP-000001');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `user-${Date.now()}`,
      organizationId: 'NP-000001',
      employeeId: `emp-${Date.now()}`,
      email: form.email,
      fullName: form.fullName,
      roleId: 'role-super-admin',
      roleName: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      status: 'active',
      lastLogin: new Date().toISOString()
    };
    StorageEngine.insert<User>(STORAGE_KEYS.USERS, newUser);
    setIsModalOpen(false);
    setForm({ fullName: '', email: '', phone: '' });
  };

  return (
    <div className="space-y-6 text-slate-100">
      <PageHeader
        title="Admin Users"
        badge={
          <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 font-bold px-2.5 py-0.5 rounded-full">
            {superAdminUsers.length} Operators
          </span>
        }
        actions={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Super Admin User
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {superAdminUsers.map(u => (
          <div key={u.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <img src={u.avatar} alt={u.fullName} className="w-12 h-12 rounded-xl object-cover border-2 border-purple-500" />
              <div>
                <h4 className="font-extrabold text-white text-sm">{u.fullName}</h4>
                <span className="text-[10px] text-purple-300 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800 font-bold">
                  {u.roleName}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{u.email}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Full Cluster Access (All Tenants)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite New Super Administrator"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-slate-900">
          <Input
            label="Full Name"
            placeholder="e.g. Aditi Roy"
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            required
          />
          <Input
            label="Official Work Email"
            type="email"
            placeholder="aditi@novapulse.co.in"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            placeholder="+91 98765 00000"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
              Grant Admin Access
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
