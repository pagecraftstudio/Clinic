'use client'

import { AlertTriangle, AlertOctagon, Info, Wrench } from 'lucide-react'
import type { MaintenanceModeValue, SystemAnnouncement } from '@/types/admin'

const SEVERITY_STYLE: Record<SystemAnnouncement['severity'], { icon: any; bg: string; text: string }> = {
  info:     { icon: Info,          bg: 'bg-blue-500/10',  text: 'text-blue-400' },
  warning:  { icon: AlertTriangle, bg: 'bg-amber-500/10', text: 'text-amber-400' },
  critical: { icon: AlertOctagon,  bg: 'bg-red-500/10',   text: 'text-red-400' },
}

export function MaintenanceBanner({
  maintenanceMode,
  announcements,
}: {
  maintenanceMode?: MaintenanceModeValue | null
  announcements?: SystemAnnouncement[]
}) {
  if (!maintenanceMode?.enabled && !(announcements && announcements.length > 0)) return null

  return (
    <div className="flex flex-col">
      {maintenanceMode?.enabled && (
        <div className="flex items-center gap-2 px-4 py-2 text-[13px] bg-amber-500/10 text-amber-400 border-b border-amber-500/20">
          <Wrench size={14} className="flex-shrink-0" />
          <span>{maintenanceMode.message || 'Scheduled maintenance in progress. Some features may be unavailable.'}</span>
        </div>
      )}
      {announcements?.map((a) => {
        const s = SEVERITY_STYLE[a.severity]
        const Icon = s.icon
        return (
          <div key={a.id} className={`flex items-center gap-2 px-4 py-2 text-[13px] ${s.bg} ${s.text} border-b border-[var(--border)]`}>
            <Icon size={14} className="flex-shrink-0" />
            <span className="font-medium">{a.title}:</span>
            <span>{a.message}</span>
          </div>
        )
      })}
    </div>
  )
}
