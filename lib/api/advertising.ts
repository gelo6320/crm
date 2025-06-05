// lib/api/advertising.ts
import axios from 'axios';

// Definizione dell'URL base dell'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.costruzionedigitale.com';

// Configurazione Facebook API
const FB_API_VERSION = 'v22.0';

// Definizione dei tipi di dati
export interface Ad {
  id: string;
  name: string;
  status: string;
  spend: number;
  leads: number;
  costPerLead: number;
  clicks: number;
  costPerClick: number;
  reach: number;
  impressions: number;
  cpm: number;
}

// Nuovo tipo per i dati del creative
export interface AdCreative {
  id: string;
  name: string;
  title?: string;
  body?: string;
  image_url?: string;
  video_id?: string;
  thumbnail_url?: string;
  object_type?: string;
  call_to_action?: {
    type: string;
    value?: {
      link?: string;
      link_title?: string;
    };
  };
  link_url?: string;
  link_description?: string;
}

// Helper per estrarre dati di lead dalle actions di Facebook
function extractActionData(actions: any[] = []) {
  let leads = 0;
  
  if (actions && Array.isArray(actions)) {
    actions.forEach(action => {
      if (action && typeof action === 'object') {
        if (action.action_type === 'lead') {
          const value = typeof action.value === 'string' ? 
            parseFloat(action.value) : 
            typeof action.value === 'number' ? 
              action.value : 0;
          
          leads += value || 0;
        }
      }
    });
  }
  
  return { leads };
}

// Helper per calcolare metriche dai dati Facebook
function calculateMetrics(data: any): {
  spend: number;
  leads: number;
  costPerLead: number;
  clicks: number;
  costPerClick: number;
  reach: number;
  impressions: number;
  cpm: number;
} {
  const impressions = parseInt(data.impressions) || 0;
  const clicks = parseInt(data.clicks) || 0;
  const spend = parseFloat(data.spend) || 0;
  const reach = parseInt(data.reach) || 0;
  
  // Estrai lead con priorità sui campi diretti
  let leads = 0;
  
  // Prima prova ad ottenere leads dai campi diretti
  if (data.leads !== undefined) {
    leads = parseFloat(data.leads) || 0;
  } else if (data.conversions && data.conversions.lead) {
    leads = parseFloat(data.conversions.lead) || 0;
  } else {
    // Fallback al metodo actions
    const actionData = extractActionData(data.actions || []);
    leads = actionData.leads;
  }
  
  // Calcola le metriche derivate
  const costPerLead = leads > 0 && spend > 0 ? spend / leads : 0;
  const costPerClick = clicks > 0 && spend > 0 ? spend / clicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  
  return {
    spend,
    leads,
    costPerLead,
    clicks,
    costPerClick,
    reach,
    impressions,
    cpm
  };
}

// Funzione per recuperare le inserzioni attive
export async function fetchActiveAds(): Promise<Ad[]> {
  try {
    // Prima facciamo una richiesta per ottenere la configurazione utente dal backend
    const configResponse = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );
    
    // Estrai la configurazione dalla risposta
    const userConfig = configResponse.data.config || {};
    const FB_MARKETING_TOKEN = userConfig.marketing_api_token || '';
    const FB_ACCOUNT_ID = userConfig.fb_account_id || '';
    
    // Se FB_MARKETING_TOKEN o FB_ACCOUNT_ID non sono disponibili, restituisci un errore
    if (!FB_MARKETING_TOKEN || !FB_ACCOUNT_ID) {
      console.error('ERRORE: Marketing API token o Account ID mancanti.');
      throw new Error('Configurazione Facebook incompleta. Verifica le impostazioni di accesso.');
    }
    
    // Richiesta all'API di Facebook per ottenere le inserzioni attive
    const response = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/act_${FB_ACCOUNT_ID}/ads`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN,
          fields: 'id,name,status,effective_status',
          effective_status: ['ACTIVE'],
          limit: 50
        }
      }
    );
    
    const adsData = response.data.data || [];
    
    if (adsData.length === 0) {
      console.log(`Nessuna inserzione attiva trovata per l'account ID ${FB_ACCOUNT_ID}`);
      return [];
    }
    
    console.log(`Trovate ${adsData.length} inserzioni attive`);
    
    // Ottieni insights per queste inserzioni
    const adsInsightResponse = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/act_${FB_ACCOUNT_ID}/insights`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN,
          level: 'ad',
          fields: 'ad_id,ad_name,reach,impressions,clicks,spend,actions,conversions',
          time_range: JSON.stringify({ 
            since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
            until: new Date().toISOString().split('T')[0] 
          })
        }
      }
    );
    
    const insights = adsInsightResponse.data.data || [];
    
    // Mappa insights alle inserzioni
    const insightsMap = insights.reduce((map: any, insight: any) => {
      map[insight.ad_id] = insight;
      return map;
    }, {});
    
    // Costruisci i nostri oggetti Ad
    const result: Ad[] = [];
    
    for (const ad of adsData) {
      const insight = insightsMap[ad.id] || {};
      const metrics = calculateMetrics(insight);
      
      // Crea oggetto Ad
      const adObj: Ad = {
        id: ad.id,
        name: ad.name,
        status: ad.effective_status || ad.status,
        ...metrics
      };
      
      result.push(adObj);
    }
    
    return result;
    
  } catch (error) {
    console.error("Errore durante il recupero delle inserzioni attive:", error);
    throw error;
  }
}

// Nuova funzione per recuperare i dati del creative dell'inserzione
export async function fetchAdCreative(adId: string): Promise<AdCreative | null> {
  try {
    // Prima facciamo una richiesta per ottenere la configurazione utente dal backend
    const configResponse = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );
    
    // Estrai la configurazione dalla risposta
    const userConfig = configResponse.data.config || {};
    const FB_MARKETING_TOKEN = userConfig.marketing_api_token || '';
    
    // Se FB_MARKETING_TOKEN non è disponibile, restituisci un errore
    if (!FB_MARKETING_TOKEN) {
      console.error('ERRORE: Marketing API token mancante.');
      throw new Error('Configurazione Facebook incompleta. Verifica le impostazioni di accesso.');
    }
    
    // Step 1: Ottieni l'ad creative ID dall'annuncio
    const adResponse = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/${adId}`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN,
          fields: 'creative'
        }
      }
    );
    
    const creativeId = adResponse.data.creative?.id;
    if (!creativeId) {
      throw new Error('Creative ID non trovato per questa inserzione.');
    }
    
    // Step 2: Ottieni i dettagli del creative
    const creativeResponse = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/${creativeId}`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN,
          fields: 'id,name,title,body,image_url,object_story_spec,call_to_action_type,url_tags,thumbnail_url,object_type,link_url'
        }
      }
    );
    
    const creative = creativeResponse.data;
    
    // Step 3: Estrai i dati dall'object_story_spec se presente
    let extractedData: any = {};
    
    if (creative.object_story_spec) {
      const spec = creative.object_story_spec;
      
      // Gestisci link_data (per i post con link)
      if (spec.link_data) {
        extractedData = {
          title: spec.link_data.name,
          body: spec.link_data.message,
          link_description: spec.link_data.description,
          link_url: spec.link_data.link,
          call_to_action: spec.link_data.call_to_action,
          image_url: spec.link_data.picture
        };
      }
      
      // Gestisci photo_data (per i post con foto)
      else if (spec.photo_data) {
        extractedData = {
          title: spec.photo_data.name,
          body: spec.photo_data.message,
          link_url: spec.photo_data.url,
          call_to_action: spec.photo_data.call_to_action,
          image_url: spec.photo_data.picture || spec.photo_data.url
        };
      }
      
      // Gestisci video_data (per i post con video)
      else if (spec.video_data) {
        extractedData = {
          title: spec.video_data.title,
          body: spec.video_data.message,
          video_id: spec.video_data.video_id,
          call_to_action: spec.video_data.call_to_action,
          image_url: spec.video_data.image_url,
          link_description: spec.video_data.link_description
        };
      }
    }
    
    // Costruisci l'oggetto AdCreative
    const adCreative: AdCreative = {
      id: creative.id,
      name: creative.name || `Creative ${creative.id}`,
      title: extractedData.title || creative.title,
      body: extractedData.body || creative.body,
      image_url: extractedData.image_url || creative.image_url || creative.thumbnail_url,
      video_id: extractedData.video_id,
      thumbnail_url: creative.thumbnail_url,
      object_type: creative.object_type,
      call_to_action: extractedData.call_to_action,
      link_url: extractedData.link_url || creative.link_url,
      link_description: extractedData.link_description
    };
    
    return adCreative;
    
  } catch (error) {
    console.error("Errore durante il recupero del creative dell'inserzione:", error);
    throw error;
  }
}

// Funzione legacy mantenuta per compatibilità (ora deprecated)
export async function fetchAdPreview(adId: string): Promise<string> {
  console.warn('fetchAdPreview è deprecata. Usa fetchAdCreative per evitare popup di cookie.');
  
  try {
    // Prima facciamo una richiesta per ottenere la configurazione utente dal backend
    const configResponse = await axios.get(
      `${API_BASE_URL}/api/user/config`,
      { withCredentials: true }
    );
    
    // Estrai la configurazione dalla risposta
    const userConfig = configResponse.data.config || {};
    const FB_MARKETING_TOKEN = userConfig.marketing_api_token || '';
    
    // Se FB_MARKETING_TOKEN non è disponibile, restituisci un errore
    if (!FB_MARKETING_TOKEN) {
      console.error('ERRORE: Marketing API token mancante.');
      throw new Error('Configurazione Facebook incompleta. Verifica le impostazioni di accesso.');
    }
    
    // Richiesta all'API di Facebook per ottenere l'anteprima dell'inserzione
    const response = await axios.get(
      `https://graph.facebook.com/${FB_API_VERSION}/${adId}/previews`,
      {
        params: {
          access_token: FB_MARKETING_TOKEN,
          ad_format: 'DESKTOP_FEED_STANDARD'
        }
      }
    );
    
    const previewData = response.data.data || [];
    
    if (previewData.length === 0 || !previewData[0].body) {
      console.error(`Nessuna anteprima trovata per l'inserzione ID ${adId}`);
      throw new Error('Anteprima non disponibile per questa inserzione.');
    }
    
    // Restituisci l'HTML dell'anteprima
    return previewData[0].body;
    
  } catch (error) {
    console.error("Errore durante il recupero dell'anteprima dell'inserzione:", error);
    throw error;
  }
}

// Funzione per recuperare i dettagli di un'inserzione specifica
export async function fetchAdDetails(adId: string): Promise<Ad | null> {
  const ads = await fetchActiveAds();
  return ads.find(ad => ad.id === adId) || null;
}