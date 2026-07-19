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
export type InventoryCategory = 'medicine' | 'supply' | 'equipment' | 'consumable'
export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled'
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'return' | 'expired'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type LabTestPriority = 'routine' | 'urgent' | 'stat'
export type PrescriptionStatus = 'active' | 'dispensed' | 'expired' | 'cancelled'
export type VisitStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface WorkingHours {
  day: DayOfWeek
  is_active: boolean
  start_time: string
  end_time: string
  break_start?: string | null
  break_end?: string | null
  slot_duration: number
}

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
        Relationships: []
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
        Relationships: []
      }
      patient_emergency_contacts: {
        Row: {
          id: string
          patient_id: string
          name: string
          relationship: string | null
          phone: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['patient_emergency_contacts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['patient_emergency_contacts']['Insert']>
        Relationships: []
      }
      patient_documents: {
        Row: {
          id: string
          patient_id: string
          name: string
          type: string | null
          url: string
          size: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['patient_documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['patient_documents']['Insert']>
        Relationships: []
      }
      doctors: {
        Row: {
          id: string
          profile_id: string
          employee_number: string
          specialty: string
          sub_specialty: string | null
          license_number: string | null
          consultation_fee: number
          follow_up_fee: number
          bio: string | null
          is_active: boolean
          accepts_online: boolean
          working_hours: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['doctors']['Row'], 'employee_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['doctors']['Insert']>
        Relationships: []
      }
      doctor_leaves: {
        Row: {
          id: string
          doctor_id: string
          start_date: string
          end_date: string
          reason: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['doctor_leaves']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['doctor_leaves']['Insert']>
        Relationships: []
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
        Relationships: []
      }
      visits: {
        Row: {
          id: string
          visit_number: string
          patient_id: string
          doctor_id: string
          appointment_id: string | null
          visit_date: string
          chief_complaint: string | null
          status: VisitStatus
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['visits']['Row'], 'visit_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['visits']['Insert']>
        Relationships: []
      }
      vitals: {
        Row: {
          id: string
          visit_id: string
          patient_id: string
          height: number | null
          weight: number | null
          bmi: number | null
          temperature: number | null
          pulse: number | null
          blood_pressure_systolic: number | null
          blood_pressure_diastolic: number | null
          oxygen_saturation: number | null
          respiratory_rate: number | null
          notes: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vitals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vitals']['Insert']>
        Relationships: []
      }
      soap_notes: {
        Row: {
          id: string
          visit_id: string
          patient_id: string
          doctor_id: string
          subjective: string | null
          objective: string | null
          assessment: string | null
          plan: string | null
          diagnosis_codes: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['soap_notes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['soap_notes']['Insert']>
        Relationships: []
      }
      prescriptions: {
        Row: {
          id: string
          prescription_number: string
          visit_id: string | null
          patient_id: string
          doctor_id: string
          prescribed_at: string
          valid_until: string | null
          diagnosis: string | null
          notes: string | null
          is_dispensed: boolean
          dispensed_at: string | null
          dispensed_by: string | null
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'prescription_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>
        Relationships: []
      }
      prescription_items: {
        Row: {
          id: string
          prescription_id: string
          medicine_name: string
          strength: string | null
          form: string | null
          dosage: string
          frequency: string
          duration: string
          quantity: number | null
          route: string | null
          instructions: string | null
          is_prn: boolean
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['prescription_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['prescription_items']['Insert']>
        Relationships: []
      }
      lab_requests: {
        Row: {
          id: string
          request_number: string
          visit_id: string | null
          patient_id: string
          doctor_id: string
          technician_id: string | null
          status: LabStatus
          priority: LabTestPriority
          requested_at: string
          collected_at: string | null
          completed_at: string | null
          diagnosis: string | null
          clinical_notes: string | null
          report_notes: string | null
          attachment_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['lab_requests']['Row'], 'request_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['lab_requests']['Insert']>
        Relationships: []
      }
      lab_results: {
        Row: {
          id: string
          lab_request_id: string
          test_name: string
          value: string | null
          unit: string | null
          reference_range: string | null
          is_abnormal: boolean
          notes: string | null
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['lab_results']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['lab_results']['Insert']>
        Relationships: []
      }
      lab_orders: {
        Row: {
          id: string
          request_number: string
          visit_id: string | null
          patient_id: string
          doctor_id: string
          status: LabStatus
          priority: LabTestPriority
          requested_at: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['lab_orders']['Row'], 'request_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['lab_orders']['Insert']>
        Relationships: []
      }
      radiology_orders: {
        Row: {
          id: string
          order_number: string
          visit_id: string | null
          patient_id: string
          doctor_id: string
          technician_id: string | null
          radiology_type_id: string | null
          status: RadiologyStatus
          priority: LabTestPriority
          modality: string | null
          body_part: string | null
          clinical_notes: string | null
          report: string | null
          requested_at: string
          scheduled_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['radiology_orders']['Row'], 'order_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['radiology_orders']['Insert']>
        Relationships: []
      }
      radiology_types: {
        Row: {
          id: string
          name: string
          name_ar: string | null
          modality: string
          description: string | null
          price: number | null
          duration: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['radiology_types']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['radiology_types']['Insert']>
        Relationships: []
      }
      radiology_attachments: {
        Row: {
          id: string
          order_id: string
          name: string
          url: string
          size: number | null
          type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['radiology_attachments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['radiology_attachments']['Insert']>
        Relationships: []
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
        Relationships: []
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          discount: number
          total: number
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['invoice_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          amount: number
          method: PaymentMethod
          reference: string | null
          notes: string | null
          paid_at: string
          collected_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
        Relationships: []
      }
      refunds: {
        Row: {
          id: string
          invoice_id: string
          payment_id: string | null
          amount: number
          reason: string | null
          method: PaymentMethod
          reference: string | null
          refunded_at: string
          processed_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['refunds']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['refunds']['Insert']>
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          name_ar: string | null
          sku: string | null
          barcode: string | null
          category: InventoryCategory
          supplier_id: string | null
          unit: string
          unit_price: number | null
          selling_price: number | null
          current_stock: number
          minimum_stock: number
          maximum_stock: number | null
          reorder_point: number | null
          expiry_date: string | null
          storage_location: string | null
          notes: string | null
          is_active: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['inventory_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['inventory_items']['Insert']>
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact: string | null
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>
        Relationships: []
      }
      purchase_orders: {
        Row: {
          id: string
          order_number: string
          supplier_id: string | null
          status: PurchaseOrderStatus
          ordered_at: string | null
          received_at: string | null
          total: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['purchase_orders']['Row'], 'order_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['purchase_orders']['Insert']>
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          order_id: string
          item_id: string
          quantity_ordered: number
          quantity_received: number
          unit_cost: number
          total: number
        }
        Insert: Omit<Database['public']['Tables']['purchase_order_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['purchase_order_items']['Insert']>
        Relationships: []
      }
      stock_movements: {
        Row: {
          id: string
          item_id: string
          type: StockMovementType
          quantity: number
          unit_cost: number | null
          reference_id: string | null
          reference_type: string | null
          notes: string | null
          performed_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>
        Relationships: []
      }
      clinic_settings: {
        Row: {
          id: string
          name: string
          name_ar: string | null
          logo_url: string | null
          tagline: string | null
          tagline_ar: string | null
          phone: string | null
          phone_alt: string | null
          email: string | null
          address: string | null
          address_ar: string | null
          city: string | null
          country: string
          tax_number: string | null
          license_number: string | null
          currency: string
          timezone: string
          date_format: string
          time_format: string
          working_days: number[]
          working_hours_start: string
          working_hours_end: string
          appointment_duration: number
          primary_color: string
          theme: string
          invoice_prefix: string
          invoice_notes: string | null
          invoice_footer: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clinic_settings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clinic_settings']['Insert']>
        Relationships: []
      }
      holidays: {
        Row: {
          id: string
          name: string
          name_ar: string | null
          date: string
          is_recurring: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['holidays']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['holidays']['Insert']>
        Relationships: []
      }
      notification_templates: {
        Row: {
          id: string
          name: string
          channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app'
          event: string
          subject: string | null
          body: string
          body_ar: string | null
          variables: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notification_templates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notification_templates']['Insert']>
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          module: string
          action: string
        }
        Insert: Omit<Database['public']['Tables']['permissions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['permissions']['Insert']>
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          role: UserRole
          permission_id: string
        }
        Insert: Omit<Database['public']['Tables']['role_permissions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['role_permissions']['Insert']>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          performed_by: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
        Relationships: []
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
      get_monthly_revenue: {
        Args: { p_start: string; p_end: string; p_group: string }
        Returns: { period: string; revenue: number; count: number }[]
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
      payment_status: PaymentStatus
      lab_status: LabStatus
      radiology_status: RadiologyStatus
    }
    CompositeTypes: Record<string, never>
  }
}
