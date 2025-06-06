// app/analytics/page.tsx - Versione Semplificata
"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Calendar } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TemporalPatternsSimple from "@/components/analytics/TemporalPatternsSimple";
import { 
  fetchTemporalAnalysis,
  refreshTemporalAnalytics,
  TemporalAnalysis
} from "@/lib/api/analytics";
import { toast } from "@/components/ui/toaster";

const TIMEFRAME_OPTIONS = [
  { value: 'weekly', label: 'Settimanale', days: 7, weeks: 1 },
  { value: 'monthly', label: 'Mensile', days: 30, weeks: 4 },
  { value: 'quarterly', label: 'Trimestrale', days: 90, weeks: 12 },
];

export default function AnalyticsPage() {
  // Stati
  const [temporalData, setTemporalData] = useState<TemporalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('monthly');

  const currentTimeframe = TIMEFRAME_OPTIONS.find(opt => opt.value === timeframe);

  // Carica dati al mount e cambio timeframe
  useEffect(() => {
    loadTemporalData();
  }, [timeframe]);

  const loadTemporalData = async () => {
    try {
      setIsLoading(true);
      const timeframeConfig = TIMEFRAME_OPTIONS.find(opt => opt.value === timeframe);
      
      console.log('📊 Caricamento dati temporali:', {
        timeframe,
        days: timeframeConfig?.days,
        weeks: timeframeConfig?.weeks
      });

      const data = await fetchTemporalAnalysis(
        timeframe,
        timeframeConfig?.weeks || 4,
        timeframeConfig?.days || 30
      );
      
      setTemporalData(data);
      
      console.log('✅ Dati temporali caricati:', {
        periodKey: data.periodKey,
        totalSessions: data.summary?.totalSessions
      });

    } catch (error) {
      console.error("❌ Errore caricamento dati temporali:", error);
      toast("error", "Errore", "Impossibile caricare i dati temporali");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      console.log('🔄 Refresh dati temporali per:', timeframe);
      
      await refreshTemporalAnalytics(timeframe);
      await loadTemporalData();
      
      toast("success", "Aggiornato", "Dati temporali aggiornati");
    } catch (error) {
      console.error("❌ Errore refresh:", error);
      toast("error", "Errore", "Impossibile aggiornare i dati");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !temporalData) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header compatto */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            {/* Selettore Timeframe */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {TIMEFRAME_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Info periodo */}
            {temporalData && (
              <div className="text-sm text-zinc-400">
                {temporalData.summary?.totalSessions?.toLocaleString() || 0} sessioni • 
                Picco: {temporalData.summary?.peakHour?.time || '--'} il {temporalData.summary?.peakDay?.day || '--'}
              </div>
            )}
          </div>
          
          {/* Bottone Aggiorna */}
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg p-2 text-white transition-colors"
            title="Aggiorna dati"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Contenuto */}
        <TemporalPatternsSimple
          data={temporalData}
          isLoading={isLoading}
        />

        {/* Footer compatto */}
        {temporalData && (
          <div className="text-center text-sm text-zinc-500 p-4 border-t border-zinc-800">
            Ultimo aggiornamento: {new Date(temporalData.lastUpdated).toLocaleString('it-IT')} • 
            Periodo: {temporalData.periodKey}
          </div>
        )}
      </div>
    </div>
  );
}