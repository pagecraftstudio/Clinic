import Link from 'next/link'
import { Building2, Users, UserRound, CalendarDays, DollarSign, Ban } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPlatformStats, getAdminClinics } from '@/features/admin/queries'

export const metadata = { title: 'Super Admin — Overview' }

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600/10 text-blue-500 flex-shrink-0">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminOverviewPage() {
  const [stats, clinics] = await Promise.all([getPlatformStats(), getAdminClinics()])
  const recentClinics = clinics.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={Building2} label="Clinics" value={stats.clinic_count} />
        <StatCard icon={Building2} label="Active" value={stats.active_clinic_count} />
        <StatCard icon={Ban} label="Suspended" value={stats.suspended_clinic_count} />
        <StatCard icon={Users} label="Staff Users" value={stats.user_count} />
        <StatCard icon={UserRound} label="Patients" value={stats.patient_count} />
        <StatCard icon={CalendarDays} label="Appts (30d)" value={stats.appointment_count_30d} />
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-600/10 text-green-500 flex-shrink-0">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Revenue collected — last 30 days (across all clinics)</p>
            <p className="text-xl font-semibold leading-tight">{stats.revenue_30d.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recently created clinics</CardTitle>
          <Link href="/admin/clinics" className="text-xs text-blue-500 hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/[0.06]">
            {recentClinics.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.slug} · {c.owner_email ?? 'no owner'}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{c.user_count} users</span>
                  <span>{c.patient_count} patients</span>
                  <span className={c.suspended_at ? 'text-red-500' : 'text-green-500'}>
                    {c.suspended_at ? 'Suspended' : 'Active'}
                  </span>
                </div>
              </div>
            ))}
            {recentClinics.length === 0 && (
              <p className="px-6 py-8 text-sm text-center text-muted-foreground">No clinics yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
