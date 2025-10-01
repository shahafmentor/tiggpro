'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useLocalizedRouter } from '@/hooks/use-localized-router'
import { Check, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { locales, getLocaleNativeName, type Locale } from '@/i18n/config';
import { useLocale } from '@/hooks/use-locale';
import { useLanguageTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function LanguageSelector({ variant = 'default', className }: LanguageSelectorProps) {
  const { locale } = useLocale();
  const router = useLocalizedRouter();
  const pathname = usePathname();
  const t = useLanguageTranslations();

  const handleLocaleChange = (newLocale: Locale) => {
    // Simple locale switching by replacing the locale part of the path
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  const currentLocaleName = getLocaleNativeName(locale);

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              className
            )}
          >
            <Globe className="h-4 w-4" />
            <span className="sr-only">{t('selectLanguage')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {locales.map((availableLocale) => (
            <DropdownMenuItem
              key={availableLocale}
              onClick={() => handleLocaleChange(availableLocale)}
              className={cn(
                "flex items-center justify-between"
              )}
            >
              <span>{getLocaleNativeName(availableLocale)}</span>
              {locale === availableLocale && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between min-w-[120px]",
            className
          )}
        >
          <div className={cn(
            "flex items-center gap-2"
          )}>
            <Globe className="h-4 w-4" />
            <span>{currentLocaleName}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((availableLocale) => (
          <DropdownMenuItem
            key={availableLocale}
            onClick={() => handleLocaleChange(availableLocale)}
          className={cn(
            "flex items-center justify-between min-w-[120px]"
          )}
          >
            <span>{getLocaleNativeName(availableLocale)}</span>
            {locale === availableLocale && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}