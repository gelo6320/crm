// app/api/tracciamento/landing-pages/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * GET /api/tracciamento/landing-pages
 * 
 * Restituisce l'elenco delle landing page tracciate con relativi dati di traffico
 * Query params:
 * - timeRange: '24h', '7d', '30d', 'all'
 * - search: testo di ricerca
 */
export async function GET(request: NextRequest) {
  try {
    // Estrai i parametri dalla query string
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '7d';
    const search = searchParams.get('search') || '';
    
    // In un'implementazione reale, qui ci sarebbe la logica per recuperare i dati dal database
    // Per ora restituiamo dati mockati
    
    // Simula un piccolo ritardo per mostrare il caricamento
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Genera dati di esempio
    const landingPages = [
      {
        id: '1',
        url: 'https://costruzionedigitale.com/',
        title: 'Home - Costruzione Digitale',
        totalVisits: 1245,
        uniqueUsers: 876,
        conversionRate: 5.2,
        lastAccess: new Date().toISOString()
      },
      {
        id: '2',
        url: 'https://costruzionedigitale.com/servizi/ristrutturazioni',
        title: 'Servizi di Ristrutturazione - Costruzione Digitale',
        totalVisits: 842,
        uniqueUsers: 561,
        conversionRate: 7.8,
        lastAccess: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 ore fa
      },
      {
        id: '3',
        url: 'https://costruzionedigitale.com/servizi/impianti',
        title: 'Impianti Elettrici e Idraulici - Costruzione Digitale',
        totalVisits: 623,
        uniqueUsers: 408,
        conversionRate: 4.1,
        lastAccess: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 ore fa
      },
      {
        id: '4',
        url: 'https://costruzionedigitale.com/contatti',
        title: 'Contattaci - Costruzione Digitale',
        totalVisits: 498,
        uniqueUsers: 412,
        conversionRate: 12.5,
        lastAccess: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minuti fa
      },
      {
        id: '5',
        url: 'https://costruzionedigitale.com/promozioni/estate-2024',
        title: 'Promozioni Estate 2024 - Costruzione Digitale',
        totalVisits: 356,
        uniqueUsers: 289,
        conversionRate: 9.2,
        lastAccess: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 ore fa
      }
    ];
    
    // Filtra per ricerca se specificata
    const filtered = search 
      ? landingPages.filter(page => 
          page.url.toLowerCase().includes(search.toLowerCase()) ||
          page.title.toLowerCase().includes(search.toLowerCase())
        )
      : landingPages;
    
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Errore nel recupero delle landing page:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle landing page' },
      { status: 500 }
    );
  }
}