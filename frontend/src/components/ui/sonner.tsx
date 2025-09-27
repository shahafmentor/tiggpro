"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      expand={true}
      richColors={true}
      closeButton={true}
      style={{
        "--normal-bg": "hsl(var(--card))",
        "--normal-border": "hsl(var(--border))",
        "--normal-text": "hsl(var(--card-foreground))",
        "--success-bg": "hsl(var(--chore-completed))",
        "--success-border": "hsl(var(--chore-completed))",
        "--success-text": "hsl(var(--primary-foreground))",
        "--error-bg": "hsl(var(--destructive))",
        "--error-border": "hsl(var(--destructive))",
        "--error-text": "hsl(var(--destructive-foreground))",
        "--warning-bg": "hsl(var(--chore-pending))",
        "--warning-border": "hsl(var(--chore-pending))",
        "--warning-text": "hsl(var(--primary-foreground))",
        "--info-bg": "hsl(var(--primary))",
        "--info-border": "hsl(var(--primary))",
        "--info-text": "hsl(var(--primary-foreground))",
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
