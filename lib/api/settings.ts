// lib/api/settings.ts
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Interfaccia per le impostazioni utente aggiornata
 */
export interface UserSettings {
  // Nuovi campi personali/aziendali
  name: string;
  company: string;
  companyLogo: string; // Base64 encoded image or URL
  
  // Campi esistenti
  mongoDbUri: string;
  apiKeys: {
    facebookAccessToken: string;      // Per Facebook Conversion API (CAPI)
    facebookMarketingToken: string;   // Per Facebook Marketing API
    googleApiKey: string;
    facebookPixelId: string;
    facebookAccountId: string;        // ID dell'account pubblicitario Facebook
  };
  whatsapp: {
    accessToken: string;              // Token di accesso WhatsApp Business API
    phoneNumberId: string;            // ID del numero di telefono WhatsApp Business
    webhookToken: string;             // Token per autenticare i webhook WhatsApp
    verifyToken: string;              // Token di verifica per setup webhook
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
        // Nuovi campi personali
        name: serverConfig.name || "",
        company: serverConfig.company || "",
        companyLogo: serverConfig.companyLogo || "",
        
        // Campi esistenti
        mongoDbUri: serverConfig.mongodb_uri || "",
        apiKeys: {
          facebookAccessToken: serverConfig.access_token || "",  // Per CAPI
          facebookMarketingToken: serverConfig.marketing_api_token || "", // Per Marketing API  
          googleApiKey: "", // Non disponibile dal backend
          facebookPixelId: serverConfig.meta_pixel_id || "",
          facebookAccountId: serverConfig.fb_account_id || ""
        },
        whatsapp: {
          accessToken: serverConfig.whatsapp_access_token || "",
          phoneNumberId: serverConfig.whatsapp_phone_number_id || "",
          webhookToken: serverConfig.whatsapp_webhook_token || "",
          verifyToken: serverConfig.whatsapp_verify_token || ""
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
      name: "",
      company: "",
      companyLogo: "",
      mongoDbUri: "",
      apiKeys: {
        facebookAccessToken: "",
        facebookMarketingToken: "",
        googleApiKey: "",
        facebookPixelId: "",
        facebookAccountId: ""
      },
      whatsapp: {
        accessToken: "",
        phoneNumberId: "",
        webhookToken: "",
        verifyToken: ""
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
      // Nuovi campi personali
      name: settings.name,
      company: settings.company,
      companyLogo: settings.companyLogo,
      
      // Campi esistenti
      mongodb_uri: settings.mongoDbUri,
      access_token: settings.apiKeys.facebookAccessToken,        // Per CAPI
      marketing_api_token: settings.apiKeys.facebookMarketingToken, // Per Marketing API
      meta_pixel_id: settings.apiKeys.facebookPixelId,
      fb_account_id: settings.apiKeys.facebookAccountId,
      whatsapp_access_token: settings.whatsapp.accessToken,
      whatsapp_phone_number_id: settings.whatsapp.phoneNumberId,
      whatsapp_webhook_token: settings.whatsapp.webhookToken,
      whatsapp_verify_token: settings.whatsapp.verifyToken
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

/**
 * Utility function per validare un'immagine
 */
export function validateImage(file: File): { isValid: boolean; error?: string } {
  // Verifica tipo file
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Il file deve essere un\'immagine' };
  }
  
  // Verifica dimensione (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'L\'immagine deve essere inferiore a 5MB' };
  }
  
  return { isValid: true };
}

/**
 * Utility function per convertire file in base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}