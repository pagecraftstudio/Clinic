import type { ReactNode } from 'react'
import { getPortalClinicSettings } from '@/features/patient-portal/queries'
import { PortalShell } from './portal-shell'
import { LangProvider } from '@/lib/i18n/context'

export default async function PatientPortalLayout({ children }: { children: ReactNode }) {
  const clinic = await getPortalClinicSettings()
  return (
    <LangProvider>
      <PortalShell
        clinicName={clinic?.name ?? undefined}
        clinicNameAr={clinic?.name_ar ?? undefined}
        logoUrl={clinic?.logo_url ?? null}
        primaryColor={clinic?.primary_color ?? null}
      >
        {children}
      </PortalShell>
    </LangProvider>
  )
}
