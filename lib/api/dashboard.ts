// lib/api/dashboard.ts
import { Stat, Event } from "@/types";
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Valori predefiniti per i dati
const defaultStats = {
    forms: { total: 0, converted: 0, conversionRate: 0 },
    bookings: { total: 0, converted: 0, conversionRate: 0 },
    events: { 
      total: 0, 
      success: 0, 
      successRate: 0, 
      conversionRate: 0  // Aggiungi questa riga per risolvere l'errore
    },
  };

/**
 * Recupera le statistiche della dashboard dal server
 */
export async function fetchDashboardStats(): Promise<{
  forms: Stat;
  bookings: Stat;
  events: Stat;
}> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/dashboard/stats`,
      { withCredentials: true }
    );
    
    console.log("Risposta API originale:", JSON.stringify(response.data, null, 2));
    
    // Verifica se la risposta contiene i dati direttamente nella risposta
    if (response.data && typeof response.data === 'object') {
      
      // Prova i diversi pattern di risposta possibili
      
      // Pattern 1: La risposta contiene direttamente forms, bookings, events
      if (response.data.forms && response.data.bookings && response.data.events) {
        return response.data;
      }
      
      // Pattern 2: La risposta è incapsulata in un oggetto 'data'
      if (response.data.data && 
          response.data.data.forms && 
          response.data.data.bookings && 
          response.data.data.events) {
        return response.data.data;
      }
      
      // Pattern 3: La risposta è incapsulata in un oggetto 'success' e 'data'
      if (response.data.success && 
          response.data.data && 
          response.data.data.forms && 
          response.data.data.bookings && 
          response.data.data.events) {
        return response.data.data;
      }
      
      // Pattern 4: I dati sono in proprietà separate
      const forms = response.data.forms || response.data.formsStats || {};
      const bookings = response.data.bookings || response.data.bookingsStats || {};
      const events = response.data.events || response.data.eventsStats || {};
      
      if (forms.total !== undefined && bookings.total !== undefined && events.total !== undefined) {
        return {
          forms,
          bookings,
          events
        };
      }
    }
    
    console.warn("Struttura API non riconosciuta, utilizzo valori predefiniti");
    return defaultStats;
    
  } catch (error) {
    console.error("Errore durante il recupero delle statistiche:", error);
    return defaultStats;
  }
}

/**
 * Recupera gli eventi recenti dal server
 */
export async function fetchRecentEvents(): Promise<Event[]> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/events?limit=5`,
      { withCredentials: true }
    );
    
    console.log("Risposta eventi originale:", JSON.stringify(response.data, null, 2));
    
    // Pattern 1: Risposta diretta come array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Pattern 2: Dati in proprietà 'data'
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Pattern 3: Dati in 'success' e 'data'
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    console.warn("Struttura API eventi non riconosciuta, restituisco array vuoto");
    return [];
    
  } catch (error) {
    console.error("Errore durante il recupero degli eventi recenti:", error);
    return [];
  }
}