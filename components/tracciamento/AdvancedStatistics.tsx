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
  ArrowRightLeft,
  Calendar
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
  ResponsiveContainer,
  LabelList
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
  originalId?: string;
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

interface AdvancedStatisticsProps {
  timeRange: string;
}

const AdvancedStatistics: React.FC<AdvancedStatisticsProps> = ({ timeRange }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<StatisticsData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch statistics data directly from the server
  const fetchStatistics = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tracciamento/statistics`, {
        params: { timeRange },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Ricevuti ${response.data?.length || 0} record statistici dal server per il periodo ${timeRange}`);
      setStatistics(response.data || []);
    } catch (err) {
      setError('Impossibile caricare le statistiche');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Carica i dati quando cambia il timeRange o quando la sezione viene espansa
  useEffect(() => {
    if (isExpanded) {
      fetchStatistics();
    }
  }, [isExpanded]);

  // Ricarica automaticamente quando cambia il timeRange (anche se non espanso)
  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  // Calcola statistiche aggregate
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
        avgTimeOnSite: stat.avgTimeOnSite,
        bounceRate: stat.bounceRate
      };
    }, {}) as AggregatedStats;
  };

  const aggregatedStats = getAggregatedStats();
  
  // Prepara i dati per il grafico a torta delle sorgenti
  const prepareSourcesData = (): ChartDataItem[] => {
    if (!statistics || statistics.length === 0) return [];
    
    const combinedSources = statistics.reduce((acc: Record<string, number>, stat) => {
      if (!stat.sources) return acc;
      
      Object.entries(stat.sources).forEach(([source, count]) => {
        acc[source] = (acc[source] || 0) + count;
      });
      
      return acc;
    }, {});
    
    return Object.entries(combinedSources).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  // Rileva se il dispositivo è mobile
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Prepara i dati per il grafico Mobile vs Desktop
  const prepareMobileDesktopData = (): ChartDataItem[] => {
    if (!statistics || statistics.length === 0) return [];
    
    const combined = statistics.reduce((acc: { mobile: number, desktop: number }, stat) => {
      if (!stat.mobileVsDesktop) return acc;
      
      acc.mobile = (acc.mobile || 0) + (stat.mobileVsDesktop.mobile || 0);
      acc.desktop = (acc.desktop || 0) + (stat.mobileVsDesktop.desktop || 0);
      
      return acc;
    }, { mobile: 0, desktop: 0 });
    
    return [
      { name: 'Mobile', value: combined.mobile },
      { name: 'Desktop', value: combined.desktop }
    ];
  };
  
  // Prepara i dati per il grafico conversioni per sorgente
  const prepareConversionsBySourceData = (): ChartDataItem[] => {
    if (!statistics || statistics.length === 0) return [];
    
    const combinedConversions = statistics.reduce((acc: Record<string, number>, stat) => {
      if (!stat.conversions || !stat.conversions.bySource) return acc;
      
      Object.entries(stat.conversions.bySource).forEach(([source, count]) => {
        acc[source] = (acc[source] || 0) + count;
      });
      
      return acc;
    }, {});
    
    return Object.entries(combinedConversions).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  // Prepara i dati per il grafico dei pulsanti più cliccati
  const prepareButtonClicksData = (): ChartDataItem[] => {
    if (!statistics || statistics.length === 0) return [];
    
    const combinedButtonClicks = statistics.reduce((acc: Record<string, number>, stat) => {
      if (!stat.buttonClicks || !stat.buttonClicks.byId) return acc;
      
      const byId = typeof stat.buttonClicks.byId === 'object' ? stat.buttonClicks.byId : {};
      
      Object.entries(byId).forEach(([buttonId, count]) => {
        acc[buttonId] = (acc[buttonId] || 0) + (count as number);
      });
      
      return acc;
    }, {});
    
    return Object.entries(combinedButtonClicks)
      .map(([buttonId, value]) => ({
        name: formatButtonId(buttonId),
        value,
        originalId: buttonId
      }))
      .sort((a, b) => b.value - a.value);
  };
  
  // Funzione helper per formattare gli ID dei pulsanti
  const formatButtonId = (id: string): string => {
    let name = id.replace(/^(btn-|button-)/i, '');
    name = name.replace(/[-_]/g, ' ');
    name = name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    return name;
  };
  
  // Prepara i dati per il grafico del tempo per sorgente
  const prepareTimeBySourceData = (): TimeSourceChartItem[] => {
    if (!statistics || statistics.length === 0) return [];
    
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

  // UI per stato di caricamento
  if (isExpanded && isLoading) {
    return (
      <div className="bg-zinc-900 rounded-xl mt-6 overflow-hidden" style={{ borderRadius: '12px' }}>
        <div className="flex items-center justify-between p-4 bg-zinc-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-primary w-5 h-5" />
            <h3 className="text-lg font-medium">Statistiche Avanzate</h3>
          </div>
          <ChevronUp className="w-5 h-5" />
        </div>
        <div className="flex justify-center items-center h-64 p-4">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl mt-6 overflow-hidden transition-all duration-300" style={{ borderRadius: '12px' }}>
      {/* Header sempre visibile */}
      <div 
        className="p-4 cursor-pointer hover:bg-zinc-800 transition-colors flex items-center justify-between bg-zinc-800/80"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="text-primary w-5 h-5" />
          <h3 className="text-lg font-medium">Statistiche Avanzate</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
      
      {/* Contenuto espandibile */}
      {isExpanded && (
        <div className="p-4 md:p-6"> 
          {error && (
            <div className="bg-red-900/20 text-red-400 p-3 rounded-xl mb-4" style={{ borderRadius: '12px' }}>
              {error}
            </div>
          )}
          
          {statistics.length === 0 && !isLoading && !error ? (
            <div className="text-center py-8 text-zinc-400 bg-zinc-800/50 rounded-xl" style={{ borderRadius: '12px' }}>
              <p>Nessun dato statistico disponibile</p>
            </div>
          ) : (
            <>
              {/* Metriche principali */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-800 rounded-xl p-4 flex flex-col hover:bg-zinc-700/50 transition-colors" style={{ borderRadius: '12px' }}>
                  <span className="text-zinc-400 text-xs mb-1">Visite Totali</span>
                  <span className="text-2xl font-semibold">{aggregatedStats?.totalVisits || 0}</span>
                </div>
                <div className="bg-zinc-800 rounded-xl p-4 flex flex-col hover:bg-zinc-700/50 transition-colors" style={{ borderRadius: '12px' }}>
                  <span className="text-zinc-400 text-xs mb-1">Conversioni</span>
                  <span className="text-2xl font-semibold">{aggregatedStats?.conversions?.total || 0}</span>
                </div>
                <div className="bg-zinc-800 rounded-xl p-4 flex flex-col hover:bg-zinc-700/50 transition-colors" style={{ borderRadius: '12px' }}>
                  <span className="text-zinc-400 text-xs mb-1">Tempo medio</span>
                  <span className="text-2xl font-semibold">{formatTime(aggregatedStats?.avgTimeOnSite || 0)}</span>
                </div>
                <div className="bg-zinc-800 rounded-xl p-4 flex flex-col hover:bg-zinc-700/50 transition-colors" style={{ borderRadius: '12px' }}>
                  <span className="text-zinc-400 text-xs mb-1">Bounce Rate</span>
                  <span className="text-2xl font-semibold">{aggregatedStats?.bounceRate || 0}%</span>
                </div>
              </div>
              
              {/* Grafici in grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Grafico Sorgenti */}
                <div className="bg-zinc-800 rounded-xl p-4 hover:bg-zinc-700/50 transition-colors" style={{ borderRadius: '12px' }}>
                  <h4 className="text-sm font-medium mb-2 text-zinc-300">Sorgenti di Traffico</h4>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={prepareSourcesData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={isMobile ? 50 : 60}
                        outerRadius={isMobile ? 70 : 80}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={!isMobile}
                        label={isMobile ? false : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {prepareSourcesData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={SOURCE_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} visite`, 'Visite']} />
                      {isMobile && <Legend layout="horizontal" verticalAlign="bottom" align="center" />}
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Grafico Mobile vs Desktop */}
                <div className="bg-zinc-800 rounded-xl p-4 hover:bg-zinc-700/50 transition-colors" style={{ borderRadius: '12px' }}>
                  <h4 className="text-sm font-medium mb-2 text-zinc-300">Mobile vs Desktop</h4>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={prepareMobileDesktopData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={!isMobile}
                        label={isMobile ? false : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#0ea5e9" />
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} visite`, 'Dispositivi']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Altri grafici con stesso stile */}
              <div className="bg-zinc-800 rounded-xl p-4 mb-6 hover:bg-zinc-700/50 transition-colors" style={{ borderRadius: '12px' }}>
                <h4 className="text-sm font-medium mb-2 text-zinc-300">Tempo Medio per Sorgente (secondi)</h4>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareTimeBySourceData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" strokeWidth={0.5} />
                      <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <YAxis 
                        tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                        unit="s"
                        domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.3)]} 
                      />
                      <Tooltip 
                        formatter={(value) => [`${formatTime(value as number)}`, 'Tempo Medio']}
                        contentStyle={{ backgroundColor: '#27272A', borderColor: '#3F3F46' }}
                        itemStyle={{ color: '#E4E4E7' }}
                      />
                      <Bar dataKey="avgTime" fill="#FF6B00" maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Info aggiornamento */}
              <div className="mt-6 text-center">
                <p className="text-xs text-zinc-500">
                  {statistics.length} record statistici per {timeRange === '24h' ? 'le ultime 24 ore' : 
                    timeRange === '7d' ? 'gli ultimi 7 giorni' : 
                    timeRange === '30d' ? 'gli ultimi 30 giorni' : 'tutto il periodo'}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 

export default AdvancedStatistics;