"use client";

import { useState, useEffect } from "react";
import { 
  ChevronDown, 
  BarChart as BarChartIcon,
  Activity,
  MousePointerClick,
  LayoutDashboard
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CONFIG from "@/config/tracking-config";
import { TrackingStats } from "@/types/tracciamento";

// Define simpler interface for interaction data
interface InteractionData {
  buttons: Array<{ name: string; clicks: number }>;
  sections: Array<{ name: string; views: number }>;
}

// Extend TrackingStats for our component
interface ExtendedTrackingStats extends TrackingStats {
  interactionStats?: InteractionData;
}

interface InterestStatsProps {
  timeRange?: string;
}

/**
 * Simplified component to display user engagement data
 */
const InterestStats: React.FC<InterestStatsProps> = ({ timeRange = "30d" }) => {
  // States for UI and data management
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState<ExtendedTrackingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data when component is expanded
  useEffect(() => {
    if (isExpanded && !stats) {
      fetchStats();
    }
  }, [isExpanded, stats]);

  // Reload data when time range changes
  useEffect(() => {
    if (isExpanded) {
      fetchStats();
    }
  }, [timeRange, isExpanded]);

  // Toggle expand/collapse
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Fetch statistics from API
  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Direct fetch using fetch API instead of the client
      const apiUrl = `${CONFIG.api.baseUrl}/api/tracciamento/stats?timeRange=${timeRange}&includeTrends=true`;
      console.log(`Fetching from: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Raw tracking stats:", data);
      
      // Process the data for our component
      const extendedData: ExtendedTrackingStats = {
        ...data,
        // Add derived interaction stats
        interactionStats: {
          // Use landing pages as sources of interaction
          buttons: createButtonsFromLandingPages(data),
          // Use landing pages for sections data
          sections: createSectionsFromLandingPages(data)
        }
      };
      
      setStats(extendedData);
    } catch (err) {
      console.error("Error loading statistics:", err);
      setError("Impossibile caricare le statistiche. Riprova più tardi.");
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create buttons data from landing pages or sources
  const createButtonsFromLandingPages = (data: TrackingStats) => {
    // Use the landingPagesTrends data (we know this one is populated from the console log)
    if (data.landingPagesTrends && data.landingPagesTrends.length > 0) {
      return data.landingPagesTrends
        .map(page => ({
          name: `Pagina ${formatPagePath(page.url)}`,
          clicks: page.visits
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);
    }
    
    // Fallback to empty array
    return [];
  };
  
  // Create sections data from landing pages
  const createSectionsFromLandingPages = (data: TrackingStats) => {
    if (data.landingPagesTrends && data.landingPagesTrends.length > 0) {
      return data.landingPagesTrends
        .map(page => ({
          name: formatPagePath(page.url),
          views: page.visits
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    }
    
    // Fallback to empty array
    return [];
  };
  
  // Format source name for better display
  const formatSourceName = (source: string): string => {
    // Capitalize first letter and replace underscores/dashes
    return source
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format URL path for better display
  const formatPagePath = (path: string): string => {
    // Remove domain and protocol if present
    let cleanPath = path.replace(/https?:\/\/[^\/]+/i, '');
    
    // Use "Home Page" for root
    if (!cleanPath || cleanPath === '/') {
      return 'Home Page';
    }
    
    // Remove leading slash and split by slashes
    const parts = cleanPath.replace(/^\//, '').split('/');
    
    // Convert to title case and replace dashes and underscores
    return parts.map(part => 
      part.replace(/[-_]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
    ).join(' › ');
  };

  // Format numbers for display
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "N/A";
    return new Intl.NumberFormat("it-IT").format(num);
  };

  // Prepare chart data ensuring proper sorting
  const prepareChartData = (items: any[] | undefined, valueKey: string = "clicks") => {
    if (!items || !Array.isArray(items)) return [];
    
    return [...items]
      .sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0))
      .map(item => ({
        ...item,
        color: CONFIG.colors.primary
      }));
  };

  // Render the component
  return (
    <div className="mt-8 card overflow-hidden">
      {/* Clickable header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition-colors"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <Activity size={20} className="mr-2 text-primary" />
          <h3 className="text-lg font-semibold">Interesse degli Utenti</h3>
        </div>
        <ChevronDown 
          size={20} 
          className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`} 
        />
      </div>
      
      {/* Expandable content */}
      {isExpanded && (
        <div className="p-4 animate-fade-in">
          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <LoadingSpinner />
            </div>
          ) : error || !stats ? (
            <div className="flex flex-col items-center justify-center h-60 text-zinc-400">
              <BarChartIcon size={40} className="mb-4 opacity-50" />
              <p>{error || "Nessun dato disponibile per il periodo selezionato."}</p>
              <button 
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                onClick={fetchStats}
              >
                Riprova
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Source interactions */}
              {stats.interactionStats?.buttons && stats.interactionStats.buttons.length > 0 && (
                <div className="bg-zinc-900 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <MousePointerClick size={18} className="mr-2 text-primary" />
                    <h3 className="text-md font-medium">Sorgenti di Interazione</h3>
                  </div>
                  <div className="space-y-3">
                    {prepareChartData(stats.interactionStats.buttons).map((button, index) => (
                      <div key={index} className="bg-zinc-800 rounded-lg p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                          <span className="font-medium mb-1 sm:mb-0">{button.name}</span>
                          <span className="text-primary font-bold">{formatNumber(button.clicks)} interazioni</span>
                        </div>
                        <div className="w-full bg-zinc-700 rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ 
                              width: `${stats.interactionStats?.buttons && stats.interactionStats.buttons[0]?.clicks ? 
                                (button.clicks / stats.interactionStats.buttons[0].clicks) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Most visited sections */}
              {stats.interactionStats?.sections && stats.interactionStats.sections.length > 0 && (
                <div className="bg-zinc-900 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <LayoutDashboard size={18} className="mr-2 text-success" />
                    <h3 className="text-md font-medium">Sezioni Più Visitate</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareChartData(stats.interactionStats.sections, "views")}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis type="number" stroke="#777" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                          stroke="#777" 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} 
                          formatter={(value: any) => [formatNumber(value), "Visualizzazioni"]}
                        />
                        <Bar 
                          dataKey="views" 
                          fill={CONFIG.colors.success} 
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterestStats;