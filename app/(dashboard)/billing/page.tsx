import { getBillingSummary } from '@/features/billing/queries'
import { BillingClient } from './billing-client'

export const metadata = { title: 'Billing' }

export default async function BillingPage() {
  const summary = await getBillingSummary()
  return <BillingClient summary={summary} />
}
