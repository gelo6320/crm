// lib/api/sites.ts
import { Site } from "@/types";
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Recupera la lista dei siti dell'utente
 */
export async function fetchUserSites(): Promise<Site[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/sites`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero dei siti:", error);
    throw error;
  }
}

/**
 * Aggiunge un nuovo sito
 */
export async function addSite(url: string): Promise<Site> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/sites`, 
      { url }, 
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiunta del sito:", error);
    throw error;
  }
}

/**
 * Aggiorna le metriche di un sito
 */
export async function refreshSiteMetrics(siteId: string): Promise<Site> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/sites/${siteId}/refresh`, 
      {}, 
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento delle metriche:", error);
    throw error;
  }
}

/**
 * Elimina un sito
 */
export async function deleteSite(siteId: string): Promise<{ success: boolean }> {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/sites/${siteId}`, 
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante l'eliminazione del sito:", error);
    throw error;
  }
}