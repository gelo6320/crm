// app/api/tracciamento/sessions/details/[sessionId]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * GET /api/tracciamento/sessions/details/[sessionId]
 * 
 * Restituisce i dettagli di una specifica sessione di tracciamento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Ottieni l'ID sessione dai parametri dell'URL
    const sessionId = params.sessionId;
    
    console.log(`Recupero dettagli sessione per ID: ${sessionId}`);
    
    // Simula un piccolo ritardo per mostrare il caricamento
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Genera dettagli sessione di esempio
    const now = Date.now();
    let baseTime;
    
    // Usa un id specifico per determinare quando è iniziata la sessione
    if (sessionId === 'session1') {
      baseTime = now - 2 * 60 * 60 * 1000; // 2 ore fa
    } else if (sessionId === 'session2') {
      baseTime = now - 1 * 24 * 60 * 60 * 1000; // 1 giorno fa
    } else if (sessionId === 'session3') {
      baseTime = now - 3 * 24 * 60 * 60 * 1000; // 3 giorni fa
    } else if (sessionId === 'session4') {
      baseTime = now - 7 * 24 * 60 * 60 * 1000; // 7 giorni fa
    } else {
      baseTime = now - 1 * 60 * 60 * 1000; // 1 ora fa (default)
    }
    
    const details = [
      // Visualizzazione iniziale della landing page
      {
        id: `${sessionId}_detail_1`,
        sessionId: sessionId,
        type: 'page_view',
        timestamp: new Date(baseTime).toISOString(),
        data: {
          url: 'https://costruzionedigitale.com/',
          title: 'Home - Costruzione Digitale',
          referrer: 'https://google.com/search'
        }
      },
      
      // Scroll nella pagina - MODIFICATO come evento di navigazione
      {
        id: `${sessionId}_detail_2`,
        sessionId: sessionId,
        type: 'scroll',
        timestamp: new Date(baseTime + 45 * 1000).toISOString(), // +45 secondi
        data: {
          direction: 'down',
          depth: 35, // percentuale
          category: 'navigation' // Aggiunta categoria
        }
      },
      
      // Tempo sulla pagina - NUOVO evento di navigazione
      {
        id: `${sessionId}_detail_time_1`,
        sessionId: sessionId,
        type: 'time_on_page',
        timestamp: new Date(baseTime + 60 * 1000).toISOString(), // +1 minuto
        data: {
          duration: 60, // secondi
          category: 'navigation'
        }
      },
      
      // Click su un link di servizi
      {
        id: `${sessionId}_detail_3`,
        sessionId: sessionId,
        type: 'click',
        timestamp: new Date(baseTime + 2 * 60 * 1000).toISOString(), // +2 minuti
        data: {
          element: 'a',
          text: 'Servizi',
          selector: '.nav-link[href="/servizi"]'
        }
      },
      
      // Visualizzazione pagina servizi
      {
        id: `${sessionId}_detail_4`,
        sessionId: sessionId,
        type: 'page_view',
        timestamp: new Date(baseTime + 2 * 60 * 1000 + 2 * 1000).toISOString(), // +2 min e 2 sec
        data: {
          url: 'https://costruzionedigitale.com/servizi',
          title: 'I Nostri Servizi - Costruzione Digitale',
          referrer: 'https://costruzionedigitale.com/'
        }
      },
      
      // Altro scroll - MODIFICATO come evento di navigazione
      {
        id: `${sessionId}_detail_5`,
        sessionId: sessionId,
        type: 'scroll',
        timestamp: new Date(baseTime + 3 * 60 * 1000).toISOString(), // +3 minuti
        data: {
          direction: 'down',
          depth: 70,
          category: 'navigation' // Aggiunta categoria
        }
      },
      
      // Exit intent - NUOVO evento di navigazione
      {
        id: `${sessionId}_detail_exit_1`,
        sessionId: sessionId,
        type: 'exit_intent',
        timestamp: new Date(baseTime + 3 * 60 * 1000 + 30 * 1000).toISOString(), // +3 min e 30 sec
        data: {
          category: 'navigation',
          mousePosition: {
            x: 800,
            y: 5
          }
        }
      },
      
      // Click su un servizio specifico
      {
        id: `${sessionId}_detail_6`,
        sessionId: sessionId,
        type: 'click',
        timestamp: new Date(baseTime + 4 * 60 * 1000).toISOString(), // +4 minuti
        data: {
          element: 'a',
          text: 'Ristrutturazioni',
          selector: '.service-card[data-service="ristrutturazioni"] .btn'
        }
      },
      
      // Visualizzazione pagina ristrutturazioni
      {
        id: `${sessionId}_detail_7`,
        sessionId: sessionId,
        type: 'page_view',
        timestamp: new Date(baseTime + 4 * 60 * 1000 + 2 * 1000).toISOString(), // +4 min e 2 sec
        data: {
          url: 'https://costruzionedigitale.com/servizi/ristrutturazioni',
          title: 'Servizi di Ristrutturazione - Costruzione Digitale',
          referrer: 'https://costruzionedigitale.com/servizi'
        }
      },
      
      // Altro tempo sulla pagina - NUOVO evento di navigazione
      {
        id: `${sessionId}_detail_time_2`,
        sessionId: sessionId,
        type: 'time_on_page',
        timestamp: new Date(baseTime + 4 * 60 * 1000 + 30 * 1000).toISOString(), // +4 min e 30 sec
        data: {
          duration: 120, // secondi
          category: 'navigation'
        }
      },
      
      // Scroll nella pagina di ristrutturazioni - MODIFICATO come evento di navigazione
      {
        id: `${sessionId}_detail_8`,
        sessionId: sessionId,
        type: 'scroll',
        timestamp: new Date(baseTime + 5 * 60 * 1000).toISOString(), // +5 minuti
        data: {
          direction: 'down',
          depth: 65,
          category: 'navigation' // Aggiunta categoria
        }
      },
      
      // Click sul link di contatto
      {
        id: `${sessionId}_detail_9`,
        sessionId: sessionId,
        type: 'click',
        timestamp: new Date(baseTime + 8 * 60 * 1000).toISOString(), // +8 minuti
        data: {
          element: 'a',
          text: 'Contattaci',
          selector: '.cta-button[href="/contatti"]'
        }
      },
      
      // Visualizzazione pagina contatti
      {
        id: `${sessionId}_detail_10`,
        sessionId: sessionId,
        type: 'page_view',
        timestamp: new Date(baseTime + 8 * 60 * 1000 + 2 * 1000).toISOString(), // +8 min e 2 sec
        data: {
          url: 'https://costruzionedigitale.com/contatti',
          title: 'Contattaci - Costruzione Digitale',
          referrer: 'https://costruzionedigitale.com/servizi/ristrutturazioni'
        }
      },
      
      // Interazione con il form
      {
        id: `${sessionId}_detail_11`,
        sessionId: sessionId,
        type: 'click',
        timestamp: new Date(baseTime + 10 * 60 * 1000).toISOString(), // +10 minuti
        data: {
          element: 'input',
          text: '',
          selector: 'form#contactForm input[name="name"]'
        }
      },
      
      // Invio del form
      {
        id: `${sessionId}_detail_12`,
        sessionId: sessionId,
        type: 'form_submit',
        timestamp: new Date(baseTime + 12 * 60 * 1000).toISOString(), // +12 minuti
        data: {
          formId: 'contactForm',
          page: '/contatti'
        }
      },
      
      // Evento di conversione
      {
        id: `${sessionId}_detail_13`,
        sessionId: sessionId,
        type: 'event',
        timestamp: new Date(baseTime + 12 * 60 * 1000 + 1 * 1000).toISOString(), // +12 min e 1 sec
        data: {
          name: 'lead_generated',
          category: 'conversion',
          value: 'form_submission'
        }
      }
    ];
    
    // Se è session3, diamo un set di dati più breve per variety
    if (sessionId === 'session3') {
      return NextResponse.json(details.slice(0, 5));
    }
    
    // Ordina gli eventi cronologicamente per sicurezza
    details.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return NextResponse.json(details);
  } catch (error) {
    console.error(`Errore nel recupero dei dettagli della sessione:`, error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei dettagli della sessione' },
      { status: 500 }
    );
  }
}