// app/analytics/page.tsx - Versione Semplificata e Raffinata
"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Calendar } from "lucide-react";
import { SmoothCorners } from 'react-smooth-corners';
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TemporalPatternsSimple from "@/components/analytics/TemporalPatternsSimple";
import { 
  fetchTemporalAnalysis,
  refreshTemporalAnalytics,
  TemporalAnalysis
} from "@/lib/api/analytics";
import { toast } from "@/components/ui/toaster";

const TIMEFRAME_OPTIONS = [
  { value: 'weekly', label: 'Settimana', days: 7, weeks: 1 },
  { value: 'monthly', label: 'Mese', days: 30, weeks: 4 },
  { value: 'quarterly', label: 'Trimestre', days: 90, weeks: 12 },
];

export default function AnalyticsPage() {
  const [temporalData, setTemporalData] = useState<TemporalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('monthly');

  const currentTimeframe = TIMEFRAME_OPTIONS.find(opt => opt.value === timeframe);

  useEffect(() => {
    loadTemporalData();
  }, [timeframe]);

  const loadTemporalData = async () => {
    try {
      setIsLoading(true);
      const timeframeConfig = TIMEFRAME_OPTIONS.find(opt => opt.value === timeframe);
      
      const data = await fetchTemporalAnalysis(
        timeframe,
        timeframeConfig?.weeks || 4,
        timeframeConfig?.days || 30
      );
      
      setTemporalData(data);
    } catch (error) {
      console.error("❌ Errore caricamento dati temporali:", error);
      toast("error", "Errore", "Impossibile caricare i dati");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshTemporalAnalytics(timeframe);
      await loadTemporalData();
      toast("success", "Aggiornato", "Dati aggiornati");
    } catch (error) {
      console.error("❌ Errore refresh:", error);
      toast("error", "Errore", "Impossibile aggiornare");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !temporalData) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full">
        {/* Header compatto con frosted glass */}
        <motion.div 
          className="relative backdrop-blur-lg border-b border-white/20 dark:border-white/10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SmoothCorners corners="0" borderRadius="0" />
          <div className="absolute inset-0 bg-white/30 dark:bg-zinc-100/5" />
          
          <div className="relative flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <SmoothCorners corners="2" borderRadius="12" />
                <div className="relative bg-white/40 dark:bg-white/20 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-xl">
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="bg-transparent border-0 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 dark:text-white focus:ring-0 focus:outline-none pr-8 appearance-none"
                  >
                    {TIMEFRAME_OPTIONS.map(option => (
                      <option key={option.value} value={option.value} className="bg-white dark:bg-zinc-800">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              
              {temporalData && (
                <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                  {temporalData.summary?.totalSessions?.toLocaleString() || 0} sessioni
                </div>
              )}
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="relative group"
            >
              <SmoothCorners corners="2.5" borderRadius="12" />
              <div className="relative bg-white/40 dark:bg-white/20 hover:bg-white/60 dark:hover:bg-white/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-xl p-2.5 transition-all duration-200">
                <RefreshCw size={16} className={`text-gray-700 dark:text-gray-300 ${isRefreshing ? "animate-spin" : ""}`} />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Contenuto principale */}
        <div className="p-4 sm:p-6">
          <TemporalPatternsSimple
            data={temporalData}
            isLoading={isLoading}
          />
        </div>

        {/* Footer semplificato */}
        {temporalData && (
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              {new Date(temporalData.lastUpdated).toLocaleString('it-IT', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}