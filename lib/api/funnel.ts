// lib/api/funnel.ts
import { FunnelData, FunnelItem, FunnelStats } from "@/types";
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

export async function fetchFunnelData(): Promise<{
  funnelData: FunnelData;
  funnelStats: FunnelStats;
}> {
  try {
    // Recupera tutti i dati dai diversi endpoint
    const [formsResponse, bookingsResponse, facebookLeadsResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/leads/forms?limit=100`, { withCredentials: true }),
      axios.get(`${API_BASE_URL}/api/leads/bookings?limit=100`, { withCredentials: true }),
      axios.get(`${API_BASE_URL}/api/leads/facebook?limit=100`, { withCredentials: true })
    ]);
    
    const formsData = formsResponse.data.data || [];
    const bookingsData = bookingsResponse.data.data || [];
    const facebookLeadsData = facebookLeadsResponse.data.data || [];
    
    // Mappa i lead in FunnelItem
    const formItems: FunnelItem[] = formsData.map((form: any) => ({
      ...form,
      type: 'form'
    }));
    
    const bookingItems: FunnelItem[] = bookingsData.map((booking: any) => ({
      ...booking,
      type: 'booking'
    }));
    
    const facebookItems: FunnelItem[] = facebookLeadsData.map((lead: any) => ({
      ...lead,
      type: 'facebook'
    }));
    
    // Combina tutti i lead
    const allItems = [...formItems, ...bookingItems, ...facebookItems];
    
    // Inizializza il FunnelData con array vuoti
    const funnelData: FunnelData = {
      new: [],
      contacted: [],
      qualified: [],
      opportunity: [],
      proposal: [],
      customer: [],
      lost: []
    };
    
    // Raggruppa i lead per stato
    allItems.forEach(item => {
      if (funnelData[item.status as keyof FunnelData]) {
        funnelData[item.status as keyof FunnelData].push(item);
      } else if (item.status === 'pending' || item.status === 'confirmed' || item.status === 'completed') {
        // Mappa gli stati specifici delle prenotazioni
        const mappedStatus = mapBookingStatusToFunnelStatus(item.status);
        funnelData[mappedStatus as keyof FunnelData].push({
          ...item,
          status: mappedStatus
        });
      } else {
        // Fallback per stati sconosciuti
        funnelData.new.push(item);
      }
    });
    
    // Calcola le statistiche
    const funnelStats: FunnelStats = calculateFunnelStats(allItems);
    
    return {
      funnelData,
      funnelStats
    };
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

// Mappa gli stati delle prenotazioni agli stati del funnel
function mapBookingStatusToFunnelStatus(bookingStatus: string): string {
  switch (bookingStatus) {
    case 'pending': return 'new';
    case 'confirmed': return 'contacted';
    case 'completed': return 'qualified';
    case 'cancelled': return 'lost';
    default: return 'new';
  }
}

// Calcola le statistiche del funnel
function calculateFunnelStats(items: FunnelItem[]): FunnelStats {
  const totalLeads = items.length;
  const customers = items.filter(item => item.status === 'customer').length;
  const conversionRate = totalLeads > 0 ? Math.round((customers / totalLeads) * 100) : 0;
  
  let potentialValue = 0;
  let realizedValue = 0;
  let lostValue = 0;
  
  // Conteggio dei servizi
  const serviceDistribution: Record<string, number> = {};
  
  items.forEach(item => {
    const value = item.value || 0;
    
    if (item.status === 'customer') {
      realizedValue += value;
    } else if (item.status === 'lost') {
      lostValue += value;
    } else {
      potentialValue += value;
    }
    
    // Aggiorna la distribuzione dei servizi
    if (item.service) {
      serviceDistribution[item.service] = (serviceDistribution[item.service] || 0) + 1;
    }
  });
  
  return {
    totalLeads,
    conversionRate,
    potentialValue,
    realizedValue,
    lostValue,
    serviceDistribution
  };
}

interface FacebookEventOptions {
    eventName: string;
    eventMetadata?: Record<string, any>;
  }

// Modifica la funzione per supportare l'invio di eventi Facebook
export async function updateLeadStage(
    leadId: string,
    leadType: string,
    fromStage: string,
    toStage: string,
    facebookOptions?: FacebookEventOptions
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
          toStage,
          sendToFacebook: !!facebookOptions,
          facebookEvent: facebookOptions?.eventName || null,
          eventMetadata: facebookOptions?.eventMetadata || null
        },
        { withCredentials: true }
      );
      
      return response.data;
    } catch (error) {
      console.error("Errore durante l'aggiornamento del lead nel funnel:", error);
      throw error;
    }
  }

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