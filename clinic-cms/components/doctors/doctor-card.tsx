'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Stethoscope, Video, Phone, Mail, MoreHorizontal, Power, Trash2 } from 'lucide-react'
import { toggleDoctorActive, deleteDoctor } from '@/features/doctors/actions'
import type { Doctor } from '@/types/doctor'
import { cn } from '@/lib/utils'

interface Props {
  doctor: Doctor
  onMutate?: () => void
}

export function DoctorCard({ doctor, onMutate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const profile = doctor.profiles
  const displayName = profile?.display_name ?? `${profile?.first_name} ${profile?.last_name}`
  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase()

  async function handleToggle() {
    setMenuOpen(false)
    startTransition(async () => {
      await toggleDoctorActive(doctor.id, !doctor.is_active)
      onMutate?.()
    })
  }

  async function handleDelete() {
    setMenuOpen(false)
    if (!confirm(`Deactivate Dr. ${displayName}? They will no longer appear in appointment booking.`)) return
    startTransition(async () => {
      const res = await deleteDoctor(doctor.id)
      if (!res.success) alert(res.error)
      else onMutate?.()
    })
  }

  return (
    <div className={cn(
      'group relative bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 hover:shadow-md transition-all',
      !doctor.is_active && 'opacity-60',
    )}>
      {/* Status dot */}
      <span className={cn(
        'absolute top-4 right-4 size-2 rounded-full',
        doctor.is_active ? 'bg-emerald-400' : 'bg-[var(--border)]',
      )} title={doctor.is_active ? 'Active' : 'Inactive'} />

      {/* Avatar + basic info */}
      <Link href={`/doctors/${doctor.id}`} className="flex items-start gap-4 mb-4">
        <div className="relative flex-shrink-0">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="size-14 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <div className="size-14 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow">
              {initials || <Stethoscope className="size-6" />}
            </div>
          )}
          {doctor.accepts_online && (
            <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-sky-100 border-2 border-white flex items-center justify-center">
              <Video className="size-3 text-sky-500" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">{displayName}</h3>
          <p className="text-sm text-[var(--accent)] font-medium">{doctor.specialty}</p>
          {doctor.sub_specialty && (
            <p className="text-xs text-[var(--text-muted)] truncate">{doctor.sub_specialty}</p>
          )}
        </div>
      </Link>

      {/* Fees */}
      <div className="flex gap-3 mb-4">
        <Pill label="Consult" value={`${doctor.consultation_fee} EGP`} />
        <Pill label="Follow-up" value={`${doctor.follow_up_fee} EGP`} />
      </div>

      {/* Contact */}
      <div className="space-y-1 text-xs text-[var(--text-muted)]">
        {profile?.phone && (
          <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors">
            <Phone className="size-3" /> {profile.phone}
          </a>
        )}
        {profile?.email && (
          <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors truncate">
            <Mail className="size-3" /> {profile.email}
          </a>
        )}
      </div>

      {/* Context menu */}
      <div className="absolute bottom-4 right-4">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            disabled={isPending}
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <div className="absolute bottom-full right-0 mb-1 w-44 bg-white rounded-xl border border-[var(--border)] shadow-lg py-1 z-10">
              <Link
                href={`/doctors/${doctor.id}/edit`}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--surface-muted)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Edit profile
              </Link>
              <button
                onClick={handleToggle}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--surface-muted)] transition-colors"
              >
                <Power className="size-3.5" />
                {doctor.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <div className="border-t border-[var(--border)] my-1" />
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 bg-[var(--surface-muted)] rounded-lg px-2.5 py-1.5 min-w-0">
      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{value}</p>
    </div>
  )
}
