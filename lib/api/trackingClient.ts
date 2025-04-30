// lib/api/trackingClient.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import CONFIG from "@/config/tracking-config";

const TRACKING_API_BASE_URL = CONFIG.api.baseUrl;

interface ErrorResponse {
  message?: string;
}

// Crea una istanza di axios con configurazione di base per il server di tracciamento
const trackingClient = axios.create({
  baseURL: TRACKING_API_BASE_URL,
  withCredentials: true, // Invia sempre i cookie nelle richieste
  headers: {
    "Content-Type": "application/json",
  },
  timeout: CONFIG.api.timeout,
});

// Interceptor per le richieste
trackingClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per le risposte
trackingClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Ottieni il messaggio di errore dalla risposta (se disponibile)
    const errorData = error.response?.data as ErrorResponse;
    const errorMessage = errorData?.message || error.message || "Si è verificato un errore";
    
    // Log dell'errore per debugging
    console.error(`Tracking API Error (${error.response?.status || 'network error'}):`, errorMessage);
    
    return Promise.reject(error);
  }
);

// Funzioni helper per le richieste API
export const trackingApi = {
  /**
   * Esegue una richiesta GET
   */
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await trackingClient.get<T>(url, config);
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
      const response = await trackingClient.post<T>(url, data, config);
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
      const response = await trackingClient.put<T>(url, data, config);
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
      const response = await trackingClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default trackingClient;