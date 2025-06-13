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
  AlertTriangle
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
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'insights'>('overview');
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

  // Carica i dati reali quando cambia il timeRange
  useEffect(() => {
    loadRealAnalyticsData();
  }, [timeRange]);

  const loadRealAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[AI Analytics] Caricamento dati reali...');
      
      // 1. Carica dati statistici degli ultimi 6 mesi per l'analisi mensile
      const monthlyStatsResponse = await axios.get(`${API_BASE_URL}/api/tracciamento/statistics`, {
        params: { timeRange: 'all' }, // Prendi tutti i dati disponibili
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

      // 4. Chiama l'analisi AI con i dati reali
      console.log('[AI Analytics] Avvio analisi AI...');
      
      const aiAnalysisResponse = await axios.post(`${API_BASE_URL}/api/ai/analyze-performance`, {
        monthlyData: processedData.monthlyData,
        weeklyComparisons: processedData.weeklyComparisons,
        timeRange,
        additionalContext: {
          totalLandingPages: landingPagesResponse.data?.length || 0,
          dataSource: 'real_analytics'
        }
      }, {
        withCredentials: true,
        timeout: 30000 // 30 secondi per l'AI
      });

      console.log('[AI Analytics] Analisi AI completata');
      setAiAnalysis(aiAnalysisResponse.data);

    } catch (error) {
      console.error('[AI Analytics] Errore nel caricamento:', error);
      
      let errorMessage = 'Errore nel caricamento dei dati analytics';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Timeout durante il caricamento dei dati';
        } else if (error.response?.status === 404) {
          errorMessage = 'Endpoint analytics non disponibile';
        } else if (error.response?.status === 500) {
          errorMessage = 'Errore del server durante l\'analisi';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            <p className="text-xs text-red-600">Errore nel caricamento dei dati</p>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-red-700 text-xs mb-2">{error}</p>
          <button
            onClick={loadRealAnalyticsData}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </motion.div>
    );
  }

  // Stato di caricamento
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
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" />
            <span className="text-xs font-medium text-purple-600">Analizzando...</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-50 rounded-xl animate-pulse" />
          ))}
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
            onClick={loadRealAnalyticsData}
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
                Analisi di {monthlyData.length} periodi • Dati reali
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Score Badge */}
            <div className={`px-2 py-1 rounded-full ${getScoreBackground(aiAnalysis.overallScore)} flex items-center gap-1`}>
              <Target className={`w-3 h-3 ${getScoreColor(aiAnalysis.overallScore)}`} />
              <span className={`text-xs font-semibold ${getScoreColor(aiAnalysis.overallScore)}`}>
                {aiAnalysis.overallScore}/100
              </span>
            </div>
            
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
                <h3 className="text-base font-semibold text-zinc-900 mb-2">Verdetto AI</h3>
                <p className="text-zinc-700 text-sm leading-relaxed">{aiAnalysis.verdict}</p>
              </div>

              {/* Tabs - Mobile Optimized */}
              <div className="flex gap-0.5 mb-4 bg-zinc-100 rounded-xl p-0.5">
                {[
                  { id: 'overview', label: 'Panoramica', icon: BarChart3 },
                  { id: 'trends', label: 'Tendenze', icon: TrendingUp },
                  { id: 'insights', label: 'Insights', icon: Sparkles }
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
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Key Metrics Grid - Mobile Optimized */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-emerald-600 mb-0.5">
                          {aiAnalysis.keyMetrics.bestMonth}
                        </div>
                        <div className="text-xs text-zinc-600">Mese migliore</div>
                      </div>
                      
                      <div className="bg-zinc-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-blue-600 mb-0.5">
                          {aiAnalysis.keyMetrics.averageGrowth > 0 ? '+' : ''}{aiAnalysis.keyMetrics.averageGrowth.toFixed(1)}%
                        </div>
                        <div className="text-xs text-zinc-600">Crescita media</div>
                      </div>
                      
                      <div className="bg-zinc-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-purple-600 mb-0.5">
                          {aiAnalysis.keyMetrics.consistencyScore}%
                        </div>
                        <div className="text-xs text-zinc-600">Consistenza</div>
                      </div>
                      
                      <div className="bg-zinc-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-orange-600 mb-0.5">
                          {aiAnalysis.predictions.confidence}%
                        </div>
                        <div className="text-xs text-zinc-600">Affidabilità</div>
                      </div>
                    </div>

                    {/* Monthly Chart - Mobile Optimized */}
                    <div className="bg-zinc-50 rounded-xl p-3">
                      <h4 className="text-base font-semibold text-zinc-900 mb-3">Andamento nel Tempo</h4>
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
                  </motion.div>
                )}

                {activeTab === 'trends' && (
                  <motion.div
                    key="trends"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Period Comparisons - Mobile Optimized */}
                    <div className="bg-zinc-50 rounded-xl p-3">
                      <h4 className="text-base font-semibold text-zinc-900 mb-3">Confronto Periodi</h4>
                      <div className="space-y-2">
                        {weeklyComparisons.map((period, index) => (
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

                    {/* Predictions - Mobile Optimized */}
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
                    </div>
                  </motion.div>
                )}

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
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIAnalytics;