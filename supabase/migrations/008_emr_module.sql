-- ============================================================
-- EMR Module: visits, SOAP notes, vitals
-- ============================================================

-- ── Visits ──────────────────────────────────────────────────
-- `visits` already exists from 001_initial_schema.sql (with doctor_id
-- correctly referencing doctors(id), not profiles(id)). Add the columns
-- this module needs instead of re-declaring the table.
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_type TEXT NOT NULL DEFAULT 'outpatient';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'visits_visit_type_check') THEN
    ALTER TABLE visits ADD CONSTRAINT visits_visit_type_check
      CHECK (visit_type IN ('outpatient','follow_up','emergency','teleconsult'));
  END IF;
END $$;

ALTER TABLE visits ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'visits_status_check') THEN
    ALTER TABLE visits ADD CONSTRAINT visits_status_check
      CHECK (status IN ('open','completed','cancelled'));
  END IF;
END $$;

-- soft delete
ALTER TABLE visits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── Vitals ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vitals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id        UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  recorded_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Measurements
  weight_kg       NUMERIC(5,2),
  height_cm       NUMERIC(5,1),
  bmi             NUMERIC(4,1) GENERATED ALWAYS AS (
                    CASE WHEN height_cm > 0 AND weight_kg IS NOT NULL
                    THEN ROUND((weight_kg / ((height_cm/100)^2))::NUMERIC, 1)
                    ELSE NULL END
                  ) STORED,
  temperature_c   NUMERIC(4,1),
  systolic_bp     SMALLINT,
  diastolic_bp    SMALLINT,
  pulse_bpm       SMALLINT,
  spo2_pct        SMALLINT,
  respiratory_rate SMALLINT,
  blood_glucose_mgdl NUMERIC(5,1),
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── SOAP Notes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS soap_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id        UUID NOT NULL UNIQUE REFERENCES visits(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

  -- SOAP
  subjective      TEXT,          -- HPI, history, complaints
  objective       TEXT,          -- Exam findings
  assessment      TEXT,          -- Diagnosis / impression
  plan            TEXT,          -- Treatment, referrals, instructions

  -- ICD-10
  diagnoses       JSONB DEFAULT '[]'::JSONB,
  -- shape: [{ code: "J06.9", description: "Acute URI", type: "primary|secondary" }]

  -- Follow-up
  follow_up_date  DATE,
  follow_up_notes TEXT,

  -- Signed by doctor
  signed_at       TIMESTAMPTZ,
  signed_by       UUID REFERENCES profiles(id),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_visits_patient    ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor     ON visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_date       ON visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_status     ON visits(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vitals_visit      ON vitals(visit_id);
CREATE INDEX IF NOT EXISTS idx_soap_visit        ON soap_notes(visit_id);

-- ── Updated-at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 001_initial_schema.sql already creates trg_visits_updated_at via its
-- generic per-table trigger loop; drop it first so this one doesn't collide.
DROP TRIGGER IF EXISTS trg_visits_updated_at ON visits;
CREATE TRIGGER trg_visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_soap_updated_at
  BEFORE UPDATE ON soap_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE visits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- visits: read
CREATE POLICY "visits_read" ON visits FOR SELECT
  USING (
    deleted_at IS NULL
    AND current_user_role() IN (
      'owner','admin','doctor','nurse','receptionist','accountant'
    )
  );

-- visits: insert — doctors, nurses, receptionists
CREATE POLICY "visits_insert" ON visits FOR INSERT
  WITH CHECK (
    current_user_role() IN ('owner','admin','doctor','nurse','receptionist')
  );

-- visits: update — doctor who owns it, or admin/owner
CREATE POLICY "visits_update" ON visits FOR UPDATE
  USING (
    current_user_role() IN ('owner','admin')
    OR (current_user_role() = 'doctor' AND doctor_id IN (
      SELECT id FROM doctors WHERE profile_id = auth.uid()
    ))
  );

-- vitals: read same as visits
CREATE POLICY "vitals_read" ON vitals FOR SELECT
  USING (
    current_user_role() IN ('owner','admin','doctor','nurse','receptionist')
  );

CREATE POLICY "vitals_insert" ON vitals FOR INSERT
  WITH CHECK (
    current_user_role() IN ('owner','admin','doctor','nurse')
  );

CREATE POLICY "vitals_update" ON vitals FOR UPDATE
  USING (
    current_user_role() IN ('owner','admin','nurse')
    OR recorded_by = auth.uid()
  );

-- soap_notes: doctors write, others read
CREATE POLICY "soap_read" ON soap_notes FOR SELECT
  USING (
    current_user_role() IN ('owner','admin','doctor','nurse')
  );

CREATE POLICY "soap_insert" ON soap_notes FOR INSERT
  WITH CHECK (
    current_user_role() IN ('owner','admin','doctor')
  );

CREATE POLICY "soap_update" ON soap_notes FOR UPDATE
  USING (
    -- Cannot edit after signed unless admin/owner
    (signed_at IS NULL AND (
      current_user_role() IN ('owner','admin')
      OR (current_user_role() = 'doctor' AND doctor_id = auth.uid())
    ))
    OR current_user_role() IN ('owner','admin')
  );
