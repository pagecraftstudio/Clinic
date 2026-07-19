import { notFound } from 'next/navigation'
import { getVisitById } from '@/actions/emr.actions'
import { VisitHeader } from '../_components/VisitHeader'
import { VitalsSection } from '../_components/VitalsSection'
import { SOAPSection } from '../_components/SOAPSection'
import { VisitSidebar } from '../_components/VisitSidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const visit = await getVisitById(id).catch(() => null)
  return { title: visit ? `Visit — ${visit.patient?.full_name}` : 'Visit' }
}

export default async function VisitDetailPage({ params }: PageProps) {
  const { id } = await params
  const visit = await getVisitById(id).catch(() => null)
  if (!visit) notFound()

  const isSigned = Boolean(visit.soap_note?.signed_at)

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Top bar */}
      <VisitHeader visit={visit} />

      {/* Layout: main + sidebar */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Main */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="soap">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="soap">SOAP Note</TabsTrigger>
                <TabsTrigger value="vitals">Vitals</TabsTrigger>
              </TabsList>
              {isSigned && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Signed
                </Badge>
              )}
            </div>

            <TabsContent value="soap" className="mt-0">
              <SOAPSection visit={visit} readOnly={isSigned} />
            </TabsContent>

            <TabsContent value="vitals" className="mt-0">
              <VitalsSection visit={visit} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <VisitSidebar visit={visit} />
      </div>
    </div>
  )
}
