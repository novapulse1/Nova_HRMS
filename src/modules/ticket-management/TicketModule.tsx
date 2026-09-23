// MODULE 6: Internal Employee Ticketing & Helpdesk System
import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  Clock,
  MessageSquare,
  Send,
  Lock,
  CheckCircle,
  AlertTriangle,
  Download,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { TicketService } from '../../services/ticketService';
import { EmployeeService } from '../../services/employeeService';
import { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../../database/schema';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { exportToExcel } from '../../utils/exportUtils';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { StorageEngine } from '../../database/storageEngine';

export const TicketModule: React.FC = () => {
  const { currentUser, currentEmployee, isSuperAdmin, isHR, isEmployee } = useAuth();
  const { departments } = useOrganization();
  const [dataVersion, setDataVersion] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    category: 'IT' as TicketCategory,
    subject: '',
    description: '',
    priority: 'Medium' as TicketPriority,
    assignedDepartmentId: '',
  });

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const allTickets = TicketService.getAll();
  const employees = EmployeeService.getAll();

  let filteredTickets = allTickets;
  if (isEmployee && currentEmployee) {
    filteredTickets = filteredTickets.filter(t => t.employeeId === currentEmployee.id);
  }
  if (statusFilter !== 'all') {
    filteredTickets = filteredTickets.filter(t => t.status === statusFilter);
  }
  if (categoryFilter !== 'all') {
    filteredTickets = filteredTickets.filter(t => t.category === categoryFilter);
  }
  if (searchQuery) {
    filteredTickets = filteredTickets.filter(t =>
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;

    TicketService.createTicket({
      employeeId: currentEmployee.id,
      category: ticketForm.category,
      subject: ticketForm.subject,
      description: ticketForm.description,
      priority: ticketForm.priority,
      assignedDepartmentId: ticketForm.assignedDepartmentId || undefined,
    });

    setIsCreateModalOpen(false);
    setTicketForm({
      category: 'IT',
      subject: '',
      description: '',
      priority: 'Medium',
      assignedDepartmentId: '',
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !commentText.trim()) return;

    const updated = TicketService.addComment(selectedTicket.id, {
      authorUserId: currentUser.id,
      authorName: currentUser.fullName,
      authorRole: currentUser.roleName,
      message: commentText.trim(),
      isInternalOnly: isInternalComment,
    });

    if (updated) setSelectedTicket(updated);
    setCommentText('');
  };

  const handleUpdateStatus = (status: TicketStatus) => {
    if (!selectedTicket) return;
    const updated = TicketService.updateStatus(selectedTicket.id, status, undefined, {
      id: currentUser.id,
      name: currentUser.fullName,
      role: currentUser.roleName,
    });
    if (updated) setSelectedTicket(updated);
  };

  const handleExportTickets = () => {
    const rows = filteredTickets.map(t => {
      const emp = EmployeeService.getById(t.employeeId);
      const assignee = EmployeeService.getById(t.assignedToEmployeeId || '');
      return {
        'Ticket ID': t.ticketCode,
        'Raised By': `${emp?.firstName} ${emp?.lastName}`,
        'Category': t.category,
        'Subject': t.subject,
        'Priority': t.priority,
        'Status': t.status,
        'Assignee': assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned',
        'Created Date': formatDate(t.createdAt),
      };
    });
    exportToExcel('NovaPulse_Helpdesk_Tickets.xlsx', 'Helpdesk Tickets', rows);
  };

  const ticketColumns: Column<Ticket>[] = [
    {
      key: 'code',
      header: 'Ticket ID & Subject',
      render: (t) => (
        <div>
          <div className="font-mono text-xs font-bold text-brand-800">{t.ticketCode}</div>
          <div className="font-bold text-slate-900 text-sm">{t.subject}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Priority',
      render: (t) => {
        const priorityColors: Record<TicketPriority, string> = {
          Urgent: 'bg-rose-100 text-rose-800 border-rose-300',
          High: 'bg-orange-100 text-orange-800 border-orange-300',
          Medium: 'bg-amber-100 text-amber-800 border-amber-300',
          Low: 'bg-slate-100 text-slate-700 border-slate-300',
        };
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              {t.category}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityColors[t.priority]}`}>
              {t.priority}
            </span>
          </div>
        );
      },
    },
    {
      key: 'creator',
      header: 'Raised By',
      render: (t) => {
        const emp = EmployeeService.getById(t.employeeId);
        return (
          <div>
            <div className="text-xs font-bold text-slate-800">{emp?.firstName} {emp?.lastName}</div>
            <div className="text-[11px] text-slate-400">{formatDate(t.createdAt)}</div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => {
        const mapVariant: any = {
          'Open': 'warning',
          'In Progress': 'info',
          'Resolved': 'success',
          'Closed': 'default',
        };
        return <Badge variant={mapVariant[t.status] || 'default'}>{t.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (t) => (
        <Button
          size="sm"
          variant="outline"
          className="text-xs px-2.5 py-1"
          onClick={() => setSelectedTicket(t)}
        >
          View Ticket
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Ticket Management
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentEmployee && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Raise New Ticket
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportTickets}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Tickets
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ticket # or subject..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none w-full sm:w-60 focus:border-brand-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Payroll">Payroll</option>
              <option value="Attendance">Attendance</option>
              <option value="Facilities">Facilities</option>
            </select>
          </div>
        </div>
      </div>

      <Table
        columns={ticketColumns}
        data={filteredTickets}
        keyExtractor={t => t.id}
        pageSize={10}
        emptyMessage="No tickets found matching your query."
      />

      {/* Raise Ticket Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Raise an Internal Support Ticket"
        subtitle="Route your query to the responsible department desk"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department Category"
              value={ticketForm.category}
              onChange={e => setTicketForm({ ...ticketForm, category: e.target.value as any })}
              required
            >
              <option value="IT">IT & Systems</option>
              <option value="HR">Human Resources</option>
              <option value="Payroll">Payroll & Tax</option>
              <option value="Attendance">Attendance</option>
              <option value="Facilities">Facilities & Office</option>
              <option value="Admin">Administration</option>
            </Select>

            <Select
              label="Priority Level"
              value={ticketForm.priority}
              onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
              required
            >
              <option value="Low">Low (SLA 72h)</option>
              <option value="Medium">Medium (SLA 48h)</option>
              <option value="High">High (SLA 24h)</option>
              <option value="Urgent">Urgent (SLA 12h)</option>
            </Select>
          </div>

          <Input
            label="Subject Line"
            placeholder="Brief summary of your request..."
            value={ticketForm.subject}
            onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detailed Description
            </label>
            <textarea
              rows={4}
              placeholder="Provide exact details or error messages..."
              value={ticketForm.description}
              onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-brand-700"
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Details & Discussion Thread Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`${selectedTicket.ticketCode}: ${selectedTicket.subject}`}
          subtitle={`Category: ${selectedTicket.category} • Priority: ${selectedTicket.priority}`}
          size="2xl"
        >
          <div className="space-y-6">
            {/* Status Header & Actions */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge variant={selectedTicket.status === 'Resolved' ? 'success' : 'info'}>
                  {selectedTicket.status}
                </Badge>
                <span className="text-xs text-slate-500">
                  SLA Target: {selectedTicket.slaHours} Hours
                </span>
              </div>

              {(isSuperAdmin || isHR || !isEmployee) && (
                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'Resolved' && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleUpdateStatus('Resolved')}
                    >
                      Mark Resolved
                    </Button>
                  )}
                  {selectedTicket.status !== 'Closed' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleUpdateStatus('Closed')}
                    >
                      Close Ticket
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Description
              </span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.description}
              </p>
            </div>

            {/* Discussion Thread */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Conversation History ({selectedTicket.comments?.length || 0})
              </h4>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No replies yet.</p>
                ) : (
                  selectedTicket.comments.map(c => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        c.isInternalOnly ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{c.authorName}</span>
                          <span className="text-[10px] text-brand-700 font-semibold">({c.authorRole})</span>
                          {c.isInternalOnly && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 rounded">
                              Internal Note
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleAddComment} className="pt-2 space-y-2">
                <textarea
                  rows={2}
                  placeholder="Type your response or update..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-brand-700"
                  required
                />
                <div className="flex items-center justify-between">
                  {(isSuperAdmin || isHR || !isEmployee) ? (
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={e => setIsInternalComment(e.target.checked)}
                        className="rounded text-brand-700"
                      />
                      <span>Internal staff note (hidden from employee)</span>
                    </label>
                  ) : <div />}
                  <Button size="sm" type="submit" leftIcon={<Send className="w-3.5 h-3.5" />}>
                    Send Reply
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
