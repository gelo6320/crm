// lib/api/tracciamento.ts
import { LandingPage, TrackedUser, UserSession, SessionDetail } from "@/types/tracciamento";
import { API_BASE_URL } from "./api-utils";
import { api } from "./apiClient";

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
    const params = new URLSearchParams();
    
    if (timeRange && timeRange !== 'all') {
      params.append('timeRange', timeRange);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    // Chiama l'API
    const queryString = params.toString();
    const url = `/api/tracciamento/landing-pages${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<LandingPage[]>(url);
    return response;
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
    const params = new URLSearchParams();
    
    if (timeRange && timeRange !== 'all') {
      params.append('timeRange', timeRange);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    // Chiama l'API
    const queryString = params.toString();
    const url = `/api/tracciamento/users/${landingPageId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<TrackedUser[]>(url);
    return response;
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
    const params = new URLSearchParams();
    
    if (timeRange && timeRange !== 'all') {
      params.append('timeRange', timeRange);
    }
    
    // Chiama l'API
    const queryString = params.toString();
    const url = `/api/tracciamento/sessions/${userId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<UserSession[]>(url);
    return response;
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
    // Utilizziamo il nuovo percorso per evitare conflitti di slug
    const url = `/api/tracciamento/sessions/details/${sessionId}`;
    const response = await api.get<SessionDetail[]>(url);
    return response;
  } catch (error) {
    console.error("Errore nel recupero dei dettagli della sessione:", error);
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
    const params = new URLSearchParams();
    
    if (timeRange && timeRange !== 'all') {
      params.append('timeRange', timeRange);
    }
    
    // Chiama l'API
    const queryString = params.toString();
    const url = `/api/tracciamento/stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response;
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
    const params = new URLSearchParams();
    params.append('url', url);
    
    if (timeRange && timeRange !== 'all') {
      params.append('timeRange', timeRange);
    }
    
    // Chiama l'API
    const queryString = params.toString();
    const apiUrl = `/api/tracciamento/heatmap${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(apiUrl);
    return response;
  } catch (error) {
    console.error("Errore nel recupero dei dati heatmap:", error);
    throw error;
  }
}