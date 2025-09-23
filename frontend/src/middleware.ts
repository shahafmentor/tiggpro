import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ['en', 'he'];
const defaultLocale = 'en';

function getLocale(request: NextRequest): string {
  // Simple locale detection - can be enhanced later
  const pathname = request.nextUrl.pathname;
  const localeFromPath = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (localeFromPath) return localeFromPath;

  // Check Accept-Language header for browser preference
  const acceptLanguage = request.headers.get('accept-language') || '';
  if (acceptLanguage.includes('he')) return 'he';

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if there is already a locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect if no locale found
  const locale = getLocale(request);
  return NextResponse.redirect(
    new URL(`/${locale}${pathname}`, request.url)
  );
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico).*)',
    // Optional: only run on root (/) URL
    '/'
  ]
};