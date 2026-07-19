// ============================================================
// AUTO-GENERATE THIS FILE via: supabase gen types typescript
// This is a partial manual version for reference.
// Run: npx supabase gen types typescript --project-id YOUR_ID > types/database.ts
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole =
  | 'owner' | 'admin' | 'doctor' | 'receptionist'
  | 'nurse' | 'cashier' | 'accountant' | 'lab_technician'
  | 'radiology_technician' | 'pharmacist' | 'marketing' | 'patient'

export type Gender = 'male' | 'female' | 'other'
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
export type AppointmentType = 'in_person' | 'online' | 'follow_up' | 'urgent' | 'routine'
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'vodafone_cash' | 'fawry' | 'insurance'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'cancelled'
export type InvoiceStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'refunded' | 'cancelled'
export type LabStatus = 'requested' | 'sample_collected' | 'processing' | 'completed' | 'cancelled'
export type RadiologyStatus = 'requested' | 'scheduled' | 'completed' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          first_name: string
          last_name: string
          display_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          language: string
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'display_name' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      patients: {
        Row: {
          id: string
          profile_id: string | null
          patient_number: string
          first_name: string
          last_name: string
          first_name_ar: string | null
          last_name_ar: string | null
          full_name: string
          date_of_birth: string | null
          gender: Gender | null
          blood_group: BloodGroup
          national_id: string | null
          passport_number: string | null
          phone: string
          phone_alt: string | null
          email: string | null
          address: string | null
          city: string | null
          governorate: string | null
          country: string
          occupation: string | null
          marital_status: string | null
          nationality: string | null
          language_pref: string
          allergies: string[] | null
          chronic_diseases: string[] | null
          current_medications: string[] | null
          notes: string | null
          insurance_company: string | null
          insurance_number: string | null
          insurance_expiry: string | null
          referred_by: string | null
          source: string | null
          is_active: boolean
          deleted_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'patient_number' | 'full_name' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          appointment_number: string
          patient_id: string
          doctor_id: string
          scheduled_at: string
          duration: number
          end_at: string
          type: AppointmentType
          status: AppointmentStatus
          chief_complaint: string | null
          notes: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          waiting_number: number | null
          is_online: boolean
          online_link: string | null
          booked_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'appointment_number' | 'end_at' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          patient_id: string
          doctor_id: string | null
          visit_id: string | null
          appointment_id: string | null
          issued_at: string
          due_date: string | null
          status: InvoiceStatus
          subtotal: number
          discount_type: string | null
          discount_value: number
          discount_amount: number
          tax_percent: number
          tax_amount: number
          total: number
          paid_amount: number
          balance: number
          currency: string
          notes: string | null
          insurance_claim: string | null
          pdf_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'invoice_number' | 'balance' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
    }
    Views: {
      v_today_queue: {
        Row: {
          id: string
          appointment_number: string
          waiting_number: number | null
          scheduled_at: string
          status: AppointmentStatus
          type: AppointmentType
          chief_complaint: string | null
          checked_in_at: string | null
          patient_id: string
          patient_number: string
          patient_name: string
          patient_phone: string
          patient_gender: Gender | null
          date_of_birth: string | null
          doctor_id: string
          doctor_name: string
          specialty: string
        }
      }
      v_patient_summary: {
        Row: Database['public']['Tables']['patients']['Row'] & {
          total_appointments: number
          total_visits: number
          total_prescriptions: number
          total_billed: number
          total_paid: number
          outstanding_balance: number
          last_visit_date: string | null
        }
      }
    }
    Functions: {
      get_dashboard_stats: {
        Args: { p_date?: string }
        Returns: Json
      }
      search_patients: {
        Args: { p_query: string; p_limit?: number }
        Returns: {
          id: string
          patient_number: string
          full_name: string
          phone: string
          national_id: string | null
          similarity: number
        }[]
      }
      get_available_slots: {
        Args: { p_doctor_id: string; p_date: string }
        Returns: {
          slot_start: string
          slot_end: string
          is_available: boolean
        }[]
      }
      auth_role: { Args: Record<never, never>; Returns: UserRole }
      is_admin: { Args: Record<never, never>; Returns: boolean }
      has_permission: {
        Args: { p_module: string; p_action: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      gender: Gender
      blood_group: BloodGroup
      appointment_status: AppointmentStatus
      appointment_type: AppointmentType
      payment_method: PaymentMethod
      invoice_status: InvoiceStatus
      lab_status: LabStatus
      radiology_status: RadiologyStatus
    }
    CompositeTypes: Record<string, never>
  }
}
