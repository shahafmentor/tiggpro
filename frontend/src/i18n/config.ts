export const locales = ['en', 'he'] as const
export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'en'

export function getLocaleNativeName(locale: string): string {
  const names: Record<string, string> = {
    en: 'English',
    he: 'עברית',
  }
  return names[locale] || locale
}