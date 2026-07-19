'use client'
export function DoctorPerformanceChart({ data }: { data?: any[] }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="font-semibold mb-4">Doctor Performance</h3>
      <div className="text-sm text-muted-foreground">No data available</div>
    </div>
  )
}
