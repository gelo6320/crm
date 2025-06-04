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
import { 
  fetchAnalyticsDashboard,
  fetchEngagementMetrics,
  fetchHeatmapData,
  fetchTemporalAnalysis,
  refreshTodayAnalytics
} from "@/lib/api/analytics";
import { 
  AnalyticsDashboard, 
  EngagementTrendData, 
  HeatmapData,
  TemporalAnalysis
} from "@/types/analytics";
import { toast } from "@/components/ui/toaster";

const TIMEFRAME_OPTIONS = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'quarterly', label: 'Quarterly', days: 90 }
];

export default function AnalyticsPage() {
  // Estados principales
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementTrendData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [temporalData, setTemporalData] = useState<TemporalAnalysis | null>(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Global timeframe
  const [globalTimeframe, setGlobalTimeframe] = useState('monthly');
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'behavior'>('overview');

  const currentTimeframe = TIMEFRAME_OPTIONS.find(opt => opt.value === globalTimeframe);

  // Load all data
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
      console.error("Error loading analytics:", error);
      toast("error", "Error", "Unable to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshTodayAnalytics();
      await loadAllData();
      toast("success", "Updated", "Analytics data refreshed");
    } catch (error) {
      console.error("Error refreshing:", error);
      toast("error", "Error", "Unable to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !dashboard) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <BarChart3 className="w-8 h-8 text-orange-500 mr-3" />
              Analytics
            </h1>
            <p className="text-zinc-400 mt-1">
              Behavioral insights and performance metrics
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Global Timeframe Selector */}
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
            
            {/* Refresh Button */}
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg p-2 text-white transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-zinc-800">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'engagement', label: 'Engagement', icon: TrendingUp },
              { id: 'behavior', label: 'Behavior', icon: MousePointer }
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

        {/* Content */}
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

          {activeTab === 'behavior' && (
            <div className="space-y-6">
              {heatmapData && (
                <HeatmapVisualization
                  data={heatmapData}
                  isLoading={isLoading}
                  timeframe={globalTimeframe}
                />
              )}
              
              {temporalData && (
                <div className="bg-zinc-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                    <Clock className="w-5 h-5 text-orange-500 mr-2" />
                    Temporal Patterns
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-zinc-800 rounded-lg p-4">
                      <div className="text-sm text-zinc-400 mb-2">Peak Hour</div>
                      <div className="text-2xl font-bold text-white">
                        {temporalData.insights.peakHour.time}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {temporalData.insights.peakHour.visits} visits
                      </div>
                    </div>
                    
                    <div className="bg-zinc-800 rounded-lg p-4">
                      <div className="text-sm text-zinc-400 mb-2">Peak Day</div>
                      <div className="text-2xl font-bold text-white">
                        {temporalData.insights.peakDay.day}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {temporalData.insights.peakDay.visits} avg visits
                      </div>
                    </div>
                    
                    <div className="bg-zinc-800 rounded-lg p-4">
                      <div className="text-sm text-zinc-400 mb-2">Records</div>
                      <div className="text-2xl font-bold text-white">
                        {temporalData.recordsAnalyzed.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        analyzed
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {dashboard && (
          <div className="text-center text-sm text-zinc-500 border-t border-zinc-800 pt-4">
            Last updated: {new Date(dashboard.lastUpdated).toLocaleString()} • 
            Confidence: {dashboard.summary.confidence}% • 
            Sample: {dashboard.summary.sampleSize.toLocaleString()} sessions
          </div>
        )}
      </div>
    </div>
  );
}