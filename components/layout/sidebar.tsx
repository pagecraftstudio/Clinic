'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Calendar, UserCog, Receipt,
  FlaskConical, Scan, Package, BarChart3, Sparkles,
  Settings, LogOut, ClipboardList, Building2, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'

function getNavGroups(t: (en: string, ar: string) => string) {
  return [
    {
      label: t('Overview', 'نظرة عامة'),
      items: [
        { href: '/',             icon: LayoutDashboard, label: t('Dashboard', 'لوحة التحكم') },
        { href: '/reception',    icon: ClipboardList,   label: t('Reception', 'الاستقبال') },
      ],
    },
    {
      label: t('Clinical', 'سريري'),
      items: [
        { href: '/patients',     icon: Users,           label: t('Patients', 'المرضى') },
        { href: '/appointments', icon: Calendar,        label: t('Appointments', 'المواعيد') },
        { href: '/doctors',      icon: UserCog,         label: t('Doctors', 'الأطباء') },
        { href: '/lab',          icon: FlaskConical,    label: t('Laboratory', 'المختبر') },
        { href: '/radiology',    icon: Scan,            label: t('Radiology', 'الأشعة') },
      ],
    },
    {
      label: t('Finance', 'مالية'),
      items: [
        { href: '/billing',      icon: Receipt,         label: t('Billing', 'الفواتير') },
        { href: '/inventory',    icon: Package,         label: t('Inventory', 'المخزون') },
      ],
    },
    {
      label: t('Intelligence', 'ذكاء اصطناعي'),
      items: [
        { href: '/ai',           icon: Sparkles,        label: t('AI Assistant', 'المساعد الذكي') },
        { href: '/reports',      icon: BarChart3,       label: t('Reports', 'التقارير') },
      ],
    },
  ]
}

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const { t } = useLang()
  const NAV_GROUPS = getNavGroups(t)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarContent = (
    <aside
      className="flex flex-col h-full border-r border-white/[0.06]"
      style={{ width: '240px', background: 'var(--sidebar-bg)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600">
          <Building2 size={16} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-semibold leading-tight tracking-tight">Clinic CMS</p>
          <p className="text-[11px] text-[#A1A8B8]">{t('Management System', 'نظام الإدارة')}</p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-md text-[#A1A8B8] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1 text-[#A1A8B8]/50">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className="block relative"
                    onClick={onClose}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-pill"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <div
                      className={cn(
                        'flex items-center gap-3 px-3 py-[7px] rounded-md text-[13px] font-medium transition-colors duration-100',
                        active
                          ? 'text-white bg-white/[0.08]'
                          : 'text-[#A1A8B8] hover:text-white hover:bg-white/[0.05]'
                      )}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      {label}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/[0.06] space-y-0.5 flex-shrink-0">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-[#A1A8B8] hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <Settings size={16} />
          {t('Settings', 'الإعدادات')}
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-[#A1A8B8] hover:text-white hover:bg-white/[0.05] transition-colors text-left"
        >
          <LogOut size={16} />
          {t('Sign out', 'تسجيل الخروج')}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-40" style={{ width: '240px' }}>
        {sidebarContent}
      </div>

      {/* Mobile: drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative z-10 h-full overflow-hidden" style={{ width: '240px' }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
