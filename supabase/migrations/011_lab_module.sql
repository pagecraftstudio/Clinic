-- ─────────────────────────────────────────────────────────────────
-- 011 — Laboratory module: tables, indexes, triggers, RLS
-- ─────────────────────────────────────────────────────────────────

-- ── Tables ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lab_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number   TEXT NOT NULL UNIQUE,
  visit_id         UUID REFERENCES visits(id) ON DELETE SET NULL,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id        UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  technician_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','collected','processing','completed','cancelled')),
  priority         TEXT NOT NULL DEFAULT 'routine'
                     CHECK (priority IN ('routine','urgent','stat')),
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  collected_at     TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  diagnosis        TEXT,
  clinical_notes   TEXT,
  report_notes     TEXT,
  attachment_url   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_results (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_request_id   UUID NOT NULL REFERENCES lab_requests(id) ON DELETE CASCADE,
  test_name        TEXT NOT NULL,
  value            TEXT,
  unit             TEXT,
  reference_range  TEXT,
  is_abnormal      BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Auto-number trigger ──────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS lab_request_seq START 1000;

CREATE OR REPLACE FUNCTION set_lab_request_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.request_number = 'LB-TMP' THEN
    NEW.request_number := 'LB-' || LPAD(nextval('lab_request_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lab_request_number ON lab_requests;
CREATE TRIGGER trg_lab_request_number
  BEFORE INSERT ON lab_requests
  FOR EACH ROW EXECUTE FUNCTION set_lab_request_number();

-- ── updated_at triggers ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_lab_requests_updated ON lab_requests;
CREATE TRIGGER trg_lab_requests_updated
  BEFORE UPDATE ON lab_requests
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_lab_results_updated ON lab_results;
CREATE TRIGGER trg_lab_results_updated
  BEFORE UPDATE ON lab_results
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_lab_requests_patient    ON lab_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_doctor     ON lab_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_status     ON lab_requests(status);
CREATE INDEX IF NOT EXISTS idx_lab_requests_priority   ON lab_requests(priority);
CREATE INDEX IF NOT EXISTS idx_lab_requests_requested  ON lab_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_results_request     ON lab_results(lab_request_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_abnormal    ON lab_results(is_abnormal) WHERE is_abnormal = TRUE;

-- ── RLS ──────────────────────────────────────────────────────────

ALTER TABLE lab_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results  ENABLE ROW LEVEL SECURITY;

-- lab_requests: read
CREATE POLICY "lab_requests_read" ON lab_requests
  FOR SELECT USING (
    current_user_role() IN ('owner','admin','doctor','receptionist','nurse','lab_technician')
  );

-- lab_requests: insert
CREATE POLICY "lab_requests_insert" ON lab_requests
  FOR INSERT WITH CHECK (
    current_user_role() IN ('owner','admin','doctor','nurse')
  );

-- lab_requests: update (status + results by technician)
CREATE POLICY "lab_requests_update" ON lab_requests
  FOR UPDATE USING (
    current_user_role() IN ('owner','admin','doctor','lab_technician')
  );

-- lab_requests: delete
CREATE POLICY "lab_requests_delete" ON lab_requests
  FOR DELETE USING (
    current_user_role() IN ('owner','admin')
  );

-- lab_results: mirror parent access
CREATE POLICY "lab_results_read" ON lab_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lab_requests r
      WHERE r.id = lab_results.lab_request_id
        AND current_user_role() IN ('owner','admin','doctor','receptionist','nurse','lab_technician')
    )
  );

CREATE POLICY "lab_results_write" ON lab_results
  FOR ALL USING (
    current_user_role() IN ('owner','admin','doctor','lab_technician')
  );
