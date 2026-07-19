import { notFound } from 'next/navigation'
import { getInvoiceById, getPaymentsByInvoice, getRefundsByInvoice } from '@/features/billing/queries'
import { InvoiceDetailClient } from './invoice-detail-client'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  try {
    const invoice = await getInvoiceById(id)
    return { title: invoice.invoice_number }
  } catch {
    return { title: 'Invoice' }
  }
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params
  try {
    const [invoice, payments, refunds] = await Promise.all([
      getInvoiceById(id),
      getPaymentsByInvoice(id),
      getRefundsByInvoice(id),
    ])
    return <InvoiceDetailClient invoice={invoice} payments={payments} refunds={refunds} />
  } catch {
    notFound()
  }
}
