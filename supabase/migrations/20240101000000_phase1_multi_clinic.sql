-- ============================================================
-- PHASE 1: Multi-Clinic SaaS Support
-- ============================================================

-- ── 1. Clinics ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clinics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,                   -- subdomain / URL slug
  name          text NOT NULL,
  name_ar       text,
  logo_url      text,
  tagline       text,
  tagline_ar    text,
  phone         text,
  phone_alt     text,
  email         text,
  address       text,
  address_ar    text,
  city          text,
  country       text NOT NULL DEFAULT 'EG',
  tax_number    text,
  license_number text,
  currency      text NOT NULL DEFAULT 'EGP',
  timezone      text NOT NULL DEFAULT 'Africa/Cairo',
  date_format   text NOT NULL DEFAULT 'DD/MM/YYYY',
  time_format   text NOT NULL DEFAULT '12h',
  working_days  int[] NOT NULL DEFAULT '{0,1,2,3,4}',
  working_hours_start  text NOT NULL DEFAULT '09:00',
  working_hours_end    text NOT NULL DEFAULT '17:00',
  appointment_duration int NOT NULL DEFAULT 30,
  primary_color text NOT NULL DEFAULT '#2563eb',
  theme         text NOT NULL DEFAULT 'light',
  invoice_prefix text NOT NULL DEFAULT 'INV',
  invoice_notes text,
  invoice_footer text,
  is_active     boolean NOT NULL DEFAULT true,
  owner_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Clinic Users (membership table) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clinic_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id  uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'receptionist',
  is_active  boolean NOT NULL DEFAULT true,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, user_id)
);

-- ── 3. Clinic Invitations ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clinic_invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        text NOT NULL DEFAULT 'receptionist',
  token       text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 4. Add clinic_id to every business table ─────────────────────────────────

-- Helper: add clinic_id column if it doesn't exist
DO $$ BEGIN
  -- patients
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='clinic_id') THEN
    ALTER TABLE patients ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- doctors
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='clinic_id') THEN
    ALTER TABLE doctors ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- appointments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='clinic_id') THEN
    ALTER TABLE appointments ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- visits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='clinic_id') THEN
    ALTER TABLE visits ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- invoices
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='clinic_id') THEN
    ALTER TABLE invoices ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- inventory_items
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='clinic_id') THEN
    ALTER TABLE inventory_items ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- purchase_orders
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='clinic_id') THEN
    ALTER TABLE purchase_orders ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- notifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='clinic_id') THEN
    ALTER TABLE notifications ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- lab_requests
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lab_requests' AND column_name='clinic_id') THEN
    ALTER TABLE lab_requests ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- radiology_orders
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='radiology_orders' AND column_name='clinic_id') THEN
    ALTER TABLE radiology_orders ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- prescriptions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prescriptions' AND column_name='clinic_id') THEN
    ALTER TABLE prescriptions ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- holidays
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='holidays' AND column_name='clinic_id') THEN
    ALTER TABLE holidays ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- notification_templates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_templates' AND column_name='clinic_id') THEN
    ALTER TABLE notification_templates ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- ai_conversations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_conversations' AND column_name='clinic_id') THEN
    ALTER TABLE ai_conversations ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE;
  END IF;
  -- audit_logs (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='audit_logs') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='clinic_id') THEN
      ALTER TABLE audit_logs ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ── 5. Migrate existing data to a default clinic ─────────────────────────────

-- Create default clinic from existing clinic_settings (idempotent)
INSERT INTO clinics (id, slug, name, name_ar, logo_url, tagline, tagline_ar,
  phone, phone_alt, email, address, address_ar, city, country,
  tax_number, license_number, currency, timezone, date_format, time_format,
  working_days, working_hours_start, working_hours_end, appointment_duration,
  primary_color, theme, invoice_prefix, invoice_notes, invoice_footer)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'default',
  name, name_ar, logo_url, tagline, tagline_ar,
  phone, phone_alt, email, address, address_ar, city, country,
  tax_number, license_number, currency, timezone, date_format, time_format,
  working_days, working_hours_start, working_hours_end, appointment_duration,
  primary_color, theme, invoice_prefix, invoice_notes, invoice_footer
FROM clinic_settings
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Backfill clinic_id on all tables using default clinic
DO $$
DECLARE default_clinic_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  UPDATE patients        SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE doctors         SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE appointments    SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE invoices        SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE inventory_items SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE purchase_orders SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE notifications   SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE lab_requests    SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE radiology_orders SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE prescriptions   SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE holidays        SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  UPDATE notification_templates SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visits') THEN
    UPDATE visits SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ai_conversations') THEN
    UPDATE ai_conversations SET clinic_id = default_clinic_id WHERE clinic_id IS NULL;
  END IF;
END $$;

-- Enroll all existing staff in default clinic
INSERT INTO clinic_users (clinic_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', id, role
FROM profiles
WHERE role != 'patient'
ON CONFLICT (clinic_id, user_id) DO NOTHING;

-- ── 6. Make clinic_id NOT NULL after backfill ─────────────────────────────────

ALTER TABLE patients         ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE doctors          ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE appointments     ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE invoices         ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE inventory_items  ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE purchase_orders  ALTER COLUMN clinic_id SET NOT NULL;

-- ── 7. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_clinic_users_user        ON clinic_users(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic      ON clinic_users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_token ON clinic_invitations(token);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_email ON clinic_invitations(email);

CREATE INDEX IF NOT EXISTS idx_patients_clinic          ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic           ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic      ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic          ON invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_clinic         ON inventory_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_clinic   ON purchase_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_clinic      ON lab_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_radiology_orders_clinic  ON radiology_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic     ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_notifications_clinic     ON notifications(clinic_id);

-- ── 8. Helper function: get_active_clinic_id ─────────────────────────────────
-- Returns the clinic_id stored in the user's session config,
-- or their first clinic membership. Used in RLS policies.

CREATE OR REPLACE FUNCTION get_active_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT clinic_id
  FROM clinic_users
  WHERE user_id = auth.uid()
    AND is_active = true
  ORDER BY joined_at ASC
  LIMIT 1;
$$;

-- ── 9. RLS Policies ───────────────────────────────────────────────────────────

-- clinics
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinics_member_select" ON clinics
  FOR SELECT USING (
    id IN (SELECT clinic_id FROM clinic_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "clinics_owner_all" ON clinics
  FOR ALL USING (owner_id = auth.uid());

-- clinic_users
ALTER TABLE clinic_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_users_self_select" ON clinic_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "clinic_users_member_select" ON clinic_users
  FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM clinic_users WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "clinic_users_admin_all" ON clinic_users
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid() AND role IN ('owner','admin') AND is_active = true
    )
  );

-- clinic_invitations
ALTER TABLE clinic_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_invitations_admin_all" ON clinic_invitations
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_users
      WHERE user_id = auth.uid() AND role IN ('owner','admin') AND is_active = true
    )
  );

CREATE POLICY "clinic_invitations_by_token" ON clinic_invitations
  FOR SELECT USING (true); -- public token lookup for accept flow

-- Scoped RLS on business tables using get_active_clinic_id()
-- (only adding if not already present; use DROP POLICY IF EXISTS for idempotency)

DROP POLICY IF EXISTS "patients_clinic_scope" ON patients;
CREATE POLICY "patients_clinic_scope" ON patients
  FOR ALL USING (clinic_id = get_active_clinic_id());

DROP POLICY IF EXISTS "doctors_clinic_scope" ON doctors;
CREATE POLICY "doctors_clinic_scope" ON doctors
  FOR ALL USING (clinic_id = get_active_clinic_id());

DROP POLICY IF EXISTS "appointments_clinic_scope" ON appointments;
CREATE POLICY "appointments_clinic_scope" ON appointments
  FOR ALL USING (clinic_id = get_active_clinic_id());

DROP POLICY IF EXISTS "invoices_clinic_scope" ON invoices;
CREATE POLICY "invoices_clinic_scope" ON invoices
  FOR ALL USING (clinic_id = get_active_clinic_id());

DROP POLICY IF EXISTS "inventory_items_clinic_scope" ON inventory_items;
CREATE POLICY "inventory_items_clinic_scope" ON inventory_items
  FOR ALL USING (clinic_id = get_active_clinic_id());

DROP POLICY IF EXISTS "purchase_orders_clinic_scope" ON purchase_orders;
CREATE POLICY "purchase_orders_clinic_scope" ON purchase_orders
  FOR ALL USING (clinic_id = get_active_clinic_id());

DROP POLICY IF EXISTS "lab_requests_clinic_scope" ON lab_requests;
CREATE POLICY "lab_requests_clinic_scope" ON lab_requests
  FOR ALL USING (clinic_id = get_active_clinic_id());

DROP POLICY IF EXISTS "radiology_orders_clinic_scope" ON radiology_orders;
CREATE POLICY "radiology_orders_clinic_scope" ON radiology_orders
  FOR ALL USING (clinic_id = get_active_clinic_id());

DROP POLICY IF EXISTS "prescriptions_clinic_scope" ON prescriptions;
CREATE POLICY "prescriptions_clinic_scope" ON prescriptions
  FOR ALL USING (clinic_id = get_active_clinic_id());

DROP POLICY IF EXISTS "notifications_clinic_scope" ON notifications;
CREATE POLICY "notifications_clinic_scope" ON notifications
  FOR ALL USING (clinic_id = get_active_clinic_id());

-- ── 10. Updated_at triggers ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS clinics_updated_at ON clinics;
CREATE TRIGGER clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
