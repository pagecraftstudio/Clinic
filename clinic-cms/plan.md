# AI Clinic Management System (Single Clinic) — Master Prompt for Claude

You are a senior full-stack software architect, senior UI/UX designer, DevOps engineer, database architect, and AI engineer.

Your task is to build a production-ready AI-powered Clinic Management System for **one clinic only**.

This is **NOT** a SaaS platform.

There is only one clinic.

Do not build multi-tenancy.

Do not build subscription plans.

Do not build organization switching.

Do not build tenant management.

Focus on making the best clinic operating system possible.

---

# Technology Stack

Frontend

* Next.js 15 (App Router)
* React 19
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion
* TanStack Query
* React Hook Form
* Zod

Backend

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* Supabase Realtime
* Edge Functions when needed

AI

* OpenAI GPT
* Future support for Claude and Gemini

Deployment

* Vercel
* Supabase

---

# Authentication

Use Supabase Auth.

Support:

* Email & Password
* Password Reset
* Email Verification

Future ready for:

* Google Login
* Apple Login

Store application data inside a `profiles` table linked to `auth.users`.

Never create a custom authentication system.

---

# User Roles

* Owner
* Admin
* Doctor
* Receptionist
* Nurse
* Cashier
* Accountant
* Lab Technician
* Radiology Technician
* Pharmacist
* Marketing
* Patient

Use Role-Based Access Control (RBAC).

Permissions must be database-driven.

---

# Core Modules

## Dashboard

Display:

* Today's appointments
* Upcoming appointments
* Revenue
* Patient statistics
* Doctor statistics
* Notifications
* Tasks
* AI insights
* Recent activity

---

## Patient Management

Support:

* Full patient profile
* National ID
* Passport
* Contact information
* Emergency contacts
* Medical history
* Allergies
* Chronic diseases
* Blood group
* Insurance
* Documents
* Lab reports
* Radiology
* Prescriptions
* Notes
* Timeline

Global patient search.

---

## Doctor Management

Store:

* Specialty
* Availability
* Working hours
* Leave requests
* Schedule
* Appointment slots

---

## Appointment System

Support:

* Day
* Week
* Month
* Agenda

Features:

* Drag & Drop
* Reschedule
* Cancellation
* Waiting list
* Queue
* Check-in
* Check-out
* Online appointments
* Color-coded status

---

## Reception Dashboard

Receptionists can:

* Register patients
* Book appointments
* Reschedule
* Cancel
* Print receipts
* Check patients in
* Queue management

---

## Electronic Medical Records (EMR)

Store:

* Complaints
* Diagnosis
* SOAP notes
* ICD-10
* Vitals
* Lab requests
* Radiology requests
* Attachments
* Visit history
* Follow-up notes

Never delete medical records.

---

## Prescriptions

Support:

* Medicines
* Dosage
* Frequency
* Duration
* Instructions
* Printable prescription
* PDF export

---

## Billing

Support:

* Invoices
* Payments
* Discounts
* Refunds
* Partial payments
* Multiple payment methods
* Invoice history

Payment methods:

* Cash
* Card
* Bank Transfer
* Vodafone Cash
* Fawry

---

## Inventory

Manage:

* Medicines
* Supplies
* Equipment

Support:

* Stock
* Purchase Orders
* Suppliers
* Expiration
* Low stock alerts
* Barcode support

---

## Laboratory

Manage:

* Test requests
* Results
* Attachments
* Status

---

## Radiology

Manage:

* X-Ray
* MRI
* CT
* Ultrasound

Upload DICOM and PDF files.

---

## Notifications

Support:

* Email
* SMS
* WhatsApp
* Push notifications
* In-app notifications

Examples:

* Appointment reminders
* Payment reminders
* Follow-up reminders
* Prescription reminders

---

## AI Assistant

Create a ChatGPT-like assistant.

Capabilities:

* Answer clinic questions
* Find patients
* Find appointments
* Generate reports
* Explain analytics
* Summarize medical notes
* Draft emails
* Draft WhatsApp messages
* Translate Arabic ↔ English
* Voice-ready architecture
* Stream responses
* Conversation history
* Suggested prompts

---

## Reports

Generate reports for:

* Revenue
* Doctors
* Patients
* Appointments
* No-shows
* Inventory
* Lab
* Radiology

Allow PDF and Excel export.

---

## Settings

Manage:

* Clinic information
* Logo
* Colors
* Working hours
* Holidays
* Email templates
* WhatsApp templates
* SMS templates
* Invoice template
* User management
* Permissions
* Backup settings

---

# Database

Use PostgreSQL.

Use Supabase.

Use Row Level Security (RLS).

Use UUID primary keys.

Soft delete important records.

Timestamp every record.

Use proper foreign keys.

Create indexes.

Optimize queries.

---

# Storage

Use Supabase Storage.

Buckets:

* avatars
* prescriptions
* lab-results
* radiology
* patient-documents
* invoices

---

# Security

Use:

* HTTPS
* Supabase Auth
* Row Level Security
* Secure API routes
* Input validation
* Zod validation
* Rate limiting
* Audit logging
* Activity history

Encrypt sensitive medical information where appropriate.

---

# UI Design

Create an interface inspired by:

* Linear
* Stripe Dashboard
* Vercel
* Notion
* Raycast
* Arc Browser
* Apple

Characteristics:

* Minimal
* Luxurious
* Professional
* Fast
* Spacious
* Beautiful typography
* Rounded corners
* Soft shadows
* Smooth animations

Support:

* Light Mode
* Dark Mode
* Responsive Design
* RTL
* LTR

Arabic and English.

---

# Accessibility

Follow WCAG AA.

Keyboard navigation.

Proper labels.

High contrast.

Screen-reader friendly.

---

# Performance

Targets:

* First load under 2 seconds
* Dashboard under 1 second
* API responses under 300 ms
* Lighthouse score above 95

---

# Coding Standards

Use:

* TypeScript strict mode
* Clean Architecture
* SOLID principles
* Feature-based folder structure
* Reusable components
* Reusable hooks
* Server Components where appropriate
* No duplicated code
* No use of `any`
* Comprehensive error handling
* Loading states
* Empty states
* Success states
* Responsive design

---

# Deliverables

Generate a complete production-ready project including:

1. Folder structure
2. Database schema
3. Supabase SQL migrations
4. RLS policies
5. Authentication
6. UI components
7. Dashboard
8. All CRUD pages
9. AI Assistant
10. API layer
11. Forms and validation
12. Storage integration
13. Realtime updates
14. Notifications
15. Charts
16. Reports
17. Deployment configuration
18. Documentation

The resulting application should be production-ready, maintainable, scalable within a single clinic, and suitable for deployment to Vercel + Supabase without placeholder implementations.

Phase 1 — Foundation (do first)

Folder structure
DB schema + Supabase migrations
RLS policies
Auth setup

Phase 2 — Core UI

Layout, sidebar, nav
shadcn/ui component setup
Dashboard

Phase 3 — Modules (one per session)

Patients, Appointments, EMR, Billing, etc.

Phase 4 — AI + Reports + Settings