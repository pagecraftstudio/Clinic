-- ============================================================
-- STORAGE BUCKETS
-- Migration: 005_storage.sql
-- ============================================================

-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',           'avatars',           TRUE,  2097152,   ARRAY['image/jpeg','image/png','image/webp']),
  ('prescriptions',     'prescriptions',     FALSE, 10485760,  ARRAY['application/pdf','image/jpeg','image/png']),
  ('lab-results',       'lab-results',       FALSE, 52428800,  ARRAY['application/pdf','image/jpeg','image/png']),
  ('radiology',         'radiology',         FALSE, 104857600, ARRAY['application/pdf','image/jpeg','image/png','application/dicom']),
  ('patient-documents', 'patient-documents', FALSE, 20971520,  ARRAY['application/pdf','image/jpeg','image/png']),
  ('invoices',          'invoices',          FALSE, 10485760,  ARRAY['application/pdf']);

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- Avatars: anyone can read public avatars, only owner can write
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "avatars_own_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND owner = auth.uid()::TEXT
  );

CREATE POLICY "avatars_own_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND owner = auth.uid()::TEXT
  );

-- Clinical buckets: only clinical staff
CREATE POLICY "clinical_buckets_select" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('prescriptions','lab-results','radiology','patient-documents','invoices')
    AND (
      public.is_clinical_staff()
      OR public.has_any_role(ARRAY['cashier','accountant']::public.user_role[])
    )
  );

CREATE POLICY "clinical_buckets_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('prescriptions','lab-results','radiology','patient-documents','invoices')
    AND public.is_clinical_staff()
  );

CREATE POLICY "clinical_buckets_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('prescriptions','lab-results','radiology','patient-documents','invoices')
    AND public.is_admin()
  );
