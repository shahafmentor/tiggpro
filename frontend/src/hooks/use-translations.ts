'use client'

import { useDictionary } from '@/app/providers'
import { t } from '@/lib/translations'

export function useNavigationTranslations() {
  const { dictionary } = useDictionary()

  return (key: string) => t(dictionary, `navigation.${key}`)
}

export function useChoresTranslations() {
  const { dictionary } = useDictionary()

  return (key: string) => t(dictionary, `chores.${key}`)
}

export function useCommonTranslations() {
  const { dictionary } = useDictionary()

  return (key: string) => t(dictionary, `common.${key}`)
}

export function useLanguageTranslations() {
  const { dictionary } = useDictionary()

  return (key: string) => t(dictionary, `language.${key}`)
}

export function useDashboardTranslations() {
  const { dictionary } = useDictionary()

  return (key: string) => t(dictionary, `dashboard.${key}`)
}

export function usePagesTranslations() {
  const { dictionary } = useDictionary()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (key: string, params?: Record<string, any>) => t(dictionary, `pages.${key}`, params)
}

export function useModalsTranslations() {
  const { dictionary } = useDictionary()

  return (key: string) => t(dictionary, `modals.${key}`)
}

export function useRolesTranslations() {
  const { dictionary } = useDictionary()

  return (key: string) => t(dictionary, `roles.${key}`)
}

export function useBrandTranslations() {
  const { dictionary } = useDictionary()

  return (key: string) => t(dictionary, `brand.${key}`)
}

export function useRealtimeTranslations() {
  const { dictionary } = useDictionary()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (key: string, params?: Record<string, any>) => t(dictionary, `realtime.${key}`, params)
}

export function useLandingTranslations() {
  const { dictionary } = useDictionary()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (key: string, params?: Record<string, any>) => t(dictionary, `landing.${key}`, params)
}

export function useCalendarTranslations() {
  const { dictionary } = useDictionary()

  return (key: string) => t(dictionary, `calendar.${key}`)
}