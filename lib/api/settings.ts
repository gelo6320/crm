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
 * Recupera le impostazioni utente
 */
export async function fetchUserSettings(): Promise<UserSettings> {
  try {
    // Utilizziamo il nuovo endpoint GET
    const response = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Errore nel recupero delle configurazioni");
    }
    
    // Trasforma i dati dal formato backend al formato frontend
    const backendConfig = response.data.config || {};
    
    return {
      mongoDbUri: backendConfig.mongodb_uri || "",
      apiKeys: {
        facebookAccessToken: backendConfig.access_token || "",
        googleApiKey: "", // Non disponibile dal backend, lasciamo vuoto
        facebookPixelId: backendConfig.meta_pixel_id || ""
      },
      webhooks: {
        callbackUrl: "" // Non disponibile dal backend, lasciamo vuoto
      },
      isDevelopment: false // Non disponibile dal backend, impostiamo su false
    };
  } catch (error) {
    console.error("Errore durante il recupero delle impostazioni:", error);
    // Restituiamo un oggetto ben formattato con tutti i campi inizializzati
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
    // Adattato in base al formato atteso da server.js
    const backendSettings = {
      mongodb_uri: settings.mongoDbUri,
      access_token: settings.apiKeys?.facebookAccessToken,
      meta_pixel_id: settings.apiKeys?.facebookPixelId
      // Non inviamo gli altri campi perché nel server.js l'endpoint API accetta solo questi
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