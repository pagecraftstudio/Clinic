# Clinic CMS

AI-powered Clinic Management System — single clinic, production-ready.

## Stack
- **Next.js 15** App Router + React 19 + TypeScript
- **Supabase** (Auth, PostgreSQL, Storage, Realtime)
- **Tailwind CSS** + shadcn/ui
- **OpenAI** GPT for AI assistant

## Setup

```bash
cp .env.example .env.local
# Fill in Supabase and OpenAI keys

npm install
npm run dev
```

## Database

Run migrations in order inside Supabase SQL editor:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_functions.sql
supabase/migrations/004_seed_data.sql
supabase/migrations/005_storage.sql
supabase/migrations/006_appointments_indexes.sql
supabase/migrations/007_doctors.sql
supabase/migrations/008_emr_module.sql
```

## Modules

| Module | Status |
|---|---|
| Auth (login, reset) | ✅ |
| Dashboard | ✅ |
| Patients | ✅ |
| Appointments | ✅ |
| Doctors | ✅ |
| EMR (visits, SOAP, vitals) | ✅ |
| Billing | 🔜 |
| Prescriptions | 🔜 |
| Lab | 🔜 |
| Radiology | 🔜 |
| Inventory | 🔜 |
| Reception | 🔜 |
| Reports | 🔜 |
| AI Assistant | 🔜 |
| Settings | 🔜 |

## Deployment

Deploy frontend to **Vercel**, backend to **Supabase**.
