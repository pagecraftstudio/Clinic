-- ============================================================
-- FUNCTIONS & VIEWS
-- Migration: 003_functions.sql
-- ============================================================

-- ============================================================
-- DASHBOARD STATS FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'today_appointments',       (SELECT COUNT(*) FROM appointments
                                  WHERE DATE(scheduled_at) = p_date
                                    AND deleted_at IS NULL),
    'today_completed',          (SELECT COUNT(*) FROM appointments
                                  WHERE DATE(scheduled_at) = p_date
                                    AND status = 'completed'),
    'today_cancelled',          (SELECT COUNT(*) FROM appointments
                                  WHERE DATE(scheduled_at) = p_date
                                    AND status = 'cancelled'),
    'today_no_show',            (SELECT COUNT(*) FROM appointments
                                  WHERE DATE(scheduled_at) = p_date
                                    AND status = 'no_show'),
    'today_revenue',            (SELECT COALESCE(SUM(amount), 0) FROM payments
                                  WHERE DATE(paid_at) = p_date),
    'month_revenue',            (SELECT COALESCE(SUM(amount), 0) FROM payments
                                  WHERE DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', p_date::TIMESTAMPTZ)),
    'total_patients',           (SELECT COUNT(*) FROM patients WHERE deleted_at IS NULL),
    'new_patients_today',       (SELECT COUNT(*) FROM patients
                                  WHERE DATE(created_at) = p_date AND deleted_at IS NULL),
    'new_patients_month',       (SELECT COUNT(*) FROM patients
                                  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_date::TIMESTAMPTZ)
                                    AND deleted_at IS NULL),
    'pending_lab_orders',       (SELECT COUNT(*) FROM lab_orders
                                  WHERE status IN ('requested', 'sample_collected', 'processing')),
    'pending_radiology_orders', (SELECT COUNT(*) FROM radiology_orders
                                  WHERE status IN ('requested', 'scheduled')),
    'low_stock_items',          (SELECT COUNT(*) FROM inventory_items
                                  WHERE current_stock <= minimum_stock AND is_active = TRUE),
    'outstanding_balance',      (SELECT COALESCE(SUM(balance), 0) FROM invoices
                                  WHERE status IN ('issued', 'partial') AND deleted_at IS NULL),
    'upcoming_appointments',    (SELECT COUNT(*) FROM appointments
                                  WHERE scheduled_at > NOW()
                                    AND scheduled_at < NOW() + INTERVAL '7 days'
                                    AND status IN ('scheduled', 'confirmed')
                                    AND deleted_at IS NULL),
    'unread_notifications',     (SELECT COUNT(*) FROM notifications
                                  WHERE profile_id = auth.uid() AND read_at IS NULL)
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================
-- REVENUE BY PERIOD
-- ============================================================

CREATE OR REPLACE FUNCTION get_revenue_by_period(
  p_start DATE,
  p_end   DATE,
  p_group TEXT DEFAULT 'day'   -- 'day' | 'week' | 'month'
)
RETURNS TABLE (period TEXT, revenue NUMERIC, payment_count BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC(p_group, paid_at), 'YYYY-MM-DD') AS period,
    SUM(amount)                                          AS revenue,
    COUNT(*)                                             AS payment_count
  FROM payments
  WHERE paid_at::DATE BETWEEN p_start AND p_end
  GROUP BY DATE_TRUNC(p_group, paid_at)
  ORDER BY DATE_TRUNC(p_group, paid_at);
$$;

-- ============================================================
-- APPOINTMENT SLOTS (available slots for booking)
-- ============================================================

CREATE OR REPLACE FUNCTION get_available_slots(
  p_doctor_id  UUID,
  p_date       DATE
)
RETURNS TABLE (slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ, is_available BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_day_of_week    INT;
  v_start_time     TIME;
  v_end_time       TIME;
  v_slot_duration  INT;
  v_slot_start     TIMESTAMPTZ;
  v_slot_end       TIMESTAMPTZ;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);

  SELECT ds.start_time, ds.end_time, ds.slot_duration
  INTO v_start_time, v_end_time, v_slot_duration
  FROM doctor_schedules ds
  WHERE ds.doctor_id = p_doctor_id
    AND ds.day_of_week = v_day_of_week
    AND ds.is_active = TRUE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check for approved leave
  IF EXISTS (
    SELECT 1 FROM doctor_leaves
    WHERE doctor_id = p_doctor_id
      AND status = 'approved'
      AND p_date BETWEEN start_date AND end_date
  ) THEN
    RETURN;
  END IF;

  -- Check for holiday
  IF EXISTS (
    SELECT 1 FROM holidays
    WHERE date = p_date
  ) THEN
    RETURN;
  END IF;

  v_slot_start := (p_date || ' ' || v_start_time)::TIMESTAMPTZ;

  WHILE v_slot_start + (v_slot_duration || ' minutes')::INTERVAL <= (p_date || ' ' || v_end_time)::TIMESTAMPTZ LOOP
    v_slot_end := v_slot_start + (v_slot_duration || ' minutes')::INTERVAL;

    RETURN QUERY SELECT
      v_slot_start,
      v_slot_end,
      NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.doctor_id = p_doctor_id
          AND a.status NOT IN ('cancelled', 'no_show')
          AND a.deleted_at IS NULL
          AND (
            (a.scheduled_at < v_slot_end AND a.end_at > v_slot_start)
          )
      );

    v_slot_start := v_slot_end;
  END LOOP;
END;
$$;

-- ============================================================
-- PATIENT SEARCH (full-text + trgm)
-- ============================================================

CREATE OR REPLACE FUNCTION search_patients(p_query TEXT, p_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID, patient_number TEXT, full_name TEXT,
  phone TEXT, national_id TEXT, similarity FLOAT
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id, p.patient_number, p.full_name, p.phone, p.national_id,
    GREATEST(
      similarity(p.full_name, p_query),
      similarity(p.phone, p_query),
      CASE WHEN p.national_id IS NOT NULL THEN similarity(p.national_id, p_query) ELSE 0 END
    ) AS sim
  FROM patients p
  WHERE p.deleted_at IS NULL
    AND (
      p.full_name ILIKE '%' || p_query || '%'
      OR p.phone ILIKE '%' || p_query || '%'
      OR p.patient_number ILIKE '%' || p_query || '%'
      OR p.national_id ILIKE '%' || p_query || '%'
      OR p.email ILIKE '%' || p_query || '%'
    )
  ORDER BY sim DESC
  LIMIT p_limit;
$$;

-- ============================================================
-- AUDIT LOG HELPER (call from app layer)
-- ============================================================

CREATE OR REPLACE FUNCTION log_audit(
  p_action      TEXT,
  p_table_name  TEXT DEFAULT NULL,
  p_record_id   UUID DEFAULT NULL,
  p_old_data    JSONB DEFAULT NULL,
  p_new_data    JSONB DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_logs (profile_id, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_old_data, p_new_data);
END;
$$;

-- ============================================================
-- AUTO-AUDIT TRIGGER FOR CRITICAL TABLES
-- ============================================================

CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_logs (profile_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN NULL;
END;
$$;

-- Apply audit trigger to critical tables
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients', 'visits', 'prescriptions', 'invoices',
    'payments', 'appointments', 'lab_orders', 'radiology_orders'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_audit
       AFTER INSERT OR UPDATE OR DELETE ON %s
       FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn()',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- VIEWS
-- ============================================================

-- Today's appointment queue (for reception)
CREATE VIEW v_today_queue AS
SELECT
  a.id,
  a.appointment_number,
  a.waiting_number,
  a.scheduled_at,
  a.status,
  a.type,
  a.chief_complaint,
  a.checked_in_at,
  p.id            AS patient_id,
  p.patient_number,
  p.full_name     AS patient_name,
  p.phone         AS patient_phone,
  p.gender        AS patient_gender,
  p.date_of_birth,
  d.id            AS doctor_id,
  pr.display_name AS doctor_name,
  doc.specialty
FROM appointments a
JOIN patients p  ON p.id  = a.patient_id
JOIN doctors d   ON d.id  = a.doctor_id
JOIN profiles pr ON pr.id = d.profile_id
LEFT JOIN doctors doc ON doc.id = a.doctor_id
WHERE DATE(a.scheduled_at) = CURRENT_DATE
  AND a.deleted_at IS NULL
ORDER BY a.waiting_number NULLS LAST, a.scheduled_at;

-- Patient summary view
CREATE VIEW v_patient_summary AS
SELECT
  p.*,
  COUNT(DISTINCT a.id)   AS total_appointments,
  COUNT(DISTINCT v.id)   AS total_visits,
  COUNT(DISTINCT rx.id)  AS total_prescriptions,
  COALESCE(SUM(i.total), 0)       AS total_billed,
  COALESCE(SUM(i.paid_amount), 0) AS total_paid,
  COALESCE(SUM(i.balance), 0)     AS outstanding_balance,
  MAX(v.visit_date)      AS last_visit_date
FROM patients p
LEFT JOIN appointments a  ON a.patient_id = p.id AND a.deleted_at IS NULL
LEFT JOIN visits v        ON v.patient_id = p.id
LEFT JOIN prescriptions rx ON rx.patient_id = p.id
LEFT JOIN invoices i      ON i.patient_id = p.id AND i.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- Doctor performance view
CREATE VIEW v_doctor_performance AS
SELECT
  d.id,
  pr.display_name,
  d.specialty,
  COUNT(DISTINCT a.id)  FILTER (WHERE DATE(a.scheduled_at) = CURRENT_DATE) AS today_appointments,
  COUNT(DISTINCT a.id)  FILTER (WHERE DATE_TRUNC('month', a.scheduled_at) = DATE_TRUNC('month', NOW())) AS month_appointments,
  COUNT(DISTINCT a.id)  FILTER (WHERE a.status = 'completed' AND DATE_TRUNC('month', a.scheduled_at) = DATE_TRUNC('month', NOW())) AS month_completed,
  COUNT(DISTINCT a.id)  FILTER (WHERE a.status = 'no_show' AND DATE_TRUNC('month', a.scheduled_at) = DATE_TRUNC('month', NOW())) AS month_no_shows,
  COALESCE(SUM(i.total) FILTER (WHERE DATE_TRUNC('month', i.issued_at) = DATE_TRUNC('month', NOW())), 0) AS month_revenue
FROM doctors d
JOIN profiles pr ON pr.id = d.profile_id
LEFT JOIN appointments a ON a.doctor_id = d.id AND a.deleted_at IS NULL
LEFT JOIN invoices i     ON i.doctor_id = d.id AND i.deleted_at IS NULL
WHERE d.is_active = TRUE
GROUP BY d.id, pr.display_name, d.specialty;

-- Low stock alert view
CREATE VIEW v_low_stock AS
SELECT
  i.*,
  s.name AS supplier_name,
  (i.minimum_stock - i.current_stock) AS deficit
FROM inventory_items i
LEFT JOIN suppliers s ON s.id = i.supplier_id
WHERE i.current_stock <= i.minimum_stock
  AND i.is_active = TRUE
  AND i.deleted_at IS NULL
ORDER BY (i.minimum_stock - i.current_stock) DESC;

-- ============================================================
-- HANDLE NEW USER (called from Supabase Auth hook)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
