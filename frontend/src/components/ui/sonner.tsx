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
        "--normal-bg": "var(--card)",
        "--normal-border": "var(--border)",
        "--normal-text": "var(--card-foreground)",
        "--success-bg": "var(--chore-completed)",
        "--success-border": "var(--chore-completed)",
        "--success-text": "var(--primary-foreground)",
        "--error-bg": "var(--destructive)",
        "--error-border": "var(--destructive)",
        "--error-text": "var(--destructive-foreground)",
        "--warning-bg": "var(--chore-pending)",
        "--warning-border": "var(--chore-pending)",
        "--warning-text": "var(--primary-foreground)",
        "--info-bg": "var(--primary)",
        "--info-border": "var(--primary)",
        "--info-text": "var(--primary-foreground)",
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
