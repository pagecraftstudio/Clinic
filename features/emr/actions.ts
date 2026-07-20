'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Visit,
  Vitals,
  SOAPNote,
  CreateVisitInput,
  UpsertVitalsInput,
  UpsertSOAPInput,
  PaginatedVisits,
  VisitFilters,
} from '@/types/emr'

// ── Visits ───────────────────────────────────────────────────

export async function getVisits(
  filters: VisitFilters = {},
  page = 1,
  perPage = 20
): Promise<PaginatedVisits> {
  const supabase = await createServerClient()
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('visits')
    .select(
      `
      *,
      patient:patients(id, full_name, national_id),
      doctor:doctors(id, specialty, profiles(display_name)),
      vitals(*),
      soap_note:soap_notes(*)
    `,
      { count: 'exact' }
    )
    .order('visit_date', { ascending: false })
    .range(from, to)

  if (filters.patient_id)  query = query.eq('patient_id', filters.patient_id)
  if (filters.doctor_id)   query = query.eq('doctor_id', filters.doctor_id)
  if (filters.status)      query = query.eq('status', filters.status)
  if (filters.date_from)   query = query.gte('visit_date', filters.date_from)
  if (filters.date_to)     query = query.lte('visit_date', filters.date_to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as unknown as Visit[],
    count: count ?? 0,
    page,
    per_page: perPage,
  }
}

export async function getVisitById(id: string): Promise<Visit> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('visits')
    .select(
      `
      *,
      patient:patients(id, full_name, national_id),
      doctor:doctors(id, specialty, profiles(display_name)),
      vitals(*),
      soap_note:soap_notes(*)
    `
    )
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as Visit
}

export async function createVisit(input: CreateVisitInput): Promise<Visit> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('visits')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/emr')
  return data as unknown as Visit
}

export async function updateVisitStatus(
  id: string,
  status: Visit['status']
): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('visits')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/emr')
  revalidatePath(`/emr/${id}`)
}

// There is no soft-delete column on `visits` in the current schema.
// Cancelling the visit is the closest supported equivalent.
export async function cancelVisit(id: string): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('visits')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/emr')
}

// ── Vitals ───────────────────────────────────────────────────

export async function upsertVitals(input: UpsertVitalsInput): Promise<Vitals> {
  const supabase = await createServerClient()

  const { data: existing } = await supabase
    .from('vitals')
    .select('id')
    .eq('visit_id', input.visit_id)
    .maybeSingle()

  const { data, error } = existing
    ? await supabase
        .from('vitals')
        .update(input)
        .eq('id', existing.id)
        .select()
        .single()
    : await supabase
        .from('vitals')
        .insert({ ...input, recorded_by: (await supabase.auth.getUser()).data.user!.id })
        .select()
        .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/emr/${input.visit_id}`)
  return data as Vitals
}

// ── SOAP Notes ───────────────────────────────────────────────
// Note: the current schema has no e-signing (signed_at/signed_by)
// or structured follow-up fields on soap_notes — just the core
// SOAP text fields plus diagnosis_codes. If you want signing back,
// add those columns via a migration first.

export async function upsertSOAPNote(input: UpsertSOAPInput): Promise<SOAPNote> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existing } = await supabase
    .from('soap_notes')
    .select('id')
    .eq('visit_id', input.visit_id)
    .maybeSingle()

  const { data, error } = existing
    ? await supabase
        .from('soap_notes')
        .update(input)
        .eq('id', existing.id)
        .select()
        .single()
    : await supabase
        .from('soap_notes')
        .insert({ ...input, doctor_id: user.id })
        .select()
        .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/emr/${input.visit_id}`)
  return data as SOAPNote
}

export async function getPatientVisitHistory(
  patientId: string,
  limit = 10
): Promise<Visit[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('visits')
    .select(
      `
      id, visit_date, status, chief_complaint,
      doctor:doctors(id, specialty, profiles(display_name)),
      soap_note:soap_notes(assessment, diagnosis_codes)
    `
    )
    .eq('patient_id', patientId)
    .order('visit_date', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Visit[]
}
