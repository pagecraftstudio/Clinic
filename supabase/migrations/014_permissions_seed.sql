-- ============================================================
-- 014 — Seed permissions for all modules
-- ============================================================

INSERT INTO permissions (module, action) VALUES
  ('dashboard',     'read'),
  ('patients',      'read'),
  ('patients',      'write'),
  ('patients',      'delete'),
  ('patients',      'export'),
  ('appointments',  'read'),
  ('appointments',  'write'),
  ('appointments',  'delete'),
  ('appointments',  'export'),
  ('doctors',       'read'),
  ('doctors',       'write'),
  ('doctors',       'delete'),
  ('emr',           'read'),
  ('emr',           'write'),
  ('emr',           'delete'),
  ('prescriptions', 'read'),
  ('prescriptions', 'write'),
  ('prescriptions', 'delete'),
  ('prescriptions', 'export'),
  ('billing',       'read'),
  ('billing',       'write'),
  ('billing',       'delete'),
  ('billing',       'export'),
  ('inventory',     'read'),
  ('inventory',     'write'),
  ('inventory',     'delete'),
  ('inventory',     'export'),
  ('lab',           'read'),
  ('lab',           'write'),
  ('lab',           'delete'),
  ('radiology',     'read'),
  ('radiology',     'write'),
  ('radiology',     'delete'),
  ('reports',       'read'),
  ('reports',       'export'),
  ('settings',      'read'),
  ('settings',      'write'),
  ('ai',            'read')
ON CONFLICT (module, action) DO NOTHING;

-- ── Default role permissions ──────────────────────────────────────────────────

-- Doctor: read patients/appts/emr/labs/radiology + write emr/prescriptions
INSERT INTO role_permissions (role, permission_id)
SELECT 'doctor', id FROM permissions
WHERE (module IN ('dashboard', 'patients', 'appointments', 'emr', 'prescriptions', 'lab', 'radiology', 'ai')
  AND action IN ('read', 'write'))
   OR (module = 'billing' AND action = 'read')
ON CONFLICT DO NOTHING;

-- Receptionist: manage appointments + view patients/billing
INSERT INTO role_permissions (role, permission_id)
SELECT 'receptionist', id FROM permissions
WHERE (module IN ('dashboard', 'patients', 'appointments') AND action IN ('read', 'write'))
   OR (module = 'billing' AND action = 'read')
ON CONFLICT DO NOTHING;

-- Nurse: read + write vitals/emr
INSERT INTO role_permissions (role, permission_id)
SELECT 'nurse', id FROM permissions
WHERE module IN ('dashboard', 'patients', 'appointments', 'emr') AND action IN ('read', 'write')
ON CONFLICT DO NOTHING;

-- Cashier: billing full + patient read
INSERT INTO role_permissions (role, permission_id)
SELECT 'cashier', id FROM permissions
WHERE (module = 'billing')
   OR (module IN ('dashboard', 'patients', 'appointments') AND action = 'read')
ON CONFLICT DO NOTHING;

-- Accountant: billing read/export
INSERT INTO role_permissions (role, permission_id)
SELECT 'accountant', id FROM permissions
WHERE (module IN ('billing', 'reports') AND action IN ('read', 'export'))
   OR (module = 'dashboard' AND action = 'read')
ON CONFLICT DO NOTHING;

-- Lab technician: lab full + patient read
INSERT INTO role_permissions (role, permission_id)
SELECT 'lab_technician', id FROM permissions
WHERE module = 'lab'
   OR (module IN ('dashboard', 'patients') AND action = 'read')
ON CONFLICT DO NOTHING;

-- Radiology technician: radiology full + patient read
INSERT INTO role_permissions (role, permission_id)
SELECT 'radiology_technician', id FROM permissions
WHERE module = 'radiology'
   OR (module IN ('dashboard', 'patients') AND action = 'read')
ON CONFLICT DO NOTHING;

-- Pharmacist: prescriptions + inventory
INSERT INTO role_permissions (role, permission_id)
SELECT 'pharmacist', id FROM permissions
WHERE module IN ('prescriptions', 'inventory')
   OR (module IN ('dashboard', 'patients') AND action = 'read')
ON CONFLICT DO NOTHING;

-- Marketing: reports read/export
INSERT INTO role_permissions (role, permission_id)
SELECT 'marketing', id FROM permissions
WHERE module IN ('reports', 'dashboard') AND action IN ('read', 'export')
ON CONFLICT DO NOTHING;
