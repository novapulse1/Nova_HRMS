// Employee Master & Lifecycle Service
import { StorageEngine, STORAGE_KEYS } from '../database/storageEngine';
import { Employee } from '../database/schema';

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

  public static getDirectReports(managerEmployeeId: string): Employee[] {
    return this.getAll().filter(e => e.reportingManagerId === managerEmployeeId);
  }

  public static create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const id = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...employee,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return StorageEngine.insert<Employee>(STORAGE_KEYS.EMPLOYEES, newEmp);
  }

  public static update(id: string, updates: Partial<Employee>): Employee | undefined {
    return StorageEngine.update<Employee>(STORAGE_KEYS.EMPLOYEES, id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  public static delete(id: string): boolean {
    return StorageEngine.remove<Employee>(STORAGE_KEYS.EMPLOYEES, id);
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
