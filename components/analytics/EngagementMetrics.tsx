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

  // Prepare chart data with formatted dates
  const formattedChartData = chartData?.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <TrendingUp className="w-6 h-6 text-orange-500 mr-3" />
          Engagement Metrics
        </h2>
        
        <div className="text-sm text-zinc-400 capitalize">
          {timeframe} View
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Average Score */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Award className="w-5 h-5 text-orange-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Average Score</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {stats?.avgOverallScore || 0}
            </div>
            <div className={`flex items-center text-sm ${getTrendColor(stats?.trend || 'stable')}`}>
              {getTrendIcon(stats?.trend || 'stable')}
              <span className="ml-1 capitalize">{stats?.trend || 'stable'}</span>
            </div>
          </div>
        </motion.div>

        {/* Best Performance */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-emerald-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Best Day</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-emerald-400">
              {stats?.bestDay?.overallScore || 0}
            </div>
            <div className="text-xs text-zinc-500">
              {stats?.bestDay?.date ? new Date(stats.bestDay.date).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </motion.div>

        {/* Needs Improvement */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Lowest Day</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-red-400">
              {stats?.worstDay?.overallScore || 0}
            </div>
            <div className="text-xs text-zinc-500">
              {stats?.worstDay?.date ? new Date(stats.worstDay.date).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </motion.div>

        {/* Total Records */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Records</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {data.totalRecords?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-zinc-500">
              analyzed
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart Section */}
      <motion.div 
        className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Chart Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 text-orange-500 mr-2" />
            Engagement Trends
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
              Overall Score
            </button>
            <button
              onClick={() => setActiveChart('components')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeChart === 'components' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Components
            </button>
          </div>
        </div>

        {/* Chart */}
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
                  formatter={(value: any) => [`${value}`, 'Engagement Score']}
                  labelFormatter={(label) => `Date: ${label}`}
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
                    name === 'timeEngagement' ? 'Time' :
                    name === 'interactionEngagement' ? 'Interactions' :
                    name === 'depthEngagement' ? 'Depth' :
                    name === 'conversionEngagement' ? 'Conversions' : name
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
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

        {/* Components Legend */}
        {activeChart === 'components' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800">
            {[
              { name: 'Time', color: '#3B82F6', description: 'Time spent' },
              { name: 'Interactions', color: '#10B981', description: 'Clicks & forms' },
              { name: 'Depth', color: '#8B5CF6', description: 'Page depth' },
              { name: 'Conversions', color: '#F59E0B', description: 'Goals reached' }
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

      {/* Period Info */}
      {data.dateRange && (
        <div className="text-center text-sm text-zinc-500">
          Analysis from {new Date(data.dateRange.from).toLocaleDateString()} to {new Date(data.dateRange.to).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}