// app/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  RefreshCw, 
  Calendar,
  Activity,
  MousePointer,
  TrendingUp,
  Clock
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AnalyticsDashboardComponent from "@/components/analytics/AnalyticsDashboard";
import EngagementMetrics from "@/components/analytics/EngagementMetrics";
import HeatmapVisualization from "@/components/analytics/HeatmapVisualization";
import TemporalPatternsVisualization from "@/components/analytics/TemporalPatternsVisualization";
import { 
  fetchAnalyticsDashboard,
  fetchEngagementMetrics,
  fetchHeatmapData,
  fetchTemporalAnalysis,
  refreshCurrentAnalytics
} from "@/lib/api/analytics";
import { 
  AnalyticsDashboard, 
  EngagementTrendData, 
  HeatmapData,
  TemporalAnalysis
} from "@/types/analytics";
import { toast } from "@/components/ui/toaster";

const TIMEFRAME_OPTIONS = [
    { value: 'monthly', label: 'Mensile', days: 30 },
    { value: 'quarterly', label: 'Trimestrale', days: 90 },
    { value: 'weekly', label: 'Settimanale', days: 7 },
  ];

export default function AnalyticsPage() {
  // Stati principali
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementTrendData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [temporalData, setTemporalData] = useState<TemporalAnalysis | null>(null);
  
  // Stati UI
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Timeframe globale
  const [globalTimeframe, setGlobalTimeframe] = useState('monthly');
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'behavior' | 'temporal'>('overview');

  const currentTimeframe = TIMEFRAME_OPTIONS.find(opt => opt.value === globalTimeframe);

  // Carica tutti i dati
  useEffect(() => {
    loadAllData();
  }, [globalTimeframe]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const timeframe = TIMEFRAME_OPTIONS.find(opt => opt.value === globalTimeframe);
      
      const [dashboardData, engagementDataRes, heatmapDataRes, temporalDataRes] = await Promise.allSettled([
        fetchAnalyticsDashboard(),
        fetchEngagementMetrics(globalTimeframe, timeframe?.days || 30),
        fetchHeatmapData(globalTimeframe),
        fetchTemporalAnalysis(globalTimeframe, Math.ceil((timeframe?.days || 30) / 7))
      ]);

      if (dashboardData.status === 'fulfilled') setDashboard(dashboardData.value);
      if (engagementDataRes.status === 'fulfilled') setEngagementData(engagementDataRes.value);
      if (heatmapDataRes.status === 'fulfilled') setHeatmapData(heatmapDataRes.value);
      if (temporalDataRes.status === 'fulfilled') setTemporalData(temporalDataRes.value);

    } catch (error) {
      console.error("Errore caricamento analytics:", error);
      toast("error", "Errore", "Impossibile caricare i dati analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshCurrentAnalytics();
      await loadAllData();
      toast("success", "Aggiornato", "Dati analytics aggiornati");
    } catch (error) {
      console.error("Errore aggiornamento:", error);
      toast("error", "Errore", "Impossibile aggiornare i dati");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !dashboard) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Intestazione */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <BarChart3 className="w-8 h-8 text-orange-500 mr-3" />
              Analytics
            </h1>
            <p className="text-zinc-400 mt-1">
              Insight comportamentali e metriche di performance
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Selettore Timeframe Globale */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <select
                value={globalTimeframe}
                onChange={(e) => setGlobalTimeframe(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {TIMEFRAME_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
        </div>

        {/* Tab di Navigazione */}
        <div className="border-b border-zinc-800">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Panoramica', icon: Activity },
              { id: 'engagement', label: 'Coinvolgimento', icon: TrendingUp },
              { id: 'behavior', label: 'Comportamento', icon: MousePointer },
              { id: 'temporal', label: 'Pattern Temporali', icon: Clock }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenuto */}
        <div className="animate-fade-in">
          {activeTab === 'overview' && dashboard && (
            <AnalyticsDashboardComponent 
              dashboard={dashboard}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'engagement' && (
            <EngagementMetrics
              data={engagementData}
              isLoading={isLoading}
              timeframe={globalTimeframe}
            />
          )}

          {activeTab === 'behavior' && heatmapData && (
            <HeatmapVisualization
              data={heatmapData}
              isLoading={isLoading}
              timeframe={globalTimeframe}
            />
          )}

          {activeTab === 'temporal' && (
            <TemporalPatternsVisualization
              data={temporalData}
              isLoading={isLoading}
              timeframe={globalTimeframe}
            />
          )}
        </div>

        {/* Footer */}
        {dashboard && (
          <div className="text-center text-sm text-zinc-500 border-t border-zinc-800 pt-4">
            Ultimo aggiornamento: {new Date(dashboard.lastUpdated).toLocaleString('it-IT')} • 
            Confidenza: {dashboard.summary.confidence}% • 
            Campione: {dashboard.summary.sampleSize.toLocaleString()} sessioni
          </div>
        )}
      </div>
    </div>
  );
}