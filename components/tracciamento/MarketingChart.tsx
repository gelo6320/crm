// components/tracciamento/MarketingChart.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  TimeSeriesScale
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
  Legend
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
  
  // Calcola l'indicatore di performance
  const calculatePerformance = useMemo(() => {
    return (leads: number[], conversions: number[], roas: number[]) => {
      // Normalizza i valori per creare un indicatore di performance
      return leads.map((lead, index) => {
        const leadScore = Math.min(lead / 50, 1); // Normalizza con un massimo di 50 lead
        const convScore = Math.min(conversions[index] / 10, 1); // Normalizza con un massimo di 10 conversioni
        const roasScore = Math.min(roas[index] / 10, 1); // Normalizza con un massimo di 10x ROAS
        
        // Calcola il punteggio pesato (lead 30%, conversioni 30%, ROAS 40%)
        const weightedScore = (leadScore * 0.3) + (convScore * 0.3) + (roasScore * 0.4);
        
        // Scala il punteggio in un range significativo (0-100)
        return Math.round(weightedScore * 100);
      });
    };
  }, []);
  
  // Elabora i dati in base al timeRange
  useEffect(() => {
    if (!data || !data.dates || data.dates.length === 0) {
      return;
    }
    
    let processedDates: string[] = [];
    let processedLeads: number[] = [];
    let processedConversions: number[] = [];
    let processedRoas: number[] = [];
    
    if (timeRange === '7d') {
      // Per 7 giorni, usa i dati giornalieri originali
      processedDates = [...data.dates];
      processedLeads = [...data.leads];
      processedConversions = [...data.conversions];
      processedRoas = [...data.roas];
    } else {
      // Per 30 o 90 giorni, aggrega i dati settimanalmente
      const numDays = data.dates.length;
      const weeklyData: {
        dates: string[];
        leads: number[];
        conversions: number[];
        roas: number[];
      } = { dates: [], leads: [], conversions: [], roas: [] };
      
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
      }
      
      processedDates = weeklyData.dates;
      processedLeads = weeklyData.leads;
      processedConversions = weeklyData.conversions;
      processedRoas = weeklyData.roas;
    }
    
    // Calcola l'indicatore di performance
    const performanceData = calculatePerformance(processedLeads, processedConversions, processedRoas);
    
    setProcessedData({
      dates: processedDates,
      leads: processedLeads,
      conversions: processedConversions,
      roas: processedRoas,
      performance: performanceData
    });
  }, [data, timeRange, calculatePerformance]);
  
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
          borderWidth: activeMetric === 'performance' ? 3 : 2, // Linea più spessa per performance
          tension: 0.3,  // Curva più morbida
        }
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
        y1: activeMetric === 'all' || activeMetric === 'roas' ? {
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
        } : undefined
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
          borderColor: 'rgba(255, 107, 0, 0.5)',
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
                  label += context.parsed.y.toLocaleString() + '/100';
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
        borderColor: '#10e972', // Verde brillante
        backgroundColor: 'rgba(16, 233, 114, 0.5)',
        yAxisID: 'y',
        tension: 0.3,
        borderWidth: 3,
        // Effetto glow
        shadowColor: 'rgba(16, 233, 114, 0.8)',
        shadowBlur: 15,
        fill: false,
        // Aggiungi un effetto ombra intorno alla linea
        borderDash: [],
        pointBackgroundColor: '#10e972',
        pointBorderColor: 'rgba(16, 233, 114, 0.8)',
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#10e972',
        pointHoverRadius: 7,
        pointRadius: 4,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'leads' ? [{
        label: 'Lead generati',
        data: processedData.leads,
        borderColor: '#3b82f6', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y',
        tension: 0.2,
        borderWidth: 2,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'conversions' ? [{
        label: 'Conversioni',
        data: processedData.conversions,
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        yAxisID: 'y',
        tension: 0.2,
        borderWidth: 2,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'roas' ? [{
        label: 'ROAS',
        data: processedData.roas,
        borderColor: '#FF6B00', // primary
        backgroundColor: 'rgba(255, 107, 0, 0.5)',
        yAxisID: 'y1',
        tension: 0.2,
        borderWidth: 2,
      }] : []),
    ],
  };
  
  // Calcola le metriche riepilogative
  const metricSummary = [
    {
      id: 'performance',
      label: 'Performance',
      value: processedData.performance.length > 0 ? 
             processedData.performance.reduce((sum, val) => sum + val, 0) / processedData.performance.length : 0,
      isPerformance: true,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
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
                  ? metric === 'performance'
                    ? 'bg-green-500 text-white shadow-glow-green' 
                    : 'bg-primary text-white'
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 overflow-x-auto pb-2">
        <div className="flex md:block min-w-[280px] space-x-2 md:space-x-0">
          {metricSummary.map((metric) => (
            <motion.div
              key={metric.id}
              className={`p-4 rounded ${metric.bgColor} flex items-center ${
                metric.id === 'performance' ? 'md:mb-4 shadow-glow-sm' : 'md:mb-0'
              }`}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={() => setActiveMetric(metric.id as any)}
            >
              <div className={`rounded-full p-2 ${metric.color} bg-white/10 mr-3`}>
                {metric.icon}
              </div>
              <div>
                <p className="text-sm text-zinc-400">{metric.label}</p>
                <p className={`text-base md:text-xl font-bold ${metric.color}`}>
                  {metric.isPerformance 
                    ? `${Math.round(metric.value)}/100` 
                    : metric.isDecimal 
                      ? `${metric.value.toFixed(2)}x` 
                      : metric.value.toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Grafico a larghezza piena */}
      <div className="w-full h-64 md:h-80 overflow-visible">
        <Line 
          options={chartOptions} 
          data={chartData} 
        />
      </div>
    </motion.div>
  );
}