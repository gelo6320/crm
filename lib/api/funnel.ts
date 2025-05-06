// lib/api/funnel.ts
import { FunnelData, FunnelItem, FunnelStats } from "@/types";
import axios from "axios";

// Define a base URL for the API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

/**
 * Fetches funnel data from the server
 * @returns Promise with funnel data and stats
 */
export async function fetchFunnelData(): Promise<{
  funnelData: FunnelData;
  funnelStats: FunnelStats;
}> {
  try {
    // Fetch all leads with a single request
    const response = await axios.get(`${API_BASE_URL}/api/leads`, {
      params: { limit: 500 },
      withCredentials: true
    });
    
    const leads = response.data.leads || [];
    
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
    
    // Map each lead to a FunnelItem and add to appropriate column
    leads.forEach((lead: any) => {
      // Create a FunnelItem from the lead data
      const funnelItem: FunnelItem = {
        _id: lead._id,
        name: lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed Lead',
        email: lead.email,
        phone: lead.phone || '',
        status: lead.status || 'new',
        source: lead.source || 'direct',
        createdAt: lead.createdAt,
        value: lead.value || lead.extendedData?.value || 0,
        service: lead.service || '',
        type: lead.formType || 'form'
      };
      
      // Add to the appropriate funnel column based on status
      if (funnelData[funnelItem.status as keyof FunnelData]) {
        funnelData[funnelItem.status as keyof FunnelData].push(funnelItem);
      } else {
        // Default to 'new' for any unknown statuses
        funnelData.new.push({
          ...funnelItem,
          status: 'new'
        });
      }
    });
    
    // Calculate funnel statistics
    const funnelStats = calculateFunnelStats(leads);
    
    return {
      funnelData,
      funnelStats
    };
  } catch (error) {
    console.error("Error fetching funnel data:", error);
    
    // Return empty data structure in case of error
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
 * Calculate statistics for the funnel
 * @param leads Array of leads
 * @returns FunnelStats object
 */
function calculateFunnelStats(leads: any[]): FunnelStats {
  const totalLeads = leads.length;
  const customers = leads.filter(lead => lead.status === 'customer').length;
  const conversionRate = totalLeads > 0 ? Math.round((customers / totalLeads) * 100) : 0;
  
  let potentialValue = 0;
  let realizedValue = 0;
  let lostValue = 0;
  
  // Service distribution tracking
  const serviceDistribution: Record<string, number> = {};
  
  leads.forEach(lead => {
    // Extract value, defaulting to 0 if not present
    const value = lead.value || lead.extendedData?.value || 0;
    
    // Add to appropriate category based on status
    if (lead.status === 'customer') {
      realizedValue += value;
    } else if (lead.status === 'lost') {
      lostValue += value;
    } else {
      potentialValue += value;
    }
    
    // Track service distribution
    if (lead.service) {
      serviceDistribution[lead.service] = (serviceDistribution[lead.service] || 0) + 1;
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

/**
 * Updates a lead's stage/status in the funnel
 * @param leadId Lead ID
 * @param leadType Type of lead
 * @param fromStage Current stage
 * @param toStage Target stage
 * @param facebookOptions Optional Facebook event data
 * @returns Promise with result
 */
export async function updateLeadStage(
  leadId: string,
  leadType: string,
  fromStage: string,
  toStage: string,
  facebookOptions?: { eventName: string; eventMetadata?: Record<string, any> }
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
    console.error("Error updating lead stage:", error);
    throw error;
  }
}

/**
 * Updates a lead's metadata (value, service)
 * @param leadId Lead ID
 * @param leadType Lead type
 * @param value Optional value
 * @param service Optional service
 * @returns Promise with result
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
    const response = await axios.post(
      `${API_BASE_URL}/api/leads/update-metadata/${leadId}`,
      {
        value: value !== undefined ? value : null,
        service: service || null
      },
      { withCredentials: true }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error updating lead metadata:", error);
    throw error;
  }
}