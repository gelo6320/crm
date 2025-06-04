// components/analytics/TemporalPatternsVisualization.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Activity,
  Award,
  Users,
  Eye,
  Target
} from 'lucide-react';
import { TemporalAnalysis } from '@/types/analytics';

interface TemporalPatternsVisualizationProps {
  data: TemporalAnalysis | null;
  isLoading: boolean;
  timeframe: string;
}

export default function TemporalPatternsVisualization({ 
  data, 
  isLoading, 
  timeframe 
}: TemporalPatternsVisualizationProps) {
  const [activeView, setActiveView] = useState<'hourly' | 'weekly'>('hourly');

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

  const { hourlyDistribution, weeklyDistribution, insights } = data;

  // Prepare hourly chart data
  const hourlyChartData = hourlyDistribution?.map(hour => ({
    ...hour,
    hourLabel: `${hour.hour.toString().padStart(2, '0')}:00`,
    combinedMetric: (hour.visits || 0) * 0.4 + (hour.engagement || 0) * 0.6 // FIX: Protezione valori undefined
  })) || [];

  // Prepare weekly chart data
  const weeklyChartData = weeklyDistribution?.map(day => ({
    ...day,
    dayLabel: day.dayName.substring(0, 3), // Mon, Tue, etc.
    performanceScore: (day.visits || 0) * 0.3 + (day.avgEngagement || 0) * 0.7 // FIX: Protezione valori undefined
  })) || [];

  // Get top performing hours (non-zero visits)
  const topHours = hourlyChartData
    .filter(hour => (hour.visits || 0) > 0)
    .sort((a, b) => (b.combinedMetric || 0) - (a.combinedMetric || 0))
    .slice(0, 5);

  // Get top performing days
  const topDays = weeklyChartData
    .filter(day => (day.visits || 0) > 0)
    .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
    .slice(0, 3);

  // Calculate totals - FIX: Protezione valori undefined
  const totalVisits = hourlyChartData.reduce((sum, hour) => sum + (hour.visits || 0), 0);
  const totalPageViews = hourlyChartData.reduce((sum, hour) => sum + (hour.pageViews || 0), 0);
  const totalConversions = hourlyChartData.reduce((sum, hour) => sum + (hour.conversions || 0), 0);
  const avgEngagement = totalVisits > 0 
    ? hourlyChartData.reduce((sum, hour) => sum + ((hour.engagement || 0) * (hour.visits || 0)), 0) / totalVisits 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Clock className="w-6 h-6 text-orange-500 mr-3" />
          Temporal Performance Analysis
        </h2>
        
        <div className="text-sm text-zinc-400 capitalize">
          {timeframe} • {(data.recordsAnalyzed || 0).toLocaleString()} records analyzed
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Total Visits</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {totalVisits.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500">
              Peak: {insights?.peakHour?.time || 'N/A'} ({(insights?.peakHour?.visits || 0)} visits)
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
              <Eye className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Page Views</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {totalPageViews.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500">
              Avg per visit: {totalVisits > 0 ? (totalPageViews / totalVisits).toFixed(1) : '0'}
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
              <Activity className="w-5 h-5 text-orange-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Avg Engagement</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {Math.round(avgEngagement || 0)}
            </div>
            <div className="text-xs text-zinc-500">
              Best day: {insights?.peakDay?.day || 'N/A'}
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
              <Target className="w-5 h-5 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Conversions</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {totalConversions.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500">
              Rate: {totalVisits > 0 ? ((totalConversions / totalVisits) * 100).toFixed(1) : '0'}%
            </div>
          </div>
        </motion.div>
      </div>

      {/* View Toggle */}
      <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
        {[
          { id: 'hourly', label: 'Hourly Performance', icon: Clock },
          { id: 'weekly', label: 'Daily Performance', icon: Calendar }
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

      {/* Charts Section */}
      <motion.div 
        className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {activeView === 'hourly' ? (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Hourly Performance Distribution</h3>
            
            {/* Hourly Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChartData}>
                  <defs>
                    <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="hourLabel" 
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
                      value,
                      name === 'visits' ? 'Visits' :
                      name === 'pageViews' ? 'Page Views' :
                      name === 'engagement' ? 'Engagement' :
                      name === 'conversions' ? 'Conversions' : name
                    ]}
                    labelFormatter={(label) => `Hour: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#visitsGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="#FF6B00"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top Hours Table */}
            <div className="space-y-4">
              <h4 className="text-base font-medium text-white">Top Performing Hours</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-sm font-medium text-zinc-400 pb-3">Hour</th>
                      <th className="text-right text-sm font-medium text-zinc-400 pb-3">Visits</th>
                      <th className="text-right text-sm font-medium text-zinc-400 pb-3">Page Views</th>
                      <th className="text-right text-sm font-medium text-zinc-400 pb-3">Engagement</th>
                      <th className="text-right text-sm font-medium text-zinc-400 pb-3">Conversions</th>
                      <th className="text-right text-sm font-medium text-zinc-400 pb-3">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topHours.map((hour, index) => (
                      <tr key={hour.hour} className="border-b border-zinc-800/50">
                        <td className="py-3 text-sm text-white font-medium">
                          {hour.hourLabel}
                          {index === 0 && <Award size={14} className="inline ml-2 text-yellow-500" />}
                        </td>
                        <td className="py-3 text-sm text-white text-right">{hour.visits || 0}</td>
                        <td className="py-3 text-sm text-white text-right">{hour.pageViews || 0}</td>
                        <td className="py-3 text-sm text-right">
                          <span className={`${
                            (hour.engagement || 0) >= 70 ? 'text-emerald-400' :
                            (hour.engagement || 0) >= 40 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {hour.engagement || 0}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-white text-right">{hour.conversions || 0}</td>
                        <td className="py-3 text-sm text-right">
                          <div className="flex items-center justify-end">
                            <div className="w-16 h-2 bg-zinc-800 rounded-full mr-3">
                              <div 
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${Math.min(100, ((hour.combinedMetric || 0) / Math.max(...topHours.map(h => h.combinedMetric || 0), 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-orange-400 font-medium">
                              {Math.round(hour.combinedMetric || 0)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Daily Performance Distribution</h3>
            
            {/* Weekly Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="dayLabel" 
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
                      value,
                      name === 'visits' ? 'Visits' :
                      name === 'avgEngagement' ? 'Avg Engagement' :
                      name === 'performanceScore' ? 'Performance Score' : name
                    ]}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return `${data?.dayName || label}`;
                    }}
                  />
                  <Bar 
                    dataKey="visits" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="avgEngagement" 
                    fill="#FF6B00"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Days Table */}
            <div className="space-y-4">
              <h4 className="text-base font-medium text-white">Top Performing Days</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-sm font-medium text-zinc-400 pb-3">Day</th>
                      <th className="text-right text-sm font-medium text-zinc-400 pb-3">Visits</th>
                      <th className="text-right text-sm font-medium text-zinc-400 pb-3">Avg Engagement</th>
                      <th className="text-right text-sm font-medium text-zinc-400 pb-3">Peak Hour</th>
                      <th className="text-right text-sm font-medium text-zinc-400 pb-3">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDays.map((day, index) => (
                      <tr key={day.dayOfWeek} className="border-b border-zinc-800/50">
                        <td className="py-3 text-sm text-white font-medium">
                          {day.dayName}
                          {index === 0 && <Award size={14} className="inline ml-2 text-yellow-500" />}
                        </td>
                        <td className="py-3 text-sm text-white text-right">{day.visits || 0}</td>
                        <td className="py-3 text-sm text-right">
                          <span className={`${
                            (day.avgEngagement || 0) >= 70 ? 'text-emerald-400' :
                            (day.avgEngagement || 0) >= 40 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {day.avgEngagement || 0}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-white text-right">
                          {(day.peakHour || 0).toString().padStart(2, '0')}:00
                        </td>
                        <td className="py-3 text-sm text-right">
                          <div className="flex items-center justify-end">
                            <div className="w-16 h-2 bg-zinc-800 rounded-full mr-3">
                              <div 
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${Math.min(100, ((day.performanceScore || 0) / Math.max(...topDays.map(d => d.performanceScore || 0), 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-orange-400 font-medium">
                              {Math.round(day.performanceScore || 0)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <div className="text-center text-sm text-zinc-500">
        Analysis period: {timeframe} • Best performing time: {insights?.peakHour?.time || 'N/A'} on {insights?.peakDay?.day || 'N/A'}
      </div>
    </div>
  );
}