// lib/api/marketing.ts
// Versione aggiornata per utilizzare marketing_api_token anziché access_token

import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

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

interface CampaignBasic {
  id: string;
}

interface InsightBasic {
  campaign_id: string;
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

// Configurazione Facebook API
const FB_API_VERSION = 'v18.0'; // Usa la versione stabile più recente

// Helper per convertire il nostro timeRange nel formato date di Facebook
function convertTimeRangeToDateRange(timeRange: string): { since: string, until: string } {
  const now = new Date();
  let since = new Date();
  
  switch(timeRange) {
    case '7d':
      since.setDate(now.getDate() - 7);
      break;
    case '30d':
      since.setDate(now.getDate() - 30);
      break;
    case '90d':
      since.setDate(now.getDate() - 90);
      break;
    default: // '24h' o altro
      since.setDate(now.getDate() - 1);
  }
  
  // Formatta le date come YYYY-MM-DD
  const sinceStr = since.toISOString().split('T')[0];
  const untilStr = now.toISOString().split('T')[0];
  
  return { since: sinceStr, until: untilStr };
}

// Helper per estrarre dati di lead e conversioni dalle actions di Facebook
function extractActionData(actions: any[] = []) {
  let leads = 0;
  let conversions = 0;
  
  if (actions && Array.isArray(actions)) {
    console.log("Azioni ricevute:", actions.length > 0 ? 
      `${actions.length} azioni` : "Nessuna azione trovata");
    
    actions.forEach(action => {
      // Verifica che action sia un oggetto valido
      if (action && typeof action === 'object') {
        if (action.action_type === 'lead') {
          // Conversione sicura a numero
          const value = typeof action.value === 'string' ? 
            parseFloat(action.value) : 
            typeof action.value === 'number' ? 
              action.value : 0;
          
          leads += value || 0;
        } else if (
          action.action_type === 'purchase' || 
          action.action_type === 'complete_registration' ||
          action.action_type === 'offsite_conversion'
        ) {
          // Conversione sicura a numero
          const value = typeof action.value === 'string' ? 
            parseFloat(action.value) : 
            typeof action.value === 'number' ? 
              action.value : 0;
          
          conversions += value || 0;
        }
      }
    });
  }
  
  console.log(`Leads estratti: ${leads}, Conversioni estratte: ${conversions}`);
  return { leads, conversions };
}

// Helper per trasformare i dati di insights Facebook nel nostro formato MarketingOverview
function transformToMarketingOverview(fbData: any, timeRange: string): MarketingOverview {
  const results = fbData.data || [];
  
  const dates: string[] = [];
  const leads: number[] = [];
  const conversions: number[] = [];
  const roas: number[] = [];
  
  let totalLeads = 0;
  let totalConversions = 0;
  let totalSpend = 0;
  let totalValue = 0;
  
  results.forEach((day: any) => {
    // Formatta la data come DD/MM
    const date = new Date(day.date_start);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    dates.push(formattedDate);
    
    // Estrai i dati delle actions (leads e conversions)
    const { leads: dayLeads, conversions: dayConversions } = extractActionData(day.actions);
    leads.push(dayLeads);
    conversions.push(dayConversions);
    
    // Calcola il ROAS giornaliero (stimato)
    const spend = parseFloat(day.spend) || 0;
    // Assumiamo un valore medio per conversione (personalizzare in base ai dati reali)
    const estimatedValue = dayConversions * 100; // Esempio: ogni conversione vale 100 EUR
    const dailyRoas = spend > 0 ? estimatedValue / spend : 0;
    roas.push(dailyRoas);
    
    // Aggiorna i totali
    totalLeads += dayLeads;
    totalConversions += dayConversions;
    totalSpend += spend;
    totalValue += estimatedValue;
  });
  
  // Calcola ROAS medio
  const averageRoas = totalSpend > 0 ? totalValue / totalSpend : 0;
  
  return {
    dates,
    leads,
    conversions,
    roas,
    totalLeads,
    totalConversions,
    averageRoas
  };
}

// Helper per calcolare metriche dai dati Facebook
function calculateMetrics(data: any): {
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
} {
  // Log per diagnostica
  console.log("Dati ricevuti per calcolo metriche:", 
    JSON.stringify({
      impressions: data.impressions,
      clicks: data.clicks,
      spend: data.spend,
      cost_per_lead: data.cost_per_lead,
      cost_per_conversion: data.cost_per_conversion,
      campi_disponibili: Object.keys(data)
    })
  );
  
  const impressions = parseInt(data.impressions) || 0;
  const clicks = parseInt(data.clicks) || 0;
  const spend = parseFloat(data.spend) || 0;
  
  // Estrai lead e conversioni con priorità sui campi diretti
  let leads = 0;
  let conversions = 0;
  let costPerLead = 0;
  let costPerConversion = 0;
  
  // Prima prova ad ottenere leads e conversions dai campi diretti
  if (data.leads !== undefined) {
    leads = parseFloat(data.leads) || 0;
  } else if (data.conversions && data.conversions.lead) {
    leads = parseFloat(data.conversions.lead) || 0;
  } else {
    // Fallback al metodo actions
    const actionData = extractActionData(data.actions || []);
    leads = actionData.leads;
  }
  
  // Stessa cosa per conversioni
  if (data.conversions && (data.conversions.purchase || data.conversions.total)) {
    conversions = parseFloat(data.conversions.purchase || data.conversions.total) || 0;
  } else {
    // Fallback al metodo actions
    const actionData = extractActionData(data.actions || []);
    conversions = actionData.conversions;
  }
  
  // Per costPerLead
  if (data.cost_per_lead !== undefined) {
    costPerLead = parseFloat(data.cost_per_lead) || 0;
  } else if (data.cost_per_action_type && data.cost_per_action_type.lead) {
    costPerLead = parseFloat(data.cost_per_action_type.lead) || 0;
  } else {
    // Calcola manualmente
    costPerLead = leads > 0 && spend > 0 ? spend / leads : 0;
  }
  
  // Per costPerConversion
  if (data.cost_per_conversion !== undefined) {
    costPerConversion = parseFloat(data.cost_per_conversion) || 0;
  } else if (data.cost_per_action_type && 
            (data.cost_per_action_type.purchase || data.cost_per_action_type.complete_registration)) {
    costPerConversion = parseFloat(data.cost_per_action_type.purchase || 
                                 data.cost_per_action_type.complete_registration) || 0;
  } else {
    // Calcola manualmente
    costPerConversion = conversions > 0 && spend > 0 ? spend / conversions : 0;
  }
  
  // Calcola metriche derivate
  const ctr = clicks > 0 && impressions > 0 ? clicks / impressions * 100 : 0;
  const cpc = clicks > 0 && spend > 0 ? spend / clicks : 0;
  
  // Stima ROAS (personalizzare in base al valore reale delle conversioni)
  // Prova prima a guardare action_values se disponibile
  let estimatedValue = 0;
  if (data.action_values && Array.isArray(data.action_values)) {
    data.action_values.forEach((actionValue: any) => {
      if (actionValue.action_type === 'purchase' || 
          actionValue.action_type === 'offsite_conversion') {
        estimatedValue += parseFloat(actionValue.value) || 0;
      }
    });
  }
  
  // Se non troviamo valori, usiamo il calcolo stimato
  if (estimatedValue === 0) {
    estimatedValue = conversions * 100; // Esempio: ogni conversione vale 100 EUR
  }
  
  const roas = spend > 0 ? parseFloat((estimatedValue / spend).toFixed(2)) : 0;
  
  console.log(`Metriche calcolate: Leads: ${leads}, CostPerLead: ${costPerLead}, Conversions: ${conversions}, CostPerConversion: ${costPerConversion}, ROAS: ${roas}`);
  
  const result = {
    impressions,
    clicks,
    ctr,
    cpc,
    spend,  // Questo dovrebbe essere 0.33
    leads,
    costPerLead,
    conversions,
    costPerConversion,
    roas
  };
  
  console.log("Metriche calcolate con spesa:", result.spend);
  
  return result;
}

async function testFacebookAPIResponse() {
  try {

    const configResponse = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );

    const userConfig = configResponse.data.config || {};
    const FB_MARKETING_TOKEN = userConfig.marketing_api_token || '';
    const FB_ACCOUNT_ID = userConfig.fb_account_id || '';

    const response = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/act_${FB_ACCOUNT_ID}/insights`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN,
          time_range: JSON.stringify({ since: '2025-05-13', until: '2025-05-20' }),
          level: 'account',
          limit: 1,
          fields: 'date_start,spend,impressions,clicks,actions,conversions,cost_per_result',
        }
      }
    );
    
    console.log("TEST API RESPONSE:", JSON.stringify(response.data, null, 2));
    console.log("Campi disponibili:", Object.keys(response.data.data[0] || {}));
    
    // Se ci sono actions, mostra i tipi
    if (response.data.data && response.data.data[0] && response.data.data[0].actions) {
      console.log("Tipi di azioni disponibili:", 
        response.data.data[0].actions.map((a: any) => a.action_type).join(', '));
    }
  } catch (error) {
    console.error("Test API fallito:", error);
  }
}

// API per recuperare i dati di riepilogo (per il grafico)
export async function fetchMarketingOverview(
  timeRange: string = "30d"
): Promise<MarketingOverview> {

  await testFacebookAPIResponse();

  try {
    // Prima facciamo una richiesta per ottenere la configurazione utente dal backend
    const configResponse = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );
    // Estrai la configurazione dalla risposta
    const userConfig = configResponse.data.config || {};
    const FB_MARKETING_TOKEN = userConfig.marketing_api_token || ''; // MODIFICATO: usa marketing_api_token invece di access_token
    const FB_ACCOUNT_ID = userConfig.fb_account_id || '';
    
    // FALLBACK: Se FB_MARKETING_TOKEN o FB_ACCOUNT_ID non sono disponibili, usa i dati mock
    if (!FB_MARKETING_TOKEN || !FB_ACCOUNT_ID) {
      console.warn('ATTENZIONE: Per utilizzare la Facebook Marketing API, sono necessari sia marketing_api_token che fb_account_id. Utilizzo dati mock.');
      const response = await axios.get(`/api/marketing/overview?timeRange=${timeRange}`);
      return response.data;
    }
    
    console.log(`Accesso a Facebook Marketing API con Account ID: ${FB_ACCOUNT_ID.substring(0, 4)}... e timeRange: ${timeRange}`);
    
    const { since, until } = convertTimeRangeToDateRange(timeRange);
    
    // Richiesta all'API di Facebook
    const response = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/act_${FB_ACCOUNT_ID}/insights`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN,
          time_range: JSON.stringify({ since, until }),
          level: 'account',
          time_increment: 1,
          fields: 'date_start,impressions,clicks,spend,actions,action_values,cost_per_action_type,cost_per_lead,cost_per_outbound_click,conversions,cost_per_conversion',
          action_breakdowns: 'action_type',
          action_report_time: 'conversion',
        }
      }
    );
    
    return transformToMarketingOverview(response.data, timeRange);
  } catch (error) {
    console.error("Errore durante il recupero dei dati di marketing:", error);
    // Fallback ai dati mock in caso di errore
    const response = await axios.get(`/api/marketing/overview?timeRange=${timeRange}`);
    return response.data;
  }
}

// API per recuperare l'elenco delle campagne
export async function fetchCampaigns(
  timeRange: string = "30d"
): Promise<Campaign[]> {
  try {
    // Prima facciamo una richiesta per ottenere la configurazione utente dal backend
    const configResponse = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );
    
    // Estrai la configurazione dalla risposta
    const userConfig = configResponse.data.config || {};
    const FB_MARKETING_TOKEN = userConfig.marketing_api_token || ''; // MODIFICATO: usa marketing_api_token invece di access_token
    const FB_ACCOUNT_ID = userConfig.fb_account_id || '';
    
    // FALLBACK: Se FB_MARKETING_TOKEN o FB_ACCOUNT_ID non sono disponibili, usa i dati mock
    if (!FB_MARKETING_TOKEN || !FB_ACCOUNT_ID) {
      console.warn('ATTENZIONE: Per utilizzare la Facebook Marketing API, sono necessari sia marketing_api_token che fb_account_id. Utilizzo dati mock.');
      const response = await axios.get(`/api/marketing/campaigns?timeRange=${timeRange}`);
      return response.data;
    }
    
    const { since, until } = convertTimeRangeToDateRange(timeRange);
    
    // Primo, ottieni tutte le campagne attive
    const campaignsResponse = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/act_${FB_ACCOUNT_ID}/campaigns`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN, // MODIFICATO: usa il token Marketing API
          fields: 'id,name,status,daily_budget,lifetime_budget',
          limit: 50
        }
      }
    );
    
    const campaigns = campaignsResponse.data.data || [];

    console.log("ID campagne recuperate:", campaigns.map((c: CampaignBasic) => c.id));
    
    if (campaigns.length === 0) {
      console.log(`Nessuna campagna trovata per l'account ID ${FB_ACCOUNT_ID}`);
      return [];
    }
    
    console.log(`Trovate ${campaigns.length} campagne per l'account Facebook`);
    
    // Poi, ottieni insights per queste campagne
    const campaignIds = campaigns.map((c: any) => c.id).join(',');
    
    if (!campaignIds) {
      return [];
    }
    
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/insights`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN, // MODIFICATO: usa il token Marketing API
          level: 'campaign',
          ids: campaignIds,
          time_range: JSON.stringify({ since, until }),
          fields: 'campaign_id,impressions,clicks,spend,actions',
          action_breakdowns: 'action_type',
        }
      }
    );
    
    const insights = insightsResponse.data.data || [];

    console.log("ID campagne negli insights:", insights.map((i: InsightBasic) => i.campaign_id));
    
    // Mappa insights alle campagne
    const insightsMap = insights.reduce((map: any, insight: any) => {
      map[insight.campaign_id] = insight;
      return map;
    }, {});
    
    // Costruisci i nostri oggetti Campaign con adSets
    const result: Campaign[] = [];
    
    for (const campaign of campaigns) {
      const insight = insightsMap[campaign.id] || {};
      const metrics = calculateMetrics(insight);
      
      // Calcola il budget giornaliero (converti da centesimi se necessario)
      const dailyBudget = campaign.daily_budget 
        ? parseInt(campaign.daily_budget) / 100 // FB restituisce budget in centesimi
        : (campaign.lifetime_budget 
          ? parseInt(campaign.lifetime_budget) / 100 / 30 // Stima giornaliera da lifetime
          : 0);
          
      // Crea oggetto Campaign
      const campaignObj: Campaign = {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        dailyBudget,
        ...metrics,
        adSets: [] // Sarà popolato successivamente
      };
      
      // Recupera ad sets per questa campagna
      try {
        const adSets = await fetchAdSets(campaign.id, timeRange);
        campaignObj.adSets = adSets;
      } catch (adSetError) {
        console.error(`Errore nel recupero degli AdSets per la campagna ${campaign.id}:`, adSetError);
        campaignObj.adSets = []; // Array vuoto in caso di errore
      }
      
      result.push(campaignObj);
    }
    
    return result;
  } catch (error) {
    console.error("Errore durante il recupero delle campagne:", error);
    // Fallback ai dati mock in caso di errore
    const response = await axios.get(`/api/marketing/campaigns?timeRange=${timeRange}`);
    return response.data;
  }
}

// API per recuperare gli AdSet di una campagna
export async function fetchAdSets(
  campaignId: string,
  timeRange: string = "30d"
): Promise<AdSet[]> {
  try {
    // Usa le stesse credenziali della chiamata principale
    // Prima facciamo una richiesta per ottenere la configurazione utente dal backend
    const configResponse = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );
    
    // Estrai la configurazione dalla risposta
    const userConfig = configResponse.data.config || {};
    const FB_MARKETING_TOKEN = userConfig.marketing_api_token || ''; // MODIFICATO: usa marketing_api_token invece di access_token
    const FB_ACCOUNT_ID = userConfig.fb_account_id || '';
    
    // FALLBACK: Se FB_MARKETING_TOKEN o FB_ACCOUNT_ID non sono disponibili, usa i dati mock
    if (!FB_MARKETING_TOKEN || !FB_ACCOUNT_ID) {
      console.warn('ATTENZIONE: Per utilizzare la Facebook Marketing API, sono necessari sia marketing_api_token che fb_account_id. Utilizzo dati mock.');
      const response = await axios.get(
        `/api/marketing/campaigns/${campaignId}/adsets?timeRange=${timeRange}`
      );
      return response.data;
    }
    
    const { since, until } = convertTimeRangeToDateRange(timeRange);
    
    // Ottieni ad sets per la campagna
    const adSetsResponse = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/${campaignId}/adsets`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN, // MODIFICATO: usa il token Marketing API
          fields: 'id,name,status,daily_budget,lifetime_budget',
          limit: 50
        }
      }
    );
    
    const adSets = adSetsResponse.data.data || [];
    
    if (adSets.length === 0) {
      return [];
    }
    
    // Ottieni insights per questi ad sets
    const adSetIds = adSets.map((a: any) => a.id).join(',');
    
    if (!adSetIds) {
      return [];
    }
    
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/insights`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN, // MODIFICATO: usa il token Marketing API
          level: 'adset',
          ids: adSetIds,
          time_range: JSON.stringify({ since, until }),
          fields: 'adset_id,impressions,clicks,spend,actions',
          action_breakdowns: 'action_type',
        }
      }
    );
    
    const insights = insightsResponse.data.data || [];
    
    // Mappa insights agli ad sets
    const insightsMap = insights.reduce((map: any, insight: any) => {
      map[insight.adset_id] = insight;
      return map;
    }, {});
    
    // Costruisci i nostri oggetti AdSet con ads
    const result: AdSet[] = [];
    
    for (const adSet of adSets) {
      const insight = insightsMap[adSet.id] || {};
      const metrics = calculateMetrics(insight);
      
      // Calcola il budget giornaliero (converti da centesimi se necessario)
      const dailyBudget = adSet.daily_budget 
        ? parseInt(adSet.daily_budget) / 100 // FB restituisce budget in centesimi
        : (adSet.lifetime_budget 
          ? parseInt(adSet.lifetime_budget) / 100 / 30 // Stima giornaliera da lifetime
          : 0);
          
      // Crea oggetto AdSet
      const adSetObj: AdSet = {
        id: adSet.id,
        name: adSet.name,
        status: adSet.status,
        dailyBudget,
        ...metrics,
        ads: [] // Sarà popolato successivamente
      };
      
      // Recupera ads per questo ad set
      try {
        const ads = await fetchAds(adSet.id, timeRange);
        adSetObj.ads = ads;
      } catch (adError) {
        console.error(`Errore nel recupero degli Ads per l'AdSet ${adSet.id}:`, adError);
        adSetObj.ads = []; // Array vuoto in caso di errore
      }
      
      result.push(adSetObj);
    }
    
    return result;
  } catch (error) {
    console.error("Errore durante il recupero degli adset:", error);
    // Fallback ai dati mock in caso di errore
    const response = await axios.get(
      `/api/marketing/campaigns/${campaignId}/adsets?timeRange=${timeRange}`
    );
    return response.data;
  }
}

// API per recuperare gli Ad di un AdSet
export async function fetchAds(
  adSetId: string,
  timeRange: string = "30d"
): Promise<Ad[]> {
  try {
    // Usa le stesse credenziali della chiamata principale
    // Prima facciamo una richiesta per ottenere la configurazione utente dal backend
    const configResponse = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );
    
    // Estrai la configurazione dalla risposta
    const userConfig = configResponse.data.config || {};
    const FB_MARKETING_TOKEN = userConfig.marketing_api_token || ''; // MODIFICATO: usa marketing_api_token invece di access_token
    const FB_ACCOUNT_ID = userConfig.fb_account_id || '';
    
    // FALLBACK: Se FB_MARKETING_TOKEN o FB_ACCOUNT_ID non sono disponibili, usa i dati mock
    if (!FB_MARKETING_TOKEN || !FB_ACCOUNT_ID) {
      console.warn('ATTENZIONE: Per utilizzare la Facebook Marketing API, sono necessari sia marketing_api_token che fb_account_id. Utilizzo dati mock.');
      const response = await axios.get(
        `/api/marketing/adsets/${adSetId}/ads?timeRange=${timeRange}`
      );
      return response.data;
    }
    
    const { since, until } = convertTimeRangeToDateRange(timeRange);
    
    // Ottieni ads per l'ad set
    const adsResponse = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/${adSetId}/ads`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN, // MODIFICATO: usa il token Marketing API
          fields: 'id,name,status',
          limit: 50
        }
      }
    );
    
    const ads = adsResponse.data.data || [];
    
    if (ads.length === 0) {
      return [];
    }
    
    // Ottieni insights per questi ads
    const adIds = ads.map((a: any) => a.id).join(',');
    
    if (!adIds) {
      return [];
    }
    
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/insights`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN, // MODIFICATO: usa il token Marketing API
          level: 'ad',
          ids: adIds,
          time_range: JSON.stringify({ since, until }),
          fields: 'ad_id,impressions,clicks,spend,actions',
          action_breakdowns: 'action_type',
        }
      }
    );
    
    const insights = insightsResponse.data.data || [];
    
    // Mappa insights agli ads
    const insightsMap = insights.reduce((map: any, insight: any) => {
      map[insight.ad_id] = insight;
      return map;
    }, {});
    
    // Costruisci i nostri oggetti Ad
    const result: Ad[] = [];
    
    for (const ad of ads) {
      const insight = insightsMap[ad.id] || {};
      const metrics = calculateMetrics(insight);
      
      // Gli ads non hanno un proprio budget, quindi usa 0 come default
      const dailyBudget = 0;
          
      // Crea oggetto Ad
      const adObj: Ad = {
        id: ad.id,
        name: ad.name,
        status: ad.status,
        dailyBudget,
        ...metrics
      };
      
      result.push(adObj);
    }
    
    return result;
  } catch (error) {
    console.error("Errore durante il recupero degli ads:", error);
    // Fallback ai dati mock in caso di errore
    const response = await axios.get(
      `/api/marketing/adsets/${adSetId}/ads?timeRange=${timeRange}`
    );
    return response.data;
  }
}