// lib/api/analytics.ts
import axios from 'axios';
import {
  AnalyticsDashboard,
  EngagementTrendData,
  HeatmapData,
  TemporalAnalysis,
  GenerateAnalyticsRequest,
  GenerateAnalyticsResponse,
  InsightsResponse
} from '@/types/analytics';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

/**
 * Recupera la dashboard completa analytics per oggi
 * @returns {Promise<AnalyticsDashboard>}
 */
export async function fetchAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  try {
    console.log('Richiesta dashboard analytics');
    
    const response = await axios.get<AnalyticsDashboard>(
      `${API_BASE_URL}/api/analytics/dashboard`,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data) {
      throw new Error("Nessun dato ricevuto dalla dashboard analytics");
    }
    
    console.log('Dashboard analytics ricevuta:', {
      periodKey: response.data.currentPeriod?.periodKey,
      overallScore: response.data.summary?.overallScore,
      insightsCount: response.data.insights?.length || 0
    });
    
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero della dashboard analytics:", error);
    throw error;
  }
}

/**
 * Recupera metriche di engagement dettagliate
 * @param {string} period - Periodo ('daily', 'weekly', 'monthly')
 * @param {number} days - Numero di giorni da analizzare
 * @returns {Promise<EngagementTrendData>}
 */
export async function fetchEngagementMetrics(
    period: string = 'monthly',
    days: number = 30
  ): Promise<EngagementTrendData> {
  try {
    console.log(`Richiesta metriche engagement per ${days} giorni, periodo: ${period}`);
    
    const params: Record<string, string | number> = {
      period,
      days
    };
    
    const response = await axios.get<EngagementTrendData>(
      `${API_BASE_URL}/api/analytics/engagement`,
      {
        params,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data) {
      throw new Error("Nessun dato ricevuto dalle metriche engagement");
    }
    
    console.log('Metriche engagement ricevute:', {
      period: response.data.period,
      records: response.data.totalRecords,
      avgScore: response.data.stats?.avgOverallScore
    });
    
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero delle metriche engagement:", error);
    throw error;
  }
}

/**
 * Recupera dati heatmap comportamentale
 * @param {string} period - Periodo ('daily', 'weekly', 'monthly')
 * @param {string} date - Data specifica (opzionale)
 * @returns {Promise<HeatmapData>}
 */
export async function fetchHeatmapData(
    period: string = 'monthly',
    date?: string
  ): Promise<HeatmapData> {
  try {
    console.log(`Richiesta dati heatmap per periodo: ${period}`, date ? `data: ${date}` : '');
    
    const params: Record<string, string> = {
      period
    };
    
    if (date) {
      params.date = date;
    }
    
    const response = await axios.get<HeatmapData>(
      `${API_BASE_URL}/api/analytics/heatmap`,
      {
        params,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data) {
      throw new Error("Nessun dato ricevuto dalla heatmap");
    }
    
    console.log('Dati heatmap ricevuti:', {
      periodKey: response.data.periodKey,
      hotspots: response.data.hotspots?.length || 0,
      patterns: response.data.navigationPatterns?.length || 0
    });
    
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei dati heatmap:", error);
    throw error;
  }
}

/**
 * Recupera analisi pattern temporali
 * @param {string} period - Periodo ('weekly', 'monthly')
 * @param {number} weeks - Numero di settimane da analizzare
 * @returns {Promise<TemporalAnalysis>}
 */
export async function fetchTemporalAnalysis(
    period: string = 'monthly',
    weeks: number = 4
  ): Promise<TemporalAnalysis> {
  try {
    console.log(`Richiesta analisi temporale per ${weeks} settimane, periodo: ${period}`);
    
    const params: Record<string, string | number> = {
      period,
      weeks
    };
    
    const response = await axios.get<TemporalAnalysis>(
      `${API_BASE_URL}/api/analytics/temporal`,
      {
        params,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data) {
      throw new Error("Nessun dato ricevuto dall'analisi temporale");
    }
    
    console.log('Analisi temporale ricevuta:', {
      records: response.data.recordsAnalyzed,
      peakHour: response.data.insights?.peakHour?.hour,
      peakDay: response.data.insights?.peakDay?.day
    });
    
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dell'analisi temporale:", error);
    throw error;
  }
}

/**
 * Genera nuove analytics per un periodo specifico
 * @param {GenerateAnalyticsRequest} request - Dati della richiesta
 * @returns {Promise<GenerateAnalyticsResponse>}
 */
export async function generateAnalytics(
  request: GenerateAnalyticsRequest
): Promise<GenerateAnalyticsResponse> {
  try {
    console.log('Richiesta generazione analytics:', request);
    
    const response = await axios.post<GenerateAnalyticsResponse>(
      `${API_BASE_URL}/api/analytics/generate`,
      request,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data) {
      throw new Error("Nessun dato ricevuto dalla generazione analytics");
    }
    
    console.log('Analytics generate:', {
      periodKey: response.data.periodKey,
      generated: response.data.generated,
      confidence: response.data.analytics?.confidence
    });
    
    return response.data;
  } catch (error) {
    console.error("Errore nella generazione analytics:", error);
    throw error;
  }
}

/**
 * Recupera insights per un periodo specifico
 * @param {string} periodKey - Chiave del periodo (es. "2025-06-04")
 * @param {string} period - Tipo periodo ('daily', 'weekly', 'monthly')
 * @returns {Promise<InsightsResponse>}
 */
export async function fetchInsights(
    periodKey: string,
    period: string = 'monthly'
  ): Promise<InsightsResponse> {
  try {
    console.log(`Richiesta insights per periodo: ${periodKey}, tipo: ${period}`);
    
    const params: Record<string, string> = {
      period
    };
    
    const response = await axios.get<InsightsResponse>(
      `${API_BASE_URL}/api/analytics/insights/${encodeURIComponent(periodKey)}`,
      {
        params,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data) {
      throw new Error("Nessun dato ricevuto dagli insights");
    }
    
    console.log('Insights ricevuti:', {
      periodKey: response.data.periodKey,
      insightsCount: response.data.insights?.length || 0,
      highPriority: response.data.summary?.highPriority || 0
    });
    
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero degli insights:", error);
    throw error;
  }
}

/**
 * Recupera analytics per un periodo specifico (funzione helper)
 * @param {string} periodKey - Chiave del periodo
 * @param {string} period - Tipo periodo
 * @returns {Promise<any>} - Analytics complete
 */
export async function fetchAnalyticsByPeriod(
    periodKey: string,
    period: string = 'monthly'
  ): Promise<any> {
  try {
    console.log(`Richiesta analytics per periodo: ${periodKey}, tipo: ${period}`);
    
    const params: Record<string, string> = {
      period
    };
    
    const response = await axios.get(
      `${API_BASE_URL}/api/analytics/period/${encodeURIComponent(periodKey)}`,
      {
        params,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero analytics per periodo:", error);
    throw error;
  }
}

/**
 * Forza l'aggiornamento delle analytics di oggi
 * @returns {Promise<any>}
 */
export async function refreshCurrentAnalytics(): Promise<any> {
    try {
      console.log('Richiesta refresh analytics del mese corrente');
      
      const today = new Date();
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      
      const request: GenerateAnalyticsRequest = {
        startDate: currentMonth.toISOString().split('T')[0],
        endDate: nextMonth.toISOString().split('T')[0],
        period: 'monthly', // CAMBIATO: era 'daily'
        force: true
      };
      
      return await generateAnalytics(request);
    } catch (error) {
      console.error("Errore nel refresh analytics del mese corrente:", error);
      throw error;
    }
  }

/**
 * Utility per formattare le date per le richieste analytics
 * @param {Date} date - Data da formattare
 * @returns {string} - Data in formato YYYY-MM-DD
 */
export function formatAnalyticsDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Utility per generare period key
 * @param {Date} date - Data
 * @param {string} period - Tipo periodo
 * @returns {string} - Period key
 */
export function generatePeriodKey(date: Date, period: string): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  switch (period) {
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'weekly':
      const weekNumber = Math.ceil((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7);
      return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    case 'monthly':
      return `${year}-${month}`;
    case 'yearly':
      return `${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}