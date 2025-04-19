// lib/api/auth.ts
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

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
    await axios.get(
      `${API_BASE_URL}/api/logout`,
      { withCredentials: true }
    );
  } catch (error) {
    console.error("Errore durante il logout:", error);
    throw error;
  }
}

/**
 * Verifica lo stato dell'autenticazione
 */
export async function checkAuth(): Promise<{
  authenticated: boolean;
  user: string | null;
}> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/check-auth`,
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante la verifica dell'autenticazione:", error);
    
    return {
      authenticated: false,
      user: null
    };
  }
}