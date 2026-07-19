-- ============================================================
-- SEED DATA
-- Migration: 004_seed_data.sql
-- ============================================================

-- ============================================================
-- PERMISSIONS
-- ============================================================

INSERT INTO permissions (module, action) VALUES
  -- Patients
  ('patients', 'read'),   ('patients', 'write'),   ('patients', 'delete'),   ('patients', 'export'),
  -- Appointments
  ('appointments', 'read'), ('appointments', 'write'), ('appointments', 'delete'), ('appointments', 'export'),
  -- EMR
  ('emr', 'read'), ('emr', 'write'), ('emr', 'delete'),
  -- Prescriptions
  ('prescriptions', 'read'), ('prescriptions', 'write'), ('prescriptions', 'delete'),
  -- Billing
  ('billing', 'read'), ('billing', 'write'), ('billing', 'delete'), ('billing', 'export'),
  -- Inventory
  ('inventory', 'read'), ('inventory', 'write'), ('inventory', 'delete'),
  -- Lab
  ('lab', 'read'), ('lab', 'write'), ('lab', 'delete'),
  -- Radiology
  ('radiology', 'read'), ('radiology', 'write'), ('radiology', 'delete'),
  -- Reports
  ('reports', 'read'), ('reports', 'export'),
  -- Settings
  ('settings', 'read'), ('settings', 'write'),
  -- Users
  ('users', 'read'), ('users', 'write'), ('users', 'delete'),
  -- AI
  ('ai', 'read'), ('ai', 'write');

-- ============================================================
-- ROLE PERMISSIONS (RBAC DEFAULTS)
-- ============================================================

-- Owner: all permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'owner', id FROM permissions;

-- Admin: all except delete (extra safety)
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
WHERE action != 'delete' OR module IN ('appointments', 'inventory');

-- Doctor: clinical only
INSERT INTO role_permissions (role, permission_id)
SELECT 'doctor', id FROM permissions
WHERE module IN ('patients','appointments','emr','prescriptions','lab','radiology','ai')
  AND action IN ('read','write');

-- Nurse: clinical read + vitals
INSERT INTO role_permissions (role, permission_id)
SELECT 'nurse', id FROM permissions
WHERE module IN ('patients','appointments','emr','lab','radiology')
  AND action IN ('read','write');

-- Receptionist: front-desk
INSERT INTO role_permissions (role, permission_id)
SELECT 'receptionist', id FROM permissions
WHERE module IN ('patients','appointments','billing')
  AND action IN ('read','write');

-- Cashier: billing
INSERT INTO role_permissions (role, permission_id)
SELECT 'cashier', id FROM permissions
WHERE module = 'billing' AND action IN ('read','write');

-- Accountant: billing + reports (read/export)
INSERT INTO role_permissions (role, permission_id)
SELECT 'accountant', id FROM permissions
WHERE (module = 'billing' OR module = 'reports') AND action IN ('read','export');

-- Lab technician
INSERT INTO role_permissions (role, permission_id)
SELECT 'lab_technician', id FROM permissions
WHERE module IN ('lab','patients') AND action IN ('read','write');

-- Radiology technician
INSERT INTO role_permissions (role, permission_id)
SELECT 'radiology_technician', id FROM permissions
WHERE module IN ('radiology','patients') AND action IN ('read','write');

-- Pharmacist
INSERT INTO role_permissions (role, permission_id)
SELECT 'pharmacist', id FROM permissions
WHERE module IN ('prescriptions','inventory') AND action IN ('read','write');

-- Marketing: reports read only
INSERT INTO role_permissions (role, permission_id)
SELECT 'marketing', id FROM permissions
WHERE module = 'reports' AND action = 'read';

-- ============================================================
-- CLINIC SETTINGS (DEFAULT)
-- ============================================================

INSERT INTO clinic_settings (
  id, name, name_ar, currency, timezone, date_format, time_format,
  appointment_duration, primary_color, invoice_prefix
) VALUES (
  uuid_generate_v4(),
  'My Clinic',
  'عيادتي',
  'EGP',
  'Africa/Cairo',
  'DD/MM/YYYY',
  '12h',
  30,
  '#0066FF',
  'INV'
);

-- ============================================================
-- RADIOLOGY TYPES
-- ============================================================

INSERT INTO radiology_types (name, name_ar, price) VALUES
  ('X-Ray',     'أشعة سينية',    150.00),
  ('Ultrasound','موجات فوق صوتية', 250.00),
  ('CT Scan',   'أشعة مقطعية',   800.00),
  ('MRI',       'رنين مغناطيسي', 1200.00),
  ('Mammogram', 'تصوير الثدي',   350.00),
  ('DEXA Scan', 'قياس كثافة العظام', 400.00),
  ('Fluoroscopy','التنظير الفلوري', 500.00);

-- ============================================================
-- COMMON LAB TESTS
-- ============================================================

INSERT INTO lab_tests (name, name_ar, code, category, unit, normal_range, price) VALUES
  -- CBC
  ('Complete Blood Count', 'صورة دم كاملة', 'CBC', 'Hematology', NULL, NULL, 80.00),
  ('Hemoglobin', 'هيموجلوبين', 'HGB', 'Hematology', 'g/dL', 'M:13.5-17.5 / F:12-15.5', 40.00),
  ('WBC', 'كريات دم بيضاء', 'WBC', 'Hematology', '10³/μL', '4.5-11.0', 40.00),
  ('Platelets', 'صفائح دموية', 'PLT', 'Hematology', '10³/μL', '150-400', 40.00),
  -- Metabolic
  ('Fasting Blood Glucose', 'سكر صائم', 'FBG', 'Chemistry', 'mg/dL', '70-100', 30.00),
  ('HbA1c', 'سكر تراكمي', 'HBA1C', 'Chemistry', '%', '<5.7', 120.00),
  ('Creatinine', 'كرياتينين', 'CREAT', 'Chemistry', 'mg/dL', 'M:0.7-1.2 / F:0.5-1.0', 40.00),
  ('Urea', 'يوريا', 'UREA', 'Chemistry', 'mg/dL', '15-45', 35.00),
  -- Lipids
  ('Lipid Profile', 'دهون الدم', 'LIPID', 'Chemistry', NULL, NULL, 120.00),
  ('Total Cholesterol', 'كوليسترول', 'CHOL', 'Chemistry', 'mg/dL', '<200', 40.00),
  ('LDL', 'دهون ضارة', 'LDL', 'Chemistry', 'mg/dL', '<100', 40.00),
  ('HDL', 'دهون نافعة', 'HDL', 'Chemistry', 'mg/dL', 'M:>40 / F:>50', 40.00),
  -- Liver
  ('Liver Function Tests', 'وظائف كبد', 'LFT', 'Chemistry', NULL, NULL, 150.00),
  ('ALT', 'إنزيم كبد ALT', 'ALT', 'Chemistry', 'U/L', '7-56', 40.00),
  ('AST', 'إنزيم كبد AST', 'AST', 'Chemistry', 'U/L', '10-40', 40.00),
  -- Thyroid
  ('TSH', 'هرمون الغدة الدرقية', 'TSH', 'Endocrinology', 'mIU/L', '0.4-4.0', 80.00),
  ('T3', 'T3', 'T3', 'Endocrinology', 'ng/dL', '80-200', 70.00),
  ('T4', 'T4', 'T4', 'Endocrinology', 'μg/dL', '5-12', 70.00),
  -- Urine
  ('Urine Analysis', 'تحليل بول', 'UA', 'Urinalysis', NULL, NULL, 40.00),
  -- Coagulation
  ('PT/INR', 'وقت البروثرومبين', 'PT', 'Coagulation', 'seconds', '11-13.5', 60.00),
  -- Infection
  ('CRP', 'بروتين سي التفاعلي', 'CRP', 'Immunology', 'mg/L', '<10', 60.00),
  ('ESR', 'سرعة ترسب', 'ESR', 'Hematology', 'mm/hr', 'M:<15 / F:<20', 35.00),
  -- Vitamins
  ('Vitamin D', 'فيتامين د', 'VITD', 'Chemistry', 'ng/mL', '30-100', 150.00),
  ('Vitamin B12', 'فيتامين ب12', 'B12', 'Chemistry', 'pg/mL', '190-950', 120.00),
  ('Iron Studies', 'حديد وتحليل', 'FE', 'Chemistry', NULL, NULL, 100.00),
  -- Culture
  ('Blood Culture', 'مزرعة دم', 'BC', 'Microbiology', NULL, 'Negative', 200.00),
  ('Urine Culture', 'مزرعة بول', 'UC', 'Microbiology', NULL, 'Negative', 150.00);

-- ============================================================
-- NOTIFICATION TEMPLATES
-- ============================================================

INSERT INTO notification_templates (name, channel, event, subject, body, body_ar, variables) VALUES
  -- Appointment reminders
  (
    'Appointment Reminder - Email',
    'email', 'appointment_reminder',
    'Appointment Reminder - {{clinic_name}}',
    'Dear {{patient_name}},\n\nThis is a reminder for your appointment:\n\nDate: {{date}}\nTime: {{time}}\nDoctor: Dr. {{doctor_name}}\n\nPlease arrive 10 minutes early.\n\n{{clinic_name}}\n{{clinic_phone}}',
    'عزيزي {{patient_name}}،\n\nتذكير بموعدك:\n\nالتاريخ: {{date}}\nالوقت: {{time}}\nالطبيب: د. {{doctor_name}}\n\nيرجى الحضور قبل 10 دقائق.\n\n{{clinic_name}}\n{{clinic_phone}}',
    ARRAY['{{patient_name}}', '{{date}}', '{{time}}', '{{doctor_name}}', '{{clinic_name}}', '{{clinic_phone}}']
  ),
  (
    'Appointment Reminder - WhatsApp',
    'whatsapp', 'appointment_reminder',
    NULL,
    'Hello {{patient_name}} 👋\n\nReminder: You have an appointment with Dr. {{doctor_name}} on {{date}} at {{time}}.\n\nFor changes, call: {{clinic_phone}}',
    'مرحباً {{patient_name}} 👋\n\nتذكير: موعدك مع د. {{doctor_name}} يوم {{date}} الساعة {{time}}.\n\nللتغيير: {{clinic_phone}}',
    ARRAY['{{patient_name}}', '{{date}}', '{{time}}', '{{doctor_name}}', '{{clinic_phone}}']
  ),
  (
    'Appointment Reminder - SMS',
    'sms', 'appointment_reminder',
    NULL,
    'Reminder: Appt with Dr. {{doctor_name}} on {{date}} at {{time}}. Call {{clinic_phone}} to reschedule.',
    'تذكير: موعد مع د. {{doctor_name}} في {{date}} الساعة {{time}}. للتغيير: {{clinic_phone}}',
    ARRAY['{{doctor_name}}', '{{date}}', '{{time}}', '{{clinic_phone}}']
  ),
  -- Payment due
  (
    'Payment Due - Email',
    'email', 'payment_due',
    'Payment Due - Invoice {{invoice_number}}',
    'Dear {{patient_name}},\n\nYour invoice {{invoice_number}} of {{amount}} EGP is due.\n\nBalance: {{balance}} EGP\n\nPlease contact us to arrange payment.\n\n{{clinic_name}}',
    'عزيزي {{patient_name}}،\n\nفاتورتك رقم {{invoice_number}} بقيمة {{amount}} جنيه مستحقة.\n\nالرصيد: {{balance}} جنيه\n\nيرجى التواصل معنا لترتيب السداد.\n\n{{clinic_name}}',
    ARRAY['{{patient_name}}', '{{invoice_number}}', '{{amount}}', '{{balance}}', '{{clinic_name}}']
  ),
  -- Follow-up
  (
    'Follow-up Reminder - WhatsApp',
    'whatsapp', 'follow_up_reminder',
    NULL,
    'Hello {{patient_name}} 👋\n\nDr. {{doctor_name}} has recommended a follow-up visit. Please book your appointment at your earliest convenience.\n\n📞 {{clinic_phone}}',
    'مرحباً {{patient_name}} 👋\n\nd. {{doctor_name}} أوصى بزيارة متابعة. يرجى حجز موعدك في أقرب وقت.\n\n📞 {{clinic_phone}}',
    ARRAY['{{patient_name}}', '{{doctor_name}}', '{{clinic_phone}}']
  ),
  -- Lab results
  (
    'Lab Results Ready - WhatsApp',
    'whatsapp', 'lab_results_ready',
    NULL,
    'Hello {{patient_name}} 👋\n\nYour lab results ({{test_names}}) are ready.\n\nPlease visit the clinic or contact us for details.\n\n📞 {{clinic_phone}}',
    'مرحباً {{patient_name}} 👋\n\nنتائج تحاليلك ({{test_names}}) جاهزة.\n\nيرجى زيارة العيادة أو التواصل معنا للتفاصيل.\n\n📞 {{clinic_phone}}',
    ARRAY['{{patient_name}}', '{{test_names}}', '{{clinic_phone}}']
  );

-- ============================================================
-- HOLIDAY EXAMPLES (Egypt public holidays)
-- ============================================================

INSERT INTO holidays (name, name_ar, date, is_recurring) VALUES
  ('New Year Day',         'رأس السنة الميلادية',    '2025-01-01', TRUE),
  ('Coptic Christmas',     'عيد الميلاد القبطي',     '2025-01-07', TRUE),
  ('Revolution Day',       'ثورة 25 يناير',           '2025-01-25', TRUE),
  ('Sinai Liberation Day', 'تحرير سيناء',             '2025-04-25', TRUE),
  ('Labor Day',            'عيد العمال',              '2025-05-01', TRUE),
  ('Revolution Day 30',    'ثورة 30 يونيو',           '2025-06-30', TRUE),
  ('Revolution Day 23',    'ثورة 23 يوليو',           '2025-07-23', TRUE),
  ('National Day',         'عيد تحرير أكتوبر',        '2025-10-06', TRUE);
