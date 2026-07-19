import { PatientForm } from '@/components/patients/patient-form'
import { createPatient } from '@/features/patients/actions'

export default function NewPatientPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>Register patient</h1>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Create a new patient record</p>
      </div>
      <PatientForm onSubmit={createPatient} />
    </div>
  )
}
