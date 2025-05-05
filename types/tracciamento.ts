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
  startTime: string; // data inizio sessione (ISO)
  endTime?: string; // data fine sessione (ISO)
  duration: number; // durata in minuti
  pagesViewed: number; // numero pagine viste
  interactionsCount: number; // numero interazioni
  entryPage: string; // URL di ingresso
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
    isNavigation?: boolean;
    
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
    type?: string;  // Tipo di evento/conversione (es. 'exit_intent', 'purchase', ecc.)
    
    // Altri dati specifici
    [key: string]: any;
  };
}

// Interfaccia per le statistiche di tracciamento
export interface TrackingStats {
  summary: {
    totalVisits: number;
    uniqueVisitors: number;
    pageViews: number;
    bounceRate: number;
    avgTimeOnSite: number;
    conversions: {
      total: number;
      byType?: Record<string, number>;
    };
    conversionRate: number;
    avgConversionValue?: number;
  };
  chartData?: Array<{
    date: string | Date;
    visits: number;
    uniqueVisitors: number;
    pageViews: number;
    conversions: number;
    conversionRate: number;
  }>;
  sources?: Record<string, number>;
  devices?: {
    mobile: number;
    desktop: number;
  };
  trends?: {
    visitsGrowth: number;
    visitorGrowth: number;
    conversionsGrowth: number;
    convRateChange: number;
    prevPeriodVisits: number;
    prevPeriodVisitors: number;
    prevPeriodConversions: number;
    prevPeriodConvRate: number;
  };
  previousPeriod?: {
    summary: {
      totalVisits: number;
      uniqueVisitors: number;
      pageViews: number;
      conversions: {
        total: number;
      };
    };
    chartData?: Array<{
      date: string | Date;
      visits: number;
      uniqueVisitors: number;
      pageViews: number;
      conversions: number;
      conversionRate: number;
    }>;
  };
  topLandingPages?: LandingPage[];
  landingPagesTrends?: Array<{
    url: string;
    visits: number;
    uniqueUsers: number;
    conversionRate: number;
    growth: number;
  }>;
}