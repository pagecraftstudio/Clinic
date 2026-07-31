import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRecentAuditLogs } from '@/features/admin/queries'

export const metadata = { title: 'Super Admin — Audit Log' }

export default async function AdminAuditPage() {
  const logs = await getRecentAuditLogs(100)

  return (
    <Card>
      <CardContent className="p-0 divide-y divide-[var(--border)]">
        {logs.map((log: any) => (
          <div key={log.id} className="flex items-center justify-between px-6 py-3 text-sm">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{log.action}</Badge>
                {log.table_name && <span className="text-xs text-muted-foreground">{log.table_name}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {log.profiles?.display_name ?? log.profiles?.email ?? 'System'} · {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
            {log.ip_address && <span className="text-xs text-muted-foreground">{log.ip_address}</span>}
          </div>
        ))}
        {logs.length === 0 && (
          <p className="px-6 py-8 text-sm text-center text-muted-foreground">No audit events yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
