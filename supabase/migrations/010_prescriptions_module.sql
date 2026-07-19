-- ─────────────────────────────────────────────────────────────────
-- 010 — Prescriptions module: indexes + RLS policies
-- ─────────────────────────────────────────────────────────────────

-- indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient     ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor      ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit       ON prescriptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_dispensed   ON prescriptions(is_dispensed);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed  ON prescriptions(prescribed_at DESC);

CREATE INDEX IF NOT EXISTS idx_prescription_items_rx     ON prescription_items(prescription_id);

-- ── RLS ──────────────────────────────────────────────────────────

ALTER TABLE prescriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

-- prescriptions: read
CREATE POLICY "prescriptions_read" ON prescriptions
  FOR SELECT USING (
    current_user_role() IN ('owner','admin','doctor','receptionist','nurse','pharmacist')
  );

-- prescriptions: insert (doctors, nurses, admins)
CREATE POLICY "prescriptions_insert" ON prescriptions
  FOR INSERT WITH CHECK (
    current_user_role() IN ('owner','admin','doctor','nurse')
  );

-- prescriptions: update
CREATE POLICY "prescriptions_update" ON prescriptions
  FOR UPDATE USING (
    current_user_role() IN ('owner','admin','doctor','pharmacist')
  );

-- prescriptions: delete (admin/owner only)
CREATE POLICY "prescriptions_delete" ON prescriptions
  FOR DELETE USING (
    current_user_role() IN ('owner','admin')
  );

-- prescription_items mirror parent access
CREATE POLICY "prescription_items_read" ON prescription_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_items.prescription_id
        AND current_user_role() IN ('owner','admin','doctor','receptionist','nurse','pharmacist')
    )
  );

CREATE POLICY "prescription_items_write" ON prescription_items
  FOR ALL USING (
    current_user_role() IN ('owner','admin','doctor','nurse')
  );
