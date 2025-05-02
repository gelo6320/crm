// lib/api/settings.ts
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Interfaccia per le impostazioni utente
 */
export interface UserSettings {
  mongoDbUri: string;
  apiKeys: {
    facebookAccessToken: string;
    googleApiKey: string;
    facebookPixelId: string;
  };
  webhooks: {
    callbackUrl: string;
  };
  isDevelopment: boolean;
}

/**
 * Recupera le impostazioni utente dal server
 */
export async function fetchUserSettings(): Promise<UserSettings> {
  try {
    // Usa l'endpoint GET /api/user/config
    const response = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );
    
    if (response.data.success) {
      // Ottieni le configurazioni dal server
      const serverConfig = response.data.config || {};
      
      // Trasforma i dati dal formato backend al formato frontend
      return {
        mongoDbUri: serverConfig.mongodb_uri || "",
        apiKeys: {
          facebookAccessToken: serverConfig.access_token || "",
          googleApiKey: "", // Non disponibile dal backend
          facebookPixelId: serverConfig.meta_pixel_id || ""
        },
        webhooks: {
          callbackUrl: ""  // Non disponibile dal backend
        },
        isDevelopment: false // Non disponibile dal backend
      };
    } else {
      throw new Error(response.data.message || "Errore nel recupero delle configurazioni");
    }
  } catch (error) {
    console.error("Errore durante il recupero delle impostazioni:", error);
    // Restituisci un oggetto ben formattato con tutti i campi inizializzati
    return {
      mongoDbUri: "",
      apiKeys: {
        facebookAccessToken: "",
        googleApiKey: "",
        facebookPixelId: ""
      },
      webhooks: {
        callbackUrl: ""
      },
      isDevelopment: false
    };
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
    // Trasforma i dati dal formato frontend al formato backend
    const backendSettings = {
      mongodb_uri: settings.mongoDbUri,
      access_token: settings.apiKeys.facebookAccessToken,
      meta_pixel_id: settings.apiKeys.facebookPixelId
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/api/user/config`,
      backendSettings,
      { withCredentials: true }
    );
    
    return {
      success: response.data.success,
      message: response.data.message,
      config: settings // Ritorna le impostazioni nel formato frontend
    };
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