-- ============================================================
-- 019_patient_self_register.sql
-- Allow a patient to insert their own row in the patients table
-- during self-registration via the portal.
--
-- The existing "patients_insert" policy only permits staff roles
-- (owner/admin/receptionist/doctor), which means a newly signed-up
-- patient (role = 'patient') cannot create their own record —
-- the insert silently fails under RLS and getPortalPatient()
-- returns null, making the portal treat them as a guest.
--
-- Fix: add a policy that lets an authenticated user with role
-- 'patient' insert exactly one row where profile_id = auth.uid().
-- ============================================================

CREATE POLICY "patients_insert_self" ON patients
  FOR INSERT WITH CHECK (
    profile_id = auth.uid()
    AND (
      SELECT role FROM profiles WHERE id = auth.uid()
    ) = 'patient'
  );
