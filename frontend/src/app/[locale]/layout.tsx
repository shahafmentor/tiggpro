import { notFound } from 'next/navigation';
import { Providers } from '../providers';
import { getDictionary } from './dictionaries';
import '../globals.css'
import { Geist, Geist_Mono } from 'next/font/google'

const locales = ['en', 'he'];

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  // Get dictionary for this locale
  const dictionary = await getDictionary(locale as 'en' | 'he');

  // Keep LTR layout for all locales to maintain identical positioning
  const direction = 'ltr';

  return (
    <html lang={locale} dir={direction}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers dictionary={dictionary} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}