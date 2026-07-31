export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getPortalPatient, getPatientInvoices } from '@/features/patient-portal/queries'
import { BillsClient } from './bills-client'

export const metadata = { title: 'My Bills' }

export default async function PatientBillsPage() {
  const patient = await getPortalPatient()
  if (!patient) redirect('/portal/login')
  const invoices = await getPatientInvoices(patient.id)
  return <BillsClient patient={patient} invoices={invoices as any} />
}
