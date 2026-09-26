-- ====================================================================
-- NovaPulse HRMS — Migration: Add Tenant Slug & Subdomain Support
-- File: supabase/migrations/20260925_add_tenant_slug_and_subdomain.sql
-- Safe, Non-Destructive Migration with Backfill
-- ====================================================================

DO $$ 
BEGIN
  -- 1. Add slug column if it does not already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'slug'
  ) THEN
    ALTER TABLE tenants ADD COLUMN slug VARCHAR(64);
  END IF;
END $$;

-- 2. Backfill known seed/initial tenants with deterministic URL slugs
UPDATE tenants SET slug = 'novapulse' WHERE tenant_id = 'NP-000001' AND (slug IS NULL OR slug = '');
UPDATE tenants SET slug = 'apex' WHERE tenant_id = 'NP-000002' AND (slug IS NULL OR slug = '');
UPDATE tenants SET slug = 'zenith' WHERE tenant_id = 'NP-000003' AND (slug IS NULL OR slug = '');
UPDATE tenants SET slug = 'starlight' WHERE tenant_id = 'NP-000004' AND (slug IS NULL OR slug = '');
UPDATE tenants SET slug = 'quantum' WHERE tenant_id = 'NP-000005' AND (slug IS NULL OR slug = '');

-- 3. Safe fallback backfill for any other custom tenants
UPDATE tenants 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(company_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', ''))
WHERE slug IS NULL OR slug = '';

-- Fallback for empty strings if any
UPDATE tenants
SET slug = LOWER(client_code)
WHERE slug IS NULL OR slug = '';

-- 4. Create Unique Index & Constraint on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants (slug);
