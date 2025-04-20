// lib/api/calendar.ts
import { CalendarEvent } from "@/types";
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

export async function fetchAppointments(): Promise<CalendarEvent[]> {
  try {
    // Recupera le prenotazioni dall'API esistente
    const response = await axios.get(
      `${API_BASE_URL}/api/leads/bookings?limit=100`,
      { withCredentials: true }
    );
    
    // Assicurati che response.data.data esista
    const bookings = response.data.data || [];
    
    // Mappa le prenotazioni in eventi del calendario
    return bookings.map((booking: any) => {
      // Crea oggetti Date per inizio e fine
      const start = new Date(booking.bookingTimestamp);
      const end = new Date(start.getTime() + 30 * 60000); // Aggiungi 30 minuti
      
      return {
        id: booking._id,
        title: `Appuntamento: ${booking.name}`,
        start,
        end,
        status: booking.status,
        clientId: booking._id,
        description: booking.message || `Telefono: ${booking.phone}`,
        location: booking.location || 'Telefonica'
      };
    });
  } catch (error) {
    console.error("Errore durante il recupero degli appuntamenti:", error);
    return [];
  }
}

export async function createAppointment(appointmentData: Partial<CalendarEvent>): Promise<CalendarEvent> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/appointments`,
      appointmentData,
      { withCredentials: true }
    );
    
    return response.data.data;
  } catch (error) {
    console.error("Errore durante la creazione dell'appuntamento:", error);
    throw error;
  }
}

export async function updateAppointment(id: string, appointmentData: Partial<CalendarEvent>): Promise<CalendarEvent> {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/appointments/${id}`,
      appointmentData,
      { withCredentials: true }
    );
    
    return response.data.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'appuntamento:", error);
    throw error;
  }
}

export async function deleteAppointment(id: string): Promise<{ success: boolean }> {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/appointments/${id}`,
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'appuntamento:", error);
    throw error;
  }
}