'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Calendar, UserCog, Receipt,
  FlaskConical, Scan, Package, BarChart3, Sparkles,
  Settings, LogOut, ClipboardList, Building2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/',             icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/reception',    icon: ClipboardList,   label: 'Reception' },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { href: '/patients',     icon: Users,           label: 'Patients' },
      { href: '/appointments', icon: Calendar,        label: 'Appointments' },
      { href: '/doctors',      icon: UserCog,         label: 'Doctors' },
      { href: '/lab',          icon: FlaskConical,    label: 'Laboratory' },
      { href: '/radiology',    icon: Scan,            label: 'Radiology' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/billing',      icon: Receipt,         label: 'Billing' },
      { href: '/inventory',    icon: Package,         label: 'Inventory' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/ai',           icon: Sparkles,        label: 'AI Assistant' },
      { href: '/reports',      icon: BarChart3,       label: 'Reports' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.06]"
      style={{ width: '240px', background: 'var(--sidebar-bg)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600">
          <Building2 size={16} color="white" />
        </div>
        <div>
          <p className="text-white text-[13px] font-semibold leading-tight tracking-tight">Clinic CMS</p>
          <p className="text-[11px] text-[#A1A8B8]">Management System</p>
        </div>
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
                  <Link key={href} href={href} className="block relative">
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
      <div className="p-3 border-t border-white/[0.06] space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-[#A1A8B8] hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <Settings size={16} />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-[#A1A8B8] hover:text-white hover:bg-white/[0.05] transition-colors text-left"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
