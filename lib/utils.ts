import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'EGP') {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date, format = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date
  if (format === 'short') {
    return new Intl.DateTimeFormat('en-EG', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
  }
  if (format === 'time') {
    return new Intl.DateTimeFormat('en-EG', { hour: '2-digit', minute: '2-digit', hour12: true }).format(d)
  }
  if (format === 'datetime') {
    return new Intl.DateTimeFormat('en-EG', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(d)
  }
  if (format === 'relative') {
    const now = Date.now()
    const diff = now - d.getTime()
    const mins  = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days  = Math.floor(diff / 86_400_000)
    if (mins < 1)   return 'just now'
    if (mins < 60)  return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7)   return `${days}d ago`
    return formatDate(d, 'short')
  }
  return d.toLocaleDateString()
}

export function formatAge(dob: string | null) {
  if (!dob) return '—'
  const birth = new Date(dob)
  const now   = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const m     = now.getMonth() - birth.getMonth()
  return m < 0 || (m === 0 && now.getDate() < birth.getDate()) ? years - 1 : years
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
