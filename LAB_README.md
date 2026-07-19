# Laboratory Module

## Files to copy into your project

### Types
```
types/lab.ts  →  src/types/lab.ts
```

### Validation
```
lib/validations/lab.ts  →  src/lib/validations/lab.ts
```

### Features (server queries + server actions + client hooks)
```
features/lab/queries.ts  →  src/features/lab/queries.ts
features/lab/actions.ts  →  src/features/lab/actions.ts
features/lab/hooks.ts    →  src/features/lab/hooks.ts
```

### Components
```
components/lab/lab-status-badge.tsx      →  src/components/lab/lab-status-badge.tsx
components/lab/lab-request-form.tsx      →  src/components/lab/lab-request-form.tsx
components/lab/lab-results-form.tsx      →  src/components/lab/lab-results-form.tsx
components/lab/lab-request-detail.tsx    →  src/components/lab/lab-request-detail.tsx
```

### Pages (App Router)
```
app/(dashboard)/lab/page.tsx                    →  src/app/(dashboard)/lab/page.tsx
app/(dashboard)/lab/lab-client.tsx              →  src/app/(dashboard)/lab/lab-client.tsx
app/(dashboard)/lab/new/page.tsx                →  src/app/(dashboard)/lab/new/page.tsx
app/(dashboard)/lab/new/new-lab-client.tsx      →  src/app/(dashboard)/lab/new/new-lab-client.tsx
app/(dashboard)/lab/[id]/page.tsx               →  src/app/(dashboard)/lab/[id]/page.tsx
app/(dashboard)/lab/[id]/edit/page.tsx          →  src/app/(dashboard)/lab/[id]/edit/page.tsx
app/(dashboard)/lab/[id]/edit/edit-lab-client.tsx  →  src/app/(dashboard)/lab/[id]/edit/edit-lab-client.tsx
```

### Migration
Run in Supabase SQL editor:
```
supabase/migrations/011_lab_module.sql
```

---

## Sidebar

`/lab` already exists in the sidebar provided with the prescriptions module (FlaskConical icon). No sidebar changes needed.

---

## Status Flow

```
pending → collected → processing → completed
                                ↘ cancelled (manual)
```

Status transitions are triggered from the detail page action buttons.
Results can be entered once status is `processing` or `completed`.

---

## Roles

| Action              | Allowed roles                              |
|---------------------|--------------------------------------------|
| View requests       | owner, admin, doctor, receptionist, nurse, lab_technician |
| Create request      | owner, admin, doctor, nurse                |
| Update status/results | owner, admin, doctor, lab_technician     |
| Delete              | owner, admin                               |

---

## Features

- Full CRUD for lab requests
- Multi-test per request with quick-add from common test list
- Per-test result entry (value, unit, reference range, abnormal flag)
- Status workflow with timestamps (collected_at, completed_at)
- Priority levels: Routine / Urgent / STAT
- Abnormal result highlighting in red
- Filterable list: status, priority, date range, search
- Paginated table matching prescriptions module style
- Auto-generated request numbers: `LB-001000`, `LB-001001`…
