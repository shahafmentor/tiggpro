'use client'

import { useDictionary } from '@/app/providers'
import { getTextDirection } from '@/lib/translations'

export function useLocale() {
  const { locale } = useDictionary()

  return {
    locale,
    direction: getTextDirection(locale)
  }
}