-- =============================================================================
-- 007_doctors.sql — Doctors module
-- =============================================================================
-- NOTE: `doctors` and `doctor_leaves` already exist from 001_initial_schema.sql.
-- This migration only *adds* the columns/objects introduced by the doctors
-- module, instead of re-declaring the tables (the original CREATE TABLE IF NOT
-- EXISTS blocks silently no-op'd against the 001 tables, so employee_number /
-- accepts_online / working_hours never actually got created).

-- Sequence for employee numbers
CREATE SEQUENCE IF NOT EXISTS doctor_employee_seq START 1;

-- ── doctors: new columns ─────────────────────────────────────────────────────
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS employee_number TEXT
  DEFAULT ('DR-' || LPAD(nextval('doctor_employee_seq')::TEXT, 5, '0'));
UPDATE doctors SET employee_number = 'DR-' || LPAD(nextval('doctor_employee_seq')::TEXT, 5, '0')
  WHERE employee_number IS NULL;
ALTER TABLE doctors ALTER COLUMN employee_number SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_employee_number_key') THEN
    ALTER TABLE doctors ADD CONSTRAINT doctors_employee_number_key UNIQUE (employee_number);
  END IF;
END $$;

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS accepts_online BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS working_hours  JSONB NOT NULL DEFAULT '[]'::JSONB;
ALTER TABLE doctors ALTER COLUMN consultation_fee SET DEFAULT 0;
ALTER TABLE doctors ALTER COLUMN follow_up_fee SET DEFAULT 0;
UPDATE doctors SET consultation_fee = 0 WHERE consultation_fee IS NULL;
UPDATE doctors SET follow_up_fee = 0 WHERE follow_up_fee IS NULL;
ALTER TABLE doctors ALTER COLUMN consultation_fee SET NOT NULL;
ALTER TABLE doctors ALTER COLUMN follow_up_fee SET NOT NULL;

-- ── doctor_leaves: new constraint ────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leave_dates_valid') THEN
    ALTER TABLE doctor_leaves ADD CONSTRAINT leave_dates_valid CHECK (end_date >= start_date);
  END IF;
END $$;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_doctors_profile_id  ON doctors(profile_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty    ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active    ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctor_leaves_doctor ON doctor_leaves(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_leaves_dates  ON doctor_leaves(start_date, end_date);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctors_updated_at ON doctors;
CREATE TRIGGER trg_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE doctors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_leaves ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active doctors (needed for appointment booking)
DROP POLICY IF EXISTS "doctors_read_authenticated" ON doctors;
CREATE POLICY "doctors_read_authenticated"
  ON doctors FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admin / owner can insert / update / delete
DROP POLICY IF EXISTS "doctors_write_admin" ON doctors;
CREATE POLICY "doctors_write_admin"
  ON doctors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "leaves_read_authenticated" ON doctor_leaves;
CREATE POLICY "leaves_read_authenticated"
  ON doctor_leaves FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "leaves_write_admin" ON doctor_leaves;
CREATE POLICY "leaves_write_admin"
  ON doctor_leaves FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
    )
  );

-- ── Seed data (example specialties) ──────────────────────────────────────────
-- Uncomment to add sample data:
-- INSERT INTO doctors (profile_id, specialty, consultation_fee, follow_up_fee, working_hours)
-- VALUES (...);
