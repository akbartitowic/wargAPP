import { Link, useNavigate } from 'react-router-dom'
import { ChevronsUpDown, KeyRound, LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { clearCmsSession, getCmsSession } from '@/lib/cmsSession'

function initials(name: string, email: string): string {
  const fromName = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  if (fromName.length >= 2) return fromName
  return email.slice(0, 2).toUpperCase()
}

type Props = {
  displayName: string
  email: string
}

export function CmsUserMenu({ displayName, email }: Props) {
  const navigate = useNavigate()
  const session = getCmsSession()

  function logout() {
    clearCmsSession()
    navigate('/login', { replace: true })
  }

  const roleLabel = session.is_super_admin
    ? 'Super admin'
    : session.housing_name
      ? `Admin · ${session.housing_name}`
      : 'Admin perumahan'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="ml-auto h-9 gap-2 px-2 data-[state=open]:bg-accent"
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
            {initials(displayName, email)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[140px] truncate text-sm font-medium md:inline">
          {displayName}
        </span>
        <ChevronsUpDown className="hidden size-4 text-muted-foreground md:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">{email}</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
        </DropdownMenuLabel>
          <DropdownMenuItem render={<Link to="/profile" />}>
          <User className="size-4" />
          Profil akun
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/profile#password" />}>
          <KeyRound className="size-4" />
          Ganti password
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={logout}>
          <LogOut className="size-4" />
          Keluar
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
