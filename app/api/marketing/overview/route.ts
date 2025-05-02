// app/api/marketing/overview/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * GET /api/marketing/overview
 * 
 * Restituisce i dati di riepilogo per i grafici di marketing
 * Query params:
 * - timeRange: '7d', '30d', '90d'
 */
export async function GET(request: NextRequest) {
  try {
    // Estrai i parametri dalla query string
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // Genera dati di esempio in base al timeRange
    let days: number;
    switch (timeRange) {
      case '7d':
        days = 7;
        break;
      case '90d':
        days = 90;
        break;
      case '30d':
      default:
        days = 30;
        break;
    }
    
    // Genera date
    const dates: string[] = [];
    const leads: number[] = [];
    const conversions: number[] = [];
    const roas: number[] = [];
    
    const now = new Date();
    let totalLeads = 0;
    let totalConversions = 0;
    let totalRoas = 0;
    
    // Genera dati casuali per il periodo selezionato
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
      
      // Genera dati casuali con un trend realistico
      const lead = Math.floor(10 + Math.random() * 20);
      const conversion = Math.floor(lead * (0.1 + Math.random() * 0.3));
      const roasValue = 1 + Math.random() * 5;
      
      leads.push(lead);
      conversions.push(conversion);
      roas.push(parseFloat(roasValue.toFixed(2)));
      
      totalLeads += lead;
      totalConversions += conversion;
      totalRoas += roasValue;
    }
    
    const averageRoas = parseFloat((totalRoas / days).toFixed(2));
    
    // Restituisci i dati generati
    return NextResponse.json({
      dates,
      leads,
      conversions,
      roas,
      totalLeads,
      totalConversions,
      averageRoas
    });
  } catch (error) {
    console.error('Errore nel recupero dei dati di marketing:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei dati di marketing' },
      { status: 500 }
    );
  }
}