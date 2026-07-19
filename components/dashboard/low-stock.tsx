'use client'
export function LowStockAlert({ items }: { items?: any[] }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="font-semibold mb-4">Low Stock Alert</h3>
      {(!items || items.length === 0) ? (
        <div className="text-sm text-muted-foreground">No low stock items</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item: any) => (
            <li key={item.id} className="text-sm">{item.name} — {item.quantity} left</li>
          ))}
        </ul>
      )}
    </div>
  )
}
