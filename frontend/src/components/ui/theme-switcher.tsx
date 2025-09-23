'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme } from '@/lib/theme-context'
import { useRolesTranslations } from '@/hooks/use-translations'
import { Moon, Sun, User, Baby } from 'lucide-react'

export function ThemeSwitcher() {
  const { theme, userTheme, setUserTheme, toggleTheme } = useTheme()
  const rolesT = useRolesTranslations()

  return (
    <div className="flex items-center gap-2">
      {/* Theme toggle button */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="h-9 w-9"
      >
        {theme === 'light' ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* User theme selector */}
      <Select value={userTheme} onValueChange={setUserTheme}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="parent">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{rolesT('parent')}</span>
            </div>
          </SelectItem>
          <SelectItem value="kid">
            <div className="flex items-center gap-2">
              <Baby className="h-4 w-4" />
              <span>{rolesT('kid')}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export function CompactThemeSwitcher() {
  const { toggleTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
