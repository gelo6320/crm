// lib/api/settings.ts
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Interfaccia per le impostazioni
 */
export interface UserSettings {
  facebookAccessToken?: string;
  facebookPixelId?: string;
  facebookTestEventCode?: string;
  isDevelopment?: boolean;
  [key: string]: any;
}

/**
 * Recupera le impostazioni utente
 */
export async function fetchUserSettings(): Promise<UserSettings> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );
    
    return response.data.config || {};
  } catch (error) {
    console.error("Errore durante il recupero delle impostazioni:", error);
    return {};
  }
}

/**
 * Salva le impostazioni utente
 */
export async function saveUserSettings(settings: UserSettings): Promise<{
  success: boolean;
  message: string;
  config?: UserSettings;
}> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/user/config`,
      settings,
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante il salvataggio delle impostazioni:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    
    return {
      success: false,
      message: "Errore durante il salvataggio delle impostazioni"
    };
  }
}