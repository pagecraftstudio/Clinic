import { notFound } from 'next/navigation'
import {
  getPatientById, getPatientEmergencyContacts, getPatientDocuments, getPatientTimeline,
} from '@/features/patients/queries'
import { PatientDetailClient } from './patient-detail-client'

interface PageProps { params: Promise<{ id: string }> }

export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params

  let patient
  try {
    patient = await getPatientById(id)
  } catch {
    notFound()
  }

  const [contacts, documents, timeline] = await Promise.all([
    getPatientEmergencyContacts(id),
    getPatientDocuments(id),
    getPatientTimeline(id),
  ])

  return (
    <PatientDetailClient
      patient={patient}
      contacts={contacts ?? []}
      documents={documents ?? []}
      timeline={timeline}
    />
  )
}
