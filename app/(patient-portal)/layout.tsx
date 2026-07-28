import type { ReactNode } from 'react'
import { getPortalClinicSettings } from '@/features/patient-portal/queries'
import { PortalShell } from './portal-shell'

export default async function PatientPortalLayout({ children }: { children: ReactNode }) {
  const clinic = await getPortalClinicSettings()
  return (
    <PortalShell
      clinicName={clinic?.name ?? undefined}
      logoUrl={clinic?.logo_url ?? null}
      primaryColor={clinic?.primary_color ?? null}
    >
      {children}
    </PortalShell>
  )
}
