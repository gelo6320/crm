// lib/api/dashboard.ts
import { Stat, Event } from "@/types";
import axios from "axios";

// Definisci un'URL base per le API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

export async function fetchDashboardStats(): Promise<{
  forms: Stat;
  bookings: Stat;
  events: Stat;
}> {
  try {
    // Recupera le statistiche dalle API esistenti
    const [formsResponse, bookingsResponse, eventsResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/leads/forms?limit=1`, { withCredentials: true }),
      axios.get(`${API_BASE_URL}/api/leads/bookings?limit=1`, { withCredentials: true }),
      axios.get(`${API_BASE_URL}/api/events?limit=1`, { withCredentials: true })
    ]);
    
    const formsData = formsResponse.data;
    const bookingsData = bookingsResponse.data;
    const eventsData = eventsResponse.data;
    
    return {
      forms: {
        total: formsData.pagination?.total || 0,
        converted: formsData.data?.filter((f: any) => f.status === 'customer').length || 0,
        conversionRate: calculateConversionRate(formsData.data)
      },
      bookings: {
        total: bookingsData.pagination?.total || 0,
        converted: bookingsData.data?.filter((b: any) => b.status === 'customer').length || 0,
        conversionRate: calculateConversionRate(bookingsData.data)
      },
      events: {
        total: eventsData.pagination?.total || 0,
        success: eventsData.data?.filter((e: any) => e.success).length || 0,
        successRate: calculateSuccessRate(eventsData.data),
        conversionRate: 0
      }
    };
  } catch (error) {
    console.error("Errore durante il recupero delle statistiche:", error);
    return {
      forms: { total: 0, converted: 0, conversionRate: 0 },
      bookings: { total: 0, converted: 0, conversionRate: 0 },
      events: { total: 0, success: 0, successRate: 0, conversionRate: 0 }
    };
  }
}

function calculateConversionRate(data: any[]): number {
  if (!data || data.length === 0) return 0;
  const converted = data.filter(item => item.status === 'customer').length;
  return Math.round((converted / data.length) * 100);
}

function calculateSuccessRate(events: any[]): number {
  if (!events || events.length === 0) return 0;
  const successful = events.filter(event => event.success).length;
  return Math.round((successful / events.length) * 100);
}

export async function fetchRecentEvents(): Promise<Event[]> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/events?limit=5`,
      { withCredentials: true }
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error("Errore durante il recupero degli eventi recenti:", error);
    return [];
  }
}