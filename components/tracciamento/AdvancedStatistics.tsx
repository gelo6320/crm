// components/tracciamento/AdvancedStatistics.tsx
import React, { useState, useEffect } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Clock, 
  Users, 
  Smartphone, 
  RefreshCw,
  Monitor,
  MousePointer,
  Share2,
  ArrowRightLeft
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Base URL for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Interfaces for statistics data
interface ButtonClicks {
  total: number;
  byId?: Record<string, number>;
}

interface Conversions {
  total: number;
  byType?: Record<string, number>;
  bySource?: Record<string, number>;
}

interface DeviceStats {
  mobile: number;
  desktop: number;
}

interface TimeBySourceEntry {
  totalTime: number;
  pageViews: number;
  avgTime: number;
}

interface Funnel {
  entries: number;
  completions: number;
}

interface StatisticsData {
  _id: string;
  date: string;
  totalVisits: number;
  uniqueVisitors: number;
  consentedVisits: number;
  consentRate: number;
  pageViews: number;
  bounceRate: number;
  avgTimeOnSite: number;
  totalTimeOnPage: number;
  avgTimeOnPage: number;
  buttonClicks: ButtonClicks;
  conversions: Conversions;
  conversionRate: number;
  funnel: Funnel;
  mobileVsDesktop: DeviceStats;
  timeBySource: Record<string, TimeBySourceEntry>;
  sources: Record<string, number>;
  __v: number;
}

interface AggregatedStats {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  conversions: {
    total: number;
  };
  buttonClicks: {
    total: number;
  };
  avgTimeOnSite: number;
  bounceRate: number;
}

interface ChartDataItem {
  name: string;
  value: number;
}

interface TimeSourceChartItem {
  name: string;
  avgTime: number;
}

// Colori per i grafici
const COLORS = ['#FF6B00', '#374151', '#0ea5e9', '#10b981', '#8b5cf6', '#ec4899'];
const SOURCE_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  google: '#4285F4',
  direct: '#10b981',
  referral: '#8b5cf6',
  email: '#ec4899',
  other: '#374151'
};

const AdvancedStatistics: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<StatisticsData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7d');

  // Function to fetch statistics data directly from the server
  const fetchStatistics = async (timeRangeParam: string): Promise<StatisticsData[]> => {
    try {
      // Direct API call to the backend service
      const response = await axios.get(`${API_BASE_URL}/api/tracciamento/statistics`, {
        params: { timeRange: timeRangeParam },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  };

  const loadStatistics = async (): Promise<void> => {
    if (!isExpanded) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchStatistics(timeRange);
      setStatistics(data);
    } catch (err) {
      setError('Impossibile caricare le statistiche');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [isExpanded, timeRange]);

  // Calcola statistiche aggregate se ci sono più giorni di dati
  const getAggregatedStats = (): AggregatedStats | null => {
    if (!statistics || statistics.length === 0) {
      return null;
    }

    return statistics.reduce((agg: Partial<AggregatedStats>, stat) => {
      return {
        totalVisits: (agg.totalVisits || 0) + stat.totalVisits,
        uniqueVisitors: (agg.uniqueVisitors || 0) + stat.uniqueVisitors,
        pageViews: (agg.pageViews || 0) + stat.pageViews,
        conversions: {
          total: (agg.conversions?.total || 0) + stat.conversions.total
        },
        buttonClicks: {
          total: (agg.buttonClicks?.total || 0) + stat.buttonClicks.total
        },
        avgTimeOnSite: stat.avgTimeOnSite, // Prendiamo l'ultimo valore come esempio
        bounceRate: stat.bounceRate // Prendiamo l'ultimo valore come esempio
      };
    }, {}) as AggregatedStats;
  };

  const aggregatedStats = getAggregatedStats();
  
  // Prepara i dati per il grafico a torta delle sorgenti
  const prepareSourcesData = (): ChartDataItem[] => {
    if (!statistics || statistics.length === 0) return [];
    
    // Combiniamo i dati di tutte le date
    const combinedSources = statistics.reduce((acc: Record<string, number>, stat) => {
      if (!stat.sources) return acc;
      
      Object.entries(stat.sources).forEach(([source, count]) => {
        acc[source] = (acc[source] || 0) + count;
      });
      
      return acc;
    }, {});
    
    // Convertiamo in formato per il grafico
    return Object.entries(combinedSources).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  // Prepara i dati per il grafico Mobile vs Desktop
  const prepareMobileDesktopData = (): ChartDataItem[] => {
    if (!statistics || statistics.length === 0) return [];
    
    // Combiniamo i dati di tutte le date
    const combined = statistics.reduce((acc: { mobile: number, desktop: number }, stat) => {
      if (!stat.mobileVsDesktop) return acc;
      
      acc.mobile = (acc.mobile || 0) + (stat.mobileVsDesktop.mobile || 0);
      acc.desktop = (acc.desktop || 0) + (stat.mobileVsDesktop.desktop || 0);
      
      return acc;
    }, { mobile: 0, desktop: 0 });
    
    // Convertiamo in formato per il grafico
    return [
      { name: 'Mobile', value: combined.mobile },
      { name: 'Desktop', value: combined.desktop }
    ];
  };
  
  // Prepara i dati per il grafico conversioni per sorgente
  const prepareConversionsBySourceData = (): ChartDataItem[] => {
    if (!statistics || statistics.length === 0) return [];
    
    // Combiniamo i dati di tutte le date
    const combinedConversions = statistics.reduce((acc: Record<string, number>, stat) => {
      if (!stat.conversions || !stat.conversions.bySource) return acc;
      
      Object.entries(stat.conversions.bySource).forEach(([source, count]) => {
        acc[source] = (acc[source] || 0) + count;
      });
      
      return acc;
    }, {});
    
    // Convertiamo in formato per il grafico
    return Object.entries(combinedConversions).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  // Prepara i dati per il grafico del tempo per sorgente
  const prepareTimeBySourceData = (): TimeSourceChartItem[] => {
    if (!statistics || statistics.length === 0) return [];
    
    // Combiniamo i dati di tutte le date
    const combinedTimeBySource = statistics.reduce((acc: Record<string, { totalTime: number, pageViews: number }>, stat) => {
      if (!stat.timeBySource) return acc;
      
      Object.entries(stat.timeBySource).forEach(([source, data]) => {
        if (!acc[source]) {
          acc[source] = { totalTime: 0, pageViews: 0 };
        }
        
        acc[source].totalTime += (data.totalTime || 0);
        acc[source].pageViews += (data.pageViews || 0);
      });
      
      return acc;
    }, {});
    
    // Calcoliamo il tempo medio e convertiamo in formato per il grafico
    return Object.entries(combinedTimeBySource).map(([name, data]) => ({
      name,
      avgTime: data.pageViews > 0 ? Math.round(data.totalTime / data.pageViews) : 0
    }));
  };
  
  // Formatta secondi in formato mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Renderizza un loader quando stiamo caricando i dati
  if (isExpanded && isLoading) {
    return (
      <div className="card p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Statistiche Avanzate</h3>
          <ChevronUp size={20} />
        </div>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-6 overflow-hidden transition-all duration-300">
      {/* Header sempre visibile */}
      <div 
        className="p-4 cursor-pointer hover:bg-zinc-800 transition-colors flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          <h3 className="text-lg font-medium">Statistiche Avanzate</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {!isExpanded && aggregatedStats && (
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{aggregatedStats.totalVisits || 0} visite</span>
              </div>
              <div className="flex items-center gap-1">
                <MousePointer size={16} />
                <span>{aggregatedStats.buttonClicks?.total || 0} click</span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowRightLeft size={16} />
                <span>{aggregatedStats.conversions?.total || 0} conv.</span>
              </div>
            </div>
          )}
          
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      
      {/* Contenuto espandibile */}
      {isExpanded && !isLoading && (
        <div className="p-4 border-t border-zinc-800">
          {/* Selettore intervallo di tempo */}
          <div className="mb-6 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-400">Periodo:</label>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"
              >
                <option value="24h">Ultime 24 ore</option>
                <option value="7d">Ultimi 7 giorni</option>
                <option value="30d">Ultimi 30 giorni</option>
                <option value="all">Tutti i dati</option>
              </select>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-900/20 text-red-400 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {statistics.length === 0 && !isLoading && !error ? (
            <div className="text-center py-8 text-zinc-400">
              <p>Nessun dato statistico disponibile</p>
              <button 
                className="btn btn-outline mt-4"
                onClick={loadStatistics}
              >
                <RefreshCw size={16} className="mr-2" />
                Ricarica Statistiche
              </button>
            </div>
          ) : (
            <>
              {/* Grafici principali in grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Card metriche principali */}
                <div className="bg-zinc-800/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-4 text-zinc-300">Metriche Principali</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800 p-3 rounded-md">
                      <div className="text-zinc-400 text-xs mb-1">Visite Totali</div>
                      <div className="text-xl font-semibold">{aggregatedStats?.totalVisits || 0}</div>
                    </div>
                    <div className="bg-zinc-800 p-3 rounded-md">
                      <div className="text-zinc-400 text-xs mb-1">Conversioni</div>
                      <div className="text-xl font-semibold">{aggregatedStats?.conversions?.total || 0}</div>
                    </div>
                    <div className="bg-zinc-800 p-3 rounded-md">
                      <div className="text-zinc-400 text-xs mb-1">Tempo medio</div>
                      <div className="text-xl font-semibold">{formatTime(aggregatedStats?.avgTimeOnSite || 0)}</div>
                    </div>
                    <div className="bg-zinc-800 p-3 rounded-md">
                      <div className="text-zinc-400 text-xs mb-1">Bounce Rate</div>
                      <div className="text-xl font-semibold">{aggregatedStats?.bounceRate || 0}%</div>
                    </div>
                  </div>
                </div>
                
                {/* Grafico Sorgenti */}
                <div className="bg-zinc-800/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 text-zinc-300">Sorgenti di Traffico</h4>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareSourcesData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {prepareSourcesData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={SOURCE_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} visite`, 'Visite']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Grafico Mobile vs Desktop */}
                <div className="bg-zinc-800/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 text-zinc-300">Mobile vs Desktop</h4>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareMobileDesktopData()}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#10b981" />  {/* Mobile */}
                          <Cell fill="#0ea5e9" />  {/* Desktop */}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} visite`, 'Dispositivi']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Grafico Tempo per Sorgente */}
                <div className="bg-zinc-800/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 text-zinc-300">Tempo Medio per Sorgente</h4>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prepareTimeBySourceData()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
                        <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                        <YAxis tick={{ fill: '#9CA3AF' }} unit="s" />
                        <Tooltip 
                          formatter={(value) => [`${formatTime(value as number)}`, 'Tempo Medio']}
                          contentStyle={{ backgroundColor: '#27272A', borderColor: '#3F3F46' }}
                          itemStyle={{ color: '#E4E4E7' }}
                        />
                        <Bar dataKey="avgTime" fill="#FF6B00" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Altri dettagli */}
              <div className="mt-6 bg-zinc-800/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-4 text-zinc-300">Conversioni per Sorgente</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareConversionsBySourceData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
                      <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                      <YAxis tick={{ fill: '#9CA3AF' }} />
                      <Tooltip 
                        formatter={(value) => [`${value} conversioni`, 'Conversioni']}
                        contentStyle={{ backgroundColor: '#27272A', borderColor: '#3F3F46' }}
                        itemStyle={{ color: '#E4E4E7' }}
                      />
                      <Bar dataKey="value">
                        {prepareConversionsBySourceData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={SOURCE_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Pulsante per aggiornare i dati */}
              <div className="mt-6 text-center">
                <button 
                  className="btn btn-outline"
                  onClick={loadStatistics}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Caricamento...' : 'Aggiorna Statistiche'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedStatistics;