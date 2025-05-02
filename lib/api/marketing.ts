// lib/api/marketing.ts
import axios from "axios";

// Definisci il tipo per i dati di riepilogo della campagna
export interface MarketingOverview {
  dates: string[];
  leads: number[];
  conversions: number[];
  roas: number[];
  totalLeads: number;
  totalConversions: number;
  averageRoas: number;
}

// Definisci i tipi per la struttura delle campagne
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
  costPerLead: number;
  conversions: number;
  costPerConversion: number;
  roas: number;
  adSets: AdSet[];
}

// API per recuperare i dati di riepilogo (per il grafico)
export async function fetchMarketingOverview(
  timeRange: string = "30d"
): Promise<MarketingOverview> {
  try {
    const response = await axios.get(`/api/marketing/overview?timeRange=${timeRange}`);
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero dei dati di marketing:", error);
    throw error;
  }
}

// API per recuperare l'elenco delle campagne
export async function fetchCampaigns(
  timeRange: string = "30d"
): Promise<Campaign[]> {
  try {
    const response = await axios.get(`/api/marketing/campaigns?timeRange=${timeRange}`);
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero delle campagne:", error);
    throw error;
  }
}

// API per recuperare gli AdSet di una campagna
export async function fetchAdSets(
  campaignId: string,
  timeRange: string = "30d"
): Promise<AdSet[]> {
  try {
    const response = await axios.get(
      `/api/marketing/campaigns/${campaignId}/adsets?timeRange=${timeRange}`
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero degli adset:", error);
    throw error;
  }
}

// API per recuperare gli Ad di un AdSet
export async function fetchAds(
  adSetId: string,
  timeRange: string = "30d"
): Promise<Ad[]> {
  try {
    const response = await axios.get(
      `/api/marketing/adsets/${adSetId}/ads?timeRange=${timeRange}`
    );
    return response.data;
  } catch (error) {
    console.error("Errore durante il recupero degli ads:", error);
    throw error;
  }
}