'use client'

import { AuthButton } from '@/components/auth/auth-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSelector } from '@/components/ui/language-selector';
import { LandingPageContent } from '@/components/landing/landing-page-content';
import { useBrandTranslations } from '@/hooks/use-translations';

export default function Home() {
  const brandT = useBrandTranslations()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            🎮 {brandT('productName')}
          </h1>
          <div className="flex items-center gap-4">
            <LanguageSelector variant="compact" />
            <ThemeToggle />
            <AuthButton />
          </div>
        </header>

        <LandingPageContent />
      </div>
    </div>
  );
}