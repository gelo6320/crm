// components/analytics/EngagementMetrics.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Award,
  Calendar,
  BarChart3
} from 'lucide-react';
import { EngagementTrendData } from '@/types/analytics';

interface EngagementMetricsProps {
  data: EngagementTrendData | null;
  isLoading: boolean;
  timeframe: string;
}

export default function EngagementMetrics({ data, isLoading, timeframe }: EngagementMetricsProps) {
  const [activeChart, setActiveChart] = useState<'overall' | 'components'>('overall');

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

  const { chartData, stats, trend } = data;

  // Prepara dati grafico con date formattate
  const formattedChartData = chartData?.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('it-IT', {
      month: 'short',
      day: 'numeric'
    })
  })) || [];

  const getTrendColor = (trendType: string) => {
    switch (trendType) {
      case 'improving': return 'text-emerald-400';
      case 'declining': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getTrendIcon = (trendType: string) => {
    switch (trendType) {
      case 'improving': return <TrendingUp size={16} />;
      case 'declining': return <TrendingDown size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getTrendLabel = (trendType: string) => {
    switch (trendType) {
      case 'improving': return 'miglioramento';
      case 'declining': return 'calo';
      default: return 'stabile';
    }
  };

  return (
    <div className="space-y-8">
      {/* Intestazione */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <TrendingUp className="w-6 h-6 text-orange-500 mr-3" />
          Metriche di Coinvolgimento
        </h2>
        
        <div className="text-sm text-zinc-400 capitalize">
          Vista {timeframe === 'weekly' ? 'Settimanale' : 
                timeframe === 'monthly' ? 'Mensile' : 
                timeframe === 'quarterly' ? 'Trimestrale' : timeframe}
        </div>
      </div>

      {/* Schede Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Punteggio Medio */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Award className="w-5 h-5 text-orange-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Punteggio Medio</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {stats?.avgOverallScore || 0}
            </div>
            <div className={`flex items-center text-sm ${getTrendColor(stats?.trend || 'stable')}`}>
              {getTrendIcon(stats?.trend || 'stable')}
              <span className="ml-1 capitalize">{getTrendLabel(stats?.trend || 'stable')}</span>
            </div>
          </div>
        </motion.div>

        {/* Migliore Performance */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-emerald-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Giorno Migliore</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-emerald-400">
              {stats?.bestDay?.overallScore || 0}
            </div>
            <div className="text-xs text-zinc-500">
              {stats?.bestDay?.date ? new Date(stats.bestDay.date).toLocaleDateString('it-IT') : 'N/A'}
            </div>
          </div>
        </motion.div>

        {/* Da Migliorare */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Giorno Peggiore</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-red-400">
              {stats?.worstDay?.overallScore || 0}
            </div>
            <div className="text-xs text-zinc-500">
              {stats?.worstDay?.date ? new Date(stats.worstDay.date).toLocaleDateString('it-IT') : 'N/A'}
            </div>
          </div>
        </motion.div>

        {/* Record Totali */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Record</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {data.totalRecords?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-zinc-500">
              analizzati
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sezione Grafici */}
      <motion.div 
        className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Toggle Grafici */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 text-orange-500 mr-2" />
            Tendenze di Coinvolgimento
          </h3>
          
          <div className="flex bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setActiveChart('overall')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeChart === 'overall' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Punteggio Generale
            </button>
            <button
              onClick={() => setActiveChart('components')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeChart === 'components' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Componenti
            </button>
          </div>
        </div>

        {/* Grafico */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === 'overall' ? (
              <AreaChart data={formattedChartData}>
                <defs>
                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: any) => [`${value}`, 'Punteggio Coinvolgimento']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="overallScore"
                  stroke="#FF6B00"
                  strokeWidth={2}
                  fill="url(#engagementGradient)"
                />
              </AreaChart>
            ) : (
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: any, name: any) => [
                    `${value}`,
                    name === 'timeEngagement' ? 'Tempo' :
                    name === 'interactionEngagement' ? 'Interazioni' :
                    name === 'depthEngagement' ? 'Profondità' :
                    name === 'conversionEngagement' ? 'Conversioni' : name
                  ]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="timeEngagement"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="interactionEngagement"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="depthEngagement"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="conversionEngagement"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legenda Componenti */}
        {activeChart === 'components' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800">
            {[
              { name: 'Tempo', color: '#3B82F6', description: 'Tempo trascorso' },
              { name: 'Interazioni', color: '#10B981', description: 'Click e form' },
              { name: 'Profondità', color: '#8B5CF6', description: 'Profondità pagina' },
              { name: 'Conversioni', color: '#F59E0B', description: 'Obiettivi raggiunti' }
            ].map(component => (
              <div key={component.name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: component.color }}
                />
                <div>
                  <div className="font-medium text-white text-sm">{component.name}</div>
                  <div className="text-xs text-zinc-500">{component.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Informazioni Periodo */}
      {data.dateRange && (
        <div className="text-center text-sm text-zinc-500">
          Analisi dal {new Date(data.dateRange.from).toLocaleDateString('it-IT')} al {new Date(data.dateRange.to).toLocaleDateString('it-IT')}
        </div>
      )}
    </div>
  );
}