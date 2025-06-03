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
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  MousePointer, 
  Target,
  Calendar,
  Award
} from 'lucide-react';
import { EngagementTrendData } from '@/types/analytics';

interface EngagementMetricsProps {
  data: EngagementTrendData;
  isLoading: boolean;
  onPeriodChange: (period: string, days: number) => void;
}

export default function EngagementMetrics({ data, isLoading, onPeriodChange }: EngagementMetricsProps) {
  const [activeChart, setActiveChart] = useState<'overall' | 'components'>('overall');
  const [selectedPeriod, setSelectedPeriod] = useState({ period: 'daily', days: 7 });

  if (isLoading) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-zinc-700 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-zinc-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.chartData) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6 text-center">
        <p className="text-zinc-500">Nessun dato engagement disponibile</p>
      </div>
    );
  }

  const { chartData, stats, trend } = data;

  // Prepare chart data with formatted dates
  const formattedChartData = chartData.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('it-IT', {
      month: 'short',
      day: 'numeric'
    })
  }));

  // Get trend color
  const getTrendColor = (trendType: string) => {
    switch (trendType) {
      case 'improving': return 'text-emerald-500';
      case 'declining': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  // Get trend icon
  const getTrendIcon = (trendType: string) => {
    switch (trendType) {
      case 'improving': return <TrendingUp size={16} />;
      case 'declining': return <TrendingDown size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const handlePeriodChange = (newPeriod: string, newDays: number) => {
    setSelectedPeriod({ period: newPeriod, days: newDays });
    onPeriodChange(newPeriod, newDays);
  };

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
          Engagement Metrics
        </h3>
        
        {/* Period Selection */}
        <div className="flex space-x-2">
          <select
            value={`${selectedPeriod.period}-${selectedPeriod.days}`}
            onChange={(e) => {
              const [period, days] = e.target.value.split('-');
              handlePeriodChange(period, parseInt(days));
            }}
            className="bg-zinc-700 border border-zinc-600 rounded-md px-3 py-1 text-sm"
          >
            <option value="daily-7">Ultimi 7 giorni</option>
            <option value="daily-14">Ultimi 14 giorni</option>
            <option value="daily-30">Ultimi 30 giorni</option>
            <option value="weekly-4">Ultime 4 settimane</option>
            <option value="weekly-8">Ultime 8 settimane</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Average Score */}
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Media Generale</span>
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {stats.avgOverallScore}
          </div>
          <div className={`flex items-center text-sm ${getTrendColor(stats.trend)}`}>
            {getTrendIcon(stats.trend)}
            <span className="ml-1 capitalize">{stats.trend}</span>
          </div>
        </div>

        {/* Best Day */}
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Giorno Migliore</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500 mb-1">
            {stats.bestDay.overallScore}
          </div>
          <div className="text-xs text-zinc-500">
            {new Date(stats.bestDay.date).toLocaleDateString('it-IT')}
          </div>
        </div>

        {/* Worst Day */}
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Da Migliorare</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500 mb-1">
            {stats.worstDay.overallScore}
          </div>
          <div className="text-xs text-zinc-500">
            {new Date(stats.worstDay.date).toLocaleDateString('it-IT')}
          </div>
        </div>

        {/* Records Analyzed */}
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Record Analizzati</span>
            <Calendar className="w-4 h-4 text-info" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {data.totalRecords}
          </div>
          <div className="text-xs text-zinc-500">
            {data.period} per {data.days} giorni
          </div>
        </div>
      </div>

      {/* Chart Toggle */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveChart('overall')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            activeChart === 'overall' 
              ? 'bg-primary text-white' 
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          Score Generale
        </button>
        <button
          onClick={() => setActiveChart('components')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            activeChart === 'components' 
              ? 'bg-primary text-white' 
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          Componenti
        </button>
      </div>

      {/* Charts */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === 'overall' ? (
            <AreaChart data={formattedChartData}>
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
                formatter={(value: any) => [`${value}`, 'Score Engagement']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="overallScore"
                stroke="#FF6B00"
                strokeWidth={2}
                fill="url(#engagementGradient)"
              />
              <defs>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              <Legend />
              <Line
                type="monotone"
                dataKey="timeEngagement"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Tempo"
              />
              <Line
                type="monotone"
                dataKey="interactionEngagement"
                stroke="#10B981"
                strokeWidth={2}
                name="Interazioni"
              />
              <Line
                type="monotone"
                dataKey="depthEngagement"
                stroke="#8B5CF6"
                strokeWidth={2}
                name="Profondità"
              />
              <Line
                type="monotone"
                dataKey="conversionEngagement"
                stroke="#F59E0B"
                strokeWidth={2}
                name="Conversioni"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend for Components */}
      {activeChart === 'components' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <div>
              <div className="font-medium">Tempo</div>
              <div className="text-xs text-zinc-500">Engagement temporale</div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
            <div>
              <div className="font-medium">Interazioni</div>
              <div className="text-xs text-zinc-500">Click, scroll, form</div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <div>
              <div className="font-medium">Profondità</div>
              <div className="text-xs text-zinc-500">Scroll, pagine</div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <div>
              <div className="font-medium">Conversioni</div>
              <div className="text-xs text-zinc-500">Goal raggiunti</div>
            </div>
          </div>
        </div>
      )}

      {/* Period Info */}
      <div className="mt-4 text-center text-xs text-zinc-500">
        Analisi dal {new Date(data.dateRange.from).toLocaleDateString('it-IT')} al {new Date(data.dateRange.to).toLocaleDateString('it-IT')}
      </div>
    </motion.div>
  );
}