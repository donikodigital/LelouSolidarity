//web/middleware.ts
// Lien d'e-mail avec « ?lang=en » : on mémorise la langue dans le cookie puis on
// ouvre la même page sans le paramètre (le site s'affiche tout de suite dans la bonne langue).
import { NextRequest, NextResponse } from 'next/server';
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, isLocale } from '@/lib/i18n/config';

export function middleware(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get('lang');
  if (!isLocale(lang)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.searchParams.delete('lang');
  const response = NextResponse.redirect(url);
  response.cookies.set(LANG_COOKIE, lang, {
    path: '/',
    maxAge: LANG_COOKIE_MAX_AGE,
    sameSite: 'lax',
  });
  return response;
}

export const config = {
  // Pages seulement (ni les fichiers statiques ni l'API)
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
};
