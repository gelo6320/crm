// middleware.ts o lib/api/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Questo middleware verifica l'autenticazione per le pagine protette
export function middleware(request: NextRequest) {
  console.log("Middleware eseguito per:", request.nextUrl.pathname);
  
  // Controlla se l'utente è loggato verificando i cookie di sessione
  const isLoggedIn = request.cookies.has('connect.sid');
  console.log("isLoggedIn:", isLoggedIn);

  // Percorsi che richiedono autenticazione
  const protectedPaths = [
    '/',  // Aggiungi la home page del CRM
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

  // Verifica se il percorso corrente richiede autenticazione
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(`${path}/`)
  );
  console.log("isProtectedPath:", isProtectedPath);

  // Se il percorso richiede autenticazione e l'utente non è loggato, reindirizza al login
  if (isProtectedPath && !isLoggedIn) {
    console.log("Reindirizzamento a /login");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se l'utente è già loggato e sta tentando di accedere alla pagina di login,
  // reindirizza alla dashboard
  if (isLoggedIn && request.nextUrl.pathname === '/login') {
    console.log("Reindirizzamento a /");
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configura su quali percorsi il middleware deve essere eseguito
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};