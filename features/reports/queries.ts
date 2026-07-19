import { createClient } from '@/lib/supabase/server'

export type ReportRange = {
  from: string
  to: string
}

// ── Revenue ─────────────────────────────────────────────────────────────────

export async function getRevenueReport(range: ReportRange) {
  const supabase = await createClient()

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, total, paid_amount, status, issued_at, doctor_id, doctors(specialty, profiles(display_name))')
    .is('deleted_at', null)
    .gte('issued_at', `${range.from}T00:00:00`)
    .lte('issued_at', `${range.to}T23:59:59`)
    .order('issued_at', { ascending: true })

  if (error) throw error

  const { data: payments } = await supabase
    .from('payments')
    .select('amount, payment_method, paid_at')
    .gte('paid_at', `${range.from}T00:00:00`)
    .lte('paid_at', `${range.to}T23:59:59`)

  // daily revenue map
  const dailyMap: Record<string, { date: string; invoiced: number; collected: number }> = {}
  for (const inv of invoices ?? []) {
    const day = inv.issued_at.slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = { date: day, invoiced: 0, collected: 0 }
    dailyMap[day].invoiced += inv.total ?? 0
    dailyMap[day].collected += inv.paid_amount ?? 0
  }

  // payment method breakdown
  const methodMap: Record<string, number> = {}
  for (const p of payments ?? []) {
    const m = p.payment_method ?? 'other'
    methodMap[m] = (methodMap[m] ?? 0) + (p.amount ?? 0)
  }

  // doctor revenue
  const doctorMap: Record<string, { name: string; invoiced: number; collected: number }> = {}
  for (const inv of invoices ?? []) {
    const doc = inv.doctors as any
    const name = doc?.profiles?.display_name ?? 'Unknown'
    if (!doctorMap[name]) doctorMap[name] = { name, invoiced: 0, collected: 0 }
    doctorMap[name].invoiced += inv.total ?? 0
    doctorMap[name].collected += inv.paid_amount ?? 0
  }

  const totalInvoiced = (invoices ?? []).reduce((s, i) => s + (i.total ?? 0), 0)
  const totalCollected = (invoices ?? []).reduce((s, i) => s + (i.paid_amount ?? 0), 0)
  const outstanding = totalInvoiced - totalCollected
  const invoiceCount = (invoices ?? []).length
  const paidCount = (invoices ?? []).filter(i => i.status === 'paid').length

  return {
    summary: { totalInvoiced, totalCollected, outstanding, invoiceCount, paidCount },
    daily: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
    byMethod: Object.entries(methodMap).map(([method, amount]) => ({ method, amount })),
    byDoctor: Object.values(doctorMap).sort((a, b) => b.invoiced - a.invoiced),
  }
}

// ── Appointments ─────────────────────────────────────────────────────────────

export async function getAppointmentsReport(range: ReportRange) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select('id, status, type, scheduled_at, doctor_id, doctors(specialty, profiles(display_name))')
    .is('deleted_at', null)
    .gte('scheduled_at', `${range.from}T00:00:00`)
    .lte('scheduled_at', `${range.to}T23:59:59`)
    .order('scheduled_at', { ascending: true })

  if (error) throw error

  const statusMap: Record<string, number> = {}
  const typeMap: Record<string, number> = {}
  const dailyMap: Record<string, { date: string; total: number; completed: number; no_show: number; cancelled: number }> = {}
  const doctorMap: Record<string, { name: string; total: number; completed: number; no_show: number }> = {}

  for (const appt of data ?? []) {
    const day = appt.scheduled_at.slice(0, 10)
    const status = appt.status ?? 'unknown'
    const type = appt.type ?? 'unknown'
    const doc = appt.doctors as any
    const docName = doc?.profiles?.display_name ?? 'Unknown'

    statusMap[status] = (statusMap[status] ?? 0) + 1
    typeMap[type] = (typeMap[type] ?? 0) + 1

    if (!dailyMap[day]) dailyMap[day] = { date: day, total: 0, completed: 0, no_show: 0, cancelled: 0 }
    dailyMap[day].total++
    if (status === 'completed') dailyMap[day].completed++
    if (status === 'no_show') dailyMap[day].no_show++
    if (status === 'cancelled') dailyMap[day].cancelled++

    if (!doctorMap[docName]) doctorMap[docName] = { name: docName, total: 0, completed: 0, no_show: 0 }
    doctorMap[docName].total++
    if (status === 'completed') doctorMap[docName].completed++
    if (status === 'no_show') doctorMap[docName].no_show++
  }

  const total = (data ?? []).length
  const completed = statusMap['completed'] ?? 0
  const no_show = statusMap['no_show'] ?? 0
  const cancelled = statusMap['cancelled'] ?? 0
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const noShowRate = total > 0 ? Math.round((no_show / total) * 100) : 0

  return {
    summary: { total, completed, no_show, cancelled, completionRate, noShowRate },
    daily: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
    byStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    byType: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
    byDoctor: Object.values(doctorMap).sort((a, b) => b.total - a.total),
  }
}

// ── Patients ─────────────────────────────────────────────────────────────────

export async function getPatientsReport(range: ReportRange) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('patients')
    .select('id, gender, blood_group, city, governorate, created_at')
    .is('deleted_at', null)
    .gte('created_at', `${range.from}T00:00:00`)
    .lte('created_at', `${range.to}T23:59:59`)
    .order('created_at', { ascending: true })

  if (error) throw error

  const { data: allPatients } = await supabase
    .from('patients')
    .select('id')
    .is('deleted_at', null)

  const genderMap: Record<string, number> = {}
  const bloodMap: Record<string, number> = {}
  const cityMap: Record<string, number> = {}
  const dailyMap: Record<string, { date: string; count: number }> = {}

  for (const p of data ?? []) {
    const day = p.created_at.slice(0, 10)
    genderMap[p.gender ?? 'unknown'] = (genderMap[p.gender ?? 'unknown'] ?? 0) + 1
    bloodMap[p.blood_group ?? 'unknown'] = (bloodMap[p.blood_group ?? 'unknown'] ?? 0) + 1
    if (p.city) cityMap[p.city] = (cityMap[p.city] ?? 0) + 1
    if (!dailyMap[day]) dailyMap[day] = { date: day, count: 0 }
    dailyMap[day].count++
  }

  return {
    summary: {
      newPatients: (data ?? []).length,
      totalPatients: (allPatients ?? []).length,
    },
    daily: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
    byGender: Object.entries(genderMap).map(([gender, count]) => ({ gender, count })),
    byBloodGroup: Object.entries(bloodMap).map(([group, count]) => ({ group, count })),
    byCity: Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  }
}

// ── Inventory ────────────────────────────────────────────────────────────────

export async function getInventoryReport() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, category, quantity, min_quantity, unit_cost, expiry_date, is_active')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('quantity', { ascending: true })

  if (error) throw error

  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const lowStock = (data ?? []).filter(i => (i.quantity ?? 0) <= (i.min_quantity ?? 0))
  const expiringSoon = (data ?? []).filter(i => {
    if (!i.expiry_date) return false
    const exp = new Date(i.expiry_date)
    return exp <= thirtyDays && exp >= now
  })
  const expired = (data ?? []).filter(i => {
    if (!i.expiry_date) return false
    return new Date(i.expiry_date) < now
  })

  const categoryMap: Record<string, { category: string; count: number; value: number }> = {}
  for (const item of data ?? []) {
    const cat = item.category ?? 'Other'
    if (!categoryMap[cat]) categoryMap[cat] = { category: cat, count: 0, value: 0 }
    categoryMap[cat].count++
    categoryMap[cat].value += (item.quantity ?? 0) * (item.unit_cost ?? 0)
  }

  const totalValue = (data ?? []).reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_cost ?? 0), 0)

  return {
    summary: {
      totalItems: (data ?? []).length,
      lowStockCount: lowStock.length,
      expiringSoonCount: expiringSoon.length,
      expiredCount: expired.length,
      totalValue,
    },
    lowStock: lowStock.slice(0, 20),
    expiringSoon: expiringSoon.slice(0, 20),
    expired: expired.slice(0, 20),
    byCategory: Object.values(categoryMap).sort((a, b) => b.value - a.value),
  }
}

// ── Lab ──────────────────────────────────────────────────────────────────────

export async function getLabReport(range: ReportRange) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lab_requests')
    .select('id, status, test_name, created_at')
    .gte('created_at', `${range.from}T00:00:00`)
    .lte('created_at', `${range.to}T23:59:59`)
    .order('created_at', { ascending: true })

  if (error) throw error

  const statusMap: Record<string, number> = {}
  const testMap: Record<string, number> = {}

  for (const r of data ?? []) {
    statusMap[r.status ?? 'unknown'] = (statusMap[r.status ?? 'unknown'] ?? 0) + 1
    if (r.test_name) testMap[r.test_name] = (testMap[r.test_name] ?? 0) + 1
  }

  return {
    summary: { total: (data ?? []).length, completed: statusMap['completed'] ?? 0 },
    byStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    topTests: Object.entries(testMap)
      .map(([test, count]) => ({ test, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  }
}

// ── Radiology ────────────────────────────────────────────────────────────────

export async function getRadiologyReport(range: ReportRange) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('radiology_orders')
    .select('id, status, modality, created_at')
    .gte('created_at', `${range.from}T00:00:00`)
    .lte('created_at', `${range.to}T23:59:59`)
    .order('created_at', { ascending: true })

  if (error) throw error

  const statusMap: Record<string, number> = {}
  const modalityMap: Record<string, number> = {}

  for (const r of data ?? []) {
    statusMap[r.status ?? 'unknown'] = (statusMap[r.status ?? 'unknown'] ?? 0) + 1
    if (r.modality) modalityMap[r.modality] = (modalityMap[r.modality] ?? 0) + 1
  }

  return {
    summary: { total: (data ?? []).length, completed: statusMap['completed'] ?? 0 },
    byStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    byModality: Object.entries(modalityMap).map(([modality, count]) => ({ modality, count })),
  }
}
