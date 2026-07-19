'use client'

import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { ReceptionStats }          from './reception-stats'
import { WaitingQueue }            from './waiting-queue'
import { TodayAppointmentsList }   from './today-appointments'
import { QuickActions }            from './quick-actions'

const fade = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export function ReceptionClient() {
  const qc  = useQueryClient()
  const now = new Date()

  function refresh() {
    qc.invalidateQueries({ queryKey: ['reception-today'] })
    qc.invalidateQueries({ queryKey: ['reception-stats'] })
    qc.invalidateQueries({ queryKey: ['reception-queue'] })
    qc.invalidateQueries({ queryKey: ['appointments'] })
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      {/* Header */}
      <motion.div
        variants={fade}
        initial="hidden"
        animate="show"
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Reception
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {format(now, 'EEEE, MMMM d, yyyy')} · Live dashboard
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={fade} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
        <ReceptionStats />
      </motion.div>

      {/* Main grid */}
      <motion.div
        variants={fade}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1"
      >
        {/* Left: appointments list */}
        <div className="lg:col-span-2 flex flex-col min-h-[500px]">
          <TodayAppointmentsList />
        </div>

        {/* Right: queue + quick actions */}
        <div className="flex flex-col gap-5">
          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Quick Actions</h2>
            <QuickActions />
          </div>

          {/* Waiting Queue */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Waiting Queue</h2>
              <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-full">
                auto-refresh 15s
              </span>
            </div>
            <WaitingQueue />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
