// components/analytics/AnalyticsDashboard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Clock, 
  Activity,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { AnalyticsDashboard, AnalyticsInsight } from '@/types/analytics';

interface AnalyticsDashboardProps {
  dashboard: AnalyticsDashboard;
  isLoading: boolean;
}

export default function AnalyticsDashboardComponent({ dashboard, isLoading }: AnalyticsDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-900 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded mb-3"></div>
              <div className="h-8 bg-zinc-800 rounded mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No dashboard data available</p>
      </div>
    );
  }

  const { summary, insights, comparison } = dashboard;

  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getInsightIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle size={20} className="text-red-400" />;
      case 'medium': return <Info size={20} className="text-yellow-400" />;
      case 'low': return <CheckCircle size={20} className="text-green-400" />;
      default: return <Info size={20} className="text-blue-400" />;
    }
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    const color = change >= 0 ? 'text-emerald-400' : 'text-red-400';
    const icon = change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
    
    return (
      <div className={`flex items-center ${color} text-sm`}>
        {icon}
        <span className="ml-1">{sign}{change.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Engagement Score */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-orange-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Engagement</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getEngagementColor(summary.overallScore)}`}>
              {summary.overallScore}
            </div>
            {comparison && formatChange(comparison.engagementChange)}
          </div>
        </motion.div>

        {/* Confidence */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Confidence</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getConfidenceColor(summary.confidence)}`}>
              {summary.confidence}%
            </div>
            {comparison && formatChange(comparison.confidenceChange)}
          </div>
        </motion.div>

        {/* Sample Size */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Sessions</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {summary.sampleSize.toLocaleString()}
            </div>
            {comparison && (
              <div className={`flex items-center text-sm ${
                comparison.sampleSizeChange >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {comparison.sampleSizeChange >= 0 ? 
                  <TrendingUp size={14} /> : 
                  <TrendingDown size={14} />
                }
                <span className="ml-1">
                  {comparison.sampleSizeChange > 0 ? '+' : ''}{comparison.sampleSizeChange.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Peak Hour */}
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-zinc-400">Peak Hour</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {summary.peakHour.toString().padStart(2, '0')}:00
            </div>
            <div className="text-sm text-zinc-500">
              {summary.topInteraction}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <motion.div 
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Key Insights</h3>
            <span className="text-sm text-zinc-400">
              {insights.length} insights
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 8).map((insight, index) => (
              <motion.div
                key={insight.id || index}
                className="bg-zinc-800 rounded-lg p-4 border border-zinc-700"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.priority)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">
                        {insight.category}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        insight.priority === 'high' ? 'bg-red-900/30 text-red-400 border border-red-800' :
                        insight.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' :
                        'bg-green-900/30 text-green-400 border border-green-800'
                      }`}>
                        {insight.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {insight.message}
                    </p>
                    
                    {insight.recommendation && (
                      <p className="text-xs text-zinc-400 mt-2 italic">
                        💡 {insight.recommendation}
                      </p>
                    )}
                    
                    {insight.value !== undefined && (
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Value:</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-orange-400">
                            {insight.value}
                          </span>
                          {insight.change !== undefined && (
                            <span className={`ml-2 text-xs ${insight.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              ({insight.change > 0 ? '+' : ''}{insight.change}%)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {insights.length > 8 && (
            <div className="text-center mt-4">
              <span className="text-sm text-zinc-500">
                ... and {insights.length - 8} more insights
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Period Info */}
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Period:</span>
            <div className="font-medium text-white">{dashboard.currentPeriod.period}</div>
            <div className="text-xs text-zinc-500">{dashboard.currentPeriod.periodKey}</div>
          </div>
          
          <div>
            <span className="text-zinc-500">Top Source:</span>
            <div className="font-medium text-white">{summary.topSource}</div>
          </div>
          
          <div>
            <span className="text-zinc-500">Last Updated:</span>
            <div className="font-medium text-white">
              {new Date(dashboard.lastUpdated).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}