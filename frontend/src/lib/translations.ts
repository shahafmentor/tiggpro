import type { Dictionary } from '@/app/[locale]/dictionaries';

/**
 * Simple translation function that navigates nested object keys
 * Example: t(dict, 'navigation.dashboard') -> dict.navigation.dashboard
 */
export function t(dictionary: Dictionary, key: string): string {
  const keys = key.split('.');
  let current: any = dictionary;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      console.warn(`Translation key "${key}" not found`);
      return key; // Return the key itself if translation not found
    }
  }

  return typeof current === 'string' ? current : key;
}

/**
 * Get locale display names
 */
export function getLocaleDisplayName(locale: string): string {
  const displayNames: Record<string, string> = {
    en: 'English',
    he: 'עברית',
  };
  return displayNames[locale] || locale;
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return locale === 'he' ? 'rtl' : 'ltr';
}