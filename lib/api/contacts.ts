// lib/api/contacts.ts
import { Lead, Booking } from "@/types";
import { fetchForms } from "./forms";
import { fetchFacebookLeads } from "./facebook-leads";
import { fetchBookings } from "./bookings";

// Estendi l'interfaccia Contact per includere il tipo di fonte
export interface Contact extends Lead {
  sourceType: "form" | "facebook" | "booking";
}

/**
 * Recupera tutti i contatti da varie fonti usando le API esistenti
 */
export async function fetchAllContacts(
  page = 1,
  status = "",
  source = "",
  search = ""
): Promise<{
  data: Contact[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  try {
    // Limite per pagina
    const limit = 10;
    
    // Chiamate parallele a tutte le API esistenti
    const [formsResponse, facebookResponse, bookingsResponse] = await Promise.all([
      // Carica i form solo se non c'è un filtro su un'altra fonte
      source === "" || source === "form" 
        ? fetchForms(1, status, search)
        : Promise.resolve({ data: [], pagination: { total: 0, pages: 0 } }),
        
      // Carica i lead Facebook solo se non c'è un filtro su un'altra fonte
      source === "" || source === "facebook" 
        ? fetchFacebookLeads(1, status, search)
        : Promise.resolve({ data: [], pagination: { total: 0, pages: 0 } }),
        
      // Carica le prenotazioni solo se non c'è un filtro su un'altra fonte
      source === "" || source === "booking" 
        ? fetchBookings(1, status, search)
        : Promise.resolve({ data: [], pagination: { total: 0, pages: 0 } })
    ]);
    
    // Trasforma i dati per includere il tipo di fonte
    const formContacts: Contact[] = formsResponse.data.map(form => ({
      ...form,
      sourceType: "form",
      source: form.source || "Form di contatto"
    }));
    
    const facebookContacts: Contact[] = facebookResponse.data.map(lead => ({
      ...lead,
      sourceType: "facebook",
      source: "Lead Facebook"
    }));
    
    const bookingContacts: Contact[] = bookingsResponse.data.map(booking => ({
      ...booking,
      sourceType: "booking",
      source: "Prenotazione"
    }));
    
    // Combina tutti i contatti
    let allContacts: Contact[] = [
      ...formContacts,
      ...facebookContacts,
      ...bookingContacts
    ];
    
    // Ordina per data di creazione (più recenti prima)
    allContacts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Calcola la paginazione
    const totalContacts = allContacts.length;
    const totalPages = Math.ceil(totalContacts / limit);
    
    // Assicurati che la pagina corrente sia valida
    const validPage = Math.min(page, totalPages || 1);
    
    // Calcola gli indici per la paginazione
    const startIndex = (validPage - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Ottieni i contatti per la pagina corrente
    const paginatedContacts = allContacts.slice(startIndex, endIndex);
    
    return {
      data: paginatedContacts,
      pagination: {
        total: totalContacts,
        page: validPage,
        limit,
        pages: totalPages
      }
    };
  } catch (error) {
    console.error("Errore durante il recupero dei contatti:", error);
    
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