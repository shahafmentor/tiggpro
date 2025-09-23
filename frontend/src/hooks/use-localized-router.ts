'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/use-locale'

function ensureLeadingSlash(path: string): string {
  if (!path) return '/'
  return path.startsWith('/') ? path : `/${path}`
}

export function useLocalizedRouter() {
  const router = useRouter()
  const { locale } = useLocale()

  const withLocale = (path: string): string => {
    const normalized = ensureLeadingSlash(path)
    const segments = normalized.split('/')
    // If already prefixed with a 2-letter locale, keep as-is
    if (segments[1] && segments[1].length === 2) return normalized
    return `/${locale}${normalized}`
  }

  return {
    push: (path: string) => router.push(withLocale(path)),
    replace: (path: string) => router.replace(withLocale(path)),
    prefetch: (path: string) => router.prefetch?.(withLocale(path)),
    back: () => router.back(),
    withLocale,
  }
}


