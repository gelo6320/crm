// components/sales-funnel/FunnelStats.tsx
"use client";

import { FunnelStats as FunnelStatsType } from "@/types";
import { formatMoney } from "@/lib/utils/format";

interface FunnelStatsProps {
  stats: FunnelStatsType;
}

export default function FunnelStats({ stats }: FunnelStatsProps) {
  return (
    <div className="bg-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-black/30">
        <h3 className="text-sm font-medium">Statistiche</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3">
        {/* Conversion rate */}
        <div className="bg-zinc-900/60 rounded p-3 flex justify-between items-center">
          <div className="text-xs uppercase text-primary font-medium">
            Tasso conversione
          </div>
          <div className="text-base font-bold">
            {stats.conversionRate}%
          </div>
        </div>
        
        {/* Value */}
        <div className="bg-zinc-900/60 rounded p-3 flex flex-col">
          <div className="text-xs uppercase text-primary font-medium mb-1">
            Valore
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-zinc-400">Potenziale:</span>
              <div className="font-medium">€{formatMoney(stats.potentialValue)}</div>
            </div>
            <div>
              <span className="text-zinc-400">Realizzato:</span>
              <div className="font-medium">€{formatMoney(stats.realizedValue)}</div>
            </div>
            <div>
              <span className="text-zinc-400">Perso:</span>
              <div className="font-medium">€{formatMoney(stats.lostValue)}</div>
            </div>
          </div>
        </div>
        
        {/* Services */}
        <div className="bg-zinc-900/60 rounded p-3 flex justify-between items-center">
          <div className="text-xs uppercase text-primary font-medium">
            Lead totali
          </div>
          <div className="text-base font-bold">
            {stats.totalLeads}
          </div>
        </div>
      </div>
    </div>
  );
}