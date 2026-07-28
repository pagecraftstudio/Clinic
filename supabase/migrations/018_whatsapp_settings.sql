-- Add WhatsApp contact fields to clinic_settings
ALTER TABLE clinic_settings
  ADD COLUMN IF NOT EXISTS whatsapp_number  text,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT false;
