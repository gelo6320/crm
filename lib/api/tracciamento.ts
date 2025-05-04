// lib/api/tracciamento.ts
import { LandingPage, TrackedUser, UserSession, SessionDetail } from "@/types/tracciamento";
import { trackingApi } from "./trackingClient";
import CONFIG from "@/config/tracking-config";

/**
 * Recupera l'elenco delle landing page con dati di tracciamento
 * @param timeRange - Intervallo di tempo ('24h', '7d', '30d', 'all')
 * @param search - Query di ricerca opzionale
 */
export async function fetchLandingPages(
  timeRange: string = '7d',
  search?: string
): Promise<LandingPage[]> {
  try {
    // Costruisci i parametri di query
    const params: Record<string, string> = {};
    
    if (timeRange && timeRange !== 'all') {
      params.timeRange = timeRange;
    }
    
    if (search) {
      params.search = search;
    }
    
    // Chiama l'API usando il client specifico per il tracciamento
    return await trackingApi.get<LandingPage[]>(
      CONFIG.api.endpoints.landingPages,
      { params }
    );
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
    const url = `${CONFIG.api.endpoints.users}/${encodeURIComponent(landingPageId)}`;
    
    return await trackingApi.get<TrackedUser[]>(url, { params });
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
    const url = `${CONFIG.api.endpoints.sessions}/${encodeURIComponent(userId)}`;
    
    return await trackingApi.get<UserSession[]>(url, { params });
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
    const url = `${CONFIG.api.endpoints.sessionDetails}/${encodeURIComponent(sessionId)}`;
    const result = await trackingApi.get<SessionDetail[]>(url);
    console.log(`Dettagli sessione ricevuti: ${result.length} elementi`);
    return result;
  } catch (error) {
    console.error("Errore nel recupero dei dettagli della sessione:", error);
    console.error("URL richiesta:", `${CONFIG.api.endpoints.sessionDetails}/${encodeURIComponent(sessionId)}`);
    throw error;
  }
}

/**
 * Recupera le statistiche di tracciamento
 * @param timeRange - Intervallo di tempo ('24h', '7d', '30d', 'all')
 */
export async function fetchTrackingStats(timeRange: string = '7d'): Promise<any> {
  try {
    // Costruisci i parametri di query
    const params: Record<string, string> = {};
    
    if (timeRange && timeRange !== 'all') {
      params.timeRange = timeRange;
    }
    
    // Chiama l'API
    return await trackingApi.get(CONFIG.api.endpoints.stats, { params });
  } catch (error) {
    console.error("Errore nel recupero delle statistiche:", error);
    throw error;
  }
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