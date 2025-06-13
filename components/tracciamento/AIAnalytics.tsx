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

        return {
          month: displayMonth,
          monthKey: dateKey,
          visits: stat.totalVisits || stat.visits || 0,
          uniqueVisitors: stat.uniqueVisitors || Math.floor((stat.totalVisits || 0) * 0.7),
          conversions: stat.conversions?.total || stat.conversions || 0,
          conversionRate: stat.conversionRate || (stat.conversions?.total && stat.uniqueVisitors ? 
            (stat.conversions.total / stat.uniqueVisitors) * 100 : 0),
          avgTimeOnSite: stat.avgTimeOnSite || 0,
          bounceRate: stat.bounceRate || 0
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
        return <ArrowUp className="w-4 h-4 text-emerald-500" />;
      case 'negative':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Minus className="w-4 h-4 text-zinc-400" />;
    }
  };

  // Stato di errore
  if (error) {
    return (
      <motion.div 
        className="bg-white rounded-3xl p-8 mb-6 border border-red-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">AI Analytics</h2>
            <p className="text-sm text-red-600">Errore nel caricamento dei dati</p>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-2xl p-4">
          <p className="text-red-700 text-sm mb-3">{error}</p>
          <button
            onClick={loadRealAnalyticsData}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
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
        className="bg-white rounded-3xl p-8 mb-6 border border-zinc-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">AI Analytics</h2>
              <p className="text-sm text-zinc-500">Analisi intelligente delle performance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
            <span className="text-sm font-medium text-purple-600">Analizzando dati reali...</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  // Nessun dato disponibile
  if (!aiAnalysis || monthlyData.length === 0) {
    return (
      <motion.div 
        className="bg-white rounded-3xl p-8 mb-6 border border-zinc-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">AI Analytics</h2>
            <p className="text-sm text-zinc-500">Nessun dato disponibile per l'analisi</p>
          </div>
        </div>
        
        <div className="bg-zinc-50 rounded-2xl p-6 text-center">
          <p className="text-zinc-600 mb-4">
            Non ci sono dati sufficienti per generare un'analisi AI. 
            Assicurati che il sistema di tracciamento sia attivo.
          </p>
          <button
            onClick={loadRealAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Ricarica Dati
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-3xl border border-zinc-100 mb-6 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">AI Analytics</h2>
              <p className="text-sm text-zinc-500">
                Analisi di {monthlyData.length} periodi • Dati reali
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Score Badge */}
            <div className={`px-4 py-2 rounded-full ${getScoreBackground(aiAnalysis.overallScore)} flex items-center gap-2`}>
              <Target className={`w-4 h-4 ${getScoreColor(aiAnalysis.overallScore)}`} />
              <span className={`font-semibold ${getScoreColor(aiAnalysis.overallScore)}`}>
                {aiAnalysis.overallScore}/100
              </span>
            </div>
            
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-5 h-5 text-zinc-400" />
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
            <div className="px-6 pb-6">
              <div className="bg-zinc-50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">Verdetto AI</h3>
                <p className="text-zinc-700 leading-relaxed">{aiAnalysis.verdict}</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-zinc-100 rounded-2xl p-1">
                {[
                  { id: 'overview', label: 'Panoramica', icon: BarChart3 },
                  { id: 'trends', label: 'Tendenze', icon: TrendingUp },
                  { id: 'insights', label: 'Insights', icon: Sparkles }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
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
                    className="space-y-6"
                  >
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-zinc-50 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600 mb-1">
                          {aiAnalysis.keyMetrics.bestMonth}
                        </div>
                        <div className="text-sm text-zinc-600">Mese migliore</div>
                      </div>
                      
                      <div className="bg-zinc-50 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {aiAnalysis.keyMetrics.averageGrowth > 0 ? '+' : ''}{aiAnalysis.keyMetrics.averageGrowth.toFixed(1)}%
                        </div>
                        <div className="text-sm text-zinc-600">Crescita media</div>
                      </div>
                      
                      <div className="bg-zinc-50 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {aiAnalysis.keyMetrics.consistencyScore}%
                        </div>
                        <div className="text-sm text-zinc-600">Consistenza</div>
                      </div>
                      
                      <div className="bg-zinc-50 rounded-2xl p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                          {aiAnalysis.predictions.confidence}%
                        </div>
                        <div className="text-sm text-zinc-600">Affidabilità</div>
                      </div>
                    </div>

                    {/* Monthly Chart */}
                    <div className="bg-zinc-50 rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-zinc-900 mb-4">Andamento nel Tempo</h4>
                      <div className="h-64">
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
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
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
                    className="space-y-6"
                  >
                    {/* Period Comparisons */}
                    <div className="bg-zinc-50 rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-zinc-900 mb-4">Confronto Periodi</h4>
                      <div className="space-y-4">
                        {weeklyComparisons.map((period, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl">
                            <div>
                              <div className="font-medium text-zinc-900">{period.weekRange}</div>
                              <div className="text-sm text-zinc-500">
                                {period.currentWeek.toLocaleString()} visite
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center gap-1 ${period.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {period.change >= 0 ? (
                                  <ArrowUp className="w-4 h-4" />
                                ) : (
                                  <ArrowDown className="w-4 h-4" />
                                )}
                                <span className="font-medium">
                                  {Math.abs(period.changePercent).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Predictions */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-zinc-900 mb-4">Previsioni AI</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-1">
                            {aiAnalysis.predictions.nextMonthVisits.toLocaleString()}
                          </div>
                          <div className="text-sm text-zinc-600">Visite previste</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-emerald-600 mb-1">
                            {aiAnalysis.predictions.nextMonthConversions.toLocaleString()}
                          </div>
                          <div className="text-sm text-zinc-600">Conversioni previste</div>
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
                    className="space-y-4"
                  >
                    {aiAnalysis.insights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-zinc-50 rounded-2xl p-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {getTrendIcon(insight.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-semibold text-zinc-900">{insight.title}</h5>
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                                insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {insight.impact === 'high' ? 'Alto impatto' :
                                 insight.impact === 'medium' ? 'Medio impatto' :
                                 'Basso impatto'}
                              </span>
                            </div>
                            <p className="text-zinc-700 text-sm mb-3">{insight.description}</p>
                            {insight.recommendation && (
                              <div className="bg-white rounded-xl p-3">
                                <p className="text-sm text-zinc-600">
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