'use client'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme-context'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
    variant?: 'default' | 'compact'
    className?: string
}

export function ThemeToggle({ variant = 'default', className }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme()

    if (variant === 'compact') {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className={cn(
                    "h-8 w-8 p-0",
                    className
                )}
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

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn("h-9 w-9", className)}
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

export function CompactThemeToggle() {
    return <ThemeToggle variant="compact" />
}
