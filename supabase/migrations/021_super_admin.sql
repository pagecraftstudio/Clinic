-- ============================================================
-- PHASE 15: Super Admin Platform Dashboard
-- ============================================================

-- ── 1. Platform-level admin flag (not clinic-scoped) ──────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- ── 2. Clinic lifecycle fields for admin management ───────────────────────────
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS internal_notes text;

-- ── 3. Feature flags ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text UNIQUE NOT NULL,
  name            text NOT NULL,
  description     text,
  is_enabled      boolean NOT NULL DEFAULT false,
  rollout_percent int NOT NULL DEFAULT 100 CHECK (rollout_percent BETWEEN 0 AND 100),
  clinic_id       uuid REFERENCES clinics(id) ON DELETE CASCADE, -- null = global flag
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 4. System announcements (banner shown to clinics) ─────────────────────────
CREATE TABLE IF NOT EXISTS system_announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  message     text NOT NULL,
  severity    text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_active   boolean NOT NULL DEFAULT true,
  starts_at   timestamptz NOT NULL DEFAULT now(),
  ends_at     timestamptz,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 5. Platform settings (key/value singleton store) ──────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false, "message": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── 6. Helper: is_super_admin() ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT p.is_super_admin FROM profiles p WHERE p.id = auth.uid()), false)
$$;

-- ── 7. RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_feature_flags" ON feature_flags;
CREATE POLICY "super_admin_all_feature_flags" ON feature_flags
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "staff_read_enabled_flags" ON feature_flags;
CREATE POLICY "staff_read_enabled_flags" ON feature_flags
  FOR SELECT USING (is_enabled = true);

DROP POLICY IF EXISTS "super_admin_all_announcements" ON system_announcements;
CREATE POLICY "super_admin_all_announcements" ON system_announcements
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "staff_read_active_announcements" ON system_announcements;
CREATE POLICY "staff_read_active_announcements" ON system_announcements
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "super_admin_all_platform_settings" ON platform_settings;
CREATE POLICY "super_admin_all_platform_settings" ON platform_settings
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "staff_read_platform_settings" ON platform_settings;
CREATE POLICY "staff_read_platform_settings" ON platform_settings
  FOR SELECT USING (true);

-- Super admin bypass: full visibility across ALL clinics (in addition to
-- existing per-membership policies already defined on `clinics`).
DROP POLICY IF EXISTS "super_admin_all_clinics" ON clinics;
CREATE POLICY "super_admin_all_clinics" ON clinics
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Super admin read access across clinic_users / profiles for platform stats.
DROP POLICY IF EXISTS "super_admin_read_clinic_users" ON clinic_users;
CREATE POLICY "super_admin_read_clinic_users" ON clinic_users
  FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "super_admin_read_profiles" ON profiles;
CREATE POLICY "super_admin_read_profiles" ON profiles
  FOR SELECT USING (is_super_admin());

-- Super admin read access to audit_logs across all clinics (support/monitoring).
DROP POLICY IF EXISTS "super_admin_read_audit_logs" ON audit_logs;
CREATE POLICY "super_admin_read_audit_logs" ON audit_logs
  FOR SELECT USING (is_super_admin());

-- Super admin read access to invoices across all clinics (revenue analytics).
DROP POLICY IF EXISTS "super_admin_read_invoices" ON invoices;
CREATE POLICY "super_admin_read_invoices" ON invoices
  FOR SELECT USING (is_super_admin());

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON system_announcements(is_active);
