// app/api/tracciamento/users/[landingPageId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * GET /api/tracciamento/users/[landingPageId]
 * 
 * Restituisce gli utenti tracciati che hanno visitato una specifica landing page
 * Query params:
 * - timeRange: '24h', '7d', '30d', 'all'
 * - search: testo di ricerca
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { landingPageId: string } }
) {
  try {
    // Ottieni il landing page ID dai parametri dell'URL
    const landingPageId = params.landingPageId;
    
    // Estrai i parametri dalla query string
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '7d';
    const search = searchParams.get('search') || '';
    
    // In un'implementazione reale, qui ci sarebbe la logica per recuperare i dati dal database
    // Per ora restituiamo dati mockati
    
    // Simula un piccolo ritardo per mostrare il caricamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Genera dati di esempio
    const users = [
      {
        id: 'user1',
        fingerprint: 'fp_124c87e609af354',
        ip: '192.168.1.xxx',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'Milano, Italia',
        referrer: 'https://google.com',
        firstVisit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 giorni fa
        lastActivity: new Date().toISOString(),
        sessionsCount: 8,
        isActive: true
      },
      {
        id: 'user2',
        fingerprint: 'fp_398d5a22c6b971f',
        ip: '10.0.0.xxx',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        location: 'Roma, Italia',
        referrer: 'https://facebook.com',
        firstVisit: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 giorni fa
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 ore fa
        sessionsCount: 4,
        isActive: false
      },
      {
        id: 'user3',
        fingerprint: 'fp_7a1d4e8f932c65b',
        ip: '172.16.254.xxx',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        location: 'Napoli, Italia',
        referrer: 'https://instagram.com',
        firstVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 giorni fa
        lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minuti fa
        sessionsCount: 2,
        isActive: false
      },
      {
        id: 'user4',
        fingerprint: 'fp_56e9c2f381da04b',
        ip: '192.0.2.xxx',
        userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G998B)',
        location: 'Torino, Italia',
        referrer: 'https://linkedin.com',
        firstVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 giorni fa
        lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minuti fa
        sessionsCount: 3,
        isActive: true
      },
      {
        id: 'user5',
        fingerprint: 'fp_90b6d2a7f148c3e',
        ip: '198.51.100.xxx',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
        location: 'Palermo, Italia',
        referrer: 'https://youtube.com',
        firstVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 giorni fa
        lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 giorno fa
        sessionsCount: 1,
        isActive: false
      }
    ];
    
    // Filtra per ricerca se specificata
    const filtered = search 
      ? users.filter(user => 
          user.fingerprint.toLowerCase().includes(search.toLowerCase()) ||
          user.ip.toLowerCase().includes(search.toLowerCase()) ||
          (user.location && user.location.toLowerCase().includes(search.toLowerCase())) ||
          (user.referrer && user.referrer.toLowerCase().includes(search.toLowerCase()))
        )
      : users;
    
    return NextResponse.json(filtered);
  } catch (error) {
    console.error(`Errore nel recupero degli utenti per la landing page ${params.landingPageId}:`, error);
    return NextResponse.json(
      { error: 'Errore nel recupero degli utenti' },
      { status: 500 }
    );
  }
}