-- ====================================================================
-- NOVAPULSE HRMS — OPERATIONAL MODULES & ENHANCEMENTS MIGRATION
-- NON-DESTRUCTIVE / SAFE INCREMENTAL SCRIPT
-- Safe to execute even if the foundation 8 tables already exist.
-- ====================================================================

-- 1. EXTENSIONS (IF NOT EXISTS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES / ENUMS (IF NOT EXISTS)
DO $$ BEGIN
  CREATE TYPE user_role_level AS ENUM ('super_admin', 'client_admin', 'manager', 'employee');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_status_type AS ENUM (
    'ACTIVE', 'TRIAL', 'PAYMENT_PENDING', 'ON_HOLD', 'SUSPENDED', 'CANCELLED', 'ARCHIVED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan_type AS ENUM (
    'Trial', 'Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'Enterprise Custom'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_type AS ENUM (
    'PAID', 'PARTIALLY_PAID', 'PENDING', 'OVERDUE', 'WAIVED', 'REFUNDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. COMPATIBILITY VIEWS
CREATE OR REPLACE VIEW tenant_users AS SELECT * FROM user_profiles;
CREATE OR REPLACE VIEW licences AS SELECT * FROM tenant_licenses;

-- 4. OPERATIONAL TABLE: SHIFTS
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(32) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  code VARCHAR(32) NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '18:00:00',
  grace_minutes INT NOT NULL DEFAULT 15,
  break_minutes INT NOT NULL DEFAULT 60,
  work_hours NUMERIC(4,2) NOT NULL DEFAULT 9.0,
  is_night_shift BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_shift_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_shifts_tenant_id ON shifts (tenant_id);

-- 5. OPERATIONAL TABLE: ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(32) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(64) NOT NULL DEFAULT 'Present',
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  check_in_ip VARCHAR(64),
  check_out_ip VARCHAR(64),
  work_hours NUMERIC(4,2) DEFAULT 0.0,
  overtime_hours NUMERIC(4,2) DEFAULT 0.0,
  late_minutes INT DEFAULT 0,
  early_departure_minutes INT DEFAULT 0,
  location_check_in JSONB,
  location_check_out JSONB,
  regularization JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_attendance_emp_date UNIQUE (tenant_id, employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant_id ON attendance (tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance (tenant_id, employee_id, date);

-- 6. OPERATIONAL TABLE: LEAVE REQUESTS
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(32) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(64) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC(4,1) NOT NULL DEFAULT 1.0,
  reason TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id ON leave_requests (tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests (tenant_id, employee_id);

-- 7. OPERATIONAL TABLE: TICKETS
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(32) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  ticket_number VARCHAR(64) NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  category VARCHAR(64) NOT NULL DEFAULT 'IT',
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(32) NOT NULL DEFAULT 'Medium',
  status VARCHAR(32) NOT NULL DEFAULT 'Open',
  assigned_to_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_ticket_tenant_num UNIQUE (tenant_id, ticket_number)
);

CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON tickets (tenant_id);

-- 8. OPERATIONAL TABLE: INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(32) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  asset_tag VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'Laptop',
  serial_number VARCHAR(128),
  make_model VARCHAR(128),
  purchase_date DATE,
  purchase_price NUMERIC(12,2) DEFAULT 0.00,
  condition VARCHAR(64) NOT NULL DEFAULT 'Good',
  status VARCHAR(64) NOT NULL DEFAULT 'Available',
  allocated_to_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  allocation_date DATE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_inventory_tenant_tag UNIQUE (tenant_id, asset_tag)
);

CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory (tenant_id);

-- 9. OPERATIONAL TABLE: PAYROLL
CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(32) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_month INT NOT NULL CHECK (payroll_month BETWEEN 1 AND 12),
  year INT NOT NULL CHECK (year >= 2020),
  basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  hra NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  conveyance_allowance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  gross_salary NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  epf_deduction NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  esi_deduction NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_deduction NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  net_salary NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) NOT NULL DEFAULT 'Draft',
  payment_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_payroll_tenant_emp_month UNIQUE (tenant_id, employee_id, payroll_month, year)
);

CREATE INDEX IF NOT EXISTS idx_payroll_tenant_id ON payroll (tenant_id);

-- 10. OPERATIONAL TABLE: NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(32) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (tenant_id, user_id, is_read);

-- 11. SECURITY DEFINER HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role_level AS $$
DECLARE
  v_role user_role_level;
BEGIN
  SELECT role INTO v_role
  FROM user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  RETURN COALESCE(v_role, 'employee'::user_role_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS VARCHAR(32) AS $$
DECLARE
  v_tenant_id VARCHAR(32);
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (get_current_user_role() = 'super_admin'::user_role_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_employee_id()
RETURNS UUID AS $$
DECLARE
  v_emp_id UUID;
BEGIN
  SELECT e.id INTO v_emp_id
  FROM employees e
  JOIN user_profiles up ON up.employee_id = e.employee_code AND up.tenant_id = e.tenant_id
  WHERE up.auth_user_id = auth.uid()
  LIMIT 1;
  RETURN v_emp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. STRICT LICENCE LIMIT TRIGGER
CREATE OR REPLACE FUNCTION enforce_tenant_licence_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_licence_limit INT;
  v_active_count INT;
  v_tenant_status VARCHAR(32);
BEGIN
  SELECT status::text, licensed_employees INTO v_tenant_status, v_licence_limit
  FROM tenants
  WHERE tenant_id = NEW.tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant % does not exist in registry.', NEW.tenant_id;
  END IF;

  IF v_tenant_status IN ('ON_HOLD', 'SUSPENDED', 'CANCELLED', 'ARCHIVED') THEN
    RAISE EXCEPTION 'Tenant % is currently %: Employee operations blocked while account is on hold.', NEW.tenant_id, v_tenant_status;
  END IF;

  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.employment_status NOT IN ('Active', 'Probation', 'Notice') AND NEW.employment_status IN ('Active', 'Probation', 'Notice')) THEN
    IF NEW.employment_status IN ('Active', 'Probation', 'Notice') THEN
      SELECT COUNT(*) INTO v_active_count
      FROM employees
      WHERE tenant_id = NEW.tenant_id
        AND employment_status IN ('Active', 'Probation', 'Notice')
        AND (TG_OP = 'INSERT' OR id <> NEW.id);

      IF (v_active_count + 1) > v_licence_limit THEN
        RAISE EXCEPTION 'Licence quota exceeded for Tenant %: Capacity is % seats, currently using % active seats. Please upgrade licences in Super Admin Panel.',
          NEW.tenant_id, v_licence_limit, v_active_count;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_tenant_licence_limit ON employees;
CREATE TRIGGER trg_check_tenant_licence_limit
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION enforce_tenant_licence_limit();

-- 13. ENABLE RLS ON OPERATIONAL TABLES
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 14. POLICIES FOR OPERATIONAL MODULES
DROP POLICY IF EXISTS p_shifts_super_admin ON shifts;
CREATE POLICY p_shifts_super_admin ON shifts FOR ALL USING (is_super_admin());
DROP POLICY IF EXISTS p_shifts_tenant ON shifts;
CREATE POLICY p_shifts_tenant ON shifts FOR ALL USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS p_attendance_super_admin ON attendance;
CREATE POLICY p_attendance_super_admin ON attendance FOR ALL USING (is_super_admin());
DROP POLICY IF EXISTS p_attendance_tenant ON attendance;
CREATE POLICY p_attendance_tenant ON attendance FOR ALL USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS p_leave_requests_super_admin ON leave_requests;
CREATE POLICY p_leave_requests_super_admin ON leave_requests FOR ALL USING (is_super_admin());
DROP POLICY IF EXISTS p_leave_requests_tenant ON leave_requests;
CREATE POLICY p_leave_requests_tenant ON leave_requests FOR ALL USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS p_tickets_super_admin ON tickets;
CREATE POLICY p_tickets_super_admin ON tickets FOR ALL USING (is_super_admin());
DROP POLICY IF EXISTS p_tickets_tenant ON tickets;
CREATE POLICY p_tickets_tenant ON tickets FOR ALL USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS p_inventory_super_admin ON inventory;
CREATE POLICY p_inventory_super_admin ON inventory FOR ALL USING (is_super_admin());
DROP POLICY IF EXISTS p_inventory_tenant ON inventory;
CREATE POLICY p_inventory_tenant ON inventory FOR ALL USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS p_payroll_super_admin ON payroll;
CREATE POLICY p_payroll_super_admin ON payroll FOR ALL USING (is_super_admin());
DROP POLICY IF EXISTS p_payroll_tenant ON payroll;
CREATE POLICY p_payroll_tenant ON payroll FOR ALL USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS p_notifications_super_admin ON notifications;
CREATE POLICY p_notifications_super_admin ON notifications FOR ALL USING (is_super_admin());
DROP POLICY IF EXISTS p_notifications_tenant ON notifications;
CREATE POLICY p_notifications_tenant ON notifications FOR ALL USING (tenant_id = get_current_user_tenant_id());
