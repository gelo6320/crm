// components/sales-funnel/FunnelStats.tsx
"use client";

import { useEffect, useRef } from "react";
import { FunnelStats as FunnelStatsType } from "@/types";
import { formatMoney } from "@/lib/utils/format";
import Chart from "chart.js/auto";

interface FunnelStatsProps {
  stats: FunnelStatsType;
}

export default function FunnelStats({ stats }: FunnelStatsProps) {
  const conversionChartRef = useRef<HTMLCanvasElement>(null);
  const servicesChartRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Initialize conversion rate chart
    let conversionChart: Chart | null = null;
    
    if (conversionChartRef.current) {
      const ctx = conversionChartRef.current.getContext("2d");
      
      if (ctx) {
        conversionChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Acquisiti", "Persi"],
            datasets: [{
              data: [stats.conversionRate, 100 - stats.conversionRate],
              backgroundColor: ["#27ae60", "#e74c3c"],
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: "rgba(255, 255, 255, 0.7)",
                  font: {
                    size: 10,
                  },
                  boxWidth: 12,
                },
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.label}: ${context.raw}%`;
                  },
                },
              },
            },
            cutout: "70%",
          },
        });
      }
    }
    
    // Initialize services chart
    let servicesChart: Chart | null = null;
    
    if (servicesChartRef.current && Object.keys(stats.serviceDistribution).length > 0) {
      const ctx = servicesChartRef.current.getContext("2d");
      
      if (ctx) {
        const labels = Object.keys(stats.serviceDistribution);
        const data = Object.values(stats.serviceDistribution);
        
        // Colors for each service
        const colors = [
          "#FF6B00", "#3498db", "#e67e22", "#27ae60",
          "#9b59b6", "#f1c40f", "#e74c3c", "#1abc9c",
          "#34495e", "#2ecc71",
        ];
        
        servicesChart = new Chart(ctx, {
          type: "pie",
          data: {
            labels: labels.length > 0 ? labels : ["Nessun dato"],
            datasets: [{
              data: data.length > 0 ? data : [1],
              backgroundColor: data.length > 0 
                ? labels.map((_, i) => colors[i % colors.length]) 
                : ["rgba(0, 0, 0, 0.2)"],
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: "rgba(255, 255, 255, 0.7)",
                  font: {
                    size: 9,
                  },
                  boxWidth: 10,
                },
              },
            },
          },
        });
      }
    }
    
    // Cleanup charts on unmount
    return () => {
      if (conversionChart) {
        conversionChart.destroy();
      }
      
      if (servicesChart) {
        servicesChart.destroy();
      }
    };
  }, [stats]);
  
  return (
    <div className="bg-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-black/30">
        <h3 className="text-sm font-medium">Statistiche</h3>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Conversion rate */}
        <div className="bg-zinc-900/60 rounded-lg p-3">
          <h4 className="text-xs uppercase text-primary mb-2 border-b border-zinc-700 pb-1">
            Tasso conversione
          </h4>
          <div className="h-32 mb-2">
            <canvas ref={conversionChartRef}></canvas>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{stats.conversionRate}%</div>
            <div className="text-xs text-zinc-400">Tasso medio</div>
          </div>
        </div>
        
        {/* Value */}
        <div className="bg-zinc-900/60 rounded-lg p-3">
          <h4 className="text-xs uppercase text-primary mb-2 border-b border-zinc-700 pb-1">
            Valore totale
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-dotted border-zinc-700 pb-1">
              <span className="text-zinc-400">Potenziale:</span>
              <span className="font-medium">€{formatMoney(stats.potentialValue)}</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-zinc-700 pb-1">
              <span className="text-zinc-400">Realizzato:</span>
              <span className="font-medium">€{formatMoney(stats.realizedValue)}</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-zinc-700 pb-1">
              <span className="text-zinc-400">Perso:</span>
              <span className="font-medium">€{formatMoney(stats.lostValue)}</span>
            </div>
          </div>
        </div>
        
        {/* Services */}
        <div className="bg-zinc-900/60 rounded-lg p-3">
          <h4 className="text-xs uppercase text-primary mb-2 border-b border-zinc-700 pb-1">
            Servizi più venduti
          </h4>
          <div className="h-40">
            {Object.keys(stats.serviceDistribution).length > 0 ? (
              <canvas ref={servicesChartRef}></canvas>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                Nessun dato disponibile
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}