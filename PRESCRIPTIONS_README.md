# Prescriptions Module — Integration Guide

## Files

```
app/(dashboard)/prescriptions/
  page.tsx                          # List page (server)
  prescriptions-client.tsx          # List with filters + table (client)
  new/
    page.tsx                        # Fetches patients + doctors, renders form
    new-prescription-client.tsx     # Create form wrapper
  [id]/
    page.tsx                        # Detail page (server, SSR)
    edit/
      page.tsx                      # Edit page (server, guards dispensed)
      edit-prescription-client.tsx  # Edit form wrapper

components/prescriptions/
  prescription-form.tsx             # Shared create/edit form (RHF + Zod)
  prescription-detail.tsx           # Detail view + action buttons
  prescription-print.tsx            # Print-only layout (℞ format)
  prescription-status-badge.tsx     # Active / Dispensed / Expired badge

features/prescriptions/
  actions.ts                        # Server actions: create, update, markDispensed, delete
  hooks.ts                          # TanStack Query hooks wrapping actions + Supabase
  queries.ts                        # Server-side Supabase query helpers

lib/validations/prescription.ts     # Zod schemas + inferred types
types/prescription.ts               # TypeScript interfaces

supabase/migrations/
  010_prescriptions_module.sql      # Indexes + RLS policies
```

## DB Prerequisites

The `prescriptions` and `prescription_items` tables must exist (earlier migrations).
Migration 010 adds indexes and RLS — run it after the base schema.

The `prescriptions` table needs a trigger to auto-generate `prescription_number` (e.g. `RX-000001`).
Example trigger (add to your base schema migration):

```sql
CREATE SEQUENCE IF NOT EXISTS prescription_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.prescription_number := 'RX-' || LPAD(nextval('prescription_number_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_prescription_number
  BEFORE INSERT ON prescriptions
  FOR EACH ROW
  WHEN (NEW.prescription_number = 'RX-TMP' OR NEW.prescription_number IS NULL)
  EXECUTE FUNCTION generate_prescription_number();
```

## Printing

The detail page includes a hidden `<PrescriptionPrint>` component.
Clicking **Print** calls `window.print()` — CSS `@media print` shows the print layout and hides the screen UI.

Add to your global CSS:

```css
@media print {
  /* hide sidebar, topbar */
  aside, header, nav { display: none !important; }
}
```

## Permissions (RLS)

| Action | Roles |
|--------|-------|
| Read   | owner, admin, doctor, receptionist, nurse, pharmacist |
| Create | owner, admin, doctor, nurse |
| Update | owner, admin, doctor, pharmacist |
| Delete | owner, admin |
