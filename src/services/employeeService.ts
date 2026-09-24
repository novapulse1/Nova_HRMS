// Employee Master & Lifecycle Service with Supabase PostgreSQL Integration
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { Employee } from '../database/schema';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export class EmployeeService {
  public static getAll(): Employee[] {
    return StorageEngine.getList<Employee>(STORAGE_KEYS.EMPLOYEES);
  }

  public static getById(id: string): Employee | undefined {
    const list = this.getAll();
    return list.find(e => e.id === id);
  }

  public static getByCode(code: string): Employee | undefined {
    const list = this.getAll();
    return list.find(e => e.employeeCode.toLowerCase() === code.toLowerCase());
  }

  public static getByDepartment(departmentId: string): Employee[] {
    return this.getAll().filter(e => e.departmentId === departmentId);
  }

  public static getByBranch(branchId: string): Employee[] {
    return this.getAll().filter(e => e.branchId === branchId);
  }

  public static getLicenceUsage(tenantId: string) {
    const tenants = StorageEngine.getList<any>(STORAGE_KEYS.TENANTS);
    const tenant = tenants.find(t => t.id === tenantId || t.tenantId === tenantId) || tenants[0];
    const total = tenant?.licensedEmployees || 20;

    const all = this.getAll();
    const active = all.filter(
      e => (e.organizationId === tenantId || (e as any).tenantId === tenantId || (e as any).organizationId === tenant?.id) &&
           e.employmentStatus === 'Active'
    ).length;

    const available = Math.max(0, total - active);
    const percentage = total > 0 ? Math.round((active / total) * 100) : 0;
    const isLimitReached = active >= total;

    return {
      total,
      used: active,
      available,
      percentage,
      isLimitReached,
      tenantName: tenant?.companyName || 'NovaPulse Organization'
    };
  }

  public static create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const tenantId = employee.organizationId || StorageEngine.getActiveTenantId();
    const usage = this.getLicenceUsage(tenantId);

    // Enforce hard licence limit at backend level
    if (employee.employmentStatus === 'Active' && usage.isLimitReached) {
      throw new Error(
        'Your employee licence limit has been reached. Please contact NovaPulse Admin to increase your licence limit.'
      );
    }

    const id = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...employee,
      organizationId: tenantId,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const inserted = StorageEngine.insert<Employee>(STORAGE_KEYS.EMPLOYEES, newEmp);

    // Sync to Supabase PostgreSQL table if configured
    if (isSupabaseConfigured()) {
      supabase.from('employees').insert({
        tenant_id: tenantId,
        employee_code: newEmp.employeeCode,
        first_name: newEmp.firstName,
        last_name: newEmp.lastName,
        email: newEmp.email,
        phone: newEmp.phone,
        personal_email: newEmp.personalEmail,
        dob: newEmp.dob,
        gender: newEmp.gender,
        joining_date: newEmp.joiningDate,
        employment_type: newEmp.employmentType,
        employment_status: newEmp.employmentStatus,
        salary_structure: newEmp.salaryStructure,
        bank_details: newEmp.bankDetails,
        statutory_details: newEmp.statutoryDetails,
        emergency_contact: newEmp.emergencyContact,
        avatar_url: newEmp.avatarUrl,
        is_active: newEmp.employmentStatus === 'Active',
      }).then(({ error }) => {
        if (error) console.error('Supabase employee insert error:', error);
      });
    }

    return inserted;
  }

  public static update(id: string, updates: Partial<Employee>): Employee | undefined {
    const updated = StorageEngine.update<Employee>(STORAGE_KEYS.EMPLOYEES, id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (isSupabaseConfigured() && updated) {
      supabase.from('employees').update({
        employment_status: updated.employmentStatus,
        is_active: updated.employmentStatus === 'Active',
        first_name: updated.firstName,
        last_name: updated.lastName,
        email: updated.email,
        phone: updated.phone,
      }).eq('employee_code', updated.employeeCode)
        .then(({ error }) => {
          if (error) console.error('Supabase employee update error:', error);
        });
    }

    return updated;
  }

  public static delete(id: string): boolean {
    const emp = this.getById(id);
    const removed = StorageEngine.remove<Employee>(STORAGE_KEYS.EMPLOYEES, id);

    if (isSupabaseConfigured() && emp) {
      supabase.from('employees').delete().eq('employee_code', emp.employeeCode)
        .then(({ error }) => {
          if (error) console.error('Supabase employee delete error:', error);
        });
    }

    return removed;
  }

  public static updateStatus(
    id: string,
    status: Employee['employmentStatus'],
    options?: { resignationDate?: string; exitDate?: string; relievingReason?: string }
  ): Employee | undefined {
    return this.update(id, {
      employmentStatus: status,
      resignationDate: options?.resignationDate,
      exitDate: options?.exitDate,
      relievingReason: options?.relievingReason,
    });
  }
}
