-- ─────────────────────────────────────────────────────────────────
-- 012 — Radiology module: additional RLS + seed types
-- Note: tables already created in 001_initial_schema.sql
-- Run this migration to add RLS policies and seed radiology types
-- ─────────────────────────────────────────────────────────────────

-- ── Seed radiology types (idempotent) ───────────────────────────

INSERT INTO radiology_types (name, name_ar, price, is_active) VALUES
  ('X-Ray',      'أشعة سينية',   150,  TRUE),
  ('MRI',        'رنين مغناطيسي',800,  TRUE),
  ('CT Scan',    'أشعة مقطعية',  600,  TRUE),
  ('Ultrasound', 'موجات فوق صوتية',250,TRUE),
  ('Mammography','تصوير الثدي',  350,  TRUE),
  ('Fluoroscopy','تنظير إشعاعي', 400,  TRUE),
  ('Bone Scan',  'مسح العظام',   500,  TRUE),
  ('PET Scan',   'التصوير بالبوزيترون', 1200, TRUE)
ON CONFLICT (name) DO NOTHING;

-- ── updated_at trigger on radiology_orders ────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_radio_orders_updated ON radiology_orders;
CREATE TRIGGER trg_radio_orders_updated
  BEFORE UPDATE ON radiology_orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Indexes (additional) ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_radio_doctor      ON radiology_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_radio_type        ON radiology_orders(type_id);
CREATE INDEX IF NOT EXISTS idx_radio_status      ON radiology_orders(status);
CREATE INDEX IF NOT EXISTS idx_radio_requested   ON radiology_orders(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_radio_attach_order ON radiology_attachments(order_id);

-- ── Storage bucket (run once in Supabase dashboard or via API) ────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('radiology', 'radiology', true)
-- ON CONFLICT (id) DO NOTHING;
