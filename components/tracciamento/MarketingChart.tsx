// components/tracciamento/MarketingChart.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TimeScale,
  TimeSeriesScale,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { MarketingOverview } from '@/lib/api/marketing';
import 'chartjs-adapter-date-fns';

// Registra i componenti necessari per Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  TimeSeriesScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MarketingChartProps {
  data: MarketingOverview;
  isLoading: boolean;
  timeRange: '7d' | '30d' | '90d';
}

export default function MarketingChart({ data, isLoading, timeRange }: MarketingChartProps) {
  const [activeMetric, setActiveMetric] = useState<'performance' | 'all' | 'leads' | 'conversions' | 'roas'>('performance');
  const [chartOptions, setChartOptions] = useState<ChartOptions<'line'>>({});
  const [processedData, setProcessedData] = useState<{
    dates: string[];
    leads: number[];
    conversions: number[];
    roas: number[];
    performance: number[];
  }>({ dates: [], leads: [], conversions: [], roas: [], performance: [] });
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const [isChartInitialized, setIsChartInitialized] = useState(false);
  
  // Elabora i dati in base al timeRange
  useEffect(() => {
    if (!data || !data.dates || data.dates.length === 0) {
      return;
    }
    
    let processedDates: string[] = [];
    let processedLeads: number[] = [];
    let processedConversions: number[] = [];
    let processedRoas: number[] = [];
    let processedPerformance: number[] = [];
    
    if (timeRange === '7d') {
      processedDates = [...data.dates];
      processedLeads = data.realLeads ? [...data.realLeads] : [...data.leads];
      processedConversions = [...data.conversions];
      processedRoas = [...data.roas];
      
      processedPerformance = data.dates.map((_, index) => {
        const leadValue = processedLeads[index] || 0;
        const convValue = processedConversions[index] || 0;
        const roasValue = data.roas[index] || 0;
        
        const maxLeads = Math.max(...processedLeads, 1);
        const maxConversions = Math.max(...processedConversions, 1);
        
        const leadsNorm = leadValue / maxLeads;
        const convNorm = convValue / maxConversions;
        
        if (maxLeads === 1 && maxConversions === 1 && roasValue === 0) {
          return leadValue;
        }
        
        return ((leadsNorm * 0.4) + (convNorm * 0.3) + (roasValue * 0.3)) * 10;
      });
    } else {
      const numDays = data.dates.length;
      const weeklyData: {
        dates: string[];
        leads: number[];
        conversions: number[];
        roas: number[];
        performance: number[];
      } = { dates: [], leads: [], conversions: [], roas: [], performance: [] };
      
      const daysPerWeek = 7;
      for (let i = 0; i < numDays; i += daysPerWeek) {
        const endIndex = Math.min(i + daysPerWeek - 1, numDays - 1);
        const dateLabel = data.dates[endIndex];
        weeklyData.dates.push(dateLabel);
        
        let weekLeads = 0;
        let weekConversions = 0;
        let weekRoas = 0;
        let daysInThisWeek = 0;
        
        const realLeadsData = data.realLeads || data.leads;
        
        for (let j = i; j <= endIndex; j++) {
          weekLeads += realLeadsData[j] || 0;
          weekConversions += data.conversions[j] || 0;
          weekRoas += data.roas[j] || 0;
          daysInThisWeek++;
        }
        
        weeklyData.leads.push(weekLeads);
        weeklyData.conversions.push(weekConversions);
        weeklyData.roas.push(Number((weekRoas / daysInThisWeek).toFixed(2)));
        
        const maxLeadsInPeriod = Math.max(...realLeadsData, 1);
        const maxConversionsInPeriod = Math.max(...data.conversions, 1);
        
        const leadsNorm = weekLeads / maxLeadsInPeriod * 7;
        const convNorm = weekConversions / maxConversionsInPeriod * 7;
        const roasValue = weekRoas / daysInThisWeek;
        
        if (maxLeadsInPeriod === 1 && maxConversionsInPeriod === 1 && roasValue === 0) {
          weeklyData.performance.push(weekLeads);
        } else {
          weeklyData.performance.push(((leadsNorm * 0.4) + (convNorm * 0.3) + (roasValue * 0.3)) * 10);
        }
      }
      
      processedDates = weeklyData.dates;
      processedLeads = weeklyData.leads;
      processedConversions = weeklyData.conversions;
      processedRoas = weeklyData.roas;
      processedPerformance = weeklyData.performance;
    }
    
    setProcessedData({
      dates: processedDates,
      leads: processedLeads,
      conversions: processedConversions,
      roas: processedRoas,
      performance: processedPerformance
    });
  }, [data, timeRange]);
  
  // Calcola i valori massimi per la scala y
  useEffect(() => {
    if (processedData.dates.length === 0) return;
    
    const maxLeads = Math.max(...processedData.leads);
    const maxConversions = Math.max(...processedData.conversions);
    const maxRoas = Math.max(...processedData.roas);
    const maxPerformance = Math.max(...processedData.performance);
    
    const yMaxLeads = Math.ceil(maxLeads * 1.3);
    const yMaxConversions = Math.ceil(maxConversions * 1.3);
    const yMaxRoas = Math.ceil(maxRoas * 1.3);
    const yMaxPerformance = Math.ceil(maxPerformance * 1.3);
    
    let xAxisConfig = {};
    
    if (timeRange === '7d') {
      xAxisConfig = {
        type: 'category' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'dd/MM'
          }
        }
      };
    } else if (timeRange === '30d' || timeRange === '90d') {
      xAxisConfig = {
        type: 'category' as const,
        ticks: {
          maxRotation: 0
        }
      };
    }

    const isMobile = window.innerWidth < 768;
    
    setChartOptions({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      elements: {
        point: {
          radius: isMobile ? (activeMetric === 'performance' ? 3 : 2) : (activeMetric === 'performance' ? 4 : 3),
          hoverRadius: isMobile ? 4 : 6,
        },
        line: {
          borderWidth: activeMetric === 'performance' ? 2 : 1.5,
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      layout: {
        padding: {
          top: 10,
          right: isMobile ? 0 : 5,
          bottom: 0, 
          left: isMobile ? 0 : 0
        }
      },
      scales: {
        x: {
          ...xAxisConfig,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            lineWidth: 0.5,
          },
          border: {
            width: 0.5,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)',
            autoSkip: true,
            maxTicksLimit: isMobile ? 5 : 7,
            font: {
              size: isMobile ? 8 : 9
            }
          }
        },
        y: {
          suggestedMax: activeMetric === 'performance' ? yMaxPerformance : yMaxLeads,
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            lineWidth: 0.5,
          },
          border: {
            width: 0.5,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)',
            padding: isMobile ? 2 : 5,
            precision: 0,
            maxTicksLimit: isMobile ? 4 : 5,
            font: {
              size: isMobile ? 8 : 9
            }
          }
        },
        ...(activeMetric === 'all' || activeMetric === 'roas' ? {
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            suggestedMax: yMaxRoas,
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
              color: 'rgba(255, 255, 255, 0.05)',
              lineWidth: 0.5,
            },
            border: {
              width: 0.5,
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              padding: isMobile ? 2 : 5,
              precision: 1,
              maxTicksLimit: isMobile ? 4 : 5,
              font: {
                size: isMobile ? 8 : 9
              }
            }
          }
        } : {})
      },
      plugins: {
        legend: {
          display: !isMobile,
          position: 'top' as const,
          align: 'start' as const,
          labels: {
            color: 'rgba(255, 255, 255, 0.7)',
            usePointStyle: true,
            pointStyle: 'circle',
            padding: isMobile ? 5 : 10,
            boxWidth: 6,
            boxHeight: 6,
            font: {
              size: isMobile ? 8 : 10
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: 'rgba(255, 255, 255, 0.9)',
          bodyColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: activeMetric === 'performance' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 107, 0, 0.5)',
          borderWidth: 1,
          padding: isMobile ? 6 : 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                if (label.includes('ROAS')) {
                  label += context.parsed.y.toFixed(2) + 'x';
                } else if (label.includes('Performance')) {
                  label += context.parsed.y.toFixed(1);
                } else {
                  label += context.parsed.y.toLocaleString();
                }
              }
              return label;
            },
            title: function(tooltipItems) {
              if (timeRange === '30d' || timeRange === '90d') {
                return 'Settimana del ' + tooltipItems[0].label;
              } 
              return tooltipItems[0].label;
            }
          }
        },
      },
    });

    setIsChartInitialized(true);
  }, [processedData, timeRange, activeMetric]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    
    const resizeTimeout = setTimeout(() => {
      handleResize();
    }, 50);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  useLayoutEffect(() => {
    if (isChartInitialized && chartInstance.current) {
      chartInstance.current.resize();
    }
  }, [isChartInitialized]);
  
  const chartRef = (chart: any) => {
    if (chart !== null) {
      chartInstance.current = chart;
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-zinc-800 rounded-xl p-3 h-60 flex items-center justify-center" style={{ borderRadius: '12px' }}>
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }
  
  const chartData = {
    labels: processedData.dates,
    datasets: [
      ...(activeMetric === 'performance' ? [{
        label: 'Performance',
        data: processedData.performance,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        yAxisID: 'y',
        tension: 0.3,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#10b981',
        pointHoverBorderWidth: 2,
        pointHoverRadius: 5,
        borderJoinStyle: 'round' as const,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'leads' ? [{
        label: 'Lead reali generati',
        data: processedData.leads,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y',
        tension: 0.2,
        borderWidth: 1.5,
        fill: false,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'conversions' ? [{
        label: 'Conversioni',
        data: processedData.conversions,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        yAxisID: 'y',
        tension: 0.2,
        borderWidth: 1.5,
        fill: false,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'roas' ? [{
        label: 'ROAS',
        data: processedData.roas,
        borderColor: '#FF6B00',
        backgroundColor: 'rgba(255, 107, 0, 0.5)',
        yAxisID: 'y1',
        tension: 0.2,
        borderWidth: 1.5,
        fill: false,
      }] : []),
    ],
  };
  
  const metricSummary = [
    {
      id: 'performance',
      label: 'Performance',
      value: processedData.performance.length > 0 ? 
        processedData.performance.reduce((sum, value) => sum + value, 0) / processedData.performance.length : 0,
      isDecimal: true,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/20',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
    },
    {
      id: 'leads',
      label: 'Lead reali',
      value: data.totalRealLeads || data.totalLeads,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
    },
    {
      id: 'conversions',
      label: 'Conversioni',
      value: data.totalConversions,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/20',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
    },
    {
      id: 'roas',
      label: 'ROAS medio',
      value: data.averageRoas,
      isDecimal: true,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
    },
  ];

  return (
    <motion.div 
      className="bg-zinc-800 rounded-xl p-3 sm:p-4 mb-3 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ borderRadius: '12px' }}
    >
      {/* Riepilogo metriche */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {metricSummary.map((metric) => (
          <button
            key={metric.id}
            onClick={() => setActiveMetric(metric.id as any)}
            className={`p-2 rounded-xl ${metric.bgColor} flex items-center transition-all ${activeMetric === metric.id ? 'ring-1 ring-white/30 scale-105' : 'hover:scale-102'}`}
            style={{ borderRadius: '10px' }}
          >
            <div className={`rounded-full p-1.5 ${metric.color} bg-white/10 mr-2`} style={{ borderRadius: '8px' }}>
              {metric.icon}
            </div>
            <div className="text-left">
              <p className="text-xs text-zinc-400">{metric.label}</p>
              <p className={`text-sm font-bold ${metric.color}`}>
                {metric.isDecimal ? `${metric.value.toFixed(1)}` : metric.value.toLocaleString()}
                {metric.id === 'roas' ? 'x' : ''}
              </p>
            </div>
          </button>
        ))}
      </div>
      
      {/* Filtri metrica */}
      <div className="flex flex-wrap gap-1.5 -mx-1 px-1 mb-3 overflow-x-auto scrollbar-none">
        {['performance', 'all', 'leads', 'conversions', 'roas'].map((metric) => (
          <button
            key={metric}
            onClick={() => setActiveMetric(metric as any)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
              activeMetric === metric
                ? metric === 'performance' ? 'bg-emerald-500 text-white' : 'bg-primary text-white'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
            style={{ borderRadius: '6px' }}
          >
            {metric === 'performance' ? 'Performance' :
             metric === 'all' ? 'Tutte' : 
             metric === 'leads' ? 'Lead reali' :
             metric === 'conversions' ? 'Conv.' : 'ROAS'}
          </button>
        ))}
      </div>
      
      {/* Grafico */}
      <div 
        ref={chartContainerRef}
        className="w-full h-56 md:h-64 -mx-3 sm:mx-0" 
        style={{ width: 'calc(100% + 24px)', marginLeft: '-12px' }}
      >
        <Line 
          ref={chartRef}
          options={chartOptions} 
          data={chartData} 
          plugins={[
            {
              id: 'glowEffect',
              beforeDatasetsDraw(chart) {
                const { ctx } = chart;
                if (activeMetric === 'performance' && chart.getDatasetMeta(0)?.visible) {
                  ctx.save();
                  ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
                  ctx.shadowBlur = 4;
                }
              },
              afterDatasetsDraw(chart) {
                const { ctx } = chart;
                if (activeMetric === 'performance') {
                  ctx.restore();
                }
              }
            }
          ]}
        />
      </div>
    </motion.div>
  );
}