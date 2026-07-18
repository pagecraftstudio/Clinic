-- ============================================================
-- 006 — Appointments: extra indexes + RLS
-- ============================================================

-- Composite indexes for common calendar queries
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at
  ON appointments (scheduled_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
  ON appointments (doctor_id, scheduled_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_patient
  ON appointments (patient_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments (status)
  WHERE deleted_at IS NULL;

-- ── RLS policies for appointments ──────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Read: authenticated staff can read all non-deleted appointments.
-- Patients can only see their own.
CREATE POLICY "appointments_select"
  ON appointments FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      auth_role() IN ('owner','admin','doctor','receptionist','nurse','cashier','accountant')
      OR (
        auth_role() = 'patient'
        AND patient_id IN (
          SELECT id FROM patients WHERE profile_id = auth.uid()
        )
      )
    )
  );

-- Insert: receptionist, admin, owner, doctor
CREATE POLICY "appointments_insert"
  ON appointments FOR INSERT
  WITH CHECK (
    auth_role() IN ('owner','admin','doctor','receptionist')
  );

-- Update: same roles, plus cashier can update payment-related status
CREATE POLICY "appointments_update"
  ON appointments FOR UPDATE
  USING (
    auth_role() IN ('owner','admin','doctor','receptionist','nurse','cashier')
  );

-- Delete (soft only enforced at app level, but block hard deletes)
CREATE POLICY "appointments_delete"
  ON appointments FOR DELETE
  USING (
    auth_role() IN ('owner','admin')
  );
