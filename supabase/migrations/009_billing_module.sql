-- ─────────────────────────────────────────────────────────────────
-- 009 — Billing module: indexes + RLS policies
-- ─────────────────────────────────────────────────────────────────

-- indexes
CREATE INDEX IF NOT EXISTS idx_invoices_patient    ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_doctor     ON invoices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at  ON invoices(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_invoice    ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient    ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at    ON payments(paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_refunds_invoice     ON refunds(invoice_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment     ON refunds(payment_id);

-- ── RLS ──────────────────────────────────────────────────────────

ALTER TABLE invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds       ENABLE ROW LEVEL SECURITY;

-- helper: get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- invoices
CREATE POLICY "invoices_read" ON invoices
  FOR SELECT USING (
    current_user_role() IN ('owner','admin','doctor','receptionist','cashier','accountant')
  );

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    current_user_role() IN ('owner','admin','cashier','receptionist')
  );

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (
    current_user_role() IN ('owner','admin','cashier','accountant')
  );

CREATE POLICY "invoices_delete" ON invoices
  FOR UPDATE USING (
    current_user_role() IN ('owner','admin')
  );

-- invoice_items (mirror invoice access)
CREATE POLICY "invoice_items_read" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
        AND current_user_role() IN ('owner','admin','doctor','receptionist','cashier','accountant')
    )
  );

CREATE POLICY "invoice_items_write" ON invoice_items
  FOR ALL USING (
    current_user_role() IN ('owner','admin','cashier','receptionist')
  );

-- payments
CREATE POLICY "payments_read" ON payments
  FOR SELECT USING (
    current_user_role() IN ('owner','admin','cashier','accountant','receptionist')
  );

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    current_user_role() IN ('owner','admin','cashier')
  );

-- refunds
CREATE POLICY "refunds_read" ON refunds
  FOR SELECT USING (
    current_user_role() IN ('owner','admin','cashier','accountant')
  );

CREATE POLICY "refunds_insert" ON refunds
  FOR INSERT WITH CHECK (
    current_user_role() IN ('owner','admin','cashier')
  );

-- ── trigger: keep invoice.updated_at fresh ────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'invoices_updated_at'
  ) THEN
    CREATE TRIGGER invoices_updated_at
      BEFORE UPDATE ON invoices
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
