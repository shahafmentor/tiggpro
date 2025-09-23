import 'server-only';

// Type for our dictionaries
export type Dictionary = {
  [key: string]: any;
};

const dictionaries = {
  en: () => import('../../messages/en.json').then((module) => module.default),
  he: () => import('../../messages/he.json').then((module) => module.default),
};

export const getDictionary = async (locale: 'en' | 'he'): Promise<Dictionary> => {
  return dictionaries[locale]?.() ?? dictionaries.en();
};