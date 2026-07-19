import { Metadata } from 'next'
import { ReceptionClient } from '@/components/reception/reception-client'

export const metadata: Metadata = {
  title: 'Reception — Clinic CMS',
  description: 'Daily reception dashboard: appointments, queue, and quick actions',
}

export default function ReceptionPage() {
  return <ReceptionClient />
}
