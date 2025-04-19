// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Questo middleware verifica l'autenticazione per le pagine protette
export function middleware(request: NextRequest) {
  // Controlla se l'utente è loggato verificando i cookie di sessione
  const isLoggedIn = request.cookies.has('connect.sid');

  // Percorsi che richiedono autenticazione
  const protectedPaths = [
    '/dashboard',
    '/crm',
    '/forms',
    '/bookings',
    '/events',
    '/facebook-leads',
    '/calendar',
    '/sales-funnel',
    '/settings',
  ];

  // URL di base per il CRM
  const crmBaseDomain = process.env.NEXT_PUBLIC_CRM_DOMAIN || 'crm.costruzionedigitale.com';
  const currentHost = request.headers.get('host') || '';

  // Verifica se il percorso corrente richiede autenticazione
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Se il percorso richiede autenticazione e l'utente non è loggato, reindirizza al login
  if (isProtectedPath && !isLoggedIn) {
    // Memorizza l'URL originale per reindirizzare dopo il login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    
    // Se siamo su crm.costruzionedigitale.com, assicuriamoci di rimanere sullo stesso dominio per il login
    if (currentHost === crmBaseDomain) {
      return NextResponse.redirect(loginUrl);
    } else {
      // Se siamo su un altro dominio, reindirizza al dominio CRM per il login
      const fullLoginUrl = new URL(`https://${crmBaseDomain}/login`);
      fullLoginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(fullLoginUrl);
    }
  }

  // Se l'utente è già loggato e sta tentando di accedere alla pagina di login,
  // reindirizza alla dashboard (solo se siamo nel dominio CRM)
  if (isLoggedIn && request.nextUrl.pathname === '/login' && currentHost === crmBaseDomain) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Continua normalmente per gli altri casi
  return NextResponse.next();
}

// Configura su quali percorsi il middleware deve essere eseguito
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/crm/:path*',
    '/forms/:path*',
    '/bookings/:path*',
    '/events/:path*',
    '/facebook-leads/:path*',
    '/calendar/:path*',
    '/sales-funnel/:path*',
    '/settings/:path*',
    '/login',
  ],
};