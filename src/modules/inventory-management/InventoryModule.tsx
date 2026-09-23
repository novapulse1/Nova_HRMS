// MODULE 8: Company Assets & Equipment Inventory Management
import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  UserCheck,
  RotateCcw,
  QrCode,
  Laptop,
  Smartphone,
  Fingerprint,
  Video,
  Monitor,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { InventoryService } from '../../services/inventoryService';
import { EmployeeService } from '../../services/employeeService';
import { AssetInventory, AssetCategory, AssetCondition, AssetStatus } from '../../database/schema';
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

export const InventoryModule: React.FC = () => {
  const { currentUser, currentEmployee, isSuperAdmin, isHR, isEmployee } = useAuth();
  const { branches } = useOrganization();
  const [dataVersion, setDataVersion] = useState(0);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetInventory | null>(null);

  // Forms
  const [assetForm, setAssetForm] = useState({
    assetTag: '',
    name: '',
    category: 'Laptop' as AssetCategory,
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 80000,
    warrantyExpiryDate: '2027-01-01',
    vendorName: '',
    vendorContact: '',
    condition: 'Brand New' as AssetCondition,
    branchId: 'branch-delhi-01',
  });

  const [allocateForm, setAllocateForm] = useState({
    employeeId: '',
    notes: '',
  });

  const [returnForm, setReturnForm] = useState({
    returnCondition: 'Good' as AssetCondition,
    notes: '',
  });

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const allAssets = InventoryService.getAll();
  const employees = EmployeeService.getAll();

  let filteredAssets = allAssets;
  if (isEmployee && currentEmployee) {
    filteredAssets = filteredAssets.filter(a => a.allocatedToEmployeeId === currentEmployee.id);
  }
  if (categoryFilter !== 'all') {
    filteredAssets = filteredAssets.filter(a => a.category === categoryFilter);
  }
  if (statusFilter !== 'all') {
    filteredAssets = filteredAssets.filter(a => a.status === statusFilter);
  }
  if (searchQuery) {
    filteredAssets = filteredAssets.filter(a =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = assetForm.assetTag || `NP-AST-${allAssets.length + 101}`;
    InventoryService.create({
      organizationId: 'org-novapulse-01',
      ...assetForm,
      assetTag: tag,
      status: 'Available',
    });
    setIsAddModalOpen(false);
  };

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    InventoryService.allocateAsset({
      assetId: selectedAsset.id,
      employeeId: allocateForm.employeeId,
      handledByEmployeeId: currentUser.employeeId,
      notes: allocateForm.notes,
    });
    setIsAllocateModalOpen(false);
    setSelectedAsset(null);
  };

  const handleReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    InventoryService.returnAsset({
      assetId: selectedAsset.id,
      handledByEmployeeId: currentUser.employeeId,
      returnCondition: returnForm.returnCondition,
      notes: returnForm.notes,
    });
    setIsReturnModalOpen(false);
    setSelectedAsset(null);
  };

  const handleExportAssets = () => {
    const rows = filteredAssets.map(a => {
      const emp = EmployeeService.getById(a.allocatedToEmployeeId || '');
      return {
        'Asset Tag': a.assetTag,
        'Asset Name': a.name,
        'Category': a.category,
        'Brand & Model': `${a.brand} ${a.model}`,
        'Serial Number': a.serialNumber,
        'Status': a.status,
        'Condition': a.condition,
        'Allocated To': emp ? `${emp.firstName} ${emp.lastName}` : 'Unallocated',
        'Purchase Cost': a.purchaseCost,
        'Warranty Expiry': a.warrantyExpiryDate,
      };
    });
    exportToExcel('NovaPulse_Asset_Inventory.xlsx', 'Assets', rows);
  };

  const assetColumns: Column<AssetInventory>[] = [
    {
      key: 'tag',
      header: 'Asset Tag & Item',
      render: (a) => (
        <div>
          <div className="font-mono text-xs font-bold text-brand-800">{a.assetTag}</div>
          <div className="font-extrabold text-sm text-slate-900">{a.name}</div>
          <div className="text-[11px] text-slate-400 font-mono">SN: {a.serialNumber}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Brand',
      render: (a) => (
        <div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block mb-0.5">
            {a.category}
          </span>
          <div className="text-xs text-slate-500">{a.brand} • {a.model}</div>
        </div>
      ),
    },
    {
      key: 'allocation',
      header: 'Custodian / Employee',
      render: (a) => {
        const emp = EmployeeService.getById(a.allocatedToEmployeeId || '');
        return emp ? (
          <div>
            <div className="text-xs font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
            <div className="text-[10px] text-slate-400 font-mono">Assigned {a.allocatedDate}</div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">In IT Storage</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status & Condition',
      render: (a) => {
        const mapVariant: any = {
          Available: 'success',
          Allocated: 'info',
          Maintenance: 'warning',
          Disposed: 'danger',
        };
        return (
          <div>
            <Badge variant={mapVariant[a.status] || 'default'}>{a.status}</Badge>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{a.condition}</div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="p-1.5"
            onClick={() => {
              setSelectedAsset(a);
              setIsQrModalOpen(true);
            }}
            title="Generate QR Label"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
          </Button>

          {(isSuperAdmin || isHR || !isEmployee) && (
            <>
              {a.status === 'Available' && (
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs px-2.5 py-1"
                  onClick={() => {
                    setSelectedAsset(a);
                    setIsAllocateModalOpen(true);
                  }}
                >
                  Allocate
                </Button>
              )}
              {a.status === 'Allocated' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs px-2.5 py-1"
                  onClick={() => {
                    setSelectedAsset(a);
                    setIsReturnModalOpen(true);
                  }}
                >
                  Return
                </Button>
              )}
            </>
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
            Company Assets & Equipment Inventory
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(isSuperAdmin || isHR || !isEmployee) && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add New Asset
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportAssets}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Register
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
              placeholder="Search asset, tag, serial..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none w-full sm:w-60 focus:border-brand-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Laptop">Laptops</option>
              <option value="Desktop">Desktop / Monitors</option>
              <option value="Biometric Device">Biometrics</option>
              <option value="CCTV Equipment">CCTV & Security</option>
              <option value="Mobile Phone">Mobile Phones</option>
              <option value="Furniture">Furniture</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Available">Available in Storage</option>
              <option value="Allocated">Allocated to Staff</option>
              <option value="Maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      <Table
        columns={assetColumns}
        data={filteredAssets}
        keyExtractor={a => a.id}
        pageSize={10}
        emptyMessage="No assets found."
      />

      {/* Add Asset Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Company Asset to Inventory"
        subtitle="Record asset tag, serial numbers, warranty, and vendor specs"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Asset Name"
              placeholder="e.g. MacBook Pro 14 M3"
              value={assetForm.name}
              onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
              required
            />
            <Input
              label="Asset Tag (Optional)"
              placeholder="e.g. NP-LAP-005"
              value={assetForm.assetTag}
              onChange={e => setAssetForm({ ...assetForm, assetTag: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={assetForm.category}
              onChange={e => setAssetForm({ ...assetForm, category: e.target.value as any })}
            >
              <option value="Laptop">Laptop</option>
              <option value="Desktop">Desktop / Monitor</option>
              <option value="Mobile Phone">Mobile Phone</option>
              <option value="SIM Card">SIM Card</option>
              <option value="Biometric Device">Biometric Device</option>
              <option value="CCTV Equipment">CCTV Equipment</option>
              <option value="Furniture">Furniture</option>
              <option value="Other Asset">Other Asset</option>
            </Select>

            <Input
              label="Serial Number"
              placeholder="e.g. C02G401ZMD6M"
              value={assetForm.serialNumber}
              onChange={e => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Brand"
              placeholder="e.g. Apple / Lenovo / Dell"
              value={assetForm.brand}
              onChange={e => setAssetForm({ ...assetForm, brand: e.target.value })}
              required
            />
            <Input
              label="Model"
              placeholder="e.g. ThinkPad T14s"
              value={assetForm.model}
              onChange={e => setAssetForm({ ...assetForm, model: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Purchase Cost (₹)"
              type="number"
              value={assetForm.purchaseCost}
              onChange={e => setAssetForm({ ...assetForm, purchaseCost: Number(e.target.value) })}
              required
            />
            <Input
              label="Warranty Expiry Date"
              type="date"
              value={assetForm.warrantyExpiryDate}
              onChange={e => setAssetForm({ ...assetForm, warrantyExpiryDate: e.target.value })}
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* Allocate Asset Modal */}
      {selectedAsset && (
        <Modal
          isOpen={isAllocateModalOpen}
          onClose={() => {
            setIsAllocateModalOpen(false);
            setSelectedAsset(null);
          }}
          title={`Allocate Asset — ${selectedAsset.name}`}
          subtitle={`Tag: ${selectedAsset.assetTag} • SN: ${selectedAsset.serialNumber}`}
        >
          <form onSubmit={handleAllocate} className="space-y-4">
            <Select
              label="Assign to Employee"
              value={allocateForm.employeeId}
              onChange={e => setAllocateForm({ ...allocateForm, employeeId: e.target.value })}
              required
            >
              <option value="">-- Choose Employee Custodian --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </Select>

            <Input
              label="Handover Notes & Condition"
              placeholder="e.g. Handed over with charger, laptop bag, and power adapter in mint condition."
              value={allocateForm.notes}
              onChange={e => setAllocateForm({ ...allocateForm, notes: e.target.value })}
            />

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAllocateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm Handover
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Return Asset Modal */}
      {selectedAsset && (
        <Modal
          isOpen={isReturnModalOpen}
          onClose={() => {
            setIsReturnModalOpen(false);
            setSelectedAsset(null);
          }}
          title={`Process Return — ${selectedAsset.name}`}
          subtitle={`Tag: ${selectedAsset.assetTag}`}
        >
          <form onSubmit={handleReturn} className="space-y-4">
            <Select
              label="Inspected Return Condition"
              value={returnForm.returnCondition}
              onChange={e => setReturnForm({ ...returnForm, returnCondition: e.target.value as any })}
            >
              <option value="Excellent">Excellent (No defects)</option>
              <option value="Good">Good (Normal wear)</option>
              <option value="Fair">Fair (Minor cosmetic scratches)</option>
              <option value="Damaged">Damaged (Requires Repair / Maintenance)</option>
            </Select>

            <Input
              label="Return Remarks"
              placeholder="e.g. Returned upon employee project transition with all original accessories."
              value={returnForm.notes}
              onChange={e => setReturnForm({ ...returnForm, notes: e.target.value })}
            />

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsReturnModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="success">
                Confirm Return & Restock
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* QR Code Tag Modal */}
      {selectedAsset && (
        <Modal
          isOpen={isQrModalOpen}
          onClose={() => {
            setIsQrModalOpen(false);
            setSelectedAsset(null);
          }}
          title="Asset QR Code Tag Label"
          subtitle="Printable physical barcode / QR label for asset tagging"
          size="sm"
        >
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="w-36 h-36 bg-white p-3 rounded-2xl border border-slate-300 mx-auto flex items-center justify-center shadow-sm">
              {/* Simulated QR Code Canvas */}
              <div className="text-center font-mono text-[10px] text-slate-800 space-y-1">
                <i className="fa-solid fa-qrcode text-6xl text-slate-900"></i>
                <div className="font-bold">{selectedAsset.assetTag}</div>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <div className="font-extrabold text-slate-900">{selectedAsset.name}</div>
              <div className="text-slate-500 font-mono">SN: {selectedAsset.serialNumber}</div>
              <div className="text-[10px] text-brand-800 font-bold uppercase">Property of NovaPulse Technologies</div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.print()}
            >
              Print Tag Label
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
