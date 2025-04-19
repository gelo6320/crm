// lib/api/bookings.ts
import { Booking } from "@/types";
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Recupera le prenotazioni dal server
 */
export async function fetchBookings(
  page = 1,
  status = "",
  search = ""
): Promise<{
  data: Booking[];
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
    
    if (status) {
      queryParams.append("status", status);
    }
    
    if (search) {
      queryParams.append("search", search);
    }
    
    // Effettua la richiesta al server
    const response = await axios.get(
      `${API_BASE_URL}/api/leads/bookings?${queryParams.toString()}`,
      { withCredentials: true }
    );
    
    // Restituisci i dati ricevuti dal server
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero delle prenotazioni:", error);
    
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