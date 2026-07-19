export type ReportTab = 'revenue' | 'appointments' | 'patients' | 'inventory' | 'lab' | 'radiology'

export type DatePreset = '7d' | '30d' | '90d' | '365d' | 'custom'

export interface ReportFilters {
  tab: ReportTab
  from: string
  to: string
  preset: DatePreset
}
