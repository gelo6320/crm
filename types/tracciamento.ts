// types/tracciamento.ts

// Landing page con dati di traffico
export interface LandingPage {
    id: string;
    url: string;
    title: string;
    totalVisits: number;
    uniqueUsers: number;
    conversionRate: number; // percentuale
    lastAccess: string; // data ISO
  }
  
  // Utente tracciato
  export interface TrackedUser {
    id: string;
    fingerprint: string; // impronta digitale del browser
    ip: string; // indirizzo IP (anonimizzato se necessario)
    userAgent?: string; // info browser
    location?: string; // localizzazione geografica
    referrer?: string; // referrer iniziale
    firstVisit: string; // data prima visita (ISO)
    lastActivity: string; // data ultima attività (ISO)
    sessionsCount: number; // numero totale sessioni
    isActive: boolean; // se l'utente è attualmente attivo
  }
  
  // Sessione utente
  export interface UserSession {
    id: string;
    userId: string; // riferimento all'utente
    landingPageId: string; // pagina di ingresso
    startTime: string; // data inizio sessione (ISO)
    endTime?: string; // data fine sessione (ISO)
    duration: number; // durata in minuti
    pagesViewed: number; // numero pagine viste
    interactionsCount: number; // numero interazioni
    entryUrl: string; // URL di ingresso
    exitUrl?: string; // URL di uscita
    isConverted: boolean; // se la sessione ha portato a conversione
  }
  
  // Dettaglio evento sessione
  export interface SessionDetail {
    id: string;
    sessionId: string; // riferimento alla sessione
    type: 'page_view' | 'click' | 'scroll' | 'form_submit' | 'event' | string; // tipo di evento
    timestamp: string; // data e ora dell'evento (ISO)
    data: {
      // Per page_view
      url?: string;
      title?: string;
      referrer?: string;
      
      // Per click
      element?: string;
      text?: string;
      selector?: string;
      
      // Per scroll
      direction?: 'up' | 'down';
      depth?: number; // percentuale di scroll
      
      // Per form_submit
      formId?: string;
      page?: string;
      
      // Per event (conversione)
      name?: string;
      category?: string;
      value?: string | number;
      
      // Altri dati specifici
      [key: string]: any;
    };
  }