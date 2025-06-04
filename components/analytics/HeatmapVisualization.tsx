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
  ResponsiveContainer
} from 'recharts';
import { 
  MousePointer, 
  Scroll, 
  Navigation, 
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  ArrowDown
} from 'lucide-react';
import { HeatmapData } from '@/types/analytics';

interface HeatmapVisualizationProps {
  data: HeatmapData | null;
  isLoading: boolean;
  timeframe: string;
}

export default function HeatmapVisualization({ data, isLoading, timeframe }: HeatmapVisualizationProps) {
  const [activeView, setActiveView] = useState<'hotspots' | 'scroll' | 'navigation'>('hotspots');

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-900 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded mb-3"></div>
              <div className="h-8 bg-zinc-800 rounded mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 animate-pulse">
          <div className="h-80 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  const { hotspots, scrollBehavior, navigationPatterns, summary } = data;

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-900/20 border-red-800 text-red-400';
      case 'medium': return 'bg-yellow-900/20 border-yellow-800 text-yellow-400';
      case 'low': return 'bg-green-900/20 border-green-800 text-green-400';
      default: return 'bg-blue-900/20 border-blue-800 text-blue-400';
    }
  };

  // Prepara dati grafico
  const hotspotsChartData = hotspots?.slice(0, 10).map(hotspot => ({
    name: hotspot.elementId.length > 20 ? hotspot.elementId.substring(0, 20) + '...' : hotspot.elementId,
    heatScore: hotspot.heatScore,
    interactions: hotspot.interactions,
    elementType: hotspot.elementType
  })) || [];

  const scrollDepthData = scrollBehavior?.dropOffPoints?.map(point => ({
    depth: `${point.depth}%`,
    dropOffRate: point.dropOffRate,
    remaining: 100 - point.dropOffRate
  })) || [];

  const navigationChartData = navigationPatterns?.slice(0, 8).map(pattern => ({
    name: pattern.pattern.length > 25 ? pattern.pattern.substring(0, 25) + '...' : pattern.pattern,
    frequency: pattern.frequency,
    conversionRate: pattern.conversionRate,
    fullPattern: pattern.pattern
  })) || [];

  return (
    <div className="space-y-8">
      {/* Intestazione */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <MousePointer className="w-6 h-6 text-orange-500 mr-3" />
          Mappa Termica Comportamentale
        </h2>
        
        <div className="text-sm text-zinc-400 capitalize">
          {timeframe === 'weekly' ? 'Settimanale' : 
           timeframe === 'monthly' ? 'Mensile' : 
           timeframe === 'quarterly' ? 'Trimestrale' : timeframe} • {summary?.totalHotspots || 0} punti caldi
        </div>
      </div>

      {/* Schede Riassuntive */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MousePointer className="w-5 h-5 text-orange-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Punti Caldi</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {summary?.totalHotspots || 0}
            </div>
            <div className="text-xs text-zinc-500">
              Top: {summary?.topElementType || 'N/A'}
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Scroll className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Scroll Medio</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {summary?.avgScrollDepth || 0}%
            </div>
            <div className="text-xs text-zinc-500">
              profondità media
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Completamento</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {scrollBehavior?.completionRate || 0}%
            </div>
            <div className="text-xs text-zinc-500">
              scroll completo
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Navigation className="w-5 h-5 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Pattern Top</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-bold text-white truncate">
              {summary?.topPattern || 'N/A'}
            </div>
            <div className="text-xs text-zinc-500">
              più frequente
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toggle Vista */}
      <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
        {[
          { id: 'hotspots', label: 'Punti Caldi', icon: MousePointer },
          { id: 'scroll', label: 'Scroll', icon: Scroll },
          { id: 'navigation', label: 'Navigazione', icon: Navigation }
        ].map(view => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex-1 px-4 py-3 text-sm rounded-lg transition-colors flex items-center justify-center ${
                activeView === view.id 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* Contenuto */}
      <motion.div 
        className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {activeView === 'hotspots' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Punti Caldi di Interazione</h3>
            
            {/* Grafico */}
            <div className="h-80">
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
                    width={120}
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
                      name === 'heatScore' ? 'Punteggio Calore' : 'Interazioni'
                    ]}
                  />
                  <Bar 
                    dataKey="heatScore" 
                    fill="#FF6B00"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dettagli */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotspots?.slice(0, 8).map((hotspot, index) => (
                <div key={index} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: getElementTypeColor(hotspot.elementType) }}
                      />
                      <div>
                        <div className="font-medium text-sm text-white">{hotspot.elementId}</div>
                        <div className="text-xs text-zinc-500 capitalize">{hotspot.elementType}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-orange-400">{hotspot.heatScore}</div>
                      <div className="text-xs text-zinc-500">
                        {hotspot.interactions} int. • {hotspot.uniqueUsers} utenti
                      </div>
                    </div>
                  </div>
                </div>
              )) || []}
            </div>
          </div>
        )}

        {activeView === 'scroll' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Comportamento di Scroll</h3>
            
            {/* Statistiche Scroll */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Prof. Media', value: `${scrollBehavior?.avgDepth || 0}%`, color: 'text-white' },
                { label: 'Completamento', value: `${scrollBehavior?.completionRate || 0}%`, color: 'text-emerald-400' },
                { label: 'Scroll Veloce', value: `${scrollBehavior?.fastScrollers || 0}%`, color: 'text-red-400' },
                { label: 'Lettori Lenti', value: `${scrollBehavior?.slowReaders || 0}%`, color: 'text-blue-400' }
              ].map((stat, index) => (
                <div key={index} className="bg-zinc-800 rounded-lg p-4 text-center border border-zinc-700">
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-zinc-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Grafico Drop-off */}
            <div className="h-80">
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
                    formatter={(value: any) => [`${value}%`, 'Tasso di Abbandono']}
                  />
                  <Bar 
                    dataKey="dropOffRate" 
                    fill="#EF4444"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Raccomandazioni */}
            {scrollBehavior?.recommendations && scrollBehavior.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-base font-medium text-white">Raccomandazioni</h4>
                <div className="space-y-3">
                  {scrollBehavior.recommendations.map((rec, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
                      <div className="flex items-center mb-2">
                        {rec.priority === 'high' ? <AlertTriangle size={16} className="mr-2" /> :
                         rec.priority === 'medium' ? <ArrowDown size={16} className="mr-2" /> :
                         <CheckCircle size={16} className="mr-2" />}
                        <span className="font-medium text-sm capitalize">{rec.type}</span>
                        <span className="ml-auto px-2 py-1 text-xs rounded-full bg-current/10">
                          {rec.priority === 'high' ? 'alta' : 
                           rec.priority === 'medium' ? 'media' : 'bassa'}
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
            <h3 className="text-lg font-semibold text-white">Pattern di Navigazione</h3>
            
            {/* Grafico */}
            <div className="h-80">
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
                    formatter={(value: any) => [value, 'Frequenza']}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return data?.fullPattern || label;
                    }}
                  />
                  <Bar 
                    dataKey="frequency" 
                    fill="#3B82F6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dettagli Pattern */}
            <div className="space-y-3">
              <h4 className="text-base font-medium text-white">Dettagli Pattern</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {navigationPatterns?.slice(0, 6).map((pattern, index) => (
                  <div key={index} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm text-white truncate">
                        {pattern.pattern}
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-sm font-medium text-blue-400">{pattern.frequency}</div>
                        <div className="text-xs text-zinc-500">
                          {pattern.conversionRate.toFixed(1)}% conv.
                        </div>
                      </div>
                    </div>
                    {pattern.insight && (
                      <div className="text-xs text-zinc-400 italic">
                        💡 {pattern.insight}
                      </div>
                    )}
                  </div>
                )) || []}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <div className="text-center text-sm text-zinc-500">
        Ultimo aggiornamento: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString('it-IT') : 'N/A'}
      </div>
    </div>
  );
}