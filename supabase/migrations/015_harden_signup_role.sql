-- ─────────────────────────────────────────────────────────────────
-- 015 — Harden handle_new_user(): never trust client-supplied role
-- ─────────────────────────────────────────────────────────────────
-- The original trigger did:
--   COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient')
-- raw_user_meta_data is set by the CLIENT via supabase.auth.signUp()
-- options.data — anyone with the public anon key (i.e. anyone, since
-- it ships in the browser bundle) could call signUp with
-- `data: { role: 'owner' }` and self-grant any role, bypassing the
-- app entirely. This became directly exploitable once public
-- self-signup (app/(auth)/register) was added.
--
-- Fix: every account created via public signup is hard-coded to
-- 'patient'. Staff roles (doctor, nurse, admin, owner, ...) can only
-- be assigned afterwards by an existing owner/admin from
-- /settings/users, which updates profiles.role directly under RLS —
-- never through auth metadata.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    'patient' -- ignore any client-supplied role, always least-privilege
  );
  RETURN NEW;
END;
$$;

-- Trigger already exists and points at this function by name, no
-- need to recreate it.
