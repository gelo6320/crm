// app/api/marketing/campaigns/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Campaign, AdSet, Ad } from '@/lib/api/marketing';

/**
 * GET /api/marketing/campaigns
 * 
 * Restituisce l'elenco delle campagne con i relativi dati
 * Query params:
 * - timeRange: '7d', '30d', '90d'
 */
export async function GET(request: NextRequest) {
  try {
    // Estrai i parametri dalla query string
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // Genera dati di esempio
    const campaigns: Campaign[] = [
      generateCampaign('1', 'Campagna Lead Generation Servizi', 'ACTIVE', 100, 4),
      generateCampaign('2', 'Campagna Conversioni Ristrutturazioni', 'ACTIVE', 150, 3),
      generateCampaign('3', 'Remarketing Clienti Esistenti', 'ACTIVE', 80, 2),
      generateCampaign('4', 'Campagna Brand Awareness', 'PAUSED', 50, 2)
    ];
    
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Errore nel recupero delle campagne:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle campagne' },
      { status: 500 }
    );
  }
}

// Funzione per generare dati di campagna casuali ma realistici
function generateCampaign(id: string, name: string, status: string, budget: number, numAdSets: number): Campaign {
  const impressions = Math.floor(10000 + Math.random() * 50000);
  const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.05));
  const ctr = parseFloat((clicks / impressions * 100).toFixed(2));
  const spend = parseFloat((budget * 0.8 + Math.random() * budget * 0.4).toFixed(2));
  const cpc = parseFloat((spend / clicks).toFixed(2));
  const leads = Math.floor(clicks * (0.1 + Math.random() * 0.2));
  const costPerLead = parseFloat((spend / leads).toFixed(2));
  const conversions = Math.floor(leads * (0.05 + Math.random() * 0.3));
  const costPerConversion = conversions > 0 ? parseFloat((spend / conversions).toFixed(2)) : 0;
  const revenue = conversions * (500 + Math.random() * 2000);
  const roas = parseFloat((revenue / spend).toFixed(2));
  
  const adSets: AdSet[] = [];
  
  // Genera AdSet per questa campagna
  for (let i = 1; i <= numAdSets; i++) {
    const adSetBudget = budget / numAdSets;
    const adSetName = `AdSet ${i} - ${name}`;
    const adSetId = `${id}_adset_${i}`;
    
    const adSetImpressions = Math.floor(impressions / numAdSets);
    const adSetClicks = Math.floor(clicks / numAdSets);
    const adSetCtr = parseFloat((adSetClicks / adSetImpressions * 100).toFixed(2));
    const adSetSpend = parseFloat((spend / numAdSets).toFixed(2));
    const adSetCpc = parseFloat((adSetSpend / adSetClicks).toFixed(2));
    const adSetLeads = Math.floor(leads / numAdSets);
    const adSetCostPerLead = parseFloat((adSetSpend / adSetLeads).toFixed(2));
    const adSetConversions = Math.floor(conversions / numAdSets);
    const adSetCostPerConversion = adSetConversions > 0 ? parseFloat((adSetSpend / adSetConversions).toFixed(2)) : 0;
    const adSetRevenue = adSetConversions * (500 + Math.random() * 2000);
    const adSetRoas = parseFloat((adSetRevenue / adSetSpend).toFixed(2));
    
    const ads: Ad[] = [];
    
    // Genera Ads per questo AdSet
    for (let j = 1; j <= 3; j++) {
      const adName = `Ad ${j} - ${adSetName}`;
      const adId = `${adSetId}_ad_${j}`;
      
      const adImpressions = Math.floor(adSetImpressions / 3);
      const adClicks = Math.floor(adSetClicks / 3);
      const adCtr = parseFloat((adClicks / adImpressions * 100).toFixed(2));
      const adSpend = parseFloat((adSetSpend / 3).toFixed(2));
      const adCpc = parseFloat((adSpend / adClicks).toFixed(2));
      const adLeads = Math.floor(adSetLeads / 3);
      const adCostPerLead = parseFloat((adSpend / adLeads).toFixed(2));
      const adConversions = Math.floor(adSetConversions / 3);
      const adCostPerConversion = adConversions > 0 ? parseFloat((adSpend / adConversions).toFixed(2)) : 0;
      const adRevenue = adConversions * (500 + Math.random() * 2000);
      const adRoas = parseFloat((adRevenue / adSpend).toFixed(2));
      
      ads.push({
        id: adId,
        name: adName,
        status: Math.random() > 0.8 ? 'PAUSED' : 'ACTIVE',
        dailyBudget: adSetBudget / 3,
        impressions: adImpressions,
        clicks: adClicks,
        ctr: adCtr,
        cpc: adCpc,
        spend: adSpend,
        leads: adLeads,
        realLeads: Math.floor(Math.random() * adLeads * 1.5),
        costPerLead: adCostPerLead,
        conversions: adConversions,
        costPerConversion: adCostPerConversion,
        roas: adRoas,
      });
    }
    
    adSets.push({
      id: adSetId,
      name: adSetName,
      status: Math.random() > 0.7 ? 'PAUSED' : 'ACTIVE',
      dailyBudget: adSetBudget,
      impressions: adSetImpressions,
      clicks: adSetClicks,
      ctr: adSetCtr,
      cpc: adSetCpc,
      spend: adSetSpend,
      leads: adSetLeads,
      realLeads: ads.reduce((sum, ad) => sum + ad.realLeads, 0),
      costPerLead: adSetCostPerLead,
      conversions: adSetConversions,
      costPerConversion: adSetCostPerConversion,
      roas: adSetRoas,
      ads
    });
  }
  
  return {
    id,
    name,
    status,
    dailyBudget: budget,
    impressions,
    clicks,
    ctr,
    cpc,
    spend,
    leads,
    realLeads: adSets.reduce((sum, adSet) => sum + adSet.realLeads, 0),
    costPerLead,
    conversions,
    costPerConversion,
    roas,
    adSets
  };
}