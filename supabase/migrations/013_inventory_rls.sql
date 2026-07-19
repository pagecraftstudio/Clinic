-- ============================================================
-- INVENTORY MODULE — RLS POLICIES
-- ============================================================

-- Enable RLS on inventory tables (already done in 002, but ensure)
ALTER TABLE suppliers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Helper: roles with inventory write access
CREATE OR REPLACE FUNCTION has_inventory_write_access()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('owner','admin','pharmacist','nurse')
      AND is_active = true
  );
$$;

-- ── suppliers ────────────────────────────────────────────────
DROP POLICY IF EXISTS "suppliers_read" ON suppliers;
CREATE POLICY "suppliers_read" ON suppliers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "suppliers_write" ON suppliers;
CREATE POLICY "suppliers_write" ON suppliers
  FOR ALL TO authenticated USING (has_inventory_write_access())
  WITH CHECK (has_inventory_write_access());

-- ── inventory_items ──────────────────────────────────────────
DROP POLICY IF EXISTS "inventory_items_read" ON inventory_items;
CREATE POLICY "inventory_items_read" ON inventory_items
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "inventory_items_write" ON inventory_items;
CREATE POLICY "inventory_items_write" ON inventory_items
  FOR ALL TO authenticated USING (has_inventory_write_access())
  WITH CHECK (has_inventory_write_access());

-- ── stock_movements ──────────────────────────────────────────
DROP POLICY IF EXISTS "stock_movements_read" ON stock_movements;
CREATE POLICY "stock_movements_read" ON stock_movements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "stock_movements_insert" ON stock_movements;
CREATE POLICY "stock_movements_insert" ON stock_movements
  FOR INSERT TO authenticated WITH CHECK (has_inventory_write_access());

-- ── purchase_orders ──────────────────────────────────────────
DROP POLICY IF EXISTS "purchase_orders_read" ON purchase_orders;
CREATE POLICY "purchase_orders_read" ON purchase_orders
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "purchase_orders_write" ON purchase_orders;
CREATE POLICY "purchase_orders_write" ON purchase_orders
  FOR ALL TO authenticated USING (has_inventory_write_access())
  WITH CHECK (has_inventory_write_access());

-- ── purchase_order_items ─────────────────────────────────────
DROP POLICY IF EXISTS "po_items_read" ON purchase_order_items;
CREATE POLICY "po_items_read" ON purchase_order_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "po_items_write" ON purchase_order_items;
CREATE POLICY "po_items_write" ON purchase_order_items
  FOR ALL TO authenticated USING (has_inventory_write_access())
  WITH CHECK (has_inventory_write_access());
