-- Phase 5: Online Booking Upgrade
-- Run against your Supabase project

-- ── 1. doctor_ratings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_ratings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id       uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id      uuid REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id  uuid REFERENCES appointments(id) ON DELETE SET NULL,
  rating          smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         text,
  is_anonymous    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_ratings_doctor   ON doctor_ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_ratings_clinic   ON doctor_ratings(clinic_id);

-- ── 2. waiting_list ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waiting_list (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id       uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id      uuid REFERENCES patients(id) ON DELETE CASCADE,
  -- guest fields (when patient not registered)
  guest_name      text,
  guest_phone     text,
  guest_email     text,
  preferred_date  date NOT NULL,
  preferred_time  text,          -- 'morning' | 'afternoon' | 'any'
  type            text NOT NULL DEFAULT 'in_person',
  chief_complaint text,
  status          text NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting', 'notified', 'booked', 'cancelled', 'expired')),
  notified_at     timestamptz,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waiting_list_doctor ON waiting_list(doctor_id, preferred_date);
CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON waiting_list(clinic_id, status);

-- ── 3. appointment_settings — per-clinic booking config ───────────────────
-- Extend clinics table with booking config columns (idempotent)
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS booking_approval_required  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_hours         integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS reschedule_hours           integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS booking_advance_days       integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS guest_booking_enabled      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ratings_enabled            boolean NOT NULL DEFAULT true;

-- ── 4. appointments — add approval / reschedule fields ────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS approval_status    text CHECK (approval_status IN ('pending','approved','rejected')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approved_by        uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at        timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason   text,
  ADD COLUMN IF NOT EXISTS rescheduled_from   uuid REFERENCES appointments(id),
  ADD COLUMN IF NOT EXISTS guest_name         text,
  ADD COLUMN IF NOT EXISTS guest_phone        text,
  ADD COLUMN IF NOT EXISTS guest_email        text,
  ADD COLUMN IF NOT EXISTS is_guest           boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_appointments_approval ON appointments(clinic_id, approval_status) WHERE approval_status IS NOT NULL;

-- ── 5. RLS policies ────────────────────────────────────────────────────────
ALTER TABLE doctor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list   ENABLE ROW LEVEL SECURITY;

-- Ratings: clinic staff can read all; patients read own
CREATE POLICY "clinic_staff_ratings" ON doctor_ratings
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM clinic_users WHERE profile_id = auth.uid())
  );

CREATE POLICY "patient_own_ratings" ON doctor_ratings
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
  );

-- Waiting list: clinic staff all access; patient own rows
CREATE POLICY "clinic_staff_waiting_list" ON waiting_list
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM clinic_users WHERE profile_id = auth.uid())
  );

CREATE POLICY "patient_own_waiting_list" ON waiting_list
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
  );

-- ── 6. Materialized view: doctor_rating_summary ───────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS doctor_rating_summary AS
  SELECT
    doctor_id,
    clinic_id,
    COUNT(*)::int            AS total_ratings,
    ROUND(AVG(rating), 1)    AS avg_rating
  FROM doctor_ratings
  GROUP BY doctor_id, clinic_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_drs_doctor ON doctor_rating_summary(doctor_id);

-- Refresh helper (call via pg_cron or after each new rating insert)
-- SELECT refresh_materialized_view('doctor_rating_summary');
