// components/analytics/AnalyticsDashboard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Clock, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  Info,
  Activity
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
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-zinc-700 rounded mb-2"></div>
              <div className="h-8 bg-zinc-700 rounded mb-2"></div>
              <div className="h-3 bg-zinc-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="bg-zinc-800 rounded-lg p-6 animate-pulse">
          <div className="h-64 bg-zinc-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>Nessun dato dashboard disponibile</p>
      </div>
    );
  }

  const { summary, insights, comparison } = dashboard;

  // Format confidence score color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Format engagement score color
  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get insight icon based on priority
  const getInsightIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle size={16} className="text-red-400" />;
      case 'medium': return <Info size={16} className="text-yellow-400" />;
      case 'low': return <CheckCircle size={16} className="text-green-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <motion.div 
          className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700/50 transition-colors"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-400">Engagement Score</h3>
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getEngagementColor(summary.overallScore)}`}>
            {summary.overallScore}
          </div>
          <div className="text-xs text-zinc-500">
            Score generale di engagement
          </div>
          {comparison && (
            <div className="mt-2 flex items-center">
              {comparison.engagementChange >= 0 ? (
                <TrendingUp size={14} className="text-emerald-500 mr-1" />
              ) : (
                <TrendingDown size={14} className="text-red-500 mr-1" />
              )}
              <span className={`text-xs ${comparison.engagementChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {comparison.engagementChange > 0 ? '+' : ''}{comparison.engagementChange.toFixed(1)}
              </span>
            </div>
          )}
        </motion.div>

        {/* Confidence */}
        <motion.div 
          className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700/50 transition-colors"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-400">Confidence</h3>
            <Target className="w-5 h-5 text-info" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getConfidenceColor(summary.confidence)}`}>
            {summary.confidence}%
          </div>
          <div className="text-xs text-zinc-500">
            Affidabilità dei dati
          </div>
          {comparison && (
            <div className="mt-2 flex items-center">
              {comparison.confidenceChange >= 0 ? (
                <TrendingUp size={14} className="text-emerald-500 mr-1" />
              ) : (
                <TrendingDown size={14} className="text-red-500 mr-1" />
              )}
              <span className={`text-xs ${comparison.confidenceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {comparison.confidenceChange > 0 ? '+' : ''}{comparison.confidenceChange.toFixed(1)}%
              </span>
            </div>
          )}
        </motion.div>

        {/* Sample Size */}
        <motion.div 
          className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700/50 transition-colors"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-400">Sample Size</h3>
            <Users className="w-5 h-5 text-success" />
          </div>
          <div className="text-3xl font-bold mb-2 text-white">
            {summary.sampleSize.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-500">
            Sessioni analizzate
          </div>
          {comparison && (
            <div className="mt-2 flex items-center">
              {comparison.sampleSizeChange >= 0 ? (
                <TrendingUp size={14} className="text-emerald-500 mr-1" />
              ) : (
                <TrendingDown size={14} className="text-red-500 mr-1" />
              )}
              <span className={`text-xs ${comparison.sampleSizeChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {comparison.sampleSizeChange > 0 ? '+' : ''}{comparison.sampleSizeChange.toLocaleString()}
              </span>
            </div>
          )}
        </motion.div>

        {/* Peak Hour */}
        <motion.div 
          className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700/50 transition-colors"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-400">Peak Hour</h3>
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div className="text-3xl font-bold mb-2 text-white">
            {summary.peakHour.toString().padStart(2, '0')}:00
          </div>
          <div className="text-xs text-zinc-500">
            Ora di massimo traffico
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Top interaction: {summary.topInteraction}
          </div>
        </motion.div>
      </div>

      {/* Insights Section */}
      {insights && insights.length > 0 && (
        <motion.div 
          className="bg-zinc-800 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium flex items-center">
              <BarChart3 className="w-5 h-5 text-primary mr-2" />
              Insights Analytics
            </h3>
            <span className="text-sm text-zinc-400">
              {insights.length} insights generati
            </span>
          </div>

          <div className="space-y-3">
            {insights.slice(0, 6).map((insight, index) => (
              <motion.div
                key={insight.id || index}
                className="flex items-start p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-700/30 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="mr-3 mt-0.5">
                  {getInsightIcon(insight.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {insight.category}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      insight.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                      insight.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-green-900/30 text-green-400'
                    }`}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 mb-1">
                    {insight.message}
                  </p>
                  {insight.recommendation && (
                    <p className="text-xs text-zinc-400 italic">
                      💡 {insight.recommendation}
                    </p>
                  )}
                  {insight.value !== undefined && (
                    <div className="mt-2 flex items-center">
                      <span className="text-xs text-zinc-500 mr-2">Valore:</span>
                      <span className="text-sm font-medium text-primary">
                        {insight.value}
                        {insight.change !== undefined && (
                          <span className={`ml-1 ${insight.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            ({insight.change > 0 ? '+' : ''}{insight.change}%)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {insights.length > 6 && (
              <div className="text-center pt-3">
                <span className="text-sm text-zinc-400">
                  ... e altri {insights.length - 6} insights
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Additional Info */}
      <motion.div 
        className="bg-zinc-800 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-medium mb-4">Informazioni Aggiuntive</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-zinc-400">Periodo:</span>
            <div className="font-medium">{dashboard.currentPeriod.period}</div>
            <div className="text-xs text-zinc-500">{dashboard.currentPeriod.periodKey}</div>
          </div>
          
          <div>
            <span className="text-zinc-400">Top Source:</span>
            <div className="font-medium">{summary.topSource}</div>
          </div>
          
          <div>
            <span className="text-zinc-400">Ultimo aggiornamento:</span>
            <div className="font-medium">
              {new Date(dashboard.lastUpdated).toLocaleString('it-IT')}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}