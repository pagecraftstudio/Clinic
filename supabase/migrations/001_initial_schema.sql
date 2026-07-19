-- ============================================================
-- CLINIC MANAGEMENT SYSTEM — INITIAL SCHEMA
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- fuzzy search
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- accent-insensitive search

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'owner', 'admin', 'doctor', 'receptionist',
    'nurse', 'cashier', 'accountant', 'lab_technician',
    'radiology_technician', 'pharmacist', 'marketing', 'patient'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE blood_group AS ENUM (
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'scheduled', 'confirmed', 'checked_in', 'in_progress',
    'completed', 'cancelled', 'no_show', 'rescheduled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_type AS ENUM (
    'in_person', 'online', 'follow_up', 'urgent', 'routine'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'cash', 'card', 'bank_transfer', 'vodafone_cash', 'fawry', 'insurance'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'partial', 'paid', 'refunded', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM (
    'draft', 'issued', 'partial', 'paid', 'refunded', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lab_status AS ENUM (
    'requested', 'sample_collected', 'processing', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE radiology_status AS ENUM (
    'requested', 'scheduled', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_category AS ENUM (
    'medicine', 'supply', 'equipment', 'consumable'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE purchase_order_status AS ENUM (
    'draft', 'sent', 'partial', 'received', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'email', 'sms', 'whatsapp', 'push', 'in_app'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
    'pending', 'sent', 'delivered', 'failed', 'read'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE leave_status AS ENUM (
    'pending', 'approved', 'rejected', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'national_id', 'passport', 'insurance_card',
    'medical_report', 'lab_result', 'radiology', 'prescription', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Profiles (linked to auth.users)
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            user_role NOT NULL DEFAULT 'patient',
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  display_name    TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  language        TEXT NOT NULL DEFAULT 'en',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clinic settings (single row)
CREATE TABLE clinic_settings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  name_ar           TEXT,
  logo_url          TEXT,
  tagline           TEXT,
  tagline_ar        TEXT,
  phone             TEXT,
  phone_alt         TEXT,
  email             TEXT,
  address           TEXT,
  address_ar        TEXT,
  city              TEXT,
  country           TEXT DEFAULT 'EG',
  tax_number        TEXT,
  license_number    TEXT,
  currency          TEXT NOT NULL DEFAULT 'EGP',
  timezone          TEXT NOT NULL DEFAULT 'Africa/Cairo',
  date_format       TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  time_format       TEXT NOT NULL DEFAULT '12h',
  working_days      INT[] DEFAULT ARRAY[0,1,2,3,4],  -- 0=Sun..6=Sat
  working_hours_start TIME DEFAULT '08:00',
  working_hours_end   TIME DEFAULT '20:00',
  appointment_duration INT NOT NULL DEFAULT 30,       -- minutes
  primary_color     TEXT DEFAULT '#0066FF',
  theme             TEXT DEFAULT 'light',
  invoice_prefix    TEXT DEFAULT 'INV',
  invoice_notes     TEXT,
  invoice_footer    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = id)              -- allows upsert
);

-- Holidays
CREATE TABLE holidays (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  name_ar     TEXT,
  date        DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RBAC — Permissions
-- ============================================================

CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module      TEXT NOT NULL,     -- 'patients', 'billing', etc.
  action      TEXT NOT NULL,     -- 'read', 'write', 'delete', 'export'
  UNIQUE(module, action)
);

CREATE TABLE role_permissions (
  role        user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_id)
);

-- ============================================================
-- PATIENTS
-- ============================================================

CREATE TABLE patients (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  patient_number      TEXT UNIQUE NOT NULL,          -- auto-generated, e.g. PT-000001
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  first_name_ar       TEXT,
  last_name_ar        TEXT,
  full_name           TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  date_of_birth       DATE,
  gender              gender,
  blood_group         blood_group DEFAULT 'unknown',
  national_id         TEXT UNIQUE,
  passport_number     TEXT,
  phone               TEXT NOT NULL,
  phone_alt           TEXT,
  email               TEXT,
  address             TEXT,
  city                TEXT,
  governorate         TEXT,
  country             TEXT DEFAULT 'EG',
  occupation          TEXT,
  marital_status      TEXT,
  nationality         TEXT DEFAULT 'Egyptian',
  language_pref       TEXT DEFAULT 'ar',
  -- Medical
  allergies           TEXT[],
  chronic_diseases    TEXT[],
  current_medications TEXT[],
  notes               TEXT,
  -- Insurance
  insurance_company   TEXT,
  insurance_number    TEXT,
  insurance_expiry    DATE,
  -- Meta
  referred_by         UUID REFERENCES patients(id) ON DELETE SET NULL,
  source              TEXT,                          -- 'walk_in', 'online', 'referral'
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at          TIMESTAMPTZ,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patient emergency contacts
CREATE TABLE patient_emergency_contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  relation    TEXT NOT NULL,
  phone       TEXT NOT NULL,
  phone_alt   TEXT,
  is_primary  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patient documents
CREATE TABLE patient_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type          document_type NOT NULL,
  name          TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_size     INT,
  mime_type     TEXT,
  notes         TEXT,
  uploaded_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOCTORS
-- ============================================================

CREATE TABLE doctors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialty         TEXT NOT NULL,
  specialty_ar      TEXT,
  sub_specialty     TEXT,
  license_number    TEXT,
  bio               TEXT,
  bio_ar            TEXT,
  consultation_fee  NUMERIC(10,2),
  follow_up_fee     NUMERIC(10,2),
  color             TEXT DEFAULT '#3B82F6',    -- calendar color
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doctor working hours
CREATE TABLE doctor_schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  slot_duration INT NOT NULL DEFAULT 30,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(doctor_id, day_of_week)
);

-- Doctor leaves
CREATE TABLE doctor_leaves (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  reason        TEXT,
  status        leave_status NOT NULL DEFAULT 'pending',
  approved_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_number TEXT UNIQUE NOT NULL,           -- APT-000001
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration          INT NOT NULL DEFAULT 30,         -- minutes
  end_at            TIMESTAMPTZ,       -- maintained by trg_appointments_set_end_at below
  type              appointment_type NOT NULL DEFAULT 'in_person',
  status            appointment_status NOT NULL DEFAULT 'scheduled',
  chief_complaint   TEXT,
  notes             TEXT,
  checked_in_at     TIMESTAMPTZ,
  checked_out_at    TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancellation_reason TEXT,
  waiting_number    INT,
  is_online         BOOLEAN DEFAULT FALSE,
  online_link       TEXT,
  booked_by         UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- Waiting list
CREATE TABLE waiting_list (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  priority      INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  notes         TEXT,
  is_notified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ELECTRONIC MEDICAL RECORDS
-- ============================================================

CREATE TABLE visits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id       UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  visit_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- SOAP
  subjective      TEXT,       -- Chief complaint, HPI
  objective       TEXT,       -- Exam findings
  assessment      TEXT,       -- Diagnosis / impression
  plan            TEXT,       -- Treatment plan
  -- Additional
  chief_complaint TEXT,
  present_illness TEXT,
  past_history    TEXT,
  family_history  TEXT,
  social_history  TEXT,
  review_of_systems TEXT,
  physical_exam   TEXT,
  -- Follow-up
  follow_up_date  DATE,
  follow_up_notes TEXT,
  -- Meta
  is_finalized    BOOLEAN DEFAULT FALSE,
  finalized_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ICD-10 Diagnoses per visit
CREATE TABLE visit_diagnoses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id    UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  icd10_code  TEXT NOT NULL,
  description TEXT NOT NULL,
  is_primary  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vitals: created in 008_emr_module.sql instead (the app's actual column
-- names — systolic_bp/diastolic_bp/pulse_bpm/spo2_pct/blood_glucose_mgdl —
-- live there; this file used to duplicate the table with different, unused
-- column names, which shadowed the real one and broke migration 008).

-- ============================================================
-- PRESCRIPTIONS
-- ============================================================

CREATE TABLE prescriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_number TEXT UNIQUE NOT NULL,          -- RX-000001
  visit_id          UUID REFERENCES visits(id) ON DELETE SET NULL,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  prescribed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until       DATE,
  diagnosis         TEXT,
  notes             TEXT,
  is_dispensed      BOOLEAN DEFAULT FALSE,
  dispensed_at      TIMESTAMPTZ,
  dispensed_by      UUID REFERENCES profiles(id),
  pdf_url           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prescription_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id   UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name     TEXT NOT NULL,
  strength          TEXT,
  form              TEXT,              -- tablet, syrup, injection, etc.
  dosage            TEXT NOT NULL,
  frequency         TEXT NOT NULL,
  duration          TEXT NOT NULL,
  quantity          INT,
  route             TEXT,              -- oral, IV, topical, etc.
  instructions      TEXT,
  is_prn            BOOLEAN DEFAULT FALSE,   -- as needed
  sort_order        INT DEFAULT 0
);

-- ============================================================
-- BILLING
-- ============================================================

CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number    TEXT UNIQUE NOT NULL,             -- INV-000001
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id         UUID REFERENCES doctors(id) ON DELETE SET NULL,
  visit_id          UUID REFERENCES visits(id) ON DELETE SET NULL,
  appointment_id    UUID REFERENCES appointments(id) ON DELETE SET NULL,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date          DATE,
  status            invoice_status NOT NULL DEFAULT 'draft',
  subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_type     TEXT,              -- 'flat' | 'percent'
  discount_value    NUMERIC(10,2) DEFAULT 0,
  discount_amount   NUMERIC(12,2) DEFAULT 0,
  tax_percent       NUMERIC(5,2) DEFAULT 0,
  tax_amount        NUMERIC(12,2) DEFAULT 0,
  total             NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance           NUMERIC(12,2) GENERATED ALWAYS AS (total - paid_amount) STORED,
  currency          TEXT NOT NULL DEFAULT 'EGP',
  notes             TEXT,
  insurance_claim   TEXT,
  pdf_url           TEXT,
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE invoice_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,2) NOT NULL,
  discount        NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price - discount) STORED,
  sort_order      INT DEFAULT 0
);

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number  TEXT UNIQUE NOT NULL,              -- PAY-000001
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  amount          NUMERIC(12,2) NOT NULL,
  method          payment_method NOT NULL,
  reference       TEXT,                              -- card last4, transaction ID, etc.
  notes           TEXT,
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refunds (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount          NUMERIC(12,2) NOT NULL,
  reason          TEXT NOT NULL,
  refunded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refunded_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE suppliers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  contact     TEXT,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  notes       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  name_ar             TEXT,
  sku                 TEXT UNIQUE,
  barcode             TEXT UNIQUE,
  category            inventory_category NOT NULL DEFAULT 'supply',
  supplier_id         UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  unit                TEXT NOT NULL DEFAULT 'piece',
  unit_price          NUMERIC(12,2),
  selling_price       NUMERIC(12,2),
  current_stock       NUMERIC(10,3) NOT NULL DEFAULT 0,
  minimum_stock       NUMERIC(10,3) NOT NULL DEFAULT 0,
  maximum_stock       NUMERIC(10,3),
  reorder_point       NUMERIC(10,3),
  expiry_date         DATE,
  storage_location    TEXT,
  notes               TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_movements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id         UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  type            TEXT NOT NULL,  -- 'in', 'out', 'adjustment', 'return', 'expired'
  quantity        NUMERIC(10,3) NOT NULL,
  unit_cost       NUMERIC(12,2),
  reference_id    UUID,           -- purchase_order_id, invoice_id, etc.
  reference_type  TEXT,
  notes           TEXT,
  performed_by    UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number       TEXT UNIQUE NOT NULL,
  supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  status          purchase_order_status NOT NULL DEFAULT 'draft',
  ordered_at      TIMESTAMPTZ,
  expected_at     DATE,
  received_at     TIMESTAMPTZ,
  subtotal        NUMERIC(12,2) DEFAULT 0,
  tax_amount      NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) DEFAULT 0,
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id         UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id       UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity      NUMERIC(10,3) NOT NULL,
  unit_cost     NUMERIC(12,2) NOT NULL,
  received_qty  NUMERIC(10,3) DEFAULT 0,
  total         NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

-- ============================================================
-- LABORATORY
-- ============================================================

CREATE TABLE lab_tests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  name_ar     TEXT,
  code        TEXT UNIQUE,
  category    TEXT,
  unit        TEXT,
  normal_range TEXT,
  price       NUMERIC(10,2),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lab_orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      TEXT UNIQUE NOT NULL,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  visit_id          UUID REFERENCES visits(id) ON DELETE SET NULL,
  status            lab_status NOT NULL DEFAULT 'requested',
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sample_at         TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  notes             TEXT,
  technician_id     UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lab_order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id       UUID NOT NULL REFERENCES lab_tests(id) ON DELETE RESTRICT,
  result_value  TEXT,
  result_unit   TEXT,
  normal_range  TEXT,
  is_abnormal   BOOLEAN DEFAULT FALSE,
  notes         TEXT,
  completed_at  TIMESTAMPTZ
);

CREATE TABLE lab_attachments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  mime_type   TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RADIOLOGY
-- ============================================================

CREATE TABLE radiology_types (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,   -- 'X-Ray', 'MRI', 'CT', 'Ultrasound'
  name_ar     TEXT,
  price       NUMERIC(10,2),
  is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE radiology_orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      TEXT UNIQUE NOT NULL,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  visit_id          UUID REFERENCES visits(id) ON DELETE SET NULL,
  type_id           UUID NOT NULL REFERENCES radiology_types(id) ON DELETE RESTRICT,
  body_part         TEXT,
  clinical_info     TEXT,
  status            radiology_status NOT NULL DEFAULT 'requested',
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  findings          TEXT,
  impression        TEXT,
  technician_id     UUID REFERENCES profiles(id),
  radiologist_id    UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE radiology_attachments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES radiology_orders(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  mime_type     TEXT,
  is_dicom      BOOLEAN DEFAULT FALSE,
  uploaded_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notification_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  channel     notification_channel NOT NULL,
  event       TEXT NOT NULL,   -- 'appointment_reminder', 'payment_due', etc.
  subject     TEXT,
  body        TEXT NOT NULL,
  body_ar     TEXT,
  variables   TEXT[],          -- ['{{patient_name}}', '{{date}}']
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID REFERENCES patients(id) ON DELETE CASCADE,
  profile_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel       notification_channel NOT NULL,
  event         TEXT NOT NULL,
  subject       TEXT,
  body          TEXT NOT NULL,
  status        notification_status NOT NULL DEFAULT 'pending',
  scheduled_at  TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,
  read_at       TIMESTAMPTZ,
  error         TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI ASSISTANT
-- ============================================================

CREATE TABLE ai_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT,
  model       TEXT DEFAULT 'gpt-4o',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           TEXT NOT NULL,
  tokens_used       INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,    -- 'create', 'update', 'delete', 'login', etc.
  table_name    TEXT,
  record_id     UUID,
  old_data      JSONB,
  new_data      JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- ============================================================

CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  assigned_to   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date      TIMESTAMPTZ,
  is_completed  BOOLEAN DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  priority      TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  patient_id    UUID REFERENCES patients(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Patients
CREATE INDEX idx_patients_phone        ON patients(phone);
CREATE INDEX idx_patients_national_id  ON patients(national_id);
CREATE INDEX idx_patients_full_name    ON patients USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_patients_email        ON patients(email);
CREATE INDEX idx_patients_deleted      ON patients(deleted_at) WHERE deleted_at IS NULL;

-- Appointments
CREATE INDEX idx_appt_patient          ON appointments(patient_id);
CREATE INDEX idx_appt_doctor           ON appointments(doctor_id);
CREATE INDEX idx_appt_scheduled        ON appointments(scheduled_at);
CREATE INDEX idx_appt_status           ON appointments(status);
CREATE INDEX idx_appt_deleted          ON appointments(deleted_at) WHERE deleted_at IS NULL;

-- Visits
CREATE INDEX idx_visits_patient        ON visits(patient_id);
CREATE INDEX idx_visits_doctor         ON visits(doctor_id);
CREATE INDEX idx_visits_date           ON visits(visit_date);

-- Invoices
CREATE INDEX idx_invoices_patient      ON invoices(patient_id);
CREATE INDEX idx_invoices_status       ON invoices(status);
CREATE INDEX idx_invoices_date         ON invoices(issued_at);
CREATE INDEX idx_invoices_deleted      ON invoices(deleted_at) WHERE deleted_at IS NULL;

-- Payments
CREATE INDEX idx_payments_invoice      ON payments(invoice_id);
CREATE INDEX idx_payments_patient      ON payments(patient_id);

-- Lab
CREATE INDEX idx_lab_patient           ON lab_orders(patient_id);
CREATE INDEX idx_lab_status            ON lab_orders(status);

-- Radiology
CREATE INDEX idx_radio_patient         ON radiology_orders(patient_id);

-- Inventory
CREATE INDEX idx_inv_barcode           ON inventory_items(barcode);
CREATE INDEX idx_inv_category          ON inventory_items(category);

-- Notifications
CREATE INDEX idx_notif_profile         ON notifications(profile_id);
CREATE INDEX idx_notif_patient         ON notifications(patient_id);
CREATE INDEX idx_notif_status          ON notifications(status);

-- Audit
CREATE INDEX idx_audit_profile         ON audit_logs(profile_id);
CREATE INDEX idx_audit_table           ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_created         ON audit_logs(created_at);

-- AI
CREATE INDEX idx_ai_conv_profile       ON ai_conversations(profile_id);
CREATE INDEX idx_ai_msg_conv           ON ai_messages(conversation_id);

-- ============================================================
-- AUTO-UPDATE updated_at FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply trigger to all tables with updated_at
DO $$ DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'clinic_settings', 'doctors', 'doctor_leaves',
    'appointments', 'visits', 'prescriptions', 'invoices',
    'inventory_items', 'purchase_orders', 'lab_orders', 'radiology_orders',
    'notification_templates', 'suppliers', 'tasks', 'ai_conversations'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- AUTO-GENERATE SEQUENTIAL NUMBERS
-- ============================================================

CREATE SEQUENCE patient_number_seq START 1;
CREATE SEQUENCE appointment_number_seq START 1;
CREATE SEQUENCE prescription_number_seq START 1;
CREATE SEQUENCE invoice_number_seq START 1;
CREATE SEQUENCE payment_number_seq START 1;
CREATE SEQUENCE lab_order_number_seq START 1;
CREATE SEQUENCE radiology_order_number_seq START 1;
CREATE SEQUENCE po_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.patient_number = 'PT-' || LPAD(nextval('patient_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.appointment_number = 'APT-' || LPAD(nextval('appointment_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.prescription_number = 'RX-' || LPAD(nextval('prescription_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  prefix TEXT;
BEGIN
  SELECT invoice_prefix INTO prefix FROM clinic_settings LIMIT 1;
  NEW.invoice_number = COALESCE(prefix, 'INV') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.payment_number = 'PAY-' || LPAD(nextval('payment_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_lab_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.order_number = 'LAB-' || LPAD(nextval('lab_order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_radio_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.order_number = 'RAD-' || LPAD(nextval('radiology_order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.po_number = 'PO-' || LPAD(nextval('po_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_patients_number         BEFORE INSERT ON patients         FOR EACH ROW EXECUTE FUNCTION generate_patient_number();
CREATE TRIGGER trg_appointments_number     BEFORE INSERT ON appointments     FOR EACH ROW EXECUTE FUNCTION generate_appointment_number();

-- end_at can't be a GENERATED column: timestamptz + interval arithmetic is
-- STABLE (timezone-dependent), not IMMUTABLE, which Postgres rejects for
-- generated columns. Maintain it with a trigger instead.
CREATE OR REPLACE FUNCTION set_appointment_end_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.end_at := NEW.scheduled_at + (NEW.duration || ' minutes')::INTERVAL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_set_end_at
  BEFORE INSERT OR UPDATE OF scheduled_at, duration ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_appointment_end_at();
CREATE TRIGGER trg_prescriptions_number    BEFORE INSERT ON prescriptions    FOR EACH ROW EXECUTE FUNCTION generate_prescription_number();
CREATE TRIGGER trg_invoices_number         BEFORE INSERT ON invoices         FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();
CREATE TRIGGER trg_payments_number         BEFORE INSERT ON payments         FOR EACH ROW EXECUTE FUNCTION generate_payment_number();
CREATE TRIGGER trg_lab_orders_number       BEFORE INSERT ON lab_orders       FOR EACH ROW EXECUTE FUNCTION generate_lab_number();
CREATE TRIGGER trg_radiology_orders_number BEFORE INSERT ON radiology_orders FOR EACH ROW EXECUTE FUNCTION generate_radio_number();
CREATE TRIGGER trg_purchase_orders_number  BEFORE INSERT ON purchase_orders  FOR EACH ROW EXECUTE FUNCTION generate_po_number();

-- ============================================================
-- INVOICE TOTALS RECALCULATION
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_invoice()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_subtotal      NUMERIC(12,2);
  v_discount_amt  NUMERIC(12,2);
  v_tax_amt       NUMERIC(12,2);
  v_total         NUMERIC(12,2);
  inv             invoices%ROWTYPE;
BEGIN
  SELECT SUM(total) INTO v_subtotal
  FROM invoice_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  SELECT * INTO inv FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  v_subtotal     := COALESCE(v_subtotal, 0);
  v_discount_amt := CASE
    WHEN inv.discount_type = 'percent' THEN v_subtotal * COALESCE(inv.discount_value, 0) / 100
    ELSE COALESCE(inv.discount_value, 0)
  END;
  v_tax_amt      := (v_subtotal - v_discount_amt) * COALESCE(inv.tax_percent, 0) / 100;
  v_total        := v_subtotal - v_discount_amt + v_tax_amt;

  UPDATE invoices SET
    subtotal        = v_subtotal,
    discount_amount = v_discount_amt,
    tax_amount      = v_tax_amt,
    total           = v_total
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoice_items_recalc
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION recalculate_invoice();

-- ============================================================
-- PAYMENT → UPDATE INVOICE paid_amount
-- ============================================================

CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE invoices SET
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0) FROM payments
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ) - (
      SELECT COALESCE(SUM(amount), 0) FROM refunds
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    status = CASE
      WHEN (SELECT COALESCE(SUM(p.amount),0) FROM payments p WHERE p.invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id))
             - (SELECT COALESCE(SUM(r.amount),0) FROM refunds r WHERE r.invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id))
           >= total THEN 'paid'
      WHEN (SELECT COALESCE(SUM(p.amount),0) FROM payments p WHERE p.invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id))
             - (SELECT COALESCE(SUM(r.amount),0) FROM refunds r WHERE r.invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id))
           > 0 THEN 'partial'
      ELSE status
    END
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payments_update_invoice
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION update_invoice_paid_amount();

CREATE TRIGGER trg_refunds_update_invoice
AFTER INSERT OR UPDATE OR DELETE ON refunds
FOR EACH ROW EXECUTE FUNCTION update_invoice_paid_amount();

-- ============================================================
-- STOCK MOVEMENT → UPDATE current_stock
-- ============================================================

CREATE OR REPLACE FUNCTION update_stock_quantity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE inventory_items SET
    current_stock = (
      SELECT COALESCE(SUM(CASE WHEN type IN ('in', 'return') THEN quantity ELSE -quantity END), 0)
      FROM stock_movements
      WHERE item_id = NEW.item_id
    )
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stock_movement_update
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION update_stock_quantity();
