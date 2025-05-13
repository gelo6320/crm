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

const AdvancedStatistics: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<StatisticsData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7d');

  // Function to fetch statistics data directly from the server
  const fetchStatistics = async (): Promise<void> => {
    if (!isExpanded) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Now we pass the timeRange directly to the API for server-side filtering
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

  useEffect(() => {
    fetchStatistics();
  }, [isExpanded, timeRange]); // Reload whenever timeRange changes or panel expands

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
  
  // Rileva se il dispositivo è mobile (larghezza schermo < 768px)
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Controlla all'inizio
    checkIfMobile();
    
    // Controlla quando la finestra viene ridimensionata
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
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
  
  // Prepara i dati per il grafico dei pulsanti più cliccati
  const prepareButtonClicksData = (): ChartDataItem[] => {
    if (!statistics || statistics.length === 0) return [];
    
    // Combiniamo i dati di tutte le date
    const combinedButtonClicks = statistics.reduce((acc: Record<string, number>, stat) => {
      if (!stat.buttonClicks || !stat.buttonClicks.byId) return acc;
      
      // Converti da Map a oggetto regolare se necessario
      const byId = typeof stat.buttonClicks.byId === 'object' ? stat.buttonClicks.byId : {};
      
      Object.entries(byId).forEach(([buttonId, count]) => {
        acc[buttonId] = (acc[buttonId] || 0) + (count as number);
      });
      
      return acc;
    }, {});
    
    // Converti in array, formatta i nomi e ordina per conteggio (decrescente)
    return Object.entries(combinedButtonClicks)
      .map(([buttonId, value]) => ({
        name: formatButtonId(buttonId),
        value,
        originalId: buttonId
      }))
      .sort((a, b) => b.value - a.value);
  };
  
  // Funzione helper per formattare gli ID dei pulsanti per la visualizzazione
  const formatButtonId = (id: string): string => {
    // Rimuovi prefissi comuni come 'btn-' o 'button-'
    let name = id.replace(/^(btn-|button-)/i, '');
    
    // Sostituisci trattini e underscore con spazi
    name = name.replace(/[-_]/g, ' ');
    
    // Metti in maiuscolo la prima lettera di ogni parola
    name = name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    return name;
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

  // UI per stato di caricamento
  if (isExpanded && isLoading) {
    return (
      <div className="bg-zinc-900 rounded-lg shadow-md mt-6 overflow-hidden">
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
    <div className="bg-zinc-900 rounded-lg shadow-md mt-6 overflow-hidden transition-all duration-300">
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
          {!isExpanded && aggregatedStats && (
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1 hidden md:flex">
                <Users className="w-4 h-4" />
                <span>{aggregatedStats.totalVisits || 0} visite</span>
              </div>
              <div className="flex items-center gap-1">
                <MousePointer className="w-4 h-4" />
                <span>{aggregatedStats.buttonClicks?.total || 0} click</span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowRightLeft className="w-4 h-4" />
                <span>{aggregatedStats.conversions?.total || 0} conv.</span>
              </div>
            </div>
          )}
          
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
      
      {/* Contenuto espandibile */}
      {isExpanded && (
        <div className="p-4 md:p-6">
          {/* Selettore intervallo di tempo */}
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-lg font-medium text-white">Dashboard Analytics</h4>
            <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
              <Calendar className="w-4 h-4 text-zinc-400 ml-2" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent border-none text-sm focus:ring-0 focus:outline-none"
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
            <div className="text-center py-8 text-zinc-400 bg-zinc-800/50 rounded-lg">
              <p>Nessun dato statistico disponibile</p>
              <button 
                className="mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md transition-colors text-sm flex items-center justify-center mx-auto"
                onClick={fetchStatistics}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Ricarica Statistiche
              </button>
            </div>
          ) : (
            <>
              {/* Metriche principali */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-800 rounded-lg p-4 flex flex-col hover:bg-zinc-700/50 transition-colors">
                  <span className="text-zinc-400 text-xs mb-1">Visite Totali</span>
                  <span className="text-2xl font-semibold">{aggregatedStats?.totalVisits || 0}</span>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 flex flex-col hover:bg-zinc-700/50 transition-colors">
                  <span className="text-zinc-400 text-xs mb-1">Conversioni</span>
                  <span className="text-2xl font-semibold">{aggregatedStats?.conversions?.total || 0}</span>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 flex flex-col hover:bg-zinc-700/50 transition-colors">
                  <span className="text-zinc-400 text-xs mb-1">Tempo medio</span>
                  <span className="text-2xl font-semibold">{formatTime(aggregatedStats?.avgTimeOnSite || 0)}</span>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 flex flex-col hover:bg-zinc-700/50 transition-colors">
                  <span className="text-zinc-400 text-xs mb-1">Bounce Rate</span>
                  <span className="text-2xl font-semibold">{aggregatedStats?.bounceRate || 0}%</span>
                </div>
              </div>
              
              {/* Grafici in grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Grafico Sorgenti */}
                <div className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700/50 transition-colors">
                  <h4 className="text-sm font-medium mb-2 text-zinc-300">Sorgenti di Traffico</h4>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={prepareSourcesData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={70}
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
                <div className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700/50 transition-colors">
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
              </div>
              
              {/* Grafico tempo per sorgente */}
              <div className="bg-zinc-800 rounded-lg p-4 mb-6 hover:bg-zinc-700/50 transition-colors">
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
              
              {/* Grafico conversioni per sorgente */}
              <div className="bg-zinc-800 rounded-lg p-4 mb-6 hover:bg-zinc-700/50 transition-colors">
                <h4 className="text-sm font-medium mb-2 text-zinc-300">Conversioni per Sorgente</h4>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareConversionsBySourceData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" strokeWidth={0.5} />
                      <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <YAxis 
                        tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                        domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.3)]}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} conversioni`, 'Conversioni']}
                        contentStyle={{ backgroundColor: '#27272A', borderColor: '#3F3F46' }}
                        itemStyle={{ color: '#E4E4E7' }}
                      />
                      <Bar dataKey="value" maxBarSize={40}>
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
              
              {/* Grafico dei pulsanti più cliccati */}
              <div className="bg-zinc-800 rounded-lg p-4 mb-6 hover:bg-zinc-700/50 transition-colors">
                <h4 className="text-sm font-medium mb-2 text-zinc-300">Pulsanti Più Cliccati</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={prepareButtonClicksData().slice(0, 10)} 
                      layout="vertical"
                      margin={{ top: 5, right: 40, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#444" strokeWidth={0.5} />
                      <XAxis 
                        type="number" 
                        tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                        domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.3)]}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} click`, 'Click']}
                        contentStyle={{ backgroundColor: '#27272A', borderColor: '#3F3F46' }}
                        itemStyle={{ color: '#E4E4E7' }}
                      />
                      <Bar dataKey="value" fill="#FF6B00" maxBarSize={30}>
                        {prepareButtonClicksData().slice(0, 10).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        <LabelList 
                          dataKey="value" 
                          position="right" 
                          fill="#fff" 
                          formatter={(value: number) => value} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Aggiornamento */}
              <div className="mt-6 text-center">
                <button 
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm flex items-center justify-center mx-auto"
                  onClick={fetchStatistics}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Caricamento...' : 'Aggiorna Statistiche'}
                </button>
                <p className="mt-2 text-xs text-zinc-500">
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