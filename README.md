# Clinic CMS

AI-powered Clinic Management System — single clinic, production-ready.

## Stack
- **Next.js 15** App Router + React 19 + TypeScript
- **Supabase** (Auth, PostgreSQL, Storage, Realtime)
- **Tailwind CSS** + shadcn/ui + Framer Motion
- **OpenAI GPT-4o** — AI assistant with tool calling

## Setup

```bash
cp .env.example .env.local
# Fill in Supabase URL, anon key, service role key, and OpenAI API key
npm install
npm run dev
```

## Database Migrations

Run in order inside Supabase SQL editor:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_functions.sql
supabase/migrations/004_seed_data.sql
supabase/migrations/005_storage.sql
supabase/migrations/006_appointments_indexes.sql
supabase/migrations/007_doctors.sql
supabase/migrations/008_emr_module.sql
supabase/migrations/009_billing_module.sql
supabase/migrations/010_prescriptions_module.sql
supabase/migrations/011_lab_module.sql
supabase/migrations/012_radiology_module.sql
supabase/migrations/013_inventory_rls.sql
supabase/migrations/014_permissions_seed.sql
```

## Modules

### Phase 1 — Foundation ✅
- Folder structure, DB schema, RLS, Auth

### Phase 2 — Core UI ✅
- Layout (sidebar, topbar), shadcn/ui, Dashboard

### Phase 3 — Modules ✅
| Module | Status |
|---|---|
| Patients | ✅ |
| Appointments | ✅ |
| Doctors | ✅ |
| EMR (visits, SOAP, vitals) | ✅ |
| Billing | ✅ |
| Prescriptions | ✅ |
| Lab | ✅ |
| Radiology | ✅ |
| Inventory | ✅ |
| Reception | ✅ |

### Phase 4 — Intelligence ✅
| Module | Status |
|---|---|
| Reports + PDF/Excel export | ✅ |
| AI Assistant (GPT-4o, streaming, tool calling) | ✅ |

## AI Assistant Features
- Real-time clinic context (today's appointments, revenue, alerts)
- Tool calling: find patients, appointments, revenue, doctors, low stock
- Streaming responses
- Conversation history (in-memory per session)
- Suggested prompts
- Arabic ↔ English drafting support
- Markdown rendering in chat

## Deployment
- Frontend → **Vercel**
- Backend → **Supabase**
