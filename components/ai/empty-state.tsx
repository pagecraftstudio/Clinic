'use client'

import { Sparkles } from 'lucide-react'

const SUGGESTED_PROMPTS = [
  {
    category: 'Clinic Overview',
    prompts: [
      { label: "Today's snapshot", prompt: "Give me a quick summary of today's clinic status — appointments, revenue, and any alerts." },
      { label: 'Revenue this month', prompt: 'What is the total revenue collected this month? Break it down for me.' },
      { label: 'Low stock alert', prompt: 'Which inventory items are running low on stock right now?' },
    ],
  },
  {
    category: 'Patients & Doctors',
    prompts: [
      { label: 'Find a patient', prompt: 'Find patient ' },
      { label: 'Active doctors', prompt: 'List all active doctors and their specialties.' },
      { label: 'Pending lab results', prompt: 'How many lab results are still pending?' },
    ],
  },
  {
    category: 'Drafting',
    prompts: [
      { label: 'Appointment reminder (Arabic)', prompt: 'Draft an appointment reminder WhatsApp message in Egyptian Arabic for a patient whose appointment is tomorrow at 10 AM.' },
      { label: 'Follow-up email', prompt: 'Draft a professional follow-up email to a patient who missed their appointment.' },
      { label: 'Translate diagnosis', prompt: 'Translate "Type 2 Diabetes Mellitus with peripheral neuropathy" to Arabic in a patient-friendly way.' },
    ],
  },
]

interface EmptyStateProps {
  onPrompt: (prompt: string) => void
}

export function AIEmptyState({ onPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 gap-10 overflow-y-auto">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center mx-auto">
          <Sparkles size={22} className="text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-white/90">AI Assistant</h2>
        <p className="text-sm text-white/40 max-w-xs leading-relaxed">
          Ask anything about your clinic — patients, revenue, appointments, or let me draft messages for you.
        </p>
      </div>

      {/* Suggested prompts */}
      <div className="w-full max-w-2xl space-y-6">
        {SUGGESTED_PROMPTS.map((group) => (
          <div key={group.category}>
            <p className="text-[11px] uppercase tracking-wider text-white/25 mb-2 px-1">
              {group.category}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {group.prompts.map((p) => (
                <button
                  key={p.label}
                  onClick={() => onPrompt(p.prompt)}
                  className="text-left rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] hover:border-blue-500/30 px-3 py-2.5 text-[13px] text-white/60 hover:text-white/90 transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
