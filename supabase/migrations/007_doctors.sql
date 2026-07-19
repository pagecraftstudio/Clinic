-- =============================================================================
-- 007_doctors.sql — Doctors module
-- =============================================================================

-- ── doctors table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  employee_number   TEXT NOT NULL UNIQUE DEFAULT 'DR-' || LPAD(nextval('doctor_employee_seq')::TEXT, 5, '0'),
  specialty         TEXT NOT NULL,
  sub_specialty     TEXT,
  license_number    TEXT,
  consultation_fee  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  follow_up_fee     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bio               TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  accepts_online    BOOLEAN NOT NULL DEFAULT FALSE,
  working_hours     JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sequence for employee numbers
CREATE SEQUENCE IF NOT EXISTS doctor_employee_seq START 1;

-- ── doctor_leaves table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_leaves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  reason      TEXT,
  status      TEXT NOT NULL DEFAULT 'approved'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leave_dates_valid CHECK (end_date >= start_date)
);

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
CREATE POLICY "doctors_read_authenticated"
  ON doctors FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admin / owner can insert / update / delete
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

CREATE POLICY "leaves_read_authenticated"
  ON doctor_leaves FOR SELECT
  TO authenticated
  USING (TRUE);

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
