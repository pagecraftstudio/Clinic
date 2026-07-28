-- ============================================================
-- 017_patient_portal.sql
-- Patient portal: allow patients to book and cancel their own
-- appointments via the self-service portal.
--
-- The existing schema already links patients to auth users via
-- patients.profile_id → profiles.id → auth.users.id, and
-- my_patient_id() already resolves this correctly.
-- No schema changes are needed — only new RLS policies.
-- ============================================================

-- Allow patients to book appointments for themselves
CREATE POLICY "appt_insert_patient_self" ON appointments
  FOR INSERT WITH CHECK (
    patient_id = my_patient_id()
  );

-- Allow patients to cancel (update status) their own future appointments
CREATE POLICY "appt_cancel_patient_self" ON appointments
  FOR UPDATE USING (
    patient_id = my_patient_id()
  )
  WITH CHECK (
    patient_id = my_patient_id()
    -- Restrict what patients can change: only status → 'cancelled'
    -- (enforced in application layer; RLS just scopes the rows)
  );
