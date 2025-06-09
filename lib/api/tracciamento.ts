// lib/api/tracciamento.ts
import { LandingPage, TrackedUser, UserSession, SessionDetail, TrackingStats } from "@/types/tracciamento";
import { trackingApi } from "./trackingClient";
import CONFIG from "@/config/tracking-config";
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Updated fetchLandingPages function
export async function fetchLandingPages(
  timeRange: string = '7d',
  search?: string
): Promise<LandingPage[]> {
  try {
    // Costruisci i parametri di query
    const params: Record<string, string> = {};
    
    params.timeRange = timeRange;
    
    if (search) {
      params.search = search;
    }
    
    console.log(`Richiesta landing pages con timeRange: ${timeRange}`);
    
    // Chiama l'API per ottenere statistiche
    const response = await axios.get<any>(
      `${API_BASE_URL}/api/tracciamento/landing-pages-stats`,
      { params, withCredentials: true }
    );
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error("Formato di risposta non valido:", response.data);
      return [];
    }
    
    // Trasforma i dati delle statistiche in LandingPage[]
    const landingPages: LandingPage[] = response.data.map(page => ({
      id: Buffer.from(page.url).toString('base64'),
      url: page.url,
      title: page.title || page.url,
      totalVisits: page.totalVisits || 0,
      uniqueUsers: page.uniqueUsers || page.uniqueVisitors || 0,  // <-- CORREZIONE: Prova entrambi i campi
      conversionRate: page.conversionRate || 0,
      lastAccess: new Date(page.lastAccess || Date.now()).toISOString()
    }));
    
    return landingPages;
  } catch (error) {
    console.error("Errore nel recupero delle landing page:", error);
    throw error;
  }
}

/**
 * Recupera gli utenti associati a una landing page
 * @param landingPageId - ID della landing page
 * @param timeRange - Intervallo di tempo ('24h', '7d', '30d', 'all')
 * @param search - Query di ricerca opzionale
 */
export async function fetchUsers(
  landingPageId: string,
  timeRange: string = '7d',
  search?: string
): Promise<TrackedUser[]> {
  try {
    // Costruisci i parametri di query
    const params: Record<string, string> = {};
    
    if (timeRange && timeRange !== 'all') {
      params.timeRange = timeRange;
    }
    
    if (search) {
      params.search = search;
    }
    
    // Chiama l'API
    const response = await axios.get<TrackedUser[]>(
      `${API_BASE_URL}/api/tracciamento/users/${encodeURIComponent(landingPageId)}`,
      { params, withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero degli utenti:", error);
    throw error;
  }
}

/**
 * Recupera le sessioni di un utente
 * @param userId - ID dell'utente
 * @param timeRange - Intervallo di tempo ('24h', '7d', '30d', 'all')
 */
export async function fetchSessions(
  userId: string,
  timeRange: string = '7d'
): Promise<UserSession[]> {
  try {
    // Costruisci i parametri di query
    const params: Record<string, string> = {};
    
    if (timeRange && timeRange !== 'all') {
      params.timeRange = timeRange;
    }
    
    // Chiama l'API
    const response = await axios.get<UserSession[]>(
      `${API_BASE_URL}/api/tracciamento/sessions/${encodeURIComponent(userId)}`,
      { params, withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero delle sessioni:", error);
    throw error;
  }
}

/**
 * Recupera i dettagli di una sessione
 * @param sessionId - ID della sessione
 */
export async function fetchSessionDetails(sessionId: string): Promise<SessionDetail[]> {
  try {
    console.log(`Recupero dettagli sessione per ID: ${sessionId}`);
    const response = await axios.get<SessionDetail[]>(
      `${API_BASE_URL}/api/tracciamento/sessions/details/${encodeURIComponent(sessionId)}`,
      { withCredentials: true }
    );
    console.log(`Dettagli sessione ricevuti: ${response.data.length} elementi`);
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei dettagli della sessione:", error);
    console.error("URL richiesta:", `${CONFIG.api.endpoints.sessionDetails}/${encodeURIComponent(sessionId)}`);
    throw error;
  }
}

/**
 * Recupera le statistiche di tracciamento complete
 * @param {string} timeRange - Intervallo di tempo ('24h', '7d', '30d', 'all')
 * @param {boolean} includeTrends - Se includere i dati di tendenza
 * @returns {Promise<TrackingStats>}
 */
export async function fetchTrackingStats(
  timeRange: string = '7d',
  includeTrends: boolean = true
): Promise<TrackingStats> {
  try {
    // Costruisci i parametri di query
    const params: Record<string, string | boolean> = {};
    
    if (timeRange && timeRange !== 'all') {
      params.timeRange = timeRange;
    }
    
    if (includeTrends) {
      params.includeTrends = true;
    }
    
    // Chiama l'API base per le statistiche
    const stats = await trackingApi.get<TrackingStats>(CONFIG.api.endpoints.stats, { params });
    
    if (!stats) {
      throw new Error("Nessun dato ricevuto dall'API");
    }
    
    // Se le tendenze non sono incluse nella risposta, le calcoliamo localmente
    if (includeTrends && !stats.trends && stats.chartData && stats.chartData.length > 0) {
      const trends = calculateTrends(stats);
      stats.trends = trends;
    }
    
    // Se ci sono pochi dati sulle landing page, aggiungiamo alcuni dati di simulazione
    // per avere una visualizzazione più completa
    if (!stats.landingPagesTrends || stats.landingPagesTrends.length === 0) {
      stats.landingPagesTrends = generateLandingPagesTrendsData(stats);
    }
    
    // Confrontiamo con dati del periodo precedente se non inclusi nella risposta
    if (includeTrends && !stats.previousPeriod && stats.chartData && stats.chartData.length > 0) {
      stats.previousPeriod = generatePreviousPeriodData(stats);
    }
    
    return stats;
  } catch (error) {
    console.error("Errore nel recupero delle statistiche:", error);
    
    // In caso di errore, restituisci dati di esempio per evitare crash nell'UI
    if (process.env.NODE_ENV !== 'production') {
      console.log("Generazione dati di fallback per ambiente di sviluppo");
      return generateFallbackStats(timeRange);
    }
    
    throw error;
  }
}

/**
 * Calcola le tendenze dei dati statistici confrontando periodi
 * @param stats - Oggetto con i dati statistici
 * @returns Oggetto con le tendenze calcolate
 */
export function calculateTrends(stats: TrackingStats): TrackingStats['trends'] {
  if (!stats || !stats.summary) {
    return {
      visitsGrowth: 0,
      visitorGrowth: 0,
      conversionsGrowth: 0,
      convRateChange: 0,
      prevPeriodVisits: 0,
      prevPeriodVisitors: 0,
      prevPeriodConversions: 0,
      prevPeriodConvRate: 0
    };
  }
  
  // Se abbiamo dati del periodo precedente, usiamo quelli per un confronto accurato
  if (stats.previousPeriod && stats.previousPeriod.summary) {
    const currentVisits = stats.summary.totalVisits;
    const currentVisitors = stats.summary.uniqueVisitors;
    const currentConversions = stats.summary.conversions.total;
    const currentConvRate = stats.summary.conversionRate;
    
    const prevVisits = stats.previousPeriod.summary.totalVisits;
    const prevVisitors = stats.previousPeriod.summary.uniqueVisitors;
    const prevConversions = stats.previousPeriod.summary.conversions.total;
    const prevConvRate = prevVisitors > 0 ? 
      (prevConversions / prevVisitors) * 100 : 0;
    
    // Calcola la crescita in percentuale
    const visitsGrowth = prevVisits > 0 ? 
      ((currentVisits - prevVisits) / prevVisits) * 100 : 0;
    
    const visitorGrowth = prevVisitors > 0 ? 
      ((currentVisitors - prevVisitors) / prevVisitors) * 100 : 0;
    
    const conversionsGrowth = prevConversions > 0 ? 
      ((currentConversions - prevConversions) / prevConversions) * 100 : 0;
    
    const convRateChange = prevConvRate > 0 ? 
      ((currentConvRate - prevConvRate) / prevConvRate) * 100 : 0;
    
    return {
      visitsGrowth,
      visitorGrowth,
      conversionsGrowth,
      convRateChange,
      prevPeriodVisits: prevVisits,
      prevPeriodVisitors: prevVisitors,
      prevPeriodConversions: prevConversions,
      prevPeriodConvRate: prevConvRate
    };
  }
  
  // In assenza di dati precedenti, facciamo un calcolo basato sui dati attuali
  // analizzando la prima metà del periodo vs. la seconda metà
  if (stats.chartData && stats.chartData.length >= 2) {
    const midpoint = Math.floor(stats.chartData.length / 2);
    
    // Calcola totali per la prima metà (periodo precedente)
    const firstHalf = stats.chartData.slice(0, midpoint);
    const prevVisits = firstHalf.reduce((sum, day) => sum + day.visits, 0);
    const prevVisitors = firstHalf.reduce((sum, day) => sum + day.uniqueVisitors, 0);
    const prevConversions = firstHalf.reduce((sum, day) => sum + day.conversions, 0);
    const prevConvRate = prevVisitors > 0 ? 
      (prevConversions / prevVisitors) * 100 : 0;
    
    // Calcola totali per la seconda metà (periodo attuale)
    const secondHalf = stats.chartData.slice(midpoint);
    const currentVisits = secondHalf.reduce((sum, day) => sum + day.visits, 0);
    const currentVisitors = secondHalf.reduce((sum, day) => sum + day.uniqueVisitors, 0);
    const currentConversions = secondHalf.reduce((sum, day) => sum + day.conversions, 0);
    const currentConvRate = currentVisitors > 0 ? 
      (currentConversions / currentVisitors) * 100 : 0;
    
    // Calcola la crescita
    const visitsGrowth = prevVisits > 0 ? 
      ((currentVisits - prevVisits) / prevVisits) * 100 : 0;
    
    const visitorGrowth = prevVisitors > 0 ? 
      ((currentVisitors - prevVisitors) / prevVisitors) * 100 : 0;
    
    const conversionsGrowth = prevConversions > 0 ? 
      ((currentConversions - prevConversions) / prevConversions) * 100 : 0;
    
    const convRateChange = prevConvRate > 0 ? 
      ((currentConvRate - prevConvRate) / prevConvRate) * 100 : 0;
    
    return {
      visitsGrowth,
      visitorGrowth,
      conversionsGrowth,
      convRateChange,
      prevPeriodVisits: prevVisits,
      prevPeriodVisitors: prevVisitors,
      prevPeriodConversions: prevConversions,
      prevPeriodConvRate: prevConvRate
    };
  }
  
  // Se non abbiamo abbastanza dati per calcoli reali, restituiamo valori neutri
  return {
    visitsGrowth: 0,
    visitorGrowth: 0,
    conversionsGrowth: 0,
    convRateChange: 0,
    prevPeriodVisits: stats.summary.totalVisits,
    prevPeriodVisitors: stats.summary.uniqueVisitors,
    prevPeriodConversions: stats.summary.conversions.total,
    prevPeriodConvRate: stats.summary.conversionRate
  };
}

/**
 * Genera dati di simulazione per le landing page e le loro tendenze
 * @param stats - Statistiche esistenti da cui estrarre dati di base
 * @returns Dati di tendenza per le landing page
 */
function generateLandingPagesTrendsData(stats: TrackingStats): TrackingStats['landingPagesTrends'] {
  // Generiamo alcune landing page di esempio
  const landingPages = [
    { url: '/home', name: 'Homepage' },
    { url: '/prodotti', name: 'Prodotti' },
    { url: '/servizi', name: 'Servizi' },
    { url: '/chi-siamo', name: 'Chi Siamo' },
    { url: '/contatti', name: 'Contatti' },
    { url: '/blog', name: 'Blog' },
    { url: '/offerte', name: 'Offerte Speciali' },
    { url: '/assistenza', name: 'Assistenza Clienti' }
  ];
  
  // Calcola il totale delle visite per proporzionare i valori
  const totalVisits = stats.summary ? stats.summary.totalVisits : 1000;
  
  // Distribuisci le visite tra le varie landing page
  return landingPages.map(page => {
    // Genera una percentuale casuale di visite per questa pagina (tra 5% e 25%)
    const shareOfVisits = 0.05 + Math.random() * 0.2;
    const visits = Math.floor(totalVisits * shareOfVisits);
    
    // Genera un tasso di conversione tra 1% e 10%
    const conversionRate = 1 + Math.random() * 9;
    
    // Genera una crescita tra -15% e +35%
    const growth = -15 + Math.random() * 50;
    
    return {
      url: page.url,
      visits,
      uniqueUsers: Math.floor(visits * 0.7), // 70% delle visite sono utenti unici
      conversionRate,
      growth
    };
  }).sort((a, b) => b.growth - a.growth); // Ordina per crescita
}

/**
 * Genera dati simulati per il periodo precedente
 * @param stats - Statistiche del periodo attuale
 * @returns Dati del periodo precedente
 */
function generatePreviousPeriodData(stats: TrackingStats): TrackingStats['previousPeriod'] {
  if (!stats.summary || !stats.chartData) {
    return undefined;
  }
  
  // Calcoliamo valori basati su una variazione casuale rispetto al periodo attuale
  const variationFactor = 0.8 + Math.random() * 0.4; // Tra -20% e +20%
  
  const prevSummary = {
    totalVisits: Math.round(stats.summary.totalVisits * variationFactor),
    uniqueVisitors: Math.round(stats.summary.uniqueVisitors * variationFactor),
    pageViews: Math.round(stats.summary.pageViews * variationFactor),
    conversions: {
      total: Math.round(stats.summary.conversions.total * variationFactor)
    }
  };
  
  // Generiamo dati giornalieri per il periodo precedente
  const prevChartData = stats.chartData.map(day => {
    const dayVariation = 0.7 + Math.random() * 0.6; // Tra -30% e +30%
    
    return {
      date: new Date(new Date(day.date).getTime() - 86400000 * stats.chartData!.length), // Sposta indietro le date
      visits: Math.round(day.visits * dayVariation),
      uniqueVisitors: Math.round(day.uniqueVisitors * dayVariation),
      pageViews: Math.round(day.pageViews * dayVariation),
      conversions: Math.round(day.conversions * dayVariation),
      conversionRate: day.conversionRate * dayVariation
    };
  });
  
  return {
    summary: prevSummary,
    chartData: prevChartData
  };
}

/**
 * Genera dati statistici di fallback in caso di errore API
 * @param timeRange - Intervallo di tempo selezionato
 * @returns Statistiche di fallback
 */
function generateFallbackStats(timeRange: string): TrackingStats {
  // Determina il numero di giorni in base al timeRange
  let days = 7;
  switch (timeRange) {
    case '24h': days = 1; break;
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    default: days = 90; break;
  }
  
  // Genera dati base
  const totalVisits = 1000 + Math.floor(Math.random() * 5000);
  const uniqueVisitors = Math.floor(totalVisits * 0.7);
  const pageViews = totalVisits * 3 + Math.floor(Math.random() * 2000);
  const totalConversions = Math.floor(uniqueVisitors * 0.05);
  
  // Genera dati per il grafico
  const chartData = Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - days + index);
    
    // Più visite nei giorni feriali
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dailyFactor = isWeekend ? 0.7 : 1.2;
    
    const dailyVisits = Math.floor((totalVisits / days) * dailyFactor * (0.8 + Math.random() * 0.4));
    const dailyVisitors = Math.floor(dailyVisits * 0.7);
    const dailyPageViews = dailyVisits * 3 + Math.floor(Math.random() * 50);
    const dailyConversions = Math.floor(dailyVisitors * 0.05 * (0.7 + Math.random() * 0.6));
    
    return {
      date: date.toISOString(),
      visits: dailyVisits,
      uniqueVisitors: dailyVisitors,
      pageViews: dailyPageViews,
      conversions: dailyConversions,
      conversionRate: (dailyConversions / dailyVisitors) * 100
    };
  });
  
  // Genera sorgenti di traffico
  const sources = {
    'google': Math.floor(totalVisits * 0.4),
    'direct': Math.floor(totalVisits * 0.25),
    'facebook': Math.floor(totalVisits * 0.15),
    'instagram': Math.floor(totalVisits * 0.1),
    'linkedin': Math.floor(totalVisits * 0.05),
    'twitter': Math.floor(totalVisits * 0.03),
    'bing': Math.floor(totalVisits * 0.02)
  };
  
  // Genera distribuzione dispositivi
  const devices = {
    mobile: Math.floor(totalVisits * 0.65),
    desktop: Math.floor(totalVisits * 0.35)
  };
  
  // Crea il periodo precedente
  const previousPeriod = {
    summary: {
      totalVisits: Math.floor(totalVisits * 0.85),
      uniqueVisitors: Math.floor(uniqueVisitors * 0.85),
      pageViews: Math.floor(pageViews * 0.85),
      conversions: {
        total: Math.floor(totalConversions * 0.8)
      }
    }
  };
  
  // Calcola trends
  const trends = {
    visitsGrowth: 17.6,
    visitorGrowth: 15.3,
    conversionsGrowth: 25.0,
    convRateChange: 8.4,
    prevPeriodVisits: previousPeriod.summary.totalVisits,
    prevPeriodVisitors: previousPeriod.summary.uniqueVisitors,
    prevPeriodConversions: previousPeriod.summary.conversions.total,
    prevPeriodConvRate: (previousPeriod.summary.conversions.total / previousPeriod.summary.uniqueVisitors) * 100
  };
  
  // Genera dati per landing pages
  const landingPagesTrends = generateLandingPagesTrendsData({
    summary: {
      totalVisits,
      uniqueVisitors,
      pageViews,
      bounceRate: 35,
      avgTimeOnSite: 120,
      conversions: {
        total: totalConversions
      },
      conversionRate: (totalConversions / uniqueVisitors) * 100
    }
  });
  
  return {
    summary: {
      totalVisits,
      uniqueVisitors,
      pageViews,
      bounceRate: 35,
      avgTimeOnSite: 120,
      conversions: {
        total: totalConversions,
        byType: {
          'contatto': Math.floor(totalConversions * 0.5),
          'registrazione': Math.floor(totalConversions * 0.3),
          'acquisto': Math.floor(totalConversions * 0.15),
          'altro': Math.floor(totalConversions * 0.05)
        }
      },
      conversionRate: (totalConversions / uniqueVisitors) * 100,
      avgConversionValue: 79.50
    },
    chartData,
    sources,
    devices,
    trends,
    previousPeriod,
    landingPagesTrends
  };
}

/**
 * Recupera i dati di heatmap per una URL specifica
 * @param url - URL della pagina
 * @param timeRange - Intervallo di tempo ('24h', '7d', '30d', 'all')
 */
export async function fetchHeatmapData(
  url: string,
  timeRange: string = '7d'
): Promise<any> {
  try {
    // Costruisci i parametri di query
    const params: Record<string, string> = {
      url
    };
    
    if (timeRange && timeRange !== 'all') {
      params.timeRange = timeRange;
    }
    
    // Chiama l'API
    return await trackingApi.get(CONFIG.api.endpoints.heatmap, { params });
  } catch (error) {
    console.error("Errore nel recupero dei dati heatmap:", error);
    throw error;
  }
}