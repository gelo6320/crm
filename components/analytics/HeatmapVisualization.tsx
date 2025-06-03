// components/analytics/HeatmapVisualization.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  MousePointer, 
  Scroll, 
  Navigation, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowDown,
  Activity,
  Users,
  Target
} from 'lucide-react';
import { HeatmapData, ProcessedHotspot, ScrollRecommendation } from '@/types/analytics';

interface HeatmapVisualizationProps {
  data: HeatmapData;
  isLoading: boolean;
  onPeriodChange: (period: string, date?: string) => void;
}

const COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function HeatmapVisualization({ data, isLoading, onPeriodChange }: HeatmapVisualizationProps) {
  const [activeView, setActiveView] = useState<'hotspots' | 'scroll' | 'navigation'>('hotspots');

  if (isLoading) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-zinc-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-zinc-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6 text-center">
        <p className="text-zinc-500">Nessun dato heatmap disponibile</p>
      </div>
    );
  }

  const { hotspots, scrollBehavior, navigationPatterns, summary } = data;

  // Get element type color
  const getElementTypeColor = (elementType: string) => {
    const colors: Record<string, string> = {
      'button': '#FF6B00',
      'form': '#8B5CF6',
      'link': '#3B82F6',
      'image': '#10B981',
      'video': '#F59E0B',
      'text': '#6B7280'
    };
    return colors[elementType] || '#6B7280';
  };

  // Get priority color for recommendations
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-blue-400 bg-blue-900/20';
    }
  };

  // Prepare hotspots chart data
  const hotspotsChartData = hotspots.slice(0, 10).map(hotspot => ({
    name: hotspot.elementId,
    interactions: hotspot.interactions,
    users: hotspot.uniqueUsers,
    heatScore: hotspot.heatScore,
    elementType: hotspot.elementType
  }));

  // Prepare scroll depth chart data
  const scrollDepthData = scrollBehavior.dropOffPoints.map(point => ({
    depth: `${point.depth}%`,
    dropOffRate: point.dropOffRate,
    remaining: 100 - point.dropOffRate
  }));

  // Prepare navigation patterns data
  const navigationChartData = navigationPatterns.slice(0, 8).map(pattern => ({
    name: pattern.pattern.length > 30 ? pattern.pattern.substring(0, 30) + '...' : pattern.pattern,
    frequency: pattern.frequency,
    conversionRate: pattern.conversionRate,
    fullPattern: pattern.pattern
  }));

  return (
    <motion.div 
      className="bg-zinc-800 rounded-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium flex items-center">
          <Activity className="w-5 h-5 text-primary mr-2" />
          Heatmap Comportamentale
        </h3>
        
        <div className="text-sm text-zinc-400">
          {data.periodKey} • {summary.totalHotspots} hotspots
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Hotspots Totali</span>
            <MousePointer className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-white">
            {summary.totalHotspots}
          </div>
          <div className="text-xs text-zinc-500">
            Top: {summary.topElementType}
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Scroll Medio</span>
            <Scroll className="w-4 h-4 text-info" />
          </div>
          <div className="text-2xl font-bold text-white">
            {summary.avgScrollDepth}%
          </div>
          <div className="text-xs text-zinc-500">
            Profondità media
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Completamento</span>
            <Target className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-white">
            {scrollBehavior.completionRate}%
          </div>
          <div className="text-xs text-zinc-500">
            Scroll completo
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Top Pattern</span>
            <Navigation className="w-4 h-4 text-warning" />
          </div>
          <div className="text-sm font-bold text-white truncate">
            {summary.topPattern}
          </div>
          <div className="text-xs text-zinc-500">
            Pattern più frequente
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveView('hotspots')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center ${
            activeView === 'hotspots' 
              ? 'bg-primary text-white' 
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          <MousePointer size={16} className="mr-2" />
          Hotspots
        </button>
        <button
          onClick={() => setActiveView('scroll')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center ${
            activeView === 'scroll' 
              ? 'bg-primary text-white' 
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          <Scroll size={16} className="mr-2" />
          Scroll Behavior
        </button>
        <button
          onClick={() => setActiveView('navigation')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center ${
            activeView === 'navigation' 
              ? 'bg-primary text-white' 
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          <Navigation size={16} className="mr-2" />
          Navigazione
        </button>
      </div>

      {/* Content based on active view */}
      {activeView === 'hotspots' && (
        <div className="space-y-6">
          {/* Hotspots Chart */}
          <div className="h-80">
            <h4 className="text-base font-medium mb-4">Top Interaction Hotspots</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hotspotsChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  type="number"
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  stroke="#9CA3AF"
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: any, name: any) => [
                    value,
                    name === 'interactions' ? 'Interazioni' :
                    name === 'users' ? 'Utenti Unici' :
                    name === 'heatScore' ? 'Heat Score' : name
                  ]}
                />
                <Bar 
                  dataKey="heatScore" 
                  fill="#FF6B00"
                  name="Heat Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hotspots Details */}
          <div>
            <h4 className="text-base font-medium mb-4">Dettagli Hotspots</h4>
            <div className="space-y-2">
              {hotspots.slice(0, 8).map((hotspot, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: getElementTypeColor(hotspot.elementType) }}
                    ></div>
                    <div>
                      <div className="font-medium text-sm">{hotspot.elementId}</div>
                      <div className="text-xs text-zinc-500 capitalize">{hotspot.elementType}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{hotspot.heatScore}</div>
                    <div className="text-xs text-zinc-500">
                      {hotspot.interactions} int. • {hotspot.uniqueUsers} utenti
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'scroll' && (
        <div className="space-y-6">
          {/* Scroll Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {scrollBehavior.avgDepth}%
              </div>
              <div className="text-sm text-zinc-400">Profondità Media</div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-500 mb-1">
                {scrollBehavior.completionRate}%
              </div>
              <div className="text-sm text-zinc-400">Completamento</div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-500 mb-1">
                {scrollBehavior.fastScrollers}%
              </div>
              <div className="text-sm text-zinc-400">Scroll Veloce</div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-500 mb-1">
                {scrollBehavior.slowReaders}%
              </div>
              <div className="text-sm text-zinc-400">Lettura Lenta</div>
            </div>
          </div>

          {/* Drop-off Chart */}
          <div className="h-80">
            <h4 className="text-base font-medium mb-4">Punti di Abbandono Scroll</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scrollDepthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="depth"
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: any, name: any) => [
                    `${value}%`,
                    name === 'dropOffRate' ? 'Tasso Abbandono' : 'Utenti Rimanenti'
                  ]}
                />
                <Bar 
                  dataKey="dropOffRate" 
                  fill="#EF4444"
                  name="Tasso Abbandono"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scroll Recommendations */}
          {scrollBehavior.recommendations && scrollBehavior.recommendations.length > 0 && (
            <div>
              <h4 className="text-base font-medium mb-4">Raccomandazioni</h4>
              <div className="space-y-3">
                {scrollBehavior.recommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-center mb-1">
                      {rec.priority === 'high' ? <AlertTriangle size={16} className="mr-2" /> :
                       rec.priority === 'medium' ? <ArrowDown size={16} className="mr-2" /> :
                       <CheckCircle size={16} className="mr-2" />}
                      <span className="font-medium text-sm capitalize">{rec.type}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm">{rec.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'navigation' && (
        <div className="space-y-6">
          {/* Navigation Patterns Chart */}
          <div className="h-80">
            <h4 className="text-base font-medium mb-4">Pattern di Navigazione</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={navigationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name"
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: any, name: any) => [
                    value,
                    name === 'frequency' ? 'Frequenza' : 'Tasso Conversione %'
                  ]}
                  labelFormatter={(label, payload) => {
                    const data = payload?.[0]?.payload;
                    return data?.fullPattern || label;
                  }}
                />
                <Bar 
                  dataKey="frequency" 
                  fill="#3B82F6"
                  name="Frequenza"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Navigation Details */}
          <div>
            <h4 className="text-base font-medium mb-4">Dettagli Pattern</h4>
            <div className="space-y-2">
              {navigationPatterns.slice(0, 6).map((pattern, index) => (
                <div key={index} className="p-3 bg-zinc-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">
                      {pattern.pattern}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{pattern.frequency} volte</div>
                      <div className="text-xs text-zinc-500">
                        {pattern.conversionRate.toFixed(1)}% conversione
                      </div>
                    </div>
                  </div>
                  {pattern.insight && (
                    <div className="text-xs text-zinc-400 italic">
                      💡 {pattern.insight}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-zinc-500">
        Ultimo aggiornamento: {new Date(data.lastUpdated).toLocaleString('it-IT')}
      </div>
    </motion.div>
  );
}