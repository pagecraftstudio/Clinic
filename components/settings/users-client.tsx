'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, MoreHorizontal, UserCheck, UserX, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { createStaffUser, toggleUserActive, deleteStaffUser, updateStaffUser } from '@/features/settings/actions'
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from '@/lib/validations/settings'
import { useStaffUsers } from '@/features/settings/hooks'
import type { StaffUser } from '@/types/settings'
import type { UserRole } from '@/types/database'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'owner',               label: 'Owner' },
  { value: 'admin',               label: 'Admin' },
  { value: 'doctor',              label: 'Doctor' },
  { value: 'receptionist',        label: 'Receptionist' },
  { value: 'nurse',               label: 'Nurse' },
  { value: 'cashier',             label: 'Cashier' },
  { value: 'accountant',          label: 'Accountant' },
  { value: 'lab_technician',      label: 'Lab Technician' },
  { value: 'radiology_technician',label: 'Radiology Technician' },
  { value: 'pharmacist',          label: 'Pharmacist' },
  { value: 'marketing',           label: 'Marketing' },
]

const ROLE_COLORS: Record<string, string> = {
  owner:                'bg-purple-500/15 text-purple-300',
  admin:                'bg-blue-500/15 text-blue-300',
  doctor:               'bg-emerald-500/15 text-emerald-300',
  receptionist:         'bg-amber-500/15 text-amber-300',
  nurse:                'bg-pink-500/15 text-pink-300',
  cashier:              'bg-cyan-500/15 text-cyan-300',
  accountant:           'bg-indigo-500/15 text-indigo-300',
  lab_technician:       'bg-orange-500/15 text-orange-300',
  radiology_technician: 'bg-teal-500/15 text-teal-300',
  pharmacist:           'bg-rose-500/15 text-rose-300',
  marketing:            'bg-lime-500/15 text-lime-300',
}

interface Props {
  initialUsers: StaffUser[]
}

export function UsersClient({ initialUsers }: Props) {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<StaffUser | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: users = initialUsers } = useStaffUsers()

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  function handleToggleActive(user: StaffUser) {
    startTransition(async () => {
      await toggleUserActive(user.id, !user.is_active)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteStaffUser(id)
      if (!result.success) setActionError(result.error ?? 'Failed to delete')
    })
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A8B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-8 h-9 text-[13px] bg-white/[0.04] border-white/[0.08] text-white placeholder:text-[#A1A8B8]/50"
          />
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white text-[13px]"
        >
          <Plus size={14} />
          Add User
        </Button>
      </div>

      {actionError && (
        <p className="text-[13px] text-red-400">{actionError}</p>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['User', 'Role', 'Phone', 'Status', 'Last login', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-[#A1A8B8] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-[11px] font-semibold text-blue-300 flex-shrink-0">
                      {getInitials(user.display_name)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.display_name}</p>
                      <p className="text-[#A1A8B8] text-[11px]">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium', ROLE_COLORS[user.role] ?? 'bg-white/[0.08] text-[#A1A8B8]')}>
                    {ROLES.find((r) => r.value === user.role)?.label ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#A1A8B8]">{user.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-medium',
                    user.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
                  )}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#A1A8B8]">
                  {user.last_login_at ? formatDate(user.last_login_at, 'relative') : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#A1A8B8] hover:text-white hover:bg-white/[0.06] transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[150px]">
                      <DropdownMenuItem onClick={() => setEditUser(user)}>
                        <Edit size={13} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                        {user.is_active
                          ? <><UserX size={13} className="mr-2" />Deactivate</>
                          : <><UserCheck size={13} className="mr-2" />Activate</>
                        }
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(user.id)}
                        className="text-red-400 focus:text-red-400"
                      >
                        <Trash2 size={13} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#A1A8B8] text-[13px]">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Dialog */}
      <CreateUserDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      {/* Edit Dialog */}
      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onClose={() => setEditUser(null)}
        />
      )}
    </div>
  )
}

// ── Create User Dialog ────────────────────────────────────────────────────────

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
  })

  function onSubmit(data: CreateUserInput) {
    setError(null)
    startTransition(async () => {
      const result = await createStaffUser(data)
      if (result.success) {
        reset()
        onClose()
      } else {
        setError(result.error ?? 'Failed to create user')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Staff User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[12px] text-[#A1A8B8]">First Name</Label>
              <Input {...register('first_name')} className={inputCls} />
              {errors.first_name && <p className="text-[11px] text-red-400">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-[#A1A8B8]">Last Name</Label>
              <Input {...register('last_name')} className={inputCls} />
              {errors.last_name && <p className="text-[11px] text-red-400">{errors.last_name.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] text-[#A1A8B8]">Email</Label>
            <Input {...register('email')} type="email" className={inputCls} />
            {errors.email && <p className="text-[11px] text-red-400">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] text-[#A1A8B8]">Password</Label>
            <Input {...register('password')} type="password" className={inputCls} />
            {errors.password && <p className="text-[11px] text-red-400">{errors.password.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] text-[#A1A8B8]">Role</Label>
            <Select onValueChange={(v) => setValue('role', v as UserRole)}>
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-[11px] text-red-400">{errors.role.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] text-[#A1A8B8]">Phone (optional)</Label>
            <Input {...register('phone')} className={inputCls} />
          </div>
          {error && <p className="text-[13px] text-red-400">{error}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/[0.08]">Cancel</Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? 'Creating…' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit User Dialog ──────────────────────────────────────────────────────────

function EditUserDialog({ user, open, onClose }: { user: StaffUser; open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone ?? '',
      is_active: user.is_active,
    },
  })

  function onSubmit(data: UpdateUserInput) {
    setError(null)
    startTransition(async () => {
      const result = await updateStaffUser(user.id, data)
      if (result.success) {
        onClose()
      } else {
        setError(result.error ?? 'Failed to update')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[12px] text-[#A1A8B8]">First Name</Label>
              <Input {...register('first_name')} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-[#A1A8B8]">Last Name</Label>
              <Input {...register('last_name')} className={inputCls} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] text-[#A1A8B8]">Role</Label>
            <Select defaultValue={user.role} onValueChange={(v) => setValue('role', v as UserRole)}>
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] text-[#A1A8B8]">Phone</Label>
            <Input {...register('phone')} className={inputCls} />
          </div>
          {error && <p className="text-[13px] text-red-400">{error}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/[0.08]">Cancel</Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const inputCls = 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-[#A1A8B8]/50 focus:border-blue-500/50 h-9 text-[13px]'
