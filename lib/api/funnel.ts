// lib/api/funnel.ts
import { FunnelData, FunnelItem, FunnelStats } from "@/types";
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Recupera i dati del funnel di vendita dal server
 */
export async function fetchFunnelData(): Promise<{
  funnelData: FunnelData;
  funnelStats: FunnelStats;
}> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/sales-funnel`,
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero dei dati del funnel:", error);
    
    // In caso di errore, restituisci un oggetto vuoto con la struttura corretta
    return {
      funnelData: {
        new: [],
        contacted: [],
        qualified: [],
        opportunity: [],
        proposal: [],
        customer: [],
        lost: []
      },
      funnelStats: {
        totalLeads: 0,
        conversionRate: 0,
        potentialValue: 0,
        realizedValue: 0,
        lostValue: 0,
        serviceDistribution: {}
      }
    };
  }
}

/**
 * Aggiorna lo stato di un lead nel funnel
 */
export async function updateLeadStage(
  leadId: string,
  leadType: string,
  fromStage: string,
  toStage: string
): Promise<{
  success: boolean;
  message: string;
  facebookResult?: any;
}> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/sales-funnel/move`,
      {
        leadId,
        leadType,
        fromStage,
        toStage
      },
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento del lead nel funnel:", error);
    throw error;
  }
}

/**
 * Aggiorna i metadati di un lead (valore e servizio)
 */
export async function updateLeadMetadata(
  leadId: string,
  leadType: string,
  value?: number,
  service?: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Determina l'endpoint in base al tipo di lead
    let endpoint;
    if (leadType === 'form') {
      endpoint = `${API_BASE_URL}/api/leads/forms/${leadId}/update-metadata`;
    } else if (leadType === 'booking') {
      endpoint = `${API_BASE_URL}/api/leads/bookings/${leadId}/update-metadata`;
    } else if (leadType === 'facebook') {
      endpoint = `${API_BASE_URL}/api/leads/facebook/${leadId}/update-metadata`;
    } else {
      throw new Error("Tipo di lead non valido");
    }
    
    const response = await axios.post(
      endpoint,
      {
        value: value !== undefined ? value : null,
        service: service || null
      },
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dei metadati del lead:", error);
    throw error;
  }
}