// lib/api/calendar.ts
import { CalendarEvent } from "@/types";
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Recupera gli appuntamenti dal server
 */
export async function fetchAppointments(): Promise<CalendarEvent[]> {
  try {
    // Effettua la richiesta al server
    const response = await axios.get(
      `${API_BASE_URL}/api/appointments`,
      { withCredentials: true }
    );
    
    // Restituisci i dati degli appuntamenti dal server
    return response.data.data || [];
  } catch (error) {
    console.error("Errore durante il recupero degli appuntamenti:", error);
    // In caso di errore, restituisci un array vuoto
    return [];
  }
}

/**
 * Crea un nuovo appuntamento
 */
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

/**
 * Aggiorna un appuntamento esistente
 */
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

/**
 * Elimina un appuntamento
 */
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