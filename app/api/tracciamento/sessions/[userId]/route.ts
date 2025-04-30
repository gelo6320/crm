// app/api/tracciamento/sessions/[userId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * GET /api/tracciamento/sessions/[userId]
 * 
 * Restituisce le sessioni di un utente specifico
 * Query params:
 * - timeRange: '24h', '7d', '30d', 'all'
 */
export function GET(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    // Ottieni l'ID utente dai parametri dell'URL
    const userId = context.params.userId;
    
    // Estrai i parametri dalla query string
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '7d';
    
    // In un'implementazione reale, qui ci sarebbe la logica per recuperare i dati dal database
    // Per ora restituiamo dati mockati
    
    // Simula un piccolo ritardo per mostrare il caricamento
    // Nota: Usiamo Promise.resolve invece di await per adattarci alla funzione non-async
    return new Promise((resolve) => {
      setTimeout(() => {
        // Genera dati di esempio
        const now = Date.now();
        const sessions = [
          {
            id: 'session1',
            userId: userId,
            landingPageId: '1',
            startTime: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 ore fa
            endTime: new Date(now - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 ore fa
            duration: 30, // minuti
            pagesViewed: 5,
            interactionsCount: 23,
            entryUrl: 'https://costruzionedigitale.com/',
            exitUrl: 'https://costruzionedigitale.com/contatti',
            isConverted: true
          },
          {
            id: 'session2',
            userId: userId,
            landingPageId: '2',
            startTime: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 giorno fa
            endTime: new Date(now - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(), // +45 minuti
            duration: 45,
            pagesViewed: 8,
            interactionsCount: 32,
            entryUrl: 'https://costruzionedigitale.com/servizi',
            exitUrl: 'https://costruzionedigitale.com/servizi/ristrutturazioni',
            isConverted: false
          },
          {
            id: 'session3',
            userId: userId,
            landingPageId: '3',
            startTime: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 giorni fa
            endTime: new Date(now - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(), // +15 minuti
            duration: 15,
            pagesViewed: 2,
            interactionsCount: 7,
            entryUrl: 'https://costruzionedigitale.com/blog/consigli-ristrutturazione',
            exitUrl: null, // uscita senza navigazione ad altra pagina
            isConverted: false
          },
          {
            id: 'session4',
            userId: userId,
            landingPageId: '4',
            startTime: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 giorni fa
            endTime: new Date(now - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // +60 minuti
            duration: 60,
            pagesViewed: 12,
            interactionsCount: 48,
            entryUrl: 'https://costruzionedigitale.com/promozioni/estate-2024',
            exitUrl: 'https://costruzionedigitale.com/contatti',
            isConverted: true
          }
        ];
        
        // Filtra per intervallo di tempo se specificato
        let filteredSessions = [...sessions];
        
        if (timeRange !== 'all') {
          let cutoffDate;
          
          if (timeRange === '24h') {
            cutoffDate = new Date(now - 24 * 60 * 60 * 1000);
          } else if (timeRange === '7d') {
            cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
          } else if (timeRange === '30d') {
            cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
          }
          
          if (cutoffDate) {
            filteredSessions = filteredSessions.filter(session => 
              new Date(session.startTime) >= cutoffDate
            );
          }
        }
        
        resolve(NextResponse.json(filteredSessions));
      }, 400);
    });
  } catch (error) {
    console.error(`Errore nel recupero delle sessioni per l'utente ${context.params.userId}:`, error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle sessioni' },
      { status: 500 }
    );
  }
}