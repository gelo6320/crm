// config/tracking-config.ts

/**
 * Configurazione per il sistema di tracciamento nel CRM
 */
const CONFIG = {
  // Informazioni sul prodotto
  product: {
    id: "landing-tracker-001",
    version: "1.0.0",
    name: "Universal Landing Tracker",
  },
  
  // Endpoint API di backend
  api: {
    baseUrl: process.env.NEXT_PUBLIC_TRACKING_API_URL || "https://alethe.costruzionedigitale.com",
    endpoints: {
      // Endpoint del tracker
      track: "/api/track",
      pageview: "/api/pageview",
      conversion: "/api/conversion",
      lead: "/api/lead",
      session: "/api/session",
      fingerprint: "/api/fingerprint",
      abtest: "/api/abtest",
      
      // Endpoint per la dashboard di tracciamento
      landingPages: "/api/tracciamento/landing-pages",
      users: "/api/tracciamento/users",
      sessions: "/api/tracciamento/sessions",
      sessionDetails: "/api/tracciamento/sessions/details",
      stats: "/api/tracciamento/stats",
      heatmap: "/api/tracciamento/heatmap"
    },
    timeout: 30000, // 30 secondi di timeout per le richieste API
  },
  
  // Formati data
  dateFormat: {
    short: "DD/MM/YYYY",
    long: "DD MMMM YYYY, HH:mm",
    time: "HH:mm:ss"
  },
  
  // Intervalli di tempo predefiniti
  timeRanges: [
    { value: "24h", label: "Ultime 24 ore" },
    { value: "7d", label: "Ultimi 7 giorni" },
    { value: "30d", label: "Ultimi 30 giorni" },
    { value: "all", label: "Tutti i dati" }
  ],
  
  // Colori per i grafici e visualizzazioni
  colors: {
    primary: "#FF6B00",
    info: "#3498db",
    success: "#2ecc71",
    warning: "#f39c12",
    danger: "#e74c3c",
    neutral: "#64748b"
  }
};

export default CONFIG;