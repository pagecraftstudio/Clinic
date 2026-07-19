import type { InventoryItem } from '@/types/inventory'

interface Props {
  item: Pick<InventoryItem, 'current_stock' | 'minimum_stock' | 'expiry_date'>
}

export function StockStatusBadge({ item }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const isExpired = item.expiry_date && item.expiry_date <= today
  const isOut = item.current_stock === 0
  const isLow = !isOut && item.current_stock <= item.minimum_stock

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}>
        Expired
      </span>
    )
  }
  if (isOut) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}>
        Out of Stock
      </span>
    )
  }
  if (isLow) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>
        Low Stock
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
      In Stock
    </span>
  )
}
