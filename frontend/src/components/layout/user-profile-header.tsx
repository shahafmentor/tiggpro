'use client'

import { useSession } from 'next-auth/react'
import { ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { signOut } from 'next-auth/react'
import { useLocalizedRouter } from '@/hooks/use-localized-router'

export function UserProfileHeader() {
  const { data: session } = useSession()
  const router = useLocalizedRouter()

  if (!session?.user) {
    return null
  }

  const user = session.user
  const initials = user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  // MVP: Removed mock gamification data - keep it simple
  // const userData = {
  //   level: 5,
  //   points: 127,
  //   role: 'Parent', // This should come from session
  //   currentTenant: 'Smith Family' // This should come from context
  // }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-2 rtl:justify-start">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left rtl:text-right min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-foreground truncate">
                {user.name}
              </p>
              {/* MVP: Removed level badge - keep it simple */}
              {/* <Badge variant="outline" className="text-xs">
                Lv.{userData.level}
              </Badge> */}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {/* MVP: Removed points and tenant info - keep it simple */}
              {/* <span>{userData.points} pts</span>
              <span>•</span>
              <span className="truncate">{userData.currentTenant}</span> */}
              <span className="truncate">{user.email}</span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {/* MVP: Removed mock role and level badges - keep it simple */}
            {/* <div className="flex items-center gap-2 pt-1">
              <Badge variant="secondary" className="text-xs">
                {userData.role}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Level {userData.level}
              </Badge>
            </div> */}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
          <User className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
          <Settings className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
