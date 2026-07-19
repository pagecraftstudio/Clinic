'use client'
import { Prescription } from '@/types/prescription'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface PrescriptionDetailProps {
  prescription: Prescription
}

export function PrescriptionDetail({ prescription }: PrescriptionDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Prescription #{prescription.prescription_number}</span>
            <Badge variant={prescription.is_dispensed ? 'secondary' : 'default'}>
              {prescription.is_dispensed ? 'Dispensed' : 'Active'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Patient:</span> {prescription.patients?.full_name ?? '—'}</div>
            <div><span className="font-medium">Doctor:</span> {prescription.doctors?.profiles?.display_name ?? '—'}</div>
            <div><span className="font-medium">Prescribed:</span> {formatDate(prescription.prescribed_at)}</div>
            {prescription.valid_until && (
              <div><span className="font-medium">Valid Until:</span> {formatDate(prescription.valid_until)}</div>
            )}
            {prescription.diagnosis && (
              <div className="col-span-2"><span className="font-medium">Diagnosis:</span> {prescription.diagnosis}</div>
            )}
          </div>
          {prescription.items && prescription.items.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Medications</h4>
              <div className="space-y-2">
                {prescription.items.map((item) => (
                  <div key={item.id} className="rounded border p-3 text-sm">
                    <div className="font-medium">{item.medicine_name} {item.strength}</div>
                    <div className="text-muted-foreground">{item.dosage} — {item.frequency} — {item.duration}</div>
                    {item.instructions && <div className="text-muted-foreground">{item.instructions}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
