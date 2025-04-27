// components/sales-funnel/FunnelStats.tsx
"use client";

import { FunnelStats as FunnelStatsType } from "@/types";
import { formatMoney } from "@/lib/utils/format";

interface FunnelStatsProps {
  stats: FunnelStatsType;
}

export default function FunnelStats({ stats }: FunnelStatsProps) {
  return (
    <div className="bg-zinc-800 rounded-lg overflow-hidden shadow-md">
      <div className="px-4 py-2 bg-black/30">
        <h3 className="text-sm font-medium">Statistiche Funnel</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
        {/* Indicatori principali */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Conversion rate */}
          <div className="bg-zinc-900/60 rounded-lg p-3 flex-1 flex flex-col">
            <div className="text-xs uppercase text-primary font-medium mb-1">
              Tasso conversione
            </div>
            <div className="text-xl font-bold">
              {stats.conversionRate}%
            </div>
          </div>
          
          {/* Lead totali */}
          <div className="bg-zinc-900/60 rounded-lg p-3 flex-1 flex flex-col">
            <div className="text-xs uppercase text-primary font-medium mb-1">
              Lead totali
            </div>
            <div className="text-xl font-bold">
              {stats.totalLeads}
            </div>
          </div>
        </div>
        
        {/* Value Section */}
        <div className="bg-zinc-900/60 rounded-lg p-3 flex flex-col md:col-span-2">
          <div className="text-xs uppercase text-primary font-medium mb-2">
            Valore
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-zinc-400 text-xs">Potenziale:</span>
              <div className="font-medium text-base">€{formatMoney(stats.potentialValue)}</div>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-400 text-xs">Realizzato:</span>
              <div className="font-medium text-base text-success">€{formatMoney(stats.realizedValue)}</div>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-400 text-xs">Perso:</span>
              <div className="font-medium text-base text-danger">€{formatMoney(stats.lostValue)}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Distribuzione servizi */}
      {Object.keys(stats.serviceDistribution).length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-xs uppercase text-primary font-medium mb-2">
            Distribuzione Servizi
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.serviceDistribution).map(([service, count]) => (
              <div key={service} className="bg-zinc-900/60 text-xs px-2 py-1 rounded-md">
                {service}: <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}