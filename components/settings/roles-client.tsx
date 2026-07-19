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
  { value: 'admin',               label: 'Admin' },
  { value: 'doctor',              label: 'Doctor' },
  { value: 'receptionist',        label: 'Receptionist' },
  { value: 'nurse',               label: 'Nurse' },
  { value: 'cashier',             label: 'Cashier' },
  { value: 'accountant',          label: 'Accountant' },
  { value: 'lab_technician',      label: 'Lab Tech' },
  { value: 'radiology_technician',label: 'Radiology Tech' },
  { value: 'pharmacist',          label: 'Pharmacist' },
  { value: 'marketing',           label: 'Marketing' },
]

const ACTION_COLORS: Record<string, string> = {
  read:   'text-blue-300',
  write:  'text-emerald-300',
  delete: 'text-red-300',
  export: 'text-amber-300',
}

export function RolesClient({ permissions, rolePermissions }: Props) {
  const [selectedRole, setSelectedRole] = useState(EDITABLE_ROLES[0].value)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Build mutable set for selected role
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

  // Group permissions by module
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
              'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
              selectedRole === r.value
                ? 'bg-blue-600 text-white'
                : 'bg-white/[0.04] text-[#A1A8B8] hover:bg-white/[0.08] hover:text-white'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 text-[12px] text-[#A1A8B8] bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          Owner role has all permissions and cannot be edited. Changes here affect all users with the selected role.
        </span>
      </div>

      {/* Matrix */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#A1A8B8] uppercase tracking-wide w-40">
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
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-[#A1A8B8] uppercase tracking-wide">
                All
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {modules.map((module) => {
              const modulePerms = permissions.filter((p) => p.module === module)
              const allGranted = modulePerms.every((p) => granted.has(p.id))

              return (
                <tr key={module} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white font-medium capitalize">{module.replace(/_/g, ' ')}</td>
                  {['read', 'write', 'delete', 'export'].map((action) => {
                    const perm = modulePerms.find((p) => p.action === action)
                    if (!perm) {
                      return <td key={action} className="px-4 py-3 text-center text-[#A1A8B8]/20">—</td>
                    }
                    return (
                      <td key={action} className="px-4 py-3 text-center">
                        <Checkbox
                          checked={granted.has(perm.id)}
                          onChange={() => toggle(perm.id)}
                        />
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
        {success && <span className="text-[13px] text-emerald-400">Saved</span>}
        {error && <span className="text-[13px] text-red-400">{error}</span>}
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
        'w-5 h-5 rounded border transition-colors flex items-center justify-center mx-auto',
        checked
          ? 'bg-blue-600 border-blue-600'
          : 'border-white/[0.12] bg-white/[0.04] hover:border-white/30'
      )}
    >
      {checked && <Check size={11} className="text-white" />}
    </button>
  )
}
