// lib/api/events.ts
import { Event } from "@/types";
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Recupera gli eventi dal server
 */
export async function fetchEvents(
  page = 1,
  success = "",
  search = ""
): Promise<{
  data: Event[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  try {
    // Costruisci l'URL con i parametri di query
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    
    if (success !== "") {
      queryParams.append("success", success);
    }
    
    if (search) {
      queryParams.append("search", search);
    }
    
    // Effettua la richiesta al server
    const response = await axios.get(
      `${API_BASE_URL}/api/events?${queryParams.toString()}`,
      { withCredentials: true }
    );
    
    // Restituisci i dati ricevuti dal server
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero degli eventi:", error);
    
    // In caso di errore, restituisci un oggetto vuoto con la struttura corretta
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit: 10,
        pages: 0,
      },
    };
  }
}

/**
 * Riprova a inviare un evento fallito
 */
export async function retryEvent(eventId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/events/${eventId}/retry`,
      {},
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante il nuovo tentativo di invio dell'evento:", error);
    throw error;
  }
}