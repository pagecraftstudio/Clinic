-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- Migration: 002_rls_policies.sql
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Check if current user has a specific role
CREATE OR REPLACE FUNCTION has_role(check_role user_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = check_role
  );
$$;

-- Check if current user has any of the given roles
CREATE OR REPLACE FUNCTION has_any_role(check_roles user_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ANY(check_roles)
  );
$$;

-- Check if user has permission on a module/action
CREATE OR REPLACE FUNCTION has_permission(p_module TEXT, p_action TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles pr
    JOIN role_permissions rp ON rp.role = pr.role
    JOIN permissions p ON p.id = rp.permission_id
    WHERE pr.id = auth.uid()
      AND p.module = p_module
      AND p.action = p_action
  );
$$;

-- Clinical staff (can access patient records)
CREATE OR REPLACE FUNCTION is_clinical_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT has_any_role(ARRAY['owner','admin','doctor','nurse','receptionist',
    'lab_technician','radiology_technician','pharmacist']::user_role[]);
$$;

-- Admin or owner
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT has_any_role(ARRAY['owner','admin']::user_role[]);
$$;

-- Get current user's linked doctor id
CREATE OR REPLACE FUNCTION my_doctor_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM doctors WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- Get current user's linked patient id
CREATE OR REPLACE FUNCTION my_patient_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM patients WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_leaves             ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list              ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_diagnoses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements           ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_attachments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_types           ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_attachments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (is_admin());

-- All authenticated staff can view other profiles (for dropdowns)
CREATE POLICY "profiles_select_staff" ON profiles
  FOR SELECT USING (is_clinical_staff());

-- ============================================================
-- CLINIC SETTINGS
-- ============================================================

CREATE POLICY "clinic_settings_select_all" ON clinic_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "clinic_settings_modify_admin" ON clinic_settings
  FOR ALL USING (is_admin());

-- ============================================================
-- HOLIDAYS
-- ============================================================

CREATE POLICY "holidays_select_all" ON holidays
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "holidays_modify_admin" ON holidays
  FOR ALL USING (is_admin());

-- ============================================================
-- PERMISSIONS / ROLE_PERMISSIONS
-- ============================================================

CREATE POLICY "permissions_select_all" ON permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "permissions_modify_admin" ON permissions
  FOR ALL USING (is_admin());

CREATE POLICY "role_permissions_select_all" ON role_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "role_permissions_modify_admin" ON role_permissions
  FOR ALL USING (is_admin());

-- ============================================================
-- PATIENTS
-- ============================================================

-- Clinical staff read all patients
CREATE POLICY "patients_select_clinical" ON patients
  FOR SELECT USING (is_clinical_staff());

-- Patients read only their own record
CREATE POLICY "patients_select_own" ON patients
  FOR SELECT USING (profile_id = auth.uid());

-- Receptionist/admin/owner can create patients
CREATE POLICY "patients_insert" ON patients
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['owner','admin','receptionist','doctor']::user_role[])
  );

-- Clinical staff can update patients (not delete)
CREATE POLICY "patients_update" ON patients
  FOR UPDATE USING (is_clinical_staff());

-- Only owner/admin can soft-delete (set deleted_at)
CREATE POLICY "patients_delete_admin" ON patients
  FOR DELETE USING (is_admin());

-- Emergency contacts
CREATE POLICY "emerg_contacts_select" ON patient_emergency_contacts
  FOR SELECT USING (
    is_clinical_staff() OR
    patient_id = my_patient_id()
  );

CREATE POLICY "emerg_contacts_modify" ON patient_emergency_contacts
  FOR ALL USING (is_clinical_staff());

-- Documents
CREATE POLICY "patient_docs_select" ON patient_documents
  FOR SELECT USING (
    is_clinical_staff() OR
    patient_id = my_patient_id()
  );

CREATE POLICY "patient_docs_modify" ON patient_documents
  FOR ALL USING (is_clinical_staff());

-- ============================================================
-- DOCTORS
-- ============================================================

CREATE POLICY "doctors_select_all_auth" ON doctors
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "doctors_modify_admin" ON doctors
  FOR ALL USING (is_admin());

CREATE POLICY "doctor_schedules_select" ON doctor_schedules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "doctor_schedules_modify_admin" ON doctor_schedules
  FOR ALL USING (is_admin() OR profile_id IN (SELECT profile_id FROM doctors WHERE id = doctor_id));

CREATE POLICY "doctor_leaves_select" ON doctor_leaves
  FOR SELECT USING (is_clinical_staff() OR
    doctor_id = my_doctor_id()
  );

CREATE POLICY "doctor_leaves_insert" ON doctor_leaves
  FOR INSERT WITH CHECK (
    is_admin() OR doctor_id = my_doctor_id()
  );

CREATE POLICY "doctor_leaves_update" ON doctor_leaves
  FOR UPDATE USING (
    is_admin() OR doctor_id = my_doctor_id()
  );

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE POLICY "appt_select_staff" ON appointments
  FOR SELECT USING (is_clinical_staff());

CREATE POLICY "appt_select_patient" ON appointments
  FOR SELECT USING (patient_id = my_patient_id());

CREATE POLICY "appt_select_doctor" ON appointments
  FOR SELECT USING (doctor_id = my_doctor_id());

CREATE POLICY "appt_insert" ON appointments
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['owner','admin','receptionist','doctor']::user_role[])
  );

CREATE POLICY "appt_update_staff" ON appointments
  FOR UPDATE USING (is_clinical_staff());

CREATE POLICY "appt_delete_admin" ON appointments
  FOR DELETE USING (is_admin());

-- Waiting list
CREATE POLICY "waiting_select_staff" ON waiting_list
  FOR SELECT USING (is_clinical_staff());

CREATE POLICY "waiting_modify_staff" ON waiting_list
  FOR ALL USING (is_clinical_staff());

-- ============================================================
-- EMR — VISITS
-- ============================================================

CREATE POLICY "visits_select_clinical" ON visits
  FOR SELECT USING (is_clinical_staff());

CREATE POLICY "visits_select_patient" ON visits
  FOR SELECT USING (patient_id = my_patient_id());

CREATE POLICY "visits_select_doctor" ON visits
  FOR SELECT USING (doctor_id = my_doctor_id());

CREATE POLICY "visits_insert_clinical" ON visits
  FOR INSERT WITH CHECK (is_clinical_staff());

CREATE POLICY "visits_update_doctor" ON visits
  FOR UPDATE USING (
    is_admin() OR doctor_id = my_doctor_id()
  );

-- Visit diagnoses
CREATE POLICY "diagnoses_select" ON visit_diagnoses
  FOR SELECT USING (
    is_clinical_staff() OR
    visit_id IN (SELECT id FROM visits WHERE patient_id = my_patient_id())
  );

CREATE POLICY "diagnoses_modify" ON visit_diagnoses
  FOR ALL USING (is_clinical_staff());

-- Vitals
CREATE POLICY "vitals_select_clinical" ON vitals
  FOR SELECT USING (is_clinical_staff());

CREATE POLICY "vitals_select_patient" ON vitals
  FOR SELECT USING (patient_id = my_patient_id());

CREATE POLICY "vitals_insert_clinical" ON vitals
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['owner','admin','doctor','nurse']::user_role[])
  );

CREATE POLICY "vitals_update_clinical" ON vitals
  FOR UPDATE USING (
    has_any_role(ARRAY['owner','admin','doctor','nurse']::user_role[])
  );

-- ============================================================
-- PRESCRIPTIONS
-- ============================================================

CREATE POLICY "rx_select_clinical" ON prescriptions
  FOR SELECT USING (is_clinical_staff());

CREATE POLICY "rx_select_patient" ON prescriptions
  FOR SELECT USING (patient_id = my_patient_id());

CREATE POLICY "rx_insert" ON prescriptions
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['owner','admin','doctor']::user_role[])
  );

CREATE POLICY "rx_update" ON prescriptions
  FOR UPDATE USING (
    is_admin() OR doctor_id = my_doctor_id() OR
    has_role('pharmacist')
  );

CREATE POLICY "rx_items_select" ON prescription_items
  FOR SELECT USING (
    is_clinical_staff() OR
    prescription_id IN (SELECT id FROM prescriptions WHERE patient_id = my_patient_id())
  );

CREATE POLICY "rx_items_modify" ON prescription_items
  FOR ALL USING (is_clinical_staff());

-- ============================================================
-- BILLING
-- ============================================================

CREATE POLICY "invoices_select_billing" ON invoices
  FOR SELECT USING (
    has_any_role(ARRAY['owner','admin','cashier','accountant','receptionist']::user_role[])
  );

CREATE POLICY "invoices_select_patient" ON invoices
  FOR SELECT USING (patient_id = my_patient_id());

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['owner','admin','cashier','receptionist']::user_role[])
  );

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (
    has_any_role(ARRAY['owner','admin','cashier','accountant']::user_role[])
  );

CREATE POLICY "invoice_items_select" ON invoice_items
  FOR SELECT USING (
    has_any_role(ARRAY['owner','admin','cashier','accountant','receptionist']::user_role[]) OR
    invoice_id IN (SELECT id FROM invoices WHERE patient_id = my_patient_id())
  );

CREATE POLICY "invoice_items_modify" ON invoice_items
  FOR ALL USING (
    has_any_role(ARRAY['owner','admin','cashier','accountant']::user_role[])
  );

CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (
    has_any_role(ARRAY['owner','admin','cashier','accountant','receptionist']::user_role[]) OR
    patient_id = my_patient_id()
  );

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['owner','admin','cashier','receptionist']::user_role[])
  );

CREATE POLICY "payments_update_admin" ON payments
  FOR UPDATE USING (is_admin());

CREATE POLICY "refunds_select" ON refunds
  FOR SELECT USING (
    has_any_role(ARRAY['owner','admin','cashier','accountant']::user_role[]) OR
    invoice_id IN (SELECT id FROM invoices WHERE patient_id = my_patient_id())
  );

CREATE POLICY "refunds_insert" ON refunds
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['owner','admin','cashier']::user_role[])
  );

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE POLICY "suppliers_select" ON suppliers
  FOR SELECT USING (
    has_any_role(ARRAY['owner','admin','accountant','pharmacist','lab_technician']::user_role[])
  );

CREATE POLICY "suppliers_modify" ON suppliers
  FOR ALL USING (
    has_any_role(ARRAY['owner','admin','pharmacist']::user_role[])
  );

CREATE POLICY "inventory_select" ON inventory_items
  FOR SELECT USING (is_clinical_staff());

CREATE POLICY "inventory_modify" ON inventory_items
  FOR ALL USING (
    has_any_role(ARRAY['owner','admin','pharmacist','lab_technician']::user_role[])
  );

CREATE POLICY "stock_movements_select" ON stock_movements
  FOR SELECT USING (
    has_any_role(ARRAY['owner','admin','pharmacist','lab_technician','accountant']::user_role[])
  );

CREATE POLICY "stock_movements_insert" ON stock_movements
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['owner','admin','pharmacist','lab_technician']::user_role[])
  );

CREATE POLICY "po_select" ON purchase_orders
  FOR SELECT USING (
    has_any_role(ARRAY['owner','admin','pharmacist','accountant']::user_role[])
  );

CREATE POLICY "po_modify" ON purchase_orders
  FOR ALL USING (
    has_any_role(ARRAY['owner','admin','pharmacist']::user_role[])
  );

CREATE POLICY "po_items_select" ON purchase_order_items
  FOR SELECT USING (
    has_any_role(ARRAY['owner','admin','pharmacist','accountant']::user_role[])
  );

CREATE POLICY "po_items_modify" ON purchase_order_items
  FOR ALL USING (
    has_any_role(ARRAY['owner','admin','pharmacist']::user_role[])
  );

-- ============================================================
-- LABORATORY
-- ============================================================

CREATE POLICY "lab_tests_select_all" ON lab_tests
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "lab_tests_modify_admin" ON lab_tests
  FOR ALL USING (is_admin());

CREATE POLICY "lab_orders_select_clinical" ON lab_orders
  FOR SELECT USING (is_clinical_staff());

CREATE POLICY "lab_orders_select_patient" ON lab_orders
  FOR SELECT USING (patient_id = my_patient_id());

CREATE POLICY "lab_orders_insert" ON lab_orders
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['owner','admin','doctor','nurse','receptionist']::user_role[])
  );

CREATE POLICY "lab_orders_update" ON lab_orders
  FOR UPDATE USING (
    has_any_role(ARRAY['owner','admin','doctor','lab_technician']::user_role[])
  );

CREATE POLICY "lab_items_select" ON lab_order_items
  FOR SELECT USING (
    is_clinical_staff() OR
    order_id IN (SELECT id FROM lab_orders WHERE patient_id = my_patient_id())
  );

CREATE POLICY "lab_items_modify" ON lab_order_items
  FOR ALL USING (is_clinical_staff());

CREATE POLICY "lab_attach_select" ON lab_attachments
  FOR SELECT USING (
    is_clinical_staff() OR
    order_id IN (SELECT id FROM lab_orders WHERE patient_id = my_patient_id())
  );

CREATE POLICY "lab_attach_modify" ON lab_attachments
  FOR ALL USING (
    has_any_role(ARRAY['owner','admin','lab_technician']::user_role[])
  );

-- ============================================================
-- RADIOLOGY
-- ============================================================

CREATE POLICY "radio_types_select_all" ON radiology_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "radio_types_modify_admin" ON radiology_types
  FOR ALL USING (is_admin());

CREATE POLICY "radio_orders_select_clinical" ON radiology_orders
  FOR SELECT USING (is_clinical_staff());

CREATE POLICY "radio_orders_select_patient" ON radiology_orders
  FOR SELECT USING (patient_id = my_patient_id());

CREATE POLICY "radio_orders_insert" ON radiology_orders
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['owner','admin','doctor','nurse','receptionist']::user_role[])
  );

CREATE POLICY "radio_orders_update" ON radiology_orders
  FOR UPDATE USING (
    has_any_role(ARRAY['owner','admin','doctor','radiology_technician']::user_role[])
  );

CREATE POLICY "radio_attach_select" ON radiology_attachments
  FOR SELECT USING (
    is_clinical_staff() OR
    order_id IN (SELECT id FROM radiology_orders WHERE patient_id = my_patient_id())
  );

CREATE POLICY "radio_attach_modify" ON radiology_attachments
  FOR ALL USING (
    has_any_role(ARRAY['owner','admin','radiology_technician']::user_role[])
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE POLICY "notif_templates_select" ON notification_templates
  FOR SELECT USING (is_admin());

CREATE POLICY "notif_templates_modify" ON notification_templates
  FOR ALL USING (is_admin());

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (
    profile_id = auth.uid() OR
    is_admin() OR
    has_role('receptionist')
  );

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (is_clinical_staff());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (profile_id = auth.uid() OR is_admin());

-- ============================================================
-- AI CONVERSATIONS
-- ============================================================

CREATE POLICY "ai_conv_select_own" ON ai_conversations
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "ai_conv_insert_own" ON ai_conversations
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "ai_conv_update_own" ON ai_conversations
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "ai_conv_delete_own" ON ai_conversations
  FOR DELETE USING (profile_id = auth.uid());

CREATE POLICY "ai_msg_select_own" ON ai_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "ai_msg_insert_own" ON ai_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE profile_id = auth.uid()
    )
  );

-- ============================================================
-- AUDIT LOGS
-- ============================================================

-- Everyone can insert (via functions)
CREATE POLICY "audit_insert_all" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admin/owner can read
CREATE POLICY "audit_select_admin" ON audit_logs
  FOR SELECT USING (is_admin());

-- ============================================================
-- TASKS
-- ============================================================

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (
    is_admin() OR
    assigned_to = auth.uid() OR
    assigned_by = auth.uid()
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (is_clinical_staff());

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    is_admin() OR
    assigned_to = auth.uid() OR
    assigned_by = auth.uid()
  );

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (
    is_admin() OR assigned_by = auth.uid()
  );
