import { createClient } from '@/lib/supabase/server'

// ── Clinic context for system prompt ────────────────────────
export async function getClinicContext() {
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)
  const todayStart = `${today}T00:00:00`
  const todayEnd = `${today}T23:59:59`

  // Today's appointment count
  const { count: apptCount } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .gte('scheduled_at', todayStart)
    .lte('scheduled_at', todayEnd)
    .neq('status', 'cancelled')

  // Today's revenue
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount')
    .gte('paid_at', todayStart)
    .lte('paid_at', todayEnd)

  const todayRevenue = (todayPayments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)

  // Active doctors today
  const { count: doctorCount } = await supabase
    .from('doctors')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  // Pending lab results
  const { count: pendingLab } = await supabase
    .from('lab_requests')
    .select('id', { count: 'exact', head: true })
    .in('status', ['requested', 'sample_collected', 'processing'])

  // Low stock items
  const { count: lowStock } = await supabase
    .from('inventory_items')
    .select('id', { count: 'exact', head: true })
    .filter('current_stock', 'lte', 'minimum_stock')

  return {
    today,
    todayAppointments: apptCount ?? 0,
    todayRevenue,
    activeDoctors: doctorCount ?? 0,
    pendingLabResults: pendingLab ?? 0,
    lowStockItems: lowStock ?? 0,
  }
}

// ── Tool implementations (called server-side by the API route) ──

export async function findPatient(query: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('patients')
    .select('id, patient_number, first_name, last_name, phone, date_of_birth, blood_group')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,patient_number.ilike.%${query}%,phone.ilike.%${query}%`)
    .is('deleted_at', null)
    .limit(5)
  return data ?? []
}

export async function findAppointment(query: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('appointments')
    .select(`
      id, scheduled_at, status, appointment_type, reason,
      patient:patients(first_name, last_name, patient_number),
      doctor:doctors(profiles(display_name), specialty)
    `)
    .or(`reason.ilike.%${query}%`)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(5)
  return data ?? []
}

export async function getRevenueSummary(days = 30) {
  const supabase = await createClient()
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, paid_amount, status, issued_at')
    .gte('issued_at', `${from}T00:00:00`)
    .is('deleted_at', null)

  const totalInvoiced = (invoices ?? []).reduce((s, i) => s + (i.total ?? 0), 0)
  const totalCollected = (invoices ?? []).reduce((s, i) => s + (i.paid_amount ?? 0), 0)
  const paidCount = (invoices ?? []).filter(i => i.status === 'paid').length
  return {
    period: `Last ${days} days`,
    totalInvoiced,
    totalCollected,
    outstanding: totalInvoiced - totalCollected,
    invoiceCount: (invoices ?? []).length,
    paidCount,
  }
}

export async function getTodayStats() {
  return getClinicContext()
}

export async function listDoctors() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('doctors')
    .select('id, specialty, profiles(display_name), is_active')
    .eq('is_active', true)
    .order('specialty')
  return data ?? []
}

export async function getLowStock() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory_items')
    .select('id, name, current_stock, minimum_stock, unit')
    .filter('current_stock', 'lte', 'minimum_stock')
    .is('deleted_at', null)
    .limit(10)
  return data ?? []
}

// ── System prompt builder ────────────────────────────────────

export function buildSystemPrompt(ctx: Awaited<ReturnType<typeof getClinicContext>>, userRole: string, userName: string) {
  return `You are an intelligent AI assistant for a medical clinic management system.

## Your Identity
- You are embedded inside the clinic's internal CMS dashboard
- You have real-time access to clinic data through tools
- You are helpful, professional, and medically-aware

## Clinic Context (as of right now)
- Today's date: ${ctx.today}
- Today's appointments: ${ctx.todayAppointments}
- Today's revenue collected: EGP ${ctx.todayRevenue.toLocaleString()}
- Active doctors: ${ctx.activeDoctors}
- Pending lab results: ${ctx.pendingLabResults}
- Low stock alerts: ${ctx.lowStockItems}

## Current User
- Name: ${userName}
- Role: ${userRole}

## Your Capabilities
You can help with:
1. **Finding patients** — search by name, phone, or patient number
2. **Finding appointments** — look up by patient name or reason
3. **Revenue summaries** — total billed, collected, outstanding for any period
4. **Today's stats** — live clinic snapshot
5. **Doctor roster** — list active doctors and specialties
6. **Inventory alerts** — identify low stock items
7. **Explaining data** — interpret charts, trends, and anomalies
8. **Drafting messages** — emails, WhatsApp messages, follow-up reminders
9. **Translation** — Arabic ↔ English for medical content
10. **SOAP summaries** — summarize or explain medical notes

## Response Style
- Be concise and direct — clinic staff are busy
- Use structured output (tables, lists) when presenting data
- Always cite the source of data ("According to today's records...")
- For medical content, use professional terminology
- For Arabic translation requests, respond with both Arabic and English
- Never fabricate patient data or medical facts

## Limitations
- You cannot modify any records — you are read-only
- You cannot send actual messages or emails (only draft them)
- For any clinical decision, always defer to the treating physician`
}
