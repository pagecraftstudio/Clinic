import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-3">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--bg-subtle)' }}
      >
        <Icon size={20} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="space-y-1">
        <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
        {description && (
          <p className="text-[13px] max-w-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
