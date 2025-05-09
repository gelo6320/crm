// lib/api/calendar.ts
import { CalendarEvent } from "@/types";
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Recupera tutti gli eventi del calendario
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/calendar/events`,
      { withCredentials: true }
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error("Errore durante il recupero degli eventi:", error);
    return [];
  }
}

// Crea un nuovo evento
export async function createCalendarEvent(eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/calendar/events`,
      eventData,
      { withCredentials: true }
    );
    
    return response.data.data;
  } catch (error) {
    console.error("Errore durante la creazione dell'evento:", error);
    throw error;
  }
}

// Aggiorna un evento esistente
export async function updateCalendarEvent(id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/calendar/events/${id}`,
      eventData,
      { withCredentials: true }
    );
    
    return response.data.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'evento:", error);
    throw error;
  }
}

// Elimina un evento
export async function deleteCalendarEvent(id: string): Promise<{ success: boolean }> {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/calendar/events/${id}`,
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'evento:", error);
    throw error;
  }
}