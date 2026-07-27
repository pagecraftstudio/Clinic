'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { doctorSchema, leaveSchema } from '@/lib/validations/doctor'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

// ── Create ────────────────────────────────────────────────────────────────────
export async function createDoctor(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = doctorSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const admin = await createAdminClient()
  const { data: auth } = await supabase.auth.getUser()

  const {
    first_name, last_name, display_name, phone, email, avatar_url,
    specialty, sub_specialty, license_number, consultation_fee,
    follow_up_fee, bio, is_active, accepts_online, working_hours,
  } = parsed.data

  // 1. Check if a user with this email already exists in auth
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingAuthUser = existingUsers?.users?.find((u) => u.email === email)

  let authUserId: string

  if (existingAuthUser) {
    // Email already in auth.users — check if they already have a doctor record
    const { data: existingDoctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('profile_id', existingAuthUser.id)
      .maybeSingle()
    if (existingDoctor) {
      return { success: false, error: 'A doctor with this email already exists.' }
    }
    authUserId = existingAuthUser.id
  } else {
    // Create new auth user — trigger will auto-create the profile row
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { first_name, last_name },
    })
    if (authErr) return { success: false, error: authErr.message }
    if (!authData.user) return { success: false, error: 'User creation failed' }
    authUserId = authData.user.id
  }

  // 2. Update the profile with doctor details
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .update({
      full_name: `${first_name} ${last_name}`.trim(),
      display_name: display_name || `${first_name} ${last_name}`.trim(),
      first_name,
      last_name,
      phone: phone || null,
      email,
      avatar_url: avatar_url || null,
      role: 'doctor',
    })
    .eq('id', authUserId)
    .select('id')
    .single()

  if (profileErr) {
    // Only roll back if we created a new user (don't delete a pre-existing account)
    if (!existingAuthUser) {
      await admin.auth.admin.deleteUser(authUserId)
    }
    return { success: false, error: profileErr.message }
  }

  // 2. Create doctor record
  const { data: doctor, error: doctorErr } = await supabase
    .from('doctors')
    .insert({
      profile_id: profile.id,
      specialty,
      sub_specialty: sub_specialty || null,
      license_number: license_number || null,
      consultation_fee,
      follow_up_fee,
      bio: bio || null,
      is_active,
      accepts_online,
      working_hours,
    })
    .select('id')
    .single()

  if (doctorErr) return { success: false, error: doctorErr.message }

  await supabase.from('audit_logs').insert({
    action: 'doctor_created',
    table_name: 'doctors',
    record_id: doctor.id,
    performed_by: auth.user?.id ?? null,
  })

  revalidatePath('/doctors')
  return { success: true, data: { id: doctor.id } }
}

// ── Update ────────────────────────────────────────────────────────────────────
export async function updateDoctor(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = doctorSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const {
    first_name, last_name, display_name, phone, email, avatar_url,
    specialty, sub_specialty, license_number, consultation_fee,
    follow_up_fee, bio, is_active, accepts_online, working_hours,
  } = parsed.data

  // Get profile_id
  const { data: doc } = await supabase
    .from('doctors')
    .select('profile_id')
    .eq('id', id)
    .single()

  if (!doc) return { success: false, error: 'Doctor not found' }

  // Update profile
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      full_name: `${first_name} ${last_name}`.trim(),
      display_name: display_name || `${first_name} ${last_name}`.trim(),
      first_name,
      last_name,
      phone: phone || null,
      email,
      avatar_url: avatar_url || null,
    })
    .eq('id', doc.profile_id)

  if (profileErr) return { success: false, error: profileErr.message }

  // Update doctor
  const { error: doctorErr } = await supabase
    .from('doctors')
    .update({
      specialty,
      sub_specialty: sub_specialty || null,
      license_number: license_number || null,
      consultation_fee,
      follow_up_fee,
      bio: bio || null,
      is_active,
      accepts_online,
      working_hours,
    })
    .eq('id', id)

  if (doctorErr) return { success: false, error: doctorErr.message }

  await supabase.from('audit_logs').insert({
    action: 'doctor_updated',
    table_name: 'doctors',
    record_id: id,
    performed_by: auth.user?.id ?? null,
  })

  revalidatePath('/doctors')
  revalidatePath(`/doctors/${id}`)
  return { success: true }
}

// ── Toggle active ─────────────────────────────────────────────────────────────
export async function toggleDoctorActive(id: string, is_active: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('doctors')
    .update({ is_active })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/doctors')
  revalidatePath(`/doctors/${id}`)
  return { success: true }
}

// ── Delete ────────────────────────────────────────────────────────────────────
export async function deleteDoctor(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  // Check no future appointments
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', id)
    .gte('scheduled_at', new Date().toISOString())
    .not('status', 'in', '(cancelled,no_show)')

  if ((count ?? 0) > 0) {
    return { success: false, error: 'Doctor has upcoming appointments. Reassign or cancel them first.' }
  }

  const { error } = await supabase
    .from('doctors')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    action: 'doctor_deactivated',
    table_name: 'doctors',
    record_id: id,
    performed_by: auth.user?.id ?? null,
  })

  revalidatePath('/doctors')
  return { success: true }
}

// ── Leave management ──────────────────────────────────────────────────────────
export async function createLeave(doctor_id: string, raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = leaveSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('doctor_leaves')
    .insert({ doctor_id, ...parsed.data, status: 'approved' })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    action: 'leave_created',
    table_name: 'doctor_leaves',
    record_id: data.id,
    performed_by: auth.user?.id ?? null,
  })

  revalidatePath(`/doctors/${doctor_id}`)
  return { success: true, data: { id: data.id } }
}

export async function deleteLeave(leave_id: string, doctor_id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('doctor_leaves').delete().eq('id', leave_id)
  if (error) return { success: false, error: error.message }
  revalidatePath(`/doctors/${doctor_id}`)
  return { success: true }
}
