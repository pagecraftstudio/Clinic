'use client'

import { useState, useTransition } from 'react'
import { Check, Save, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { updateRolePermissions } from '@/features/settings/actions'
import type { Permission } from '@/types/settings'

interface Props {
  permissions: Permission[]
  rolePermissions: { role: string; permission_id: string; permissions?: Permission }[]
}

const EDITABLE_ROLES = [
  { value: 'admin',                label: 'Admin' },
  { value: 'doctor',               label: 'Doctor' },
  { value: 'receptionist',         label: 'Receptionist' },
  { value: 'nurse',                label: 'Nurse' },
  { value: 'cashier',              label: 'Cashier' },
  { value: 'accountant',           label: 'Accountant' },
  { value: 'lab_technician',       label: 'Lab Tech' },
  { value: 'radiology_technician', label: 'Radiology Tech' },
  { value: 'pharmacist',           label: 'Pharmacist' },
  { value: 'marketing',            label: 'Marketing' },
]

const ACTION_COLORS: Record<string, string> = {
  read:   'text-blue-500',
  write:  'text-emerald-500',
  delete: 'text-red-500',
  export: 'text-amber-500',
}

export function RolesClient({ permissions, rolePermissions }: Props) {
  const [selectedRole, setSelectedRole] = useState(EDITABLE_ROLES[0].value)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const initialGranted = new Set(
    rolePermissions
      .filter((rp) => rp.role === selectedRole)
      .map((rp) => rp.permission_id)
  )
  const [granted, setGranted] = useState<Set<string>>(initialGranted)

  function handleRoleChange(role: string) {
    setSelectedRole(role)
    const roleGrants = new Set(
      rolePermissions
        .filter((rp) => rp.role === role)
        .map((rp) => rp.permission_id)
    )
    setGranted(roleGrants)
    setSuccess(false)
    setError(null)
  }

  function toggle(permId: string) {
    setGranted((prev) => {
      const next = new Set(prev)
      if (next.has(permId)) next.delete(permId)
      else next.add(permId)
      return next
    })
  }

  function toggleModule(module: string) {
    const modulePerms = permissions.filter((p) => p.module === module)
    const allGranted = modulePerms.every((p) => granted.has(p.id))
    setGranted((prev) => {
      const next = new Set(prev)
      if (allGranted) {
        modulePerms.forEach((p) => next.delete(p.id))
      } else {
        modulePerms.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  function save() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateRolePermissions(selectedRole, Array.from(granted))
      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error ?? 'Failed to save')
      }
    })
  }

  const modules = Array.from(new Set(permissions.map((p) => p.module))).sort()

  return (
    <div className="space-y-5">
      {/* Role selector */}
      <div className="flex gap-2 flex-wrap">
        {EDITABLE_ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => handleRoleChange(r.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border',
              selectedRole === r.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)]'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Info */}
      <div
        className="flex items-start gap-2 text-[12px] rounded-lg p-3 border"
        style={{
          color: 'var(--text-muted)',
          background: 'var(--bg-subtle)',
          borderColor: 'var(--border)',
        }}
      >
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          Owner role has all permissions and cannot be edited. Changes here affect all users with the selected role.
        </span>
      </div>

      {/* Matrix */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide w-40"
                  style={{ color: 'var(--text-muted)' }}>
                Module
              </th>
              {['read', 'write', 'delete', 'export'].map((action) => (
                <th
                  key={action}
                  className={cn('px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide', ACTION_COLORS[action])}
                >
                  {action}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--text-muted)' }}>
                All
              </th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module, i) => {
              const modulePerms = permissions.filter((p) => p.module === module)
              const allGranted = modulePerms.every((p) => granted.has(p.id))

              return (
                <tr
                  key={module}
                  className="transition-colors"
                  style={{
                    borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td className="px-4 py-3 font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                    {module.replace(/_/g, ' ')}
                  </td>
                  {['read', 'write', 'delete', 'export'].map((action) => {
                    const perm = modulePerms.find((p) => p.action === action)
                    if (!perm) {
                      return (
                        <td key={action} className="px-4 py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                          —
                        </td>
                      )
                    }
                    return (
                      <td key={action} className="px-4 py-3 text-center">
                        <Checkbox checked={granted.has(perm.id)} onChange={() => toggle(perm.id)} />
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-center">
                    <Checkbox checked={allGranted} onChange={() => toggleModule(module)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={save}
          disabled={isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-9 text-[13px]"
        >
          <Save size={14} />
          {isPending ? 'Saving…' : 'Save Permissions'}
        </Button>
        {success && <span className="text-[13px] text-emerald-500">Saved</span>}
        {error && <span className="text-[13px] text-red-500">{error}</span>}
      </div>
    </div>
  )
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'w-5 h-5 rounded transition-colors flex items-center justify-center mx-auto border',
        checked
          ? 'bg-blue-600 border-blue-600'
          : 'bg-[var(--bg-subtle)] border-[var(--border)] hover:border-[var(--border-strong)]'
      )}
    >
      {checked && <Check size={11} className="text-white" />}
    </button>
  )
}
