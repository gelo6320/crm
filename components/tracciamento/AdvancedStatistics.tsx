"use client";

import { useState, useEffect } from "react";
import { 
  ChevronDown, 
  BarChart as BarChartIcon, 
  LineChart as LineChartIcon, 
  Activity,
  PieChart as PieChartIcon,
  Zap,
  Calendar,
  Users,
  Globe,
  TrendingUp
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
} from "recharts";
import { fetchTrackingStats } from "@/lib/api/tracciamento";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CONFIG from "@/config/tracking-config";
import { TrackingStats } from "@/types/tracciamento";

interface AdvancedStatisticsProps {
  timeRange?: string;
}

/**
 * Componente per visualizzare statistiche avanzate e grafici di tracciamento
 */
const AdvancedStatistics: React.FC<AdvancedStatisticsProps> = ({ timeRange = "30d" }) => {
  // Stati per la gestione dei dati e dell'interfaccia
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview"); // overview, sources, conversions, trends

  // Carica i dati quando il componente viene espanso
  useEffect(() => {
    if (isExpanded && !stats) {
      fetchStats();
    }
  }, [isExpanded, stats]);

  // Ricarica i dati quando cambia l'intervallo di tempo
  useEffect(() => {
    if (isExpanded) {
      fetchStats();
    }
  }, [timeRange, isExpanded]);

  // Funzione per espandere/collassare
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Funzione per ottenere i dati
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTrackingStats(timeRange);
      console.log("Statistiche caricate:", data);
      setStats(data);
    } catch (error) {
      console.error("Errore nel caricamento delle statistiche:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione per cambiare tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Funzione per formattare i numeri
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return new Intl.NumberFormat("it-IT").format(num);
  };

  // Funzione per formattare le percentuali
  const formatPercent = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 2 }).format(num / 100);
  };

  // Funzione per ordinare un oggetto per valore e ottenere i top N elementi
  const getTopItems = (obj: Record<string, number> | undefined, limit = 5): Array<{name: string, value: number}> => {
    if (!obj) return [];
    
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, value]) => ({ name, value }));
  };

  // Colori per i grafici
  const COLORS = [
    CONFIG.colors.primary,
    CONFIG.colors.info,
    CONFIG.colors.success,
    CONFIG.colors.warning,
    CONFIG.colors.danger,
    CONFIG.colors.neutral,
    "#8B5CF6", // Viola
    "#EC4899", // Rosa
    "#2DD4BF", // Teal
    "#F59E0B", // Ambra
  ];

  // Preparazione dati per i grafici
  const prepareVisitsData = () => {
    if (!stats?.chartData) return [];
    
    return stats.chartData.map(item => ({
      date: new Date(item.date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
      visite: item.visits,
      utentiUnici: item.uniqueVisitors,
      conversioni: item.conversions
    }));
  };

  const prepareSourcesData = () => {
    if (!stats?.sources) return [];
    
    return getTopItems(stats.sources, 8);
  };

  // Renderiamo il componente
  return (
    <div className="mt-8 card overflow-hidden">
      {/* Header cliccabile */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition-colors"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <Activity size={20} className="mr-2 text-primary" />
          <h3 className="text-lg font-semibold">Statistiche Avanzate</h3>
        </div>
        <ChevronDown 
          size={20} 
          className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`} 
        />
      </div>
      
      {/* Contenuto espandibile */}
      {isExpanded && (
        <div className="p-4 animate-fade-in">
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <LoadingSpinner />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Tabs di navigazione */}
              <div className="flex flex-wrap gap-2 border-b border-zinc-700">
                <button 
                  className={`px-4 py-2 flex items-center text-sm ${activeTab === "overview" ? "text-primary border-b-2 border-primary" : "text-zinc-400 hover:text-white"}`}
                  onClick={() => handleTabChange("overview")}
                >
                  <BarChartIcon size={16} className="mr-2" />
                  Panoramica
                </button>
                <button 
                  className={`px-4 py-2 flex items-center text-sm ${activeTab === "sources" ? "text-primary border-b-2 border-primary" : "text-zinc-400 hover:text-white"}`}
                  onClick={() => handleTabChange("sources")}
                >
                  <Globe size={16} className="mr-2" />
                  Sorgenti
                </button>
                <button 
                  className={`px-4 py-2 flex items-center text-sm ${activeTab === "conversions" ? "text-primary border-b-2 border-primary" : "text-zinc-400 hover:text-white"}`}
                  onClick={() => handleTabChange("conversions")}
                >
                  <Zap size={16} className="mr-2" />
                  Conversioni
                </button>
                <button 
                  className={`px-4 py-2 flex items-center text-sm ${activeTab === "trends" ? "text-primary border-b-2 border-primary" : "text-zinc-400 hover:text-white"}`}
                  onClick={() => handleTabChange("trends")}
                >
                  <TrendingUp size={16} className="mr-2" />
                  Tendenze
                </button>
              </div>
              
              {/* Contenuto della tab selezionata */}
              <div className="animate-fade-in">
                {/* Tab Panoramica */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Metriche principali */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-zinc-900 p-4 rounded-lg flex items-start">
                        <div className="rounded-full bg-primary/10 p-2 mr-3">
                          <Users size={20} className="text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm text-zinc-400">Visitatori Unici</h4>
                          <p className="text-xl font-semibold">{formatNumber(stats.summary?.uniqueVisitors)}</p>
                        </div>
                      </div>
                      
                      <div className="bg-zinc-900 p-4 rounded-lg flex items-start">
                        <div className="rounded-full bg-info/10 p-2 mr-3">
                          <BarChartIcon size={20} className="text-info" />
                        </div>
                        <div>
                          <h4 className="text-sm text-zinc-400">Visualizzazioni Pagina</h4>
                          <p className="text-xl font-semibold">{formatNumber(stats.summary?.pageViews)}</p>
                        </div>
                      </div>
                      
                      <div className="bg-zinc-900 p-4 rounded-lg flex items-start">
                        <div className="rounded-full bg-success/10 p-2 mr-3">
                          <Zap size={20} className="text-success" />
                        </div>
                        <div>
                          <h4 className="text-sm text-zinc-400">Conversioni</h4>
                          <p className="text-xl font-semibold">{formatNumber(stats.summary?.conversions.total)}</p>
                        </div>
                      </div>
                      
                      <div className="bg-zinc-900 p-4 rounded-lg flex items-start">
                        <div className="rounded-full bg-warning/10 p-2 mr-3">
                          <TrendingUp size={20} className="text-warning" />
                        </div>
                        <div>
                          <h4 className="text-sm text-zinc-400">Tasso di Conversione</h4>
                          <p className="text-xl font-semibold">{formatPercent(stats.summary?.conversionRate)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Grafico andamento visite e conversioni */}
                    <div className="bg-zinc-900 p-4 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Andamento Visite e Conversioni</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={prepareVisitsData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="date" stroke="#777" />
                            <YAxis stroke="#777" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} 
                              labelStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="visite" 
                              stroke={CONFIG.colors.primary} 
                              name="Visite"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5, stroke: CONFIG.colors.primary, strokeWidth: 1 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="utentiUnici" 
                              stroke={CONFIG.colors.info} 
                              name="Utenti Unici"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5, stroke: CONFIG.colors.info, strokeWidth: 1 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="conversioni" 
                              stroke={CONFIG.colors.success} 
                              name="Conversioni"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5, stroke: CONFIG.colors.success, strokeWidth: 1 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Tab Sorgenti */}
                {activeTab === "sources" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Grafico a torta delle sorgenti */}
                    <div className="bg-zinc-900 p-4 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Principali Sorgenti di Traffico</h3>
                      <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={prepareSourcesData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={110}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }: { name: string, percent: number }) => 
                                `${name} ${(percent * 100).toFixed(1)}%`
                              }
                            >
                              {prepareSourcesData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} 
                              formatter={(value: any, name: any, props: any) => [formatNumber(value), "Visite"]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Classifica sorgenti */}
                    <div className="bg-zinc-900 p-4 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Classifica Sorgenti</h3>
                      <div className="space-y-2">
                        {prepareSourcesData().map((source, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border-b border-zinc-800">
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-3"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span>{source.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-zinc-400">{formatNumber(source.value)} visite</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800">
                                {formatPercent(source.value / stats.summary.totalVisits * 100)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Dispositivi */}
                    <div className="bg-zinc-900 p-4 rounded-lg lg:col-span-2">
                      <h3 className="text-md font-medium mb-4">Dispositivi</h3>
                      <div className="flex gap-6">
                        <div className="flex-1">
                          <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Desktop', value: stats.devices?.desktop || 0 },
                                    { name: 'Mobile', value: stats.devices?.mobile || 0 }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={90}
                                  fill="#8884d8"
                                  paddingAngle={1}
                                  dataKey="value"
                                >
                                  <Cell fill={CONFIG.colors.info} />
                                  <Cell fill={CONFIG.colors.primary} />
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} 
                                  formatter={(value: any, name: any, props: any) => [formatNumber(value), name]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-info"></div>
                              <span>Desktop</span>
                              <span className="ml-auto font-semibold">
                                {formatNumber(stats.devices?.desktop || 0)}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800">
                                {formatPercent((stats.devices?.desktop || 0) / 
                                 ((stats.devices?.desktop || 0) + (stats.devices?.mobile || 0)) * 100)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-primary"></div>
                              <span>Mobile</span>
                              <span className="ml-auto font-semibold">
                                {formatNumber(stats.devices?.mobile || 0)}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800">
                                {formatPercent((stats.devices?.mobile || 0) / 
                                 ((stats.devices?.desktop || 0) + (stats.devices?.mobile || 0)) * 100)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Tab Conversioni */}
                {activeTab === "conversions" && (
                  <div className="space-y-6">
                    {/* Metriche di conversione */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-zinc-900 p-4 rounded-lg">
                        <h4 className="text-sm text-zinc-400 mb-1">Conversioni Totali</h4>
                        <p className="text-2xl font-semibold">
                          {formatNumber(stats.summary?.conversions.total)}
                        </p>
                      </div>
                      
                      <div className="bg-zinc-900 p-4 rounded-lg">
                        <h4 className="text-sm text-zinc-400 mb-1">Tasso di Conversione</h4>
                        <p className="text-2xl font-semibold">
                          {formatPercent(stats.summary?.conversionRate)}
                        </p>
                      </div>
                      
                      <div className="bg-zinc-900 p-4 rounded-lg">
                        <h4 className="text-sm text-zinc-400 mb-1">Valore Medio Conversione</h4>
                        <p className="text-2xl font-semibold">
                          {stats.summary?.avgConversionValue ? 
                            new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" })
                              .format(stats.summary.avgConversionValue) : 
                            "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Grafico conversioni per tipo */}
                    <div className="bg-zinc-900 p-4 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Conversioni per Tipo</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={
                              stats.summary?.conversions?.byType ? 
                              Object.entries(stats.summary.conversions.byType).map(([type, count]) => ({
                                name: type,
                                value: count
                              })) : []
                            }
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="name" stroke="#777" />
                            <YAxis stroke="#777" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} 
                              formatter={(value: any, name: any, props: any) => [formatNumber(value), "Conversioni"]}
                            />
                            <Bar 
                              dataKey="value" 
                              name="Conversioni" 
                              fill={CONFIG.colors.success}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Tassi di conversione nel tempo */}
                    <div className="bg-zinc-900 p-4 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Trend Tasso di Conversione</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={stats.chartData?.map(day => ({
                              date: new Date(day.date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
                              rate: day.conversionRate || 0
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="date" stroke="#777" />
                            <YAxis 
                              stroke="#777"
                              tickFormatter={(value: number) => `${value.toFixed(1)}%`}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} 
                              formatter={(value: any, name: any, props: any) => [`${Number(value).toFixed(2)}%`, "Tasso di Conversione"]}
                            />
                            <Line
                              type="monotone"
                              dataKey="rate"
                              stroke={CONFIG.colors.warning}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5, stroke: CONFIG.colors.warning, strokeWidth: 1 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Tab Tendenze */}
                {activeTab === "trends" && (
                  <div className="space-y-6">
                    {/* Metriche di tendenza */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-zinc-900 p-4 rounded-lg">
                        <h4 className="text-sm text-zinc-400 mb-1">Crescita Visite (vs periodo prec.)</h4>
                        <p className={`text-2xl font-semibold ${(stats.trends?.visitsGrowth || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                          {stats.trends?.visitsGrowth !== undefined ? 
                            `${(stats.trends.visitsGrowth > 0 ? '+' : '')}${stats.trends.visitsGrowth.toFixed(1)}%` : 
                            "N/A"}
                        </p>
                      </div>
                      
                      <div className="bg-zinc-900 p-4 rounded-lg">
                        <h4 className="text-sm text-zinc-400 mb-1">Crescita Conversioni</h4>
                        <p className={`text-2xl font-semibold ${(stats.trends?.conversionsGrowth || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                          {stats.trends?.conversionsGrowth !== undefined ? 
                            `${(stats.trends.conversionsGrowth > 0 ? '+' : '')}${stats.trends.conversionsGrowth.toFixed(1)}%` : 
                            "N/A"}
                        </p>
                      </div>
                      
                      <div className="bg-zinc-900 p-4 rounded-lg">
                        <h4 className="text-sm text-zinc-400 mb-1">Variazione Tasso Conversione</h4>
                        <p className={`text-2xl font-semibold ${(stats.trends?.convRateChange || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                          {stats.trends?.convRateChange !== undefined ? 
                            `${(stats.trends.convRateChange > 0 ? '+' : '')}${stats.trends.convRateChange.toFixed(1)}%` : 
                            "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Grafico confronto periodi */}
                    <div className="bg-zinc-900 p-4 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Confronto Periodi - Visite</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#777"
                              type="category"
                              allowDuplicatedCategory={false}
                            />
                            <YAxis stroke="#777" />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} 
                            />
                            <Legend />
                            <Line 
                              data={stats.chartData?.map(day => ({
                                date: new Date(day.date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
                                value: day.visits
                              }))}
                              type="monotone" 
                              dataKey="value" 
                              name="Periodo Attuale" 
                              stroke={CONFIG.colors.primary}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                            {stats.previousPeriod?.chartData && (
                              <Line 
                                data={stats.previousPeriod.chartData.map(day => ({
                                  date: new Date(day.date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
                                  value: day.visits
                                }))}
                                type="monotone" 
                                dataKey="value" 
                                name="Periodo Precedente" 
                                stroke={CONFIG.colors.neutral}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ r: 2 }}
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Classifica di crescita delle landing page */}
                    <div className="bg-zinc-900 p-4 rounded-lg">
                      <h3 className="text-md font-medium mb-4">Top Landing Page per Crescita</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left border-b border-zinc-800">
                              <th className="pb-2">URL</th>
                              <th className="pb-2">Visite</th>
                              <th className="pb-2">Crescita</th>
                              <th className="pb-2">Conv. Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.landingPagesTrends?.slice(0, 5).map((page, index) => (
                              <tr key={index} className="border-b border-zinc-800">
                                <td className="py-2 truncate max-w-xs">
                                  {page.url}
                                </td>
                                <td className="py-2">{formatNumber(page.visits)}</td>
                                <td className={`py-2 ${page.growth >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {page.growth >= 0 ? '+' : ''}{page.growth.toFixed(1)}%
                                </td>
                                <td className="py-2">{formatPercent(page.conversionRate)}</td>
                              </tr>
                            ))}
                            {(!stats.landingPagesTrends || stats.landingPagesTrends.length === 0) && (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-zinc-500">
                                  Nessun dato disponibile
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-zinc-400">
              <LineChartIcon size={40} className="mb-4 opacity-50" />
              <p>Nessun dato statistico disponibile per il periodo selezionato.</p>
              <button 
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                onClick={fetchStats}
              >
                Riprova
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedStatistics;