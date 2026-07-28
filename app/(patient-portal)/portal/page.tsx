import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPortalClinicSettings, getPortalDoctors, getPortalPatient } from '@/features/patient-portal/queries'
import { Calendar, FileText, Clock, MapPin, Phone, Mail, ChevronRight, User } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function PatientPortalHome() {
  const [clinic, doctors, patient] = await Promise.all([
    getPortalClinicSettings(),
    getPortalDoctors(),
    getPortalPatient(),
  ])

  const workingDayLabels = clinic?.working_days
    ? (clinic.working_days as number[]).map(d => DAYS[d]).join(', ')
    : 'Mon – Fri'

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0D2B2B 0%, #0D4040 60%, #0D9488 100%)',
        color: 'white',
        padding: '72px 24px 80px',
      }}>
        <div className="max-w-5xl mx-auto">
          {patient && (
            <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}>
              <User size={13} />
              Welcome back, {patient.full_name.split(' ')[0]}
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 16, maxWidth: 640 }}>
            {clinic?.tagline ?? 'Your health, managed online.'}
          </h1>
          <p style={{ fontSize: 16, opacity: 0.75, marginBottom: 36, maxWidth: 480 }}>
            Book appointments with our doctors and view your medical bills — all in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/portal/appointments/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--accent)', color: 'white' }}>
              <Calendar size={15} />
              Book an appointment
            </Link>
            {!patient && (
              <Link href="/portal/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white', backdropFilter: 'blur(4px)' }}>
                Sign in to view records
                <ChevronRight size={14} />
              </Link>
            )}
            {patient && (
              <Link href="/portal/bills"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white', backdropFilter: 'blur(4px)' }}>
                <FileText size={15} />
                View my bills
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Quick cards (logged-in shortcut) ── */}
      {patient && (
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 gap-3" style={{ maxWidth: 480 }}>
            <Link href="/portal/appointments"
              className="rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-md"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-light)' }}>
                <Calendar size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Appointments</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>View & manage</div>
              </div>
            </Link>
            <Link href="/portal/bills"
              className="rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-md"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: '#FFF7ED' }}>
                <FileText size={16} style={{ color: '#D97706' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Bills</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Invoices & payments</div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Doctors ── */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Our doctors</h2>
        {doctors.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No doctors listed yet.</p>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {doctors.map((doc: any) => (
              <div key={doc.id} className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                  style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                  {doc.profiles?.display_name?.charAt(0) ?? 'D'}
                </div>
                <div className="min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">
                    {doc.profiles?.display_name ?? 'Doctor'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.specialty}</div>
                  {doc.consultation_fee && (
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>
                      {doc.consultation_fee} EGP
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Link href="/portal/appointments/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: 'var(--accent)' }}>
            Book with a doctor <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Clinic info ── */}
      {clinic && (
        <section style={{ borderTop: '1px solid var(--border)', marginTop: 8 }}>
          <div className="max-w-5xl mx-auto px-4 py-10">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Clinic information</h2>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {clinic.working_hours_start && (
                <InfoCard icon={Clock} label="Working hours">
                  {clinic.working_hours_start} – {clinic.working_hours_end}
                  <br />
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{workingDayLabels}</span>
                </InfoCard>
              )}
              {clinic.address && (
                <InfoCard icon={MapPin} label="Address">
                  {clinic.address}
                  {clinic.city ? `, ${clinic.city}` : ''}
                </InfoCard>
              )}
              {clinic.phone && (
                <InfoCard icon={Phone} label="Phone">
                  <a href={`tel:${clinic.phone}`} style={{ color: 'var(--accent)' }}>{clinic.phone}</a>
                </InfoCard>
              )}
              {clinic.email && (
                <InfoCard icon={Mail} label="Email">
                  <a href={`mailto:${clinic.email}`} style={{ color: 'var(--accent)' }}>{clinic.email}</a>
                </InfoCard>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function InfoCard({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{children}</div>
    </div>
  )
}
