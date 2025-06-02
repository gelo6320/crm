// lib/api/auth.ts
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

interface AuthUser {
  username: string;
  role: string;
}

interface AuthResponse {
  authenticated: boolean;
  user: AuthUser | null;
  isImpersonating?: boolean;
  originalAdmin?: AuthUser;
}


/**
 * Effettua il login
 */
export async function login(username: string, password: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/login`,
      { username, password },
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante il login:", error);
    
    // Se c'è una risposta, restituisci l'errore
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    
    // Altrimenti, restituisci un errore generico
    return {
      success: false,
      message: "Errore durante il login"
    };
  }
}

/**
 * Effettua il logout
 */
export async function logout(): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/logout`,
        {}, // corpo vuoto della richiesta
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Errore durante il logout:", error);
      throw error;
    }
  }

  // lib/api/auth.ts - Aggiungi queste funzioni

/**
 * Ottieni tutti gli utenti (solo admin)
 */
export async function getUsers(): Promise<{
  success: boolean;
  data?: any[];
  message?: string;
}> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/admin/users`,
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero degli utenti:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    
    return {
      success: false,
      message: "Errore durante il recupero degli utenti"
    };
  }
}

/**
 * Switch utente (solo admin)
 */
export async function switchUser(targetUsername: string): Promise<{
  success: boolean;
  user?: any;
  originalAdmin?: any;
  message: string;
}> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/admin/switch-user`,
      { targetUsername },
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante il cambio utente:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    
    return {
      success: false,
      message: "Errore durante il cambio utente"
    };
  }
}

/**
 * Ripristina admin originale
 */
export async function restoreAdmin(): Promise<{
  success: boolean;
  user?: any;
  message: string;
}> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/admin/restore-admin`,
      {},
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante il ripristino admin:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    
    return {
      success: false,
      message: "Errore durante il ripristino admin"
    };
  }
}

/**
 * Verifica lo stato dell'autenticazione
 */
export async function checkAuth(): Promise<AuthResponse> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/check-auth`,
      { withCredentials: true }
    );
    
    // Controlla se la risposta è HTML invece di JSON
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      // È una pagina HTML, l'utente probabilmente non è autenticato
      return {
        authenticated: false,
        user: null
      };
    }
    
    return response.data;
  } catch (error) {
    console.error("Errore durante la verifica dell'autenticazione:", error);
    
    return {
      authenticated: false,
      user: null
    };
  }
}