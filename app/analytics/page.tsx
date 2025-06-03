// app/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  RefreshCw, 
  Filter, 
  Calendar,
  Download,
  Zap,
  Activity,
  MousePointer,
  Clock,
  TrendingUp
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AnalyticsDashboardComponent from "@/components/analytics/AnalyticsDashboard";
import EngagementMetrics from "@/components/analytics/EngagementMetrics";
import HeatmapVisualization from "@/components/analytics/HeatmapVisualization";
import { 
  fetchAnalyticsDashboard,
  fetchEngagementMetrics,
  fetchHeatmapData,
  fetchTemporalAnalysis,
  generateAnalytics,
  refreshTodayAnalytics,
  formatAnalyticsDate,
  generatePeriodKey
} from "@/lib/api/analytics";
import { 
  AnalyticsDashboard, 
  EngagementTrendData, 
  HeatmapData,
  TemporalAnalysis,
  GenerateAnalyticsRequest
} from "@/types/analytics";
import { toast } from "@/components/ui/toaster";

export default function AnalyticsPage() {
  // Stati principali
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementTrendData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [temporalData, setTemporalData] = useState<TemporalAnalysis | null>(null);
  
  // Stati UI
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingEngagement, setIsLoadingEngagement] = useState(false);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
  const [isLoadingTemporal, setIsLoadingTemporal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filtri e configurazioni
  const [activeTab, setActiveTab] = useState<'dashboard' | 'engagement' | 'heatmap' | 'temporal'>('dashboard');
  const [engagementPeriod, setEngagementPeriod] = useState({ period: 'daily', days: 7 });
  const [heatmapPeriod, setHeatmapPeriod] = useState('daily');
  const [temporalPeriod, setTemporalPeriod] = useState({ period: 'weekly', weeks: 4 });

  // Carica la dashboard all'avvio
  useEffect(() => {
    loadDashboard();
  }, []);

  // Carica i dati del tab attivo
  useEffect(() => {
    switch (activeTab) {
      case 'engagement':
        if (!engagementData) loadEngagementData();
        break;
      case 'heatmap':
        if (!heatmapData) loadHeatmapData();
        break;
      case 'temporal':
        if (!temporalData) loadTemporalData();
        break;
    }
  }, [activeTab]);

  // Carica la dashboard
  const loadDashboard = async () => {
    try {
      setIsLoadingDashboard(true);
      console.log('Caricamento dashboard analytics...');
      
      const data = await fetchAnalyticsDashboard();
      setDashboard(data);
      
      console.log('Dashboard caricata:', {
        periodKey: data.currentPeriod?.periodKey,
        score: data.summary?.overallScore
      });
    } catch (error) {
      console.error("Errore durante il caricamento della dashboard:", error);
      toast("error", "Errore", "Impossibile caricare la dashboard analytics");
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Carica i dati engagement
  const loadEngagementData = async (period?: string, days?: number) => {
    try {
      setIsLoadingEngagement(true);
      
      const periodToUse = period || engagementPeriod.period;
      const daysToUse = days || engagementPeriod.days;
      
      console.log(`Caricamento engagement per ${daysToUse} giorni, periodo: ${periodToUse}`);
      
      const data = await fetchEngagementMetrics(periodToUse, daysToUse);
      setEngagementData(data);
      
      // Aggiorna stato periodo se è cambiato
      if (period && days) {
        setEngagementPeriod({ period, days });
      }
    } catch (error) {
      console.error("Errore durante il caricamento engagement:", error);
      toast("error", "Errore", "Impossibile caricare i dati di engagement");
    } finally {
      setIsLoadingEngagement(false);
    }
  };

  // Carica i dati heatmap
  const loadHeatmapData = async (period?: string, date?: string) => {
    try {
      setIsLoadingHeatmap(true);
      
      const periodToUse = period || heatmapPeriod;
      
      console.log(`Caricamento heatmap per periodo: ${periodToUse}`, date ? `data: ${date}` : '');
      
      const data = await fetchHeatmapData(periodToUse, date);
      setHeatmapData(data);
      
      if (period) {
        setHeatmapPeriod(period);
      }
    } catch (error) {
      console.error("Errore durante il caricamento heatmap:", error);
      toast("error", "Errore", "Impossibile caricare i dati heatmap");
    } finally {
      setIsLoadingHeatmap(false);
    }
  };

  // Carica i dati temporali
  const loadTemporalData = async (period?: string, weeks?: number) => {
    try {
      setIsLoadingTemporal(true);
      
      const periodToUse = period || temporalPeriod.period;
      const weeksToUse = weeks || temporalPeriod.weeks;
      
      console.log(`Caricamento analisi temporale per ${weeksToUse} settimane, periodo: ${periodToUse}`);
      
      const data = await fetchTemporalAnalysis(periodToUse, weeksToUse);
      setTemporalData(data);
      
      if (period && weeks) {
        setTemporalPeriod({ period, weeks });
      }
    } catch (error) {
      console.error("Errore durante il caricamento analisi temporale:", error);
      toast("error", "Errore", "Impossibile caricare l'analisi temporale");
    } finally {
      setIsLoadingTemporal(false);
    }
  };

  // Genera nuove analytics
  const handleGenerateAnalytics = async () => {
    try {
      setIsGenerating(true);
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const request: GenerateAnalyticsRequest = {
        startDate: formatAnalyticsDate(yesterday),
        endDate: formatAnalyticsDate(today),
        period: 'daily',
        force: true
      };
      
      console.log('Generazione analytics:', request);
      
      const result = await generateAnalytics(request);
      
      toast("success", "Successo", result.message);
      
      // Ricarica la dashboard
      await loadDashboard();
      
      // Ricarica il tab attivo
      switch (activeTab) {
        case 'engagement':
          await loadEngagementData();
          break;
        case 'heatmap':
          await loadHeatmapData();
          break;
        case 'temporal':
          await loadTemporalData();
          break;
      }
      
    } catch (error) {
      console.error("Errore durante la generazione analytics:", error);
      toast("error", "Errore", "Impossibile generare le analytics");
    } finally {
      setIsGenerating(false);
    }
  };

  // Refresh dati di oggi
  const handleRefreshToday = async () => {
    try {
      setIsGenerating(true);
      
      console.log('Refresh analytics di oggi...');
      
      await refreshTodayAnalytics();
      
      toast("success", "Aggiornato", "Analytics di oggi aggiornate");
      
      // Ricarica tutti i dati
      await loadDashboard();
      
      if (activeTab === 'engagement') await loadEngagementData();
      if (activeTab === 'heatmap') await loadHeatmapData();
      if (activeTab === 'temporal') await loadTemporalData();
      
    } catch (error) {
      console.error("Errore durante il refresh:", error);
      toast("error", "Errore", "Impossibile aggiornare le analytics");
    } finally {
      setIsGenerating(false);
    }
  };

  // Export dei dati (placeholder)
  const handleExportData = () => {
    toast("info", "Export", "Funzionalità di export in arrivo");
  };

  // Gestione cambio tab
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
  };

  if (isLoadingDashboard && !dashboard) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <BarChart3 className="w-8 h-8 text-primary mr-3" />
            Analytics Avanzate
          </h1>
          <p className="text-zinc-400 mt-1">
            Analisi comportamentale e insights predittivi
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Export Button */}
          <button 
            onClick={handleExportData}
            className="btn btn-outline p-2"
            title="Esporta dati"
          >
            <Download size={16} />
          </button>
          
          {/* Generate Analytics Button */}
          <button 
            onClick={handleGenerateAnalytics}
            className="btn btn-outline p-2"
            disabled={isGenerating}
            title="Genera nuove analytics"
          >
            <Zap size={16} className={isGenerating ? "animate-spin" : ""} />
          </button>
          
          {/* Refresh Today Button */}
          <button 
            onClick={handleRefreshToday}
            className="btn btn-outline p-2"
            disabled={isGenerating}
            title="Aggiorna oggi"
          >
            <RefreshCw size={16} className={isGenerating ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'dashboard'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <Activity size={16} className="mr-2" />
            Dashboard
          </button>
          
          <button
            onClick={() => handleTabChange('engagement')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'engagement'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <TrendingUp size={16} className="mr-2" />
            Engagement
          </button>
          
          <button
            onClick={() => handleTabChange('heatmap')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'heatmap'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <MousePointer size={16} className="mr-2" />
            Heatmap
          </button>
          
          <button
            onClick={() => handleTabChange('temporal')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'temporal'
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <Clock size={16} className="mr-2" />
            Pattern Temporali
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'dashboard' && (
          <AnalyticsDashboardComponent 
            dashboard={dashboard!}
            isLoading={isLoadingDashboard}
          />
        )}

        {activeTab === 'engagement' && (
          <EngagementMetrics
            data={engagementData!}
            isLoading={isLoadingEngagement}
            onPeriodChange={loadEngagementData}
          />
        )}

        {activeTab === 'heatmap' && (
          <HeatmapVisualization
            data={heatmapData!}
            isLoading={isLoadingHeatmap}
            onPeriodChange={loadHeatmapData}
          />
        )}

        {activeTab === 'temporal' && temporalData && (
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Clock className="w-5 h-5 text-primary mr-2" />
              Analisi Pattern Temporali
            </h3>
            
            {/* Temporal Analysis Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-900/50 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-1">Peak Hour</div>
                <div className="text-2xl font-bold text-white">
                  {temporalData.insights.peakHour.time}
                </div>
                <div className="text-xs text-zinc-500">
                  {temporalData.insights.peakHour.visits} visite
                </div>
              </div>
              
              <div className="bg-zinc-900/50 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-1">Peak Day</div>
                <div className="text-2xl font-bold text-white">
                  {temporalData.insights.peakDay.day}
                </div>
                <div className="text-xs text-zinc-500">
                  {temporalData.insights.peakDay.visits} visite medie
                </div>
              </div>
              
              <div className="bg-zinc-900/50 rounded-lg p-4">
                <div className="text-sm text-zinc-400 mb-1">Record Analizzati</div>
                <div className="text-2xl font-bold text-white">
                  {temporalData.recordsAnalyzed}
                </div>
                <div className="text-xs text-zinc-500">
                  {temporalData.weeks} settimane
                </div>
              </div>
            </div>

            {/* Temporal Insights */}
            {temporalData.insights.patterns && temporalData.insights.patterns.length > 0 && (
              <div>
                <h4 className="text-base font-medium mb-4">Insights Temporali</h4>
                <div className="space-y-3">
                  {temporalData.insights.patterns.map((pattern, index) => (
                    <div key={index} className="p-3 bg-zinc-900/50 rounded-lg">
                      <div className="font-medium text-sm capitalize mb-1">
                        {pattern.type}
                      </div>
                      <p className="text-sm text-zinc-300 mb-2">
                        {pattern.message}
                      </p>
                      <p className="text-xs text-zinc-400 italic">
                        💡 {pattern.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 text-center text-xs text-zinc-500">
              Analisi dal {new Date(temporalData.dateRange.from).toLocaleDateString('it-IT')} al {new Date(temporalData.dateRange.to).toLocaleDateString('it-IT')}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {dashboard && (
        <div className="text-center text-sm text-zinc-500">
          Ultimo aggiornamento: {new Date(dashboard.lastUpdated).toLocaleString('it-IT')} • 
          Confidence: {dashboard.summary.confidence}% • 
          Sample: {dashboard.summary.sampleSize.toLocaleString()} sessioni
        </div>
      )}
    </div>
  );
}