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
  const [activeMetric, setActiveMetric] = useState<'all' | 'leads' | 'conversions' | 'roas'>('all');
  const [chartOptions, setChartOptions] = useState<ChartOptions<'line'>>({});
  
  // Calcola i valori massimi per la scala y
  useEffect(() => {
    // Trova il valore massimo delle serie di dati
    const maxLeads = Math.max(...data.leads);
    const maxConversions = Math.max(...data.conversions);
    const maxRoas = Math.max(...data.roas);
    
    // Aggiungi un 20% in più per lo spazio
    const yMaxLeads = Math.ceil(maxLeads * 1.2);
    const yMaxConversions = Math.ceil(maxConversions * 1.2);
    const yMaxRoas = Math.ceil(maxRoas * 1.2);
    
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
    } else if (timeRange === '30d') {
      // Base settimanale per 30 giorni
      xAxisConfig = {
        type: 'category' as const,
        ticks: {
          callback: function(val: any, index: number) {
            // Mostra solo una data ogni 7 giorni (settimanale)
            return index % 7 === 0 ? data.dates[index] : '';
          },
          maxRotation: 0
        }
      };
    } else if (timeRange === '90d') {
      // Base settimanale per 90 giorni
      xAxisConfig = {
        type: 'category' as const,
        ticks: {
          callback: function(val: any, index: number) {
            // Mostra solo una data ogni 7 giorni (settimanale)
            return index % 7 === 0 ? data.dates[index] : '';
          },
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
          radius: 2, // Punti più piccoli per un aspetto più pulito
          hoverRadius: 5,
        },
        line: {
          borderWidth: 2
        }
      },
      layout: {
        padding: {
          top: 10, 
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
              size: 9
            }
          }
        },
        y: {
          suggestedMax: yMaxLeads,
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
                } else {
                  label += context.parsed.y;
                }
              }
              return label;
            }
          }
        },
      },
    });
  }, [data, timeRange, activeMetric]);
  
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
    labels: data.dates,
    datasets: [
      ...(activeMetric === 'all' || activeMetric === 'leads' ? [{
        label: 'Lead generati',
        data: data.leads,
        borderColor: '#3b82f6', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y',
        tension: 0.2,
        borderWidth: 2,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'conversions' ? [{
        label: 'Conversioni',
        data: data.conversions,
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        yAxisID: 'y',
        tension: 0.2,
        borderWidth: 2,
      }] : []),
      
      ...(activeMetric === 'all' || activeMetric === 'roas' ? [{
        label: 'ROAS',
        data: data.roas,
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
        
        <div className="flex space-x-2">
          {['all', 'leads', 'conversions', 'roas'].map((metric) => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                activeMetric === metric
                  ? 'bg-primary text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {metric === 'all' ? 'Tutte' : 
               metric === 'leads' ? 'Lead' :
               metric === 'conversions' ? 'Conversioni' : 'ROAS'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Riepilogo metriche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                {metric.isDecimal ? `${metric.value.toFixed(2)}x` : metric.value.toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Grafico a larghezza piena */}
      <div className="w-full h-64 md:h-80">
        <Line options={chartOptions} data={chartData} />
      </div>
    </motion.div>
  );
}