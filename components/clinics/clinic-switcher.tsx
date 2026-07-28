'use client'

import { useState } from 'react'
import { Building2, ChevronDown, Plus, Check } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserClinics, useSwitchClinic } from '@/features/clinics/hooks'
import { useRouter } from 'next/navigation'

interface ClinicSwitcherProps {
  activeClinicId: string
  activeClinicName: string
}

export function ClinicSwitcher({ activeClinicId, activeClinicName }: ClinicSwitcherProps) {
  const { data: memberships = [], isLoading } = useUserClinics()
  const switchClinicMut = useSwitchClinic()
  const router = useRouter()

  if (isLoading || memberships.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[140px] truncate">{activeClinicName}</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2 max-w-[200px]">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate text-sm font-medium">{activeClinicName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Switch clinic
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m: any) => {
          const clinic = m.clinics
          const isActive = clinic.id === activeClinicId
          return (
            <DropdownMenuItem
              key={clinic.id}
              onSelect={() => !isActive && switchClinicMut.mutate(clinic.id)}
              disabled={switchClinicMut.isPending}
              className="gap-2 cursor-pointer"
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={clinic.logo_url ?? undefined} />
                <AvatarFallback className="text-xs">{clinic.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm">{clinic.name}</span>
              {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => router.push('/onboarding/clinic')}
          className="gap-2 cursor-pointer text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add clinic</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
