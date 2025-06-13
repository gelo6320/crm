// components/tracciamento/AIAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Calendar, 
  BarChart3, 
  Target,
  ChevronRight,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';

// Interfaces
interface MonthlyData {
  month: string;
  monthKey: string;
  visits: number;
  uniqueVisitors: number;
  conversions: number;
  conversionRate: number;
  avgTimeOnSite: number;
  bounceRate: number;
}

interface WeeklyComparison {
  weekRange: string;
  currentWeek: number;
  previousWeek: number;
  change: number;
  changePercent: number;
}

interface AIInsight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
}

interface AIAnalysisResult {
  overallScore: number;
  verdict: string;
  monthlyTrend: 'growing' | 'declining' | 'stable';
  weeklyTrend: 'improving' | 'deteriorating' | 'steady';
  insights: AIInsight[];
  keyMetrics: {
    bestMonth: string;
    worstMonth: string;
    averageGrowth: number;
    consistencyScore: number;
  };
  predictions: {
    nextMonthVisits: number;
    nextMonthConversions: number;
    confidence: number;
  };
  _meta?: {
    source: string;
    model?: string;
    timestamp: string;
    dataPoints?: number;
    reason?: string;
    fallbackUsed?: boolean;
  };
}

// ✅ Interface per il caching
interface CachedAnalysis {
  data: AIAnalysisResult;
  monthlyData: MonthlyData[];
  weeklyComparisons: WeeklyComparison[];
  timestamp: number;
  timeRange: string;
}

interface AIAnalyticsProps {
  timeRange: string;
}

const AIAnalytics: React.FC<AIAnalyticsProps> = ({ timeRange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [weeklyComparisons, setWeeklyComparisons] = useState<WeeklyComparison[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  // ✅ Cambiato: insights prima, poi analisi (che raggruppa overview + trends)
  const [activeTab, setActiveTab] = useState<'insights' | 'analysis'>('insights');
  const [error, setError] = useState<string | null>(null);
  // ✅ Stato per il caching
  const [cachedData, setCachedData] = useState<CachedAnalysis | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";
  
  // ✅ Costanti per il caching
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore in millisecondi
  const CACHE_KEY = 'ai_analytics_cache';

  // ✅ Funzioni per il caching (in memoria per l'artifact, localStorage per il progetto reale)
  const saveToCache = (data: CachedAnalysis) => {
    setCachedData(data);
    // Per il progetto reale, decommentare questa riga:
    // localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  };

  const loadFromCache = (): CachedAnalysis | null => {
    // In memoria per l'artifact
    if (cachedData && cachedData.timeRange === timeRange) {
      const now = Date.now();
      if (now - cachedData.timestamp < CACHE_DURATION) {
        return cachedData;
      }
    }
    
    // Per il progetto reale, decommentare questo blocco:
    /*
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CachedAnalysis = JSON.parse(cached);
        const now = Date.now();
        if (now - data.timestamp < CACHE_DURATION && data.timeRange === timeRange) {
          return data;
        }
      }
    } catch (error) {
      console.warn('[AI Analytics] Errore nel caricamento cache:', error);
    }
    */
    
    return null;
  };

  const clearCache = () => {
    setCachedData(null);
    // Per il progetto reale, decommentare questa riga:
    // localStorage.removeItem(CACHE_KEY);
  };

  // Carica i dati reali quando cambia il timeRange
  useEffect(() => {
    loadRealAnalyticsData(false);
  }, [timeRange]);

  const loadRealAnalyticsData = async (forceReload = false) => {
    setIsLoading(true);
    setError(null);
    
    // ✅ Controlla cache se non è un reload forzato
    if (!forceReload) {
      const cached = loadFromCache();
      if (cached) {
        console.log('[AI Analytics] Caricamento da cache');
        setMonthlyData(cached.monthlyData);
        setWeeklyComparisons(cached.weeklyComparisons);
        setAiAnalysis(cached.data);
        setIsLoading(false);
        return;
      }
    }
    
    try {
      console.log('[AI Analytics] Caricamento dati reali con Claude 4...');
      
      // 1. Carica dati statistici degli ultimi 6 mesi per l'analisi mensile
      const monthlyStatsResponse = await axios.get(`${API_BASE_URL}/api/tracciamento/statistics`, {
        params: { timeRange: 'all' },
        withCredentials: true,
        timeout: 15000
      });
  
      console.log('[AI Analytics] Dati statistici ricevuti:', monthlyStatsResponse.data?.length || 0);
  
      // 2. Carica landing pages per dati aggiuntivi
      const landingPagesResponse = await axios.get(`${API_BASE_URL}/api/tracciamento/landing-pages-stats`, {
        params: { timeRange: '30d' },
        withCredentials: true,
        timeout: 15000
      });
  
      console.log('[AI Analytics] Landing pages ricevute:', landingPagesResponse.data?.length || 0);
  
      // 3. Processa i dati reali
      const processedData = processRealData(monthlyStatsResponse.data, landingPagesResponse.data);
      
      if (processedData.monthlyData.length === 0) {
        throw new Error('Nessun dato disponibile per l\'analisi');
      }
  
      setMonthlyData(processedData.monthlyData);
      setWeeklyComparisons(processedData.weeklyComparisons);
  
      // 4. ✅ Chiama l'analisi AI Claude 4 con dati migliorati
      console.log('[AI Analytics] Avvio analisi Claude 4...');
      
      const aiAnalysisResponse = await axios.post(`${API_BASE_URL}/api/ai/analyze-performance`, {
        monthlyData: processedData.monthlyData,
        weeklyComparisons: processedData.weeklyComparisons,
        timeRange,
        additionalContext: {
          totalLandingPages: landingPagesResponse.data?.length || 0,
          dataSource: 'real_analytics',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          analysisType: 'comprehensive',
          expectedInsights: 4,
          preferredModel: 'claude-4'
        }
      }, {
        withCredentials: true,
        timeout: 60000 // ✅ 60 secondi per Claude 4
      });
  
      console.log('[AI Analytics] Analisi Claude 4 completata');
      
      // ✅ Valida la risposta prima di impostare lo stato
      const analysisResult = validateAndSanitizeAnalysis(aiAnalysisResponse.data);
      setAiAnalysis(analysisResult);
      
      // ✅ Salva nel cache
      const cacheData: CachedAnalysis = {
        data: analysisResult,
        monthlyData: processedData.monthlyData,
        weeklyComparisons: processedData.weeklyComparisons,
        timestamp: Date.now(),
        timeRange
      };
      saveToCache(cacheData);
  
    } catch (error) {
      console.error('[AI Analytics] Errore nel caricamento:', error);
      
      let errorMessage = 'Errore nel caricamento dei dati analytics';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Timeout durante l\'analisi AI (60s scaduti)';
        } else if (error.response?.status === 404) {
          errorMessage = 'Endpoint AI non disponibile';
        } else if (error.response?.status === 500) {
          errorMessage = 'Errore del server durante l\'analisi AI';
        } else if (error.response?.status === 429) {
          errorMessage = 'Limite di utilizzo API Claude raggiunto';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsReanalyzing(false);
    }
  };

  // ✅ Funzione per ri-analizzare
  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    clearCache();
    await loadRealAnalyticsData(true);
  };

  const validateAndSanitizeAnalysis = (data: any): AIAnalysisResult => {
    // Validazione base
    if (!data || typeof data !== 'object') {
      throw new Error('Risposta AI non valida');
    }
  
    // Assicura campi obbligatori
    const sanitized: AIAnalysisResult = {
      overallScore: Math.max(0, Math.min(100, parseInt(data.overallScore) || 0)),
      verdict: data.verdict || 'Analisi non disponibile',
      monthlyTrend: ['growing', 'declining', 'stable'].includes(data.monthlyTrend) 
        ? data.monthlyTrend : 'stable',
      weeklyTrend: ['improving', 'deteriorating', 'steady'].includes(data.weeklyTrend) 
        ? data.weeklyTrend : 'steady',
      insights: Array.isArray(data.insights) && data.insights.length > 0 
        ? data.insights : [{
            type: 'neutral' as const,
            title: 'Analisi in corso',
            description: 'I dati stanno ancora venendo processati.',
            impact: 'low' as const,
            recommendation: 'Riprovare tra qualche minuto.'
          }],
      keyMetrics: {
        bestMonth: data.keyMetrics?.bestMonth || 'N/A',
        worstMonth: data.keyMetrics?.worstMonth || 'N/A',
        averageGrowth: parseFloat(data.keyMetrics?.averageGrowth) || 0,
        consistencyScore: Math.max(0, Math.min(100, parseInt(data.keyMetrics?.consistencyScore) || 0))
      },
      predictions: {
        nextMonthVisits: Math.max(0, parseInt(data.predictions?.nextMonthVisits) || 0),
        nextMonthConversions: Math.max(0, parseInt(data.predictions?.nextMonthConversions) || 0),
        confidence: Math.max(0, Math.min(100, parseInt(data.predictions?.confidence) || 0))
      },
      _meta: data._meta || {
        source: 'unknown',
        timestamp: new Date().toISOString()
      }
    };
  
    return sanitized;
  };  

  // Processa i dati reali dall'API
  const processRealData = (statsData: any[], landingPagesData: any[]) => {
    console.log('[AI Analytics] Processamento dati reali...');
    
    // Validazione di sicurezza
    if (!statsData || !Array.isArray(statsData)) {
      console.warn('[AI Analytics] statsData non è un array valido:', statsData);
      return { monthlyData: [], weeklyComparisons: [] };
    }
    
    let monthlyData: MonthlyData[] = [];
    let weeklyComparisons: WeeklyComparison[] = [];

    // Processa dati statistici
    if (statsData && statsData.length > 0) {
      monthlyData = statsData.map((stat, index) => {
        // Cerca di estrarre la data dal documento
        let dateKey = stat.monthKey || stat.weekKey || stat.date || stat._id;
        let displayMonth = '';
        
        if (stat.monthKey) {
          // Formato: "2024-06"
          const [year, month] = stat.monthKey.split('-');
          const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
          displayMonth = `${monthNames[parseInt(month) - 1]} ${year}`;
        } else if (stat.weekKey) {
          // Formato settimana
          displayMonth = `Settimana ${stat.weekKey}`;
        } else {
          // Fallback
          displayMonth = `Periodo ${index + 1}`;
        }

        // Gestisci conversioni che potrebbero essere oggetti o numeri
        let conversionsValue = 0;
        if (typeof stat.conversions === 'object' && stat.conversions !== null) {
          conversionsValue = stat.conversions.total || 0;
        } else {
          conversionsValue = stat.conversions || 0;
        }

        // Gestisci uniqueVisitors che potrebbero essere oggetti
        let uniqueVisitorsValue = 0;
        if (typeof stat.uniqueVisitors === 'object' && stat.uniqueVisitors !== null) {
          uniqueVisitorsValue = stat.uniqueVisitors.total || stat.uniqueVisitors.count || 0;
        } else {
          uniqueVisitorsValue = stat.uniqueVisitors || Math.floor((stat.totalVisits || 0) * 0.7);
        }

        return {
          month: displayMonth,
          monthKey: dateKey,
          visits: Number(stat.totalVisits || stat.visits || 0),
          uniqueVisitors: Number(uniqueVisitorsValue),
          conversions: Number(conversionsValue),
          conversionRate: Number(stat.conversionRate || (conversionsValue && uniqueVisitorsValue ? 
            (conversionsValue / uniqueVisitorsValue) * 100 : 0)),
          avgTimeOnSite: Number(stat.avgTimeOnSite || 0),
          bounceRate: Number(stat.bounceRate || 0)
        };
      }).filter(item => item.visits > 0); // Filtra periodi senza dati

      // Ordina per data (assumendo che monthKey sia ordinabile)
      monthlyData.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      
      // Prendi solo gli ultimi 6 periodi per l'analisi
      if (monthlyData.length > 6) {
        monthlyData = monthlyData.slice(-6);
      }
    }

    // Genera confronti settimanali dai dati mensili (se abbiamo abbastanza dati)
    if (monthlyData.length >= 2) {
      const recentMonths = monthlyData.slice(-4); // Ultimi 4 periodi
      
      weeklyComparisons = recentMonths.map((current, index) => {
        const previous = index > 0 ? recentMonths[index - 1] : current;
        const change = current.visits - previous.visits;
        const changePercent = previous.visits > 0 ? (change / previous.visits) * 100 : 0;

        return {
          weekRange: current.month,
          currentWeek: current.visits,
          previousWeek: previous.visits,
          change,
          changePercent
        };
      });
    }

    console.log('[AI Analytics] Dati processati:', {
      monthlyPeriods: monthlyData.length,
      weeklyComparisons: weeklyComparisons.length
    });

    return { monthlyData, weeklyComparisons };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  const getTrendIcon = (type: 'positive' | 'negative' | 'neutral' | 'warning') => {
    switch (type) {
      case 'positive':
        return <ArrowUp className="w-3 h-3 text-emerald-500" />;
      case 'negative':
        return <ArrowDown className="w-3 h-3 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      default:
        return <Minus className="w-3 h-3 text-zinc-400" />;
    }
  };

  // Stato di errore
  if (error) {
    return (
      <motion.div 
        className="bg-white rounded-2xl p-4 mb-4 border border-red-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-zinc-900">AI Analytics</h2>
              <p className="text-xs text-red-600">
                {error && error.includes('Claude') ? 'Errore API Claude 4' : 'Errore nel caricamento dei dati'}
              </p>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-red-700 text-xs mb-2">{error}</p>
          
          {/* ✅ Suggerimenti specifici per Claude 4 */}
          {error.includes('Limite') && (
            <p className="text-red-600 text-xs mb-2">
              💡 Il limite di utilizzo di Claude 4 è stato raggiunto. Riprova tra qualche minuto.
            </p>
          )}
          {error.includes('Timeout') && (
            <p className="text-red-600 text-xs mb-2">
              💡 L'analisi Claude 4 richiede più tempo del previsto. Riprova con meno dati.
            </p>
          )}
          
          <button
            onClick={() => loadRealAnalyticsData(true)}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
          >
            Riprova con Claude 4
          </button>
        </div>
      </motion.div>
    );
  }

  // ✅ Stato di caricamento - CENTRATO
  if (isLoading) {
    return (
      <motion.div 
        className="bg-white rounded-2xl p-4 mb-4 border border-zinc-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">AI Analytics</h2>
              <p className="text-xs text-zinc-500">Analisi intelligente</p>
            </div>
          </div>
        </div>
        
        {/* ✅ Loading centrato */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
            <span className="text-sm font-medium text-purple-600">
              {isReanalyzing ? 'Ri-analizzando...' : 'Analizzando con Claude 4...'}
            </span>
          </div>
          
          <div className="space-y-2 w-full max-w-md">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 bg-zinc-100 rounded-full animate-pulse" 
                   style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Nessun dato disponibile
  if (!aiAnalysis || monthlyData.length === 0) {
    return (
      <motion.div 
        className="bg-white rounded-2xl p-4 mb-4 border border-zinc-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center">
            <Brain className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">AI Analytics</h2>
            <p className="text-xs text-zinc-500">Nessun dato disponibile</p>
          </div>
        </div>
        
        <div className="bg-zinc-50 rounded-xl p-4 text-center">
          <p className="text-zinc-600 text-xs mb-3">
            Non ci sono dati sufficienti per generare un'analisi AI. 
            Assicurati che il sistema di tracciamento sia attivo.
          </p>
          <button
            onClick={() => loadRealAnalyticsData(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Ricarica Dati
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-2xl border border-zinc-100 mb-4 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-zinc-900">AI Analytics</h2>
              <p className="text-xs text-zinc-500 truncate">
                {/* ✅ Mostra informazioni Claude 4 + cache */}
                {aiAnalysis?._meta?.source === 'claude_4_analysis' 
                  ? `Claude 4 • ${monthlyData.length} periodi • ${aiAnalysis._meta.model || 'Sonnet-4'}`
                  : aiAnalysis?._meta?.fallbackUsed 
                    ? `Analisi automatica • ${monthlyData.length} periodi`
                    : `Analisi di ${monthlyData.length} periodi • Dati reali`
                }
                {cachedData && ' • Cache 24h'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* ✅ Pulsante ri-analizza piccolo e minimale */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReanalyze();
              }}
              disabled={isReanalyzing}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ri-analizza con Claude 4"
            >
              <RefreshCw className={`w-3 h-3 ${isReanalyzing ? 'animate-spin' : ''}`} />
            </button>

            {/* Score Badge */}
            <div className={`px-2 py-1 rounded-full ${getScoreBackground(aiAnalysis.overallScore)} flex items-center gap-1`}>
              {aiAnalysis?._meta?.source === 'claude_4_analysis' && (
                <Sparkles className="w-3 h-3 text-blue-500" />
              )}
              <Target className={`w-3 h-3 ${getScoreColor(aiAnalysis.overallScore)}`} />
              <span className={`text-xs font-semibold ${getScoreColor(aiAnalysis.overallScore)}`}>
                {aiAnalysis.overallScore}/100
              </span>
            </div>
            
            {/* ✅ Badge Confidence per Claude 4 */}
            {aiAnalysis?.predictions?.confidence && aiAnalysis.predictions.confidence > 0 && (
              <div className="px-2 py-1 rounded-full bg-purple-100 flex items-center gap-1">
                <span className="text-xs font-medium text-purple-700">
                  {aiAnalysis.predictions.confidence}% conf.
                </span>
              </div>
            )}
            
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Verdict Section */}
            <div className="px-4 pb-4">
            <div className="bg-zinc-50 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-zinc-900">
                  {aiAnalysis?._meta?.source === 'claude_4_analysis' ? 'Analisi Claude 4' : 'Verdetto AI'}
                </h3>
                {/* ✅ Timestamp e fonte */}
                {aiAnalysis?._meta?.timestamp && (
                  <span className="text-xs text-zinc-400">
                    {new Date(aiAnalysis._meta.timestamp).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
              
              <p className="text-zinc-700 text-sm leading-relaxed mb-2">
                {aiAnalysis.verdict}
              </p>
              
              {/* ✅ Informazioni aggiuntive Claude 4 */}
              {aiAnalysis?._meta && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  {aiAnalysis._meta.source === 'claude_4_analysis' && (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Powered by Claude 4
                    </span>
                  )}
                  {aiAnalysis._meta.fallbackUsed && (
                    <span className="flex items-center gap-1 text-yellow-600">
                      <AlertTriangle className="w-3 h-3" />
                      Analisi automatica
                    </span>
                  )}
                  {aiAnalysis._meta.dataPoints && (
                    <span>{aiAnalysis._meta.dataPoints} data points</span>
                  )}
                  {cachedData && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Target className="w-3 h-3" />
                      Cache attiva 24h
                    </span>
                  )}
                </div>
              )}
            </div>
            
              {/* ✅ Tabs modificati - Insights prima, poi Analisi */}
              <div className="flex gap-0.5 mb-4 bg-zinc-100 rounded-xl p-0.5">
                {[
                  { id: 'insights', label: 'Insights', icon: Sparkles },
                  { id: 'analysis', label: 'Analisi', icon: BarChart3 }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium transition-all text-xs ${
                      activeTab === tab.id
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <tab.icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {/* ✅ Insights per primi */}
                {activeTab === 'insights' && (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    {aiAnalysis.insights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-zinc-50 rounded-xl p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getTrendIcon(insight.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <h5 className="font-semibold text-zinc-900 text-sm leading-tight flex-1">{insight.title}</h5>
                              <span className={`px-1.5 py-0.5 rounded-md text-xs font-medium flex-shrink-0 ${
                                insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                                insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {insight.impact === 'high' ? 'Alto' :
                                 insight.impact === 'medium' ? 'Medio' :
                                 'Basso'}
                              </span>
                            </div>
                            <p className="text-zinc-700 text-xs mb-2 leading-relaxed">{insight.description}</p>
                            {insight.recommendation && (
                              <div className="bg-white rounded-lg p-2">
                                <p className="text-xs text-zinc-600">
                                  <span className="font-medium">Raccomandazione:</span> {insight.recommendation}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* ✅ Analisi (overview + trends semplificati) */}
                {activeTab === 'analysis' && (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* ✅ Solo grafico delle tendenze */}
                    <div className="bg-zinc-50 rounded-xl p-3">
                      <h4 className="text-base font-semibold text-zinc-900 mb-3">Tendenze nel Tempo</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlyData}>
                            <defs>
                              <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="conversionsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="month" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#6b7280' }}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#6b7280' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px'
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="visits"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              fill="url(#visitsGradient)"
                              name="Visite"
                            />
                            <Area
                              type="monotone"
                              dataKey="conversions"
                              stroke="#10b981"
                              strokeWidth={2}
                              fill="url(#conversionsGradient)"
                              name="Conversioni"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* ✅ Confronto periodi semplificato */}
                    <div className="bg-zinc-50 rounded-xl p-3">
                      <h4 className="text-base font-semibold text-zinc-900 mb-3">Confronto Periodi</h4>
                      <div className="space-y-2">
                        {weeklyComparisons.slice(-3).map((period, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-zinc-900 text-sm truncate">{period.weekRange}</div>
                              <div className="text-xs text-zinc-500">
                                {(period.currentWeek || 0).toLocaleString()} visite
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-1 ${period.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {period.change >= 0 ? (
                                  <ArrowUp className="w-3 h-3" />
                                ) : (
                                  <ArrowDown className="w-3 h-3" />
                                )}
                                <span className="font-medium text-xs">
                                  {Math.abs(period.changePercent).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ✅ Previsioni */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3">
                      <h4 className="text-base font-semibold text-zinc-900 mb-3">Previsioni AI</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600 mb-0.5">
                            {(aiAnalysis.predictions?.nextMonthVisits || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-zinc-600">Visite previste</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-emerald-600 mb-0.5">
                            {(aiAnalysis.predictions?.nextMonthConversions || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-zinc-600">Conversioni previste</div>
                        </div>
                      </div>
                      {aiAnalysis.predictions?.confidence && (
                        <div className="text-center mt-2">
                          <span className="text-xs text-zinc-500">
                            Affidabilità: {aiAnalysis.predictions.confidence}%
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIAnalytics;