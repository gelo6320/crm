// lib/api/funnel.ts
import { FunnelData, FunnelItem, FunnelStats } from "@/types";

// Mock data for demo purposes
export async function fetchFunnelData(): Promise<{
  funnelData: FunnelData;
  funnelStats: FunnelStats;
}> {
  // In a real application, this would fetch from your API
  
  // Generate mock data for funnel
  const generateLeads = (count: number, status: string): FunnelItem[] => {
    return Array.from({ length: count }, (_, i) => ({
      _id: `${status}-${i + 1}`,
      name: `Cliente ${status} ${i + 1}`,
      email: `cliente-${status}-${i + 1}@example.com`,
      phone: `+39 3${i.toString().padStart(2, '0')}0 1234567`,
      status,
      createdAt: new Date(2025, 0, 1 + i).toISOString(),
      type: i % 3 === 0 ? 'form' : i % 3 === 1 ? 'booking' : 'facebook',
      value: status === 'opportunity' || status === 'proposal' || status === 'customer' ? 
        Math.floor(Math.random() * 10000) + 5000 : 
        i % 3 === 0 ? Math.floor(Math.random() * 5000) + 1000 : undefined,
      service: status === 'opportunity' || status === 'proposal' || status === 'customer' ?
        ['Ristrutturazione completa', 'Ristrutturazione bagno', 'Ristrutturazione cucina', 
         'Rifacimento tetto', 'Impianto elettrico'][Math.floor(Math.random() * 5)] :
        i % 4 === 0 ? ['Ristrutturazione completa', 'Ristrutturazione bagno', 'Cappotto termico'][Math.floor(Math.random() * 3)] : undefined,
    }));
  };
  
  const funnelData: FunnelData = {
    new: generateLeads(5, 'new'),
    contacted: generateLeads(3, 'contacted'),
    qualified: generateLeads(4, 'qualified'),
    opportunity: generateLeads(2, 'opportunity'),
    proposal: generateLeads(2, 'proposal'),
    customer: generateLeads(3, 'customer'),
    lost: generateLeads(2, 'lost'),
  };
  
  // Calculate funnel stats
  const allLeads = [
    ...funnelData.new,
    ...funnelData.contacted,
    ...funnelData.qualified,
    ...funnelData.opportunity,
    ...funnelData.proposal,
    ...funnelData.customer,
    ...funnelData.lost,
  ];
  
  const totalLeads = allLeads.length;
  
  const leadsInPipeline = funnelData.contacted.length + 
                          funnelData.qualified.length + 
                          funnelData.opportunity.length + 
                          funnelData.proposal.length + 
                          funnelData.customer.length + 
                          funnelData.lost.length;
  
  const conversionRate = leadsInPipeline > 0 
    ? Math.round((funnelData.customer.length / leadsInPipeline) * 100)
    : 0;
  
  const potentialValue = allLeads.reduce((total, lead) => 
    total + (lead.value || 0), 0);
  
  const realizedValue = funnelData.customer.reduce((total, lead) => 
    total + (lead.value || 0), 0);
  
  const lostValue = funnelData.lost.reduce((total, lead) => 
    total + (lead.value || 0), 0);
  
  // Service distribution
  const serviceDistribution: Record<string, number> = {};
  
  funnelData.customer.forEach(lead => {
    if (lead.service) {
      if (!serviceDistribution[lead.service]) {
        serviceDistribution[lead.service] = 0;
      }
      serviceDistribution[lead.service]++;
    }
  });
  
  return {
    funnelData,
    funnelStats: {
      totalLeads,
      conversionRate,
      potentialValue,
      realizedValue,
      lostValue,
      serviceDistribution,
    },
  };
}