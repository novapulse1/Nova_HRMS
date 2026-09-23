// MODULE 9: Geo-Location & Geofencing Perimeter Management
import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Compass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  Crosshair,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { GeoLocationService } from '../../services/geoLocationService';
import { AttendanceService } from '../../services/attendanceService';
import { EmployeeService } from '../../services/employeeService';
import { OfficeGeoLocation, Attendance } from '../../database/schema';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { StorageEngine } from '../../database/storageEngine';

export const GeoLocationModule: React.FC = () => {
  const { currentUser, isSuperAdmin, isHR } = useAuth();
  const { branches } = useOrganization();
  const [dataVersion, setDataVersion] = useState(0);

  // Modals & Test tools
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testLat, setTestLat] = useState<number>(28.6285);
  const [testLng, setTestLng] = useState<number>(77.3652);
  const [testResult, setTestResult] = useState<any>(null);

  // New Geofence Form
  const [geoForm, setGeoForm] = useState({
    name: '',
    branchId: 'branch-delhi-01',
    address: '',
    latitude: 28.6280,
    longitude: 77.3649,
    radiusMeters: 250,
    isRestricted: true,
    isActive: true,
  });

  useEffect(() => {
    const unsub = StorageEngine.subscribe(() => {
      setDataVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const geoLocations = GeoLocationService.getAll();
  const allAttendance = AttendanceService.getAll().filter(a => a.checkInLocation);

  const handleCreateGeo = (e: React.FormEvent) => {
    e.preventDefault();
    GeoLocationService.create({
      organizationId: 'org-novapulse-01',
      ...geoForm,
      latitude: Number(geoForm.latitude),
      longitude: Number(geoForm.longitude),
      radiusMeters: Number(geoForm.radiusMeters),
    });
    setIsAddModalOpen(false);
  };

  const handleTestGeofence = () => {
    const res = GeoLocationService.verifyGeofence(Number(testLat), Number(testLng));
    setTestResult(res);
  };

  const geoColumns: Column<OfficeGeoLocation>[] = [
    {
      key: 'name',
      header: 'Geofence Perimeter & Branch',
      render: (g) => {
        const branch = branches.find(b => b.id === g.branchId);
        return (
          <div>
            <div className="font-extrabold text-sm text-slate-900">{g.name}</div>
            <div className="text-xs text-slate-500">{branch?.name || 'Main HQ'}</div>
          </div>
        );
      },
    },
    {
      key: 'coordinates',
      header: 'GPS Coordinates',
      render: (g) => (
        <div className="font-mono text-xs text-slate-700">
          Lat: {g.latitude.toFixed(4)}, Lng: {g.longitude.toFixed(4)}
        </div>
      ),
    },
    {
      key: 'radius',
      header: 'Radius Perimeter',
      render: (g) => (
        <span className="font-bold text-xs text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
          {g.radiusMeters} Meters
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Enforcement Status',
      render: (g) => (
        <Badge variant={g.isActive ? 'success' : 'default'}>
          {g.isActive ? 'Active Enforcement' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Geo-Location & Geofencing
          </h2>
        </div>

        {(isSuperAdmin || isHR) && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Branch Geofence
          </Button>
        )}
      </div>

      {/* Geofence Perimeter Table */}
      <Table
        columns={geoColumns}
        data={geoLocations}
        keyExtractor={g => g.id}
        pageSize={10}
      />

      {/* Interactive Map Visualizer & Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Simulation Panel */}
        <div className="lg:col-span-7">
          <Card
            title="Interactive Office Geofence Visualizer"
            subtitle="Real-time boundary visualizer for multi-branch attendance"
          >
            <div className="relative h-80 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center p-6 text-center">
              {/* Simulated Map Grid */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Office Center Marker */}
              <div className="relative z-10 flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className="w-36 h-36 rounded-full bg-brand-500/20 border-2 border-brand-500/60 animate-ping absolute -inset-10"></div>
                  <div className="w-16 h-16 rounded-full bg-brand-800 text-white flex items-center justify-center text-2xl shadow-2xl relative z-10 border-2 border-brand-400">
                    <Building className="w-8 h-8" />
                  </div>
                </div>

                <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 text-white text-xs">
                  <div className="font-bold text-brand-300">Delhi NCR Corporate HQ (Noida Sector 62)</div>
                  <div className="text-[10px] text-slate-400">Active Geofence: 250m Radius • 100% Authorized</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* GPS Punch Tester */}
        <div className="lg:col-span-5">
          <Card
            title="GPS Punch Verification Simulator"
            subtitle="Test arbitrary GPS coordinates against authorized perimeters"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Test Latitude"
                  type="number"
                  step="0.0001"
                  value={testLat}
                  onChange={e => setTestLat(Number(e.target.value))}
                />
                <Input
                  label="Test Longitude"
                  type="number"
                  step="0.0001"
                  value={testLng}
                  onChange={e => setTestLng(Number(e.target.value))}
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleTestGeofence}
                leftIcon={<Crosshair className="w-4 h-4" />}
              >
                Verify Geofence Boundary
              </Button>

              {testResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                    testResult.isAuthorized
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {testResult.isAuthorized ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Inside Authorized Perimeter!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <span>Outside Office Perimeter (Breach)!</span>
                      </>
                    )}
                  </div>
                  <div>Distance to nearest branch: <span className="font-bold">{testResult.distanceMeters}m</span></div>
                  <div>Nearest Office: <span className="font-bold">{testResult.nearestBranch?.name}</span></div>
                  <div className="text-[11px] opacity-80">
                    {testResult.isAuthorized
                      ? 'Attendance punch will be accepted with verified office GPS tag.'
                      : 'Attendance will be flagged as remote / pending manager exception.'}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Geofence Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Branch Geofence"
        subtitle="Specify branch location and perimeter radius in meters"
      >
        <form onSubmit={handleCreateGeo} className="space-y-4">
          <Input
            label="Geofence Name"
            placeholder="e.g. Noida HQ Geofence"
            value={geoForm.name}
            onChange={e => setGeoForm({ ...geoForm, name: e.target.value })}
            required
          />

          <Select
            label="Assign to Branch"
            value={geoForm.branchId}
            onChange={e => setGeoForm({ ...geoForm, branchId: e.target.value })}
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <Input
            label="Physical Address"
            value={geoForm.address}
            onChange={e => setGeoForm({ ...geoForm, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="0.000001"
              value={geoForm.latitude}
              onChange={e => setGeoForm({ ...geoForm, latitude: Number(e.target.value) })}
              required
            />
            <Input
              label="Longitude"
              type="number"
              step="0.000001"
              value={geoForm.longitude}
              onChange={e => setGeoForm({ ...geoForm, longitude: Number(e.target.value) })}
              required
            />
          </div>

          <Input
            label="Authorized Radius (Meters)"
            type="number"
            value={geoForm.radiusMeters}
            onChange={e => setGeoForm({ ...geoForm, radiusMeters: Number(e.target.value) })}
            required
          />

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Geofence
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
