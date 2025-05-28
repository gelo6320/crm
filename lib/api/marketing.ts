// lib/api/marketing.ts
// Versione refactorizzata che chiama solo il server backend (senza dati mock)

import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// ========== TIPI TYPESCRIPT (mantenuti dal file originale) ==========

export interface MarketingOverview {
  dates: string[];
  leads: number[];
  conversions: number[];
  roas: number[];
  totalLeads: number;
  totalConversions: number;
  averageRoas: number;
}

export interface Ad {
  id: string;
  name: string;
  status: string;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  leads: number;
  realLeads: number;
  costPerLead: number;
  conversions: number;
  costPerConversion: number;
  roas: number;
}

export interface AdSet {
  id: string;
  name: string;
  status: string;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  leads: number;
  realLeads: number;
  costPerLead: number;
  conversions: number;
  costPerConversion: number;
  roas: number;
  ads: Ad[];
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  dailyBudget: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  leads: number;
  realLeads: number;
  costPerLead: number;
  conversions: number;
  costPerConversion: number;
  roas: number;
  adSets: AdSet[];
}

// ========== API FUNCTIONS (refactorizzate per chiamare il server) ==========

/**
 * Recupera i dati di overview marketing dal server
 */
export async function fetchMarketingOverview(
  timeRange: string = "30d"
): Promise<MarketingOverview> {
  try {
    console.log(`[Marketing API] Richiesta overview per timeRange: ${timeRange}`);
    
    const response = await axios.get(`${API_BASE_URL}/api/marketing/overview`, {
      params: { timeRange },
      withCredentials: true,
      timeout: 30000
    });
    
    console.log(`[Marketing API] Overview ricevuta con successo`);
    return response.data;
  } catch (error) {
    console.error("[Marketing API] Errore durante il recupero dell'overview:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Recupera l'elenco delle campagne dal server
 */
export async function fetchCampaigns(
  timeRange: string = "30d"
): Promise<Campaign[]> {
  try {
    console.log(`[Marketing API] Richiesta campagne per timeRange: ${timeRange}`);
    
    const response = await axios.get(`${API_BASE_URL}/api/marketing/campaigns`, {
      params: { timeRange },
      withCredentials: true,
      timeout: 45000 // Timeout più lungo per le campagne
    });
    
    console.log(`[Marketing API] ${response.data.length} campagne ricevute con successo`);
    return response.data;
  } catch (error) {
    console.error("[Marketing API] Errore durante il recupero delle campagne:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * DEPRECATO: Usa fetchCampaigns() che include già gli AdSets
 * Mantenuto per compatibilità con codice esistente
 */
export async function fetchAdSets(
  campaignId: string,
  timeRange: string = "30d"
): Promise<AdSet[]> {
  console.warn('[Marketing API] fetchAdSets è deprecato. Usa fetchCampaigns() che include già gli AdSets');
  
  try {
    const campaigns = await fetchCampaigns(timeRange);
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.adSets || [];
  } catch (error) {
    console.error(`[Marketing API] Errore nel recupero AdSets per campagna ${campaignId}:`, error);
    return [];
  }
}

/**
 * DEPRECATO: Usa fetchCampaigns() che include già gli Ads
 * Mantenuto per compatibilità con codice esistente
 */
export async function fetchAds(
  adSetId: string,
  timeRange: string = "30d"
): Promise<Ad[]> {
  console.warn('[Marketing API] fetchAds è deprecato. Usa fetchCampaigns() che include già gli Ads');
  
  try {
    const campaigns = await fetchCampaigns(timeRange);
    for (const campaign of campaigns) {
      const adSet = campaign.adSets.find(as => as.id === adSetId);
      if (adSet) {
        return adSet.ads;
      }
    }
    return [];
  } catch (error) {
    console.error(`[Marketing API] Errore nel recupero Ads per adSet ${adSetId}:`, error);
    return [];
  }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Verifica se i dati marketing sono disponibili
 */
export async function checkMarketingDataAvailability(): Promise<{
  available: boolean;
  hasApiConfig: boolean;
  error?: string;
}> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/marketing/status`, {
      withCredentials: true,
      timeout: 10000
    });
    
    return {
      available: true,
      hasApiConfig: response.data.hasConfig || false
    };
  } catch (error) {
    console.error('[Marketing API] Errore nel controllo disponibilità:', error);
    return {
      available: false,
      hasApiConfig: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Refresh dei dati marketing (utile per pulsante refresh)
 */
export async function refreshMarketingData(timeRange: string = "30d"): Promise<{
  overview: MarketingOverview;
  campaigns: Campaign[];
}> {
  try {
    console.log('[Marketing API] Refresh completo dei dati marketing...');
    
    // Chiamate parallele per migliori performance
    const [overview, campaigns] = await Promise.all([
      fetchMarketingOverview(timeRange),
      fetchCampaigns(timeRange)
    ]);
    
    console.log('[Marketing API] Refresh completato con successo');
    return { overview, campaigns };
  } catch (error) {
    console.error('[Marketing API] Errore durante il refresh:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}