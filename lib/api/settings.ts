// lib/api/settings.ts
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Interfaccia per le impostazioni utente
 */
export interface UserSettings {
  mongoDbUri?: string;
  apiKeys?: {
    facebookAccessToken?: string;
    googleApiKey?: string;
    facebookPixelId?: string;
    facebookTestEventCode?: string;
  };
  webhooks?: {
    callbackUrl?: string;
  };
  isDevelopment?: boolean;
  [key: string]: any;
}

/**
 * Interfaccia per le impostazioni nel formato atteso dal backend
 */
interface BackendSettings {
  mongodb_uri?: string;
  access_token?: string;
  meta_pixel_id?: string;
  google_api_key?: string;
  webhook_callback_url?: string;
  is_development?: boolean;
}

/**
 * Recupera le impostazioni utente
 */
export async function fetchUserSettings(): Promise<UserSettings> {
  try {
    // Ottieni le configurazioni dalla sessione attraverso check-auth
    const authResponse = await axios.get(
      `${API_BASE_URL}/api/check-auth`, 
      { withCredentials: true }
    );
    
    // Verifica che l'utente sia autenticato
    if (!authResponse.data.authenticated) {
      throw new Error("Utente non autenticato");
    }
    
    // Per ora, recuperiamo le configurazioni salvate in localStorage come fallback
    let savedConfig: UserSettings = {
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
    
    if (typeof window !== 'undefined') {
      const savedConfigStr = localStorage.getItem('userConfig');
      if (savedConfigStr) {
        try {
          // Assicuriamoci che il parsed config sia di tipo UserSettings
          const parsedConfig = JSON.parse(savedConfigStr) as Partial<UserSettings>;
          
          // Aggiorniamo solo i campi che esistono nell'oggetto parsedConfig
          if (parsedConfig.mongoDbUri !== undefined) {
            savedConfig.mongoDbUri = parsedConfig.mongoDbUri;
          }
          if (parsedConfig.apiKeys) {
            savedConfig.apiKeys = {
              ...savedConfig.apiKeys,
              ...parsedConfig.apiKeys
            };
          }
          if (parsedConfig.webhooks) {
            savedConfig.webhooks = {
              ...savedConfig.webhooks,
              ...parsedConfig.webhooks
            };
          }
          if (parsedConfig.isDevelopment !== undefined) {
            savedConfig.isDevelopment = parsedConfig.isDevelopment;
          }
        } catch (e) {
          console.error("Errore nel parsing della configurazione salvata:", e);
        }
      }
    }
    
    return savedConfig;
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
    // Salva anche in localStorage per poterle recuperare successivamente
    if (typeof window !== 'undefined') {
      localStorage.setItem('userConfig', JSON.stringify(settings));
    }
    
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