// lib/api/apiClient.ts
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Crea una istanza di axios con configurazione di base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Invia sempre i cookie nelle richieste
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 secondi di timeout
});

// Interceptor per le richieste
apiClient.interceptors.request.use(
  (config) => {
    // Puoi aggiungere logica qui, come l'aggiunta di token di autorizzazione
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per le risposte
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Gestisci errori di autenticazione (401)
    if (error.response?.status === 401) {
      // Se in ambiente browser, reindirizza alla pagina di login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
      }
    }
    
    // Gestisci errori di autorizzazione (403)
    if (error.response?.status === 403) {
      console.error("Accesso non autorizzato:", error.response?.data);
    }
    
    // Ottieni il messaggio di errore dalla risposta (se disponibile)
    const errorMessage = error.response?.data?.message || error.message || "Si è verificato un errore";
    
    // Log dell'errore per debugging
    console.error(`API Error (${error.response?.status || 'network error'}):`, errorMessage);
    
    return Promise.reject(error);
  }
);

// Funzioni helper per le richieste API
export const api = {
  /**
   * Esegue una richiesta GET
   */
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Esegue una richiesta POST
   */
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Esegue una richiesta PUT
   */
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Esegue una richiesta DELETE
   */
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default apiClient;