// lib/api/api-utils.ts
import axios from "axios";

// Definisci un'URL base per le API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Configura l'istanza di axios con le impostazioni di base
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Gestisce gli errori delle richieste API
 */
export function handleApiError(error: any, defaultMessage = "Errore durante la richiesta API"): never {
  // Log dell'errore per debug
  console.error("API Error:", error);
  
  // Se è un errore di Axios con risposta
  if (axios.isAxiosError(error) && error.response) {
    const errorMessage = error.response.data?.message || error.message || defaultMessage;
    throw new Error(errorMessage);
  }
  
  // Per altri tipi di errori
  throw new Error(error?.message || defaultMessage);
}

/**
 * Verifica lo stato dell'autenticazione e reindirizza se necessario
 */
export async function checkAuthAndRedirect(): Promise<boolean> {
  try {
    const response = await apiClient.get("/api/check-auth");
    
    if (!response.data.authenticated) {
      // Se l'utente non è autenticato, reindirizza alla pagina di login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Errore durante la verifica dell'autenticazione:", error);
    
    // In caso di errore, reindirizza alla pagina di login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    
    return false;
  }
}

/**
 * Costruisce i parametri di query da un oggetto
 */
export function buildQueryParams(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  
  return queryParams.toString();
}