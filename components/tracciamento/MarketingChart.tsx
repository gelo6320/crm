// components/tracciamento/MarketingChart.tsx
import React, { useState, useEffect } from 'react';
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
      // Per 7 giorni, usa i dati giornalieri originali
      processedDates = [...data.dates];
      processedLeads = [...data.leads];
      processedConversions = [...data.conversions];
      processedRoas = [...data.roas];
      
      // Calcola l'indice di performance come media intelligente
      processedPerformance = data.dates.map((_, index) => {
        // Normalizza i valori tra 0 e 1 per leads e conversions
        const leadsNorm = data.leads[index] / Math.max(...data.leads);
        const convNorm = data.conversions[index] / Math.max(...data.conversions);
        const roasValue = data.roas[index];
        
        // Media ponderata che dà più peso al ROAS
        return ((leadsNorm * 0.3) + (convNorm * 0.3) + (roasValue * 0.4)) * 10;
      });
    } else {
      // Per 30 o 90 giorni, aggrega i dati settimanalmente
      const numDays = data.dates.length;
      const weeklyData: {
        dates: string[];
        leads: number[];
        conversions: number[];
        roas: number[];
        performance: number[];
      } = { dates: [], leads: [], conversions: [], roas: [], performance: [] };
      
      // Calcola il numero di giorni per settimana e aggrega
      const daysPerWeek = 7;
      for (let i = 0; i < numDays; i += daysPerWeek) {
        // Usa l'ultimo giorno della settimana come etichetta
        const endIndex = Math.min(i + daysPerWeek - 1, numDays - 1);
        const dateLabel = data.dates[endIndex];
        weeklyData.dates.push(dateLabel);
        
        // Calcola la media dei valori per la settimana
        let weekLeads = 0;
        let weekConversions = 0;
        let weekRoas = 0;
        let daysInThisWeek = 0;
        
        for (let j = i; j <= endIndex; j++) {
          weekLeads += data.leads[j];
          weekConversions += data.conversions[j];
          weekRoas += data.roas[j];
          daysInThisWeek++;
        }
        
        // Salva i totali settimanali
        weeklyData.leads.push(weekLeads);
        weeklyData.conversions.push(weekConversions);
        weeklyData.roas.push(Number((weekRoas / daysInThisWeek).toFixed(2))); // Media ROAS
        
        // Calcola l'indice di performance
        const leadsNorm = weekLeads / Math.max(...data.leads) * 7;
        const convNorm = weekConversions / Math.max(...data.conversions) * 7;
        const roasValue = weekRoas / daysInThisWeek;
        
        weeklyData.performance.push(((leadsNorm * 0.3) + (convNorm * 0.3) + (roasValue * 0.4)) * 10);
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
    
    // Trova il valore massimo delle serie di dati
    const maxLeads = Math.max(...processedData.leads);
    const maxConversions = Math.max(...processedData.conversions);
    const maxRoas = Math.max(...processedData.roas);
    const maxPerformance = Math.max(...processedData.performance);
    
    // Aggiungi un 40% in più per lo spazio
    const yMaxLeads = Math.ceil(maxLeads * 1.4);
    const yMaxConversions = Math.ceil(maxConversions * 1.4);
    const yMaxRoas = Math.ceil(maxRoas * 1.4);
    const yMaxPerformance = Math.ceil(maxPerformance * 1.4);
    
    // Configura le opzioni in base al timeRange
    let xAxisConfig = {};
    
    if (timeRange === '7d') {
      // Base giornaliera per 7 giorni
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
      // Base settimanale per 30 e 90 giorni
      xAxisConfig = {
        type: 'category' as const,
        ticks: {
          maxRotation: 0
        }
      };
    }
    
    // Aggiorna le opzioni del grafico
    setChartOptions({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      elements: {
        point: {
          radius: activeMetric === 'performance' ? 4 : 3, // Punti più grandi per performance
          hoverRadius: 6,
        },
        line: {
          borderWidth: activeMetric === 'performance' ? 3 : 2
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      },
      layout: {
        padding: {
          top: 20,
          right: 20, 
          bottom: 0, 
          left: 0
        }
      },
      scales: {
        x: {
          ...xAxisConfig,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            autoSkip: false,
            font: {
              size: 10
            }
          }
        },
        y: {
          suggestedMax: activeMetric === 'performance' ? yMaxPerformance : yMaxLeads,
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            padding: 10,
            precision: 0
          }
        },
        // Scala secondaria per ROAS (se attivo)
        ...(activeMetric === 'all' || activeMetric === 'roas' ? {
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            suggestedMax: yMaxRoas,
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              padding: 10,
              precision: 1
            }
          }
        } : {})
      },
      plugins: {
        legend: {
          position: 'top' as const,
          align: 'start' as const,
          labels: {
            color: 'rgba(255, 255, 255, 0.7)',
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            boxWidth: 8,
            boxHeight: 8,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: 'rgba(255, 255, 255, 0.9)',
          bodyColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: activeMetric === 'performance' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 107, 0, 0.5)',
          borderWidth: 1,
          padding: 12,
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
              // Formatta la data in base al timeRange
              if (timeRange === '30d' || timeRange === '90d') {
                return 'Settimana del ' + tooltipItems[0].label;
              } 
              return tooltipItems[0].label;
            }
          }
        },
      },
    });
  }, [processedData, timeRange, activeMetric]);
  
  // Se i dati sono ancora in caricamento, mostra un placeholder
  if (isLoading) {
    return (
      <div className="bg-zinc-800 rounded-lg p-4 h-80 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }
  
  // Configura i dati del grafico in base alla metrica attiva
  const chartData = {
    labels: processedData.dates,
    datasets: [
      ...(activeMetric === 'performance' ? [{
        label: 'Performance',
        data: processedData.performance,
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        yAxisID: 'y',
        tension: 0.3,
        borderWidth: 3,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#10b981',
        pointHoverBorderWidth: 3,
        pointHoverRadius: 6,
        borderJoinStyle: 'round' as const,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'leads' ? [{
        label: 'Lead generati',
        data: processedData.leads,
        borderColor: '#3b82f6', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y',
        tension: 0.2,
        borderWidth: 2,
        fill: false,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'conversions' ? [{
        label: 'Conversioni',
        data: processedData.conversions,
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        yAxisID: 'y',
        tension: 0.2,
        borderWidth: 2,
        fill: false,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'roas' ? [{
        label: 'ROAS',
        data: processedData.roas,
        borderColor: '#FF6B00', // primary
        backgroundColor: 'rgba(255, 107, 0, 0.5)',
        yAxisID: 'y1',
        tension: 0.2,
        borderWidth: 2,
        fill: false,
      }] : []),
    ],
  };
  
  // Calcola le metriche riepilogative
  const metricSummary = [
    {
      id: 'performance',
      label: 'Performance',
      value: processedData.performance.length > 0 ? 
        processedData.performance.reduce((sum, value) => sum + value, 0) / processedData.performance.length : 0,
      isDecimal: true,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/20',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
    },
    {
      id: 'leads',
      label: 'Lead totali',
      value: data.totalLeads,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
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
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
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
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
    },
  ];

  return (
    <motion.div 
      className="bg-zinc-800 rounded-lg p-6 mb-6 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h3 className="text-lg font-medium mb-4 md:mb-0">Andamento campagne Facebook</h3>
        
        <div className="flex flex-wrap gap-2">
          {['performance', 'all', 'leads', 'conversions', 'roas'].map((metric) => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                activeMetric === metric
                  ? metric === 'performance' ? 'bg-emerald-500 text-white' : 'bg-primary text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {metric === 'performance' ? 'Performance' :
               metric === 'all' ? 'Tutte' : 
               metric === 'leads' ? 'Lead' :
               metric === 'conversions' ? 'Conversioni' : 'ROAS'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Riepilogo metriche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {metricSummary.map((metric) => (
          <motion.div
            key={metric.id}
            className={`p-4 rounded ${metric.bgColor} flex items-center`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className={`rounded-full p-2 ${metric.color} bg-white/10 mr-3`}>
              {metric.icon}
            </div>
            <div>
              <p className="text-sm text-zinc-400">{metric.label}</p>
              <p className={`text-xl font-bold ${metric.color}`}>
                {metric.isDecimal ? `${metric.value.toFixed(1)}` : metric.value.toLocaleString()}
                {metric.id === 'roas' ? 'x' : ''}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Grafico a larghezza piena */}
      <div className="w-full h-64 md:h-80" style={{ width: '100%' }}>
        <Line 
          options={chartOptions} 
          data={chartData} 
          plugins={[
            {
              id: 'glowEffect',
              beforeDatasetsDraw(chart) {
                const { ctx } = chart;
                if (activeMetric === 'performance' && chart.getDatasetMeta(0)?.visible) {
                  ctx.save();
                  ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
                  ctx.shadowBlur = 8;
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