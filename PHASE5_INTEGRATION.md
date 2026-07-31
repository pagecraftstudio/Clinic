# Phase 5 — Online Booking Integration Notes

## Files to create (new)

```
migration/phase5_online_booking.sql            → Run in Supabase SQL editor
types/booking.ts                               → New types file
features/patient-portal/queries.ts             → APPEND exports to existing file
features/patient-portal/actions.ts             → APPEND exports to existing file
app/(patient-portal)/portal/doctors/[id]/page.tsx
app/(patient-portal)/portal/doctors/[id]/doctor-profile-client.tsx
app/(patient-portal)/portal/appointments/new/page.tsx         → REPLACE
app/(patient-portal)/portal/appointments/new/booking-client.tsx → REPLACE
app/(patient-portal)/portal/appointments/reschedule/page.tsx
app/(patient-portal)/portal/appointments/reschedule/reschedule-client.tsx
app/api/portal/slots/route.ts
clinic-cms/app/(dashboard)/appointments/pending/page.tsx
clinic-cms/app/(dashboard)/appointments/pending/pending-client.tsx
clinic-cms/app/(dashboard)/appointments/waiting-list/page.tsx
clinic-cms/app/(dashboard)/appointments/waiting-list/waiting-list-client.tsx
```

## Required: appointments-client.tsx patches

In `app/(patient-portal)/portal/appointments/appointments-client.tsx`:

1. Add `canReschedule` flag to `AppointmentCard`
2. Add reschedule `Link` button
3. Add `canRate` flag (status === 'completed' && !has_rating)
4. Add rate button that opens `RatingDialog`
5. Import `RatingDialog` from `appointments-client-patch.tsx`
6. Add `RefreshCw`, `Star` to lucide imports

## Required: Admin sidebar nav links

Add to the appointments section in your sidebar:
```
/appointments/pending   → "Pending Approvals" (badge with count)
/appointments/waiting-list → "Waiting List"
```

## Required: i18n additions (lib/i18n/portal.ts)

Add to both `en` and `ar` objects:
```ts
// en
reschedule: 'Reschedule',
rate: 'Rate',
joinWaitingList: 'Join waiting list',

// ar
reschedule: 'إعادة جدولة',
rate: 'تقييم',
joinWaitingList: 'انضم لقائمة الانتظار',
```

## Migration order

1. Run `migration/phase5_online_booking.sql`
2. Verify `doctor_rating_summary` materialized view created
3. Add `refresh_materialized_view` RPC to Supabase if not present:
   ```sql
   CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name text)
   RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
   BEGIN
     EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', view_name);
   END;
   $$;
   ```
4. Deploy new files

## What's new in Phase 5

| Feature | Where |
|---|---|
| Doctor public profiles with bio, hours, fees | `/portal/doctors/[id]` |
| Doctor ratings & reviews | Doctor profile + post-visit |
| Real slot picker (working_hours aware) | Booking flow step 2 |
| Doctor leave awareness | Slot generation skips leave days |
| Guest booking (no account needed) | Booking flow with guest fields |
| Waiting list (when no slots) | Booking flow fallback |
| Appointment approval workflow | Clinic can require approval |
| Reschedule flow | Patient portal |
| Cancellation policy hours | Enforced in reschedule + cancel |
| Admin pending approvals | `/appointments/pending` |
| Admin waiting list mgmt | `/appointments/waiting-list` |
