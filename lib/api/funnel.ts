// lib/api/funnel.ts
import { FunnelData, FunnelItem, FunnelStats } from "@/types";
import axios from "axios";
import crypto from 'crypto';

// Define base URL for APIs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

export async function fetchFunnelData(): Promise<{
  funnelData: FunnelData;
  funnelStats: FunnelStats;
}> {
  try {
    // Fetch all leads from the unified API endpoint
    const response = await axios.get(`${API_BASE_URL}/api/leads?limit=200`, {
      withCredentials: true
    });
    
    const leadsData = response.data.data || [];
    
    // Map the leads to FunnelItem format
    const allItems: FunnelItem[] = leadsData.map((lead: any) => {
      return {
        _id: lead._id,
        leadId: lead.leadId || lead._id,
        name: [lead.firstName || '', lead.lastName || ''].filter(Boolean).join(' ') || lead.name || 'Contact',
        email: lead.email,
        phone: lead.phone || '',
        type: lead.formType || 'form',
        // Check both locations - prioritize top-level fields
        service: lead.service || (lead.extendedData?.formData?.service) || '',
        value: lead.value || lead.extendedData?.value || 0,
        status: mapDatabaseStatusToFunnelStatus(lead.status),
        source: lead.source || lead.formType || '',
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        // Aggiunta dei dati di consenso
        consent: lead.consent || {},
        // Aggiunta dei dati estesi per il tracciamento
        extendedData: lead.extendedData || {}
      };
    });
    
    // Initialize the FunnelData with empty arrays
    const funnelData: FunnelData = {
      new: [],
      contacted: [],
      qualified: [],
      opportunity: [],
      proposal: [],
      customer: [],
      lost: []
    };
    
    // Group leads by mapped funnel status
    allItems.forEach(item => {
      if (funnelData[item.status as keyof FunnelData]) {
        funnelData[item.status as keyof FunnelData].push(item);
      } else {
        // Fallback for unknown statuses
        funnelData.new.push(item);
      }
    });
    
    // Calculate statistics
    const funnelStats: FunnelStats = calculateFunnelStats(allItems);
    
    return {
      funnelData,
      funnelStats
    };
  } catch (error) {
    console.error("Error fetching funnel data:", error);
    
    // Return empty object with correct structure in case of error
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

// Map database statuses to funnel statuses
function mapDatabaseStatusToFunnelStatus(dbStatus: string): string {
  switch (dbStatus) {
    case 'new': return 'new';
    case 'contacted': return 'contacted';
    case 'qualified': return 'qualified';
    case 'converted': return 'customer'; // Map 'converted' to 'customer'
    case 'lost': return 'lost';
    // Legacy mappings for backward compatibility
    case 'pending': return 'new';
    case 'confirmed': return 'contacted';
    case 'completed': return 'qualified';
    case 'cancelled': return 'lost';
    case 'opportunity': return 'opportunity';
    case 'proposal': return 'proposal';
    case 'customer': return 'customer';
    default: return 'new'; // Default to 'new' for unknown statuses
  }
}

// Map funnel statuses back to database statuses
function mapFunnelStatusToDatabaseStatus(funnelStatus: string): string {
  switch (funnelStatus) {
    case 'new': return 'new';
    case 'contacted': return 'contacted';
    case 'qualified': return 'qualified';
    case 'opportunity': return 'opportunity'; // Ora mappato direttamente
    case 'proposal': return 'proposal'; // Ora mappato direttamente
    case 'customer': return 'converted'; // Map 'customer' to 'converted'
    case 'lost': return 'lost';
    default: return 'new';
  }
}

// Funzione per hashare i dati utente per Facebook CAPI
function hashDataForFacebook(data: string): string {
  if (!data) return '';
  return crypto
    .createHash('sha256')
    .update(data.trim().toLowerCase())
    .digest('hex');
}

// Calculate funnel statistics
function calculateFunnelStats(items: FunnelItem[]): FunnelStats {
  const totalLeads = items.length;
  const customers = items.filter(item => item.status === 'customer').length;
  const conversionRate = totalLeads > 0 ? Math.round((customers / totalLeads) * 100) : 0;
  
  let potentialValue = 0;
  let realizedValue = 0;
  let lostValue = 0;
  
  // Count services
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
    
    // Update service distribution
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

// Funzione aggiornata per ottenere i dati completi del lead
export async function getLeadFullData(leadId: string): Promise<any> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/leads/${leadId}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei dati completi del lead:", error);
    throw error;
  }
}

// Updated function to support sending Facebook events with improved data and consent checking
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
  clientCreated?: boolean;
}> {
  try {
    // Prima otteniamo i dati completi del lead per verificare il consenso e raccogliere tutti i dati necessari
    const leadFullData = await getLeadFullData(leadId);
    
    // Convert funnel statuses to database statuses
    const dbFromStage = mapFunnelStatusToDatabaseStatus(fromStage);
    const dbToStage = mapFunnelStatusToDatabaseStatus(toStage);
    
    // Preparazione dati per la Facebook CAPI
    let facebookData = null;
    let consentError = null;
    
    if (facebookOptions) {
      // Verifica del consenso: controllo se il lead ha dato il consenso per terze parti
      if (!leadFullData.consent?.thirdParty) {
        consentError = "L'evento Facebook non può essere inviato: consenso per terze parti non fornito";
        console.warn(consentError, leadId);
        
        // Non inviamo l'evento, ma continuiamo con l'aggiornamento dello stato
        facebookData = null;
      } else {
        // Preparazione dei dati utente hashati per la CAPI
        const userData = {
          em: hashDataForFacebook(leadFullData.email),
          ph: hashDataForFacebook(leadFullData.phone),
          fn: hashDataForFacebook(leadFullData.firstName),
          ln: hashDataForFacebook(leadFullData.lastName),
          external_id: hashDataForFacebook(leadFullData.leadId)
        };
        
        // Preparazione dei dati di tracciamento
        const eventSourceUrl = leadFullData.extendedData?.landingPage || '';
        
        // Valore e valuta per il ROAS
        let value = facebookOptions.eventMetadata?.value || leadFullData.value || 0;
        const currency = leadFullData.extendedData?.currency || 'EUR';
        
        facebookData = {
          eventName: facebookOptions.eventName,
          userData: userData,
          eventSourceUrl: eventSourceUrl,
          eventId: `${leadId}_${Date.now()}`,
          ipAddress: leadFullData.extendedData?.ipAddress || null,
          userAgent: leadFullData.extendedData?.userAgent || null,
          clientUserAgent: leadFullData.extendedData?.userAgent || null,
          fbc: leadFullData.extendedData?.fbclid ? `fb.1.${Date.now()}.${leadFullData.extendedData.fbclid}` : null,
          fbp: null, // Questo dovrebbe essere recuperato dai cookie del browser
          value: value,
          currency: currency,
          customData: {
            ...facebookOptions.eventMetadata,
            value: value,
            currency: currency,
            service: leadFullData.service || facebookOptions.eventMetadata?.service,
            content_name: leadFullData.service || facebookOptions.eventMetadata?.service,
            content_category: leadType,
            status: toStage
          }
        };
      }
    }
    
    // Prepara flag per registrazione cliente se convertito
    const createClient = dbToStage === 'converted';
    
    // Chiamata API per lo spostamento con tutti i dati
    const response = await axios.post(
      `${API_BASE_URL}/api/sales-funnel/move`,
      {
        leadId,
        leadType,
        fromStage: dbFromStage,
        toStage: dbToStage,
        sendToFacebook: !!facebookData,
        facebookData: facebookData,
        originalFromStage: fromStage,
        originalToStage: toStage,
        createClient: createClient,  // Flag per indicare che un nuovo cliente deve essere creato
        consentError: consentError   // Passa eventuali errori di consenso al backend
      },
      { withCredentials: true }
    );
    
    return {
      ...response.data,
      consentError: consentError
    };
  } catch (error) {
    console.error("Error updating lead in funnel:", error);
    throw error;
  }
}

// Updated function to handle value/service updates with the new schema
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
    // Use the unified API endpoint for all lead types
    const endpoint = `${API_BASE_URL}/api/leads/${leadId}/update-metadata`;
    
    const response = await axios.post(
      endpoint,
      {
        value: value !== undefined ? value : null,
        service: service || null,
        leadType: leadType // Include leadType in request body for reference
      },
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore durante l'aggiornamento dei metadati del lead:", error);
    throw error;
  }
}