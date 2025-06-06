// lib/api/analytics.ts - Versione Semplificata
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// ================================================================
// TYPES
// ================================================================

export interface TemporalAnalysis {
  period: string;
  periodKey: string;
  weeks: number; // ✅ AGGIUNTO
  recordsAnalyzed: number; // ✅ AGGIUNTO
  dateRange: {
    from: string;
    to: string;
  };
  hourlyDistribution: Array<{
    hour: number;
    visits: number;
    pageViews: number;
    engagement: number;
    conversions: number;
  }>;
  weeklyDistribution: Array<{
    dayOfWeek: number;
    dayName: string;
    visits: number;
    avgEngagement: number;
    peakHour: number;
  }>;
  summary: {
    totalSessions: number;
    avgEngagement: number;
    peakHour: {
      hour: number;
      visits: number;
      time: string;
    };
    peakDay: {
      day: string;
      visits: number;
      dayOfWeek: number;
    };
  };
  insights: Array<{
    type: string;
    message: string;
    recommendation: string;
  }>;
  lastUpdated: string;
}

export interface GenerateTemporalRequest {
  period?: string;
  force?: boolean;
}

export interface GenerateTemporalResponse {
  message: string;
  periodKey: string;
  analytics: any;
  generated: boolean;
}

// ================================================================
// API FUNCTIONS
// ================================================================

/**
 * Recupera analisi pattern temporali
 */
export async function fetchTemporalAnalysis(
  period: string = 'monthly',
  weeks: number = 4,
  days: number = 30
): Promise<TemporalAnalysis> {
  try {
    console.log(`🔍 Richiesta analisi temporale: periodo=${period}, weeks=${weeks}, days=${days}`);
    
    const params: Record<string, string | number> = {
      period,
      weeks,
      days
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
    
    console.log('✅ Analisi temporale ricevuta:', {
      periodKey: response.data.periodKey,
      weeks: response.data.weeks || weeks,
      recordsAnalyzed: response.data.recordsAnalyzed || 0,
      totalSessions: response.data.summary?.totalSessions || 0,
      peakHour: response.data.summary?.peakHour?.time || 'N/A',
      peakDay: response.data.summary?.peakDay?.day || 'N/A'
    });
    
    return response.data;
  } catch (error) {
    console.error("❌ Errore nel recupero dell'analisi temporale:", error);
    throw error;
  }
}

/**
 * Genera nuovi pattern temporali
 */
export async function generateTemporalAnalytics(
  request: GenerateTemporalRequest = {}
): Promise<GenerateTemporalResponse> {
  try {
    console.log('🔄 Richiesta generazione pattern temporali:', request);
    
    const response = await axios.post<GenerateTemporalResponse>(
      `${API_BASE_URL}/api/analytics/temporal/generate`,
      {
        period: request.period || 'monthly',
        force: request.force || true
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data) {
      throw new Error("Nessun dato ricevuto dalla generazione pattern temporali");
    }
    
    console.log('✅ Pattern temporali generati:', {
      periodKey: response.data.periodKey,
      generated: response.data.generated
    });
    
    return response.data;
  } catch (error) {
    console.error("❌ Errore nella generazione pattern temporali:", error);
    throw error;
  }
}

/**
 * Aggiorna i pattern temporali correnti
 */
export async function refreshTemporalAnalytics(period: string = 'monthly'): Promise<GenerateTemporalResponse> {
  try {
    console.log(`🔄 Refresh pattern temporali per periodo: ${period}`);
    
    return await generateTemporalAnalytics({
      period,
      force: true
    });
  } catch (error) {
    console.error("❌ Errore nel refresh pattern temporali:", error);
    throw error;
  }
}

/**
 * Utility per formattare le date
 */
export function formatAnalyticsDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Utility per generare period key
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

// Export default per retrocompatibilità
export default {
  fetchTemporalAnalysis,
  generateTemporalAnalytics,
  refreshTemporalAnalytics,
  formatAnalyticsDate,
  generatePeriodKey
};