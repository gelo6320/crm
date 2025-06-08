// components/analytics/TemporalPatternsSimple.tsx - Versione Raffinata
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SmoothCorners } from 'react-smooth-corners';
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
  Users,
  Eye,
  Target
} from 'lucide-react';
import { TemporalAnalysis } from '@/lib/api/analytics';

interface TemporalPatternsSimpleProps {
  data: TemporalAnalysis | null;
  isLoading: boolean;
}

export default function TemporalPatternsSimple({ 
  data, 
  isLoading
}: TemporalPatternsSimpleProps) {
  const [activeView, setActiveView] = useState<'hourly' | 'weekly'>('hourly');

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {/* Skeleton metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="relative">
              <SmoothCorners corners="3" borderRadius="20" />
              <div className="relative bg-white/40 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-[20px] p-4 sm:p-6 animate-pulse">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Skeleton chart */}
        <div className="relative">
          <SmoothCorners corners="3" borderRadius="24" />
          <div className="relative bg-white/40 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-[24px] p-6 animate-pulse">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const { hourlyDistribution, weeklyDistribution, summary } = data;

  // Prepara dati
  const hourlyChartData = hourlyDistribution?.map(hour => ({
    ...hour,
    hourLabel: `${hour.hour.toString().padStart(2, '0')}:00`,
  })) || [];

  const weeklyChartData = weeklyDistribution?.map(day => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return {
      ...day,
      dayLabel: dayNames[day.dayOfWeek] || 'N/A',
    };
  }) || [];

  // Calcola metriche
  const totalVisits = hourlyChartData.reduce((sum, hour) => sum + (hour.visits || 0), 0);
  const totalPageViews = hourlyChartData.reduce((sum, hour) => sum + (hour.pageViews || 0), 0);
  const totalConversions = hourlyChartData.reduce((sum, hour) => sum + (hour.conversions || 0), 0);
  const avgEngagement = totalVisits > 0 
    ? hourlyChartData.reduce((sum, hour) => sum + ((hour.engagement || 0) * (hour.visits || 0)), 0) / totalVisits 
    : 0;

  const conversionRate = totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;

  const metrics = [
    {
      icon: Users,
      value: totalVisits.toLocaleString(),
      label: 'Visite',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: Eye,
      value: totalPageViews.toLocaleString(),
      label: 'Visualizzazioni',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: TrendingUp,
      value: Math.round(avgEngagement).toString(),
      label: 'Coinvolgimento',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      icon: Target,
      value: `${conversionRate.toFixed(1)}%`,
      label: 'Conversioni',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metriche principali */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <SmoothCorners corners="3" borderRadius="20" />
              <div className="relative bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-sm border border-white/40 dark:border-white/20 rounded-[20px] p-4 sm:p-6 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${metric.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {metric.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Toggle vista */}
      <div className="relative">
        <SmoothCorners corners="2.5" borderRadius="16" />
        <div className="relative bg-white/40 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-2xl p-1">
          <div className="flex">
            {[
              { id: 'hourly', label: 'Orario', icon: Clock },
              { id: 'weekly', label: 'Giornaliero', icon: Calendar }
            ].map(view => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as any)}
                  className={`relative flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeView === view.id 
                      ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grafico principale */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SmoothCorners corners="3" borderRadius="24" />
        <div className="relative bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/20 rounded-[24px] p-4 sm:p-6">
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {activeView === 'hourly' ? (
                <ComposedChart data={hourlyChartData}>
                  <defs>
                    <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
                  <XAxis 
                    dataKey="hourLabel" 
                    stroke="#9CA3AF"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#374151',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any, name: any) => [
                      value,
                      name === 'visits' ? 'Visite' :
                      name === 'engagement' ? 'Coinvolgimento' : name
                    ]}
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
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              ) : (
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
                  <XAxis 
                    dataKey="dayLabel" 
                    stroke="#9CA3AF"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#374151',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any, name: any) => [
                      value,
                      name === 'visits' ? 'Visite' : name
                    ]}
                  />
                  <Bar 
                    dataKey="visits" 
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          
          {/* Info aggiuntive minimali */}
          {summary && (
            <div className="mt-4 pt-4 border-t border-white/30 dark:border-white/20">
              <div className="flex justify-center items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                <span>Picco: {summary.peakHour?.time || '--'}</span>
                <span>•</span>
                <span>Giorno top: {summary.peakDay?.day || '--'}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}