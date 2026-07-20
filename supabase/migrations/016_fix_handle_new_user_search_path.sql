-- ─────────────────────────────────────────────────────────────────
-- 016 — Fix handle_new_user(): unqualified "profiles" fails to
-- resolve when the trigger runs as supabase_auth_admin
-- ─────────────────────────────────────────────────────────────────
-- The trigger is attached to auth.users, so it executes as the
-- supabase_auth_admin role. That role's default search_path does not
-- include `public`, so the bare `profiles` reference inside the
-- function threw:
--   ERROR 42P01: relation "profiles" does not exist
-- on every signup — this was a latent bug from the original
-- migration, unrelated to the role-metadata fix in 015. It just
-- never fired until something actually called auth.signUp() in
-- production.
--
-- Fix: schema-qualify the table as public.profiles AND pin
-- search_path on the function itself so this class of bug can't
-- recur regardless of which role invokes it.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
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
