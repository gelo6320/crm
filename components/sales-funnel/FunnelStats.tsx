// components/sales-funnel/FunnelStats.tsx
"use client";

import React, { ReactElement } from "react";
import { TrendingUp, Users, DollarSign, Award } from "lucide-react";
import { FunnelStats as FunnelStatsType } from "@/types";

interface FunnelStatsProps {
  stats: FunnelStatsType;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactElement;
  trend?: number;
  color?: string;
}

// Componente StatsCard migliorato con TypeScript corretto
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = "bg-zinc-800" }) => (
  <div className={`${color} rounded-lg p-3 transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px]`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-zinc-400 mb-1">{title}</p>
        <p className="text-xl font-bold">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center mt-1 text-xs">
            <span className={trend > 0 ? "text-green-500" : "text-red-500"}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          </div>
        )}
      </div>
      <div className="bg-black/20 p-2 rounded-lg">
        {icon}
      </div>
    </div>
  </div>
);

export default function FunnelStats({ stats }: FunnelStatsProps) {
  // Formato della valuta
  const formatMoney = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-zinc-900/50 rounded-xl p-4 shadow-md mb-6 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Tasso Conversione" 
          value={`${stats.conversionRate}%`}
          icon={<TrendingUp size={24} className="text-primary" />}
          trend={2.5}
        />
        
        <StatCard 
          title="Lead Totali" 
          value={stats.totalLeads}
          icon={<Users size={24} className="text-blue-400" />}
        />
        
        <StatCard 
          title="Valore Potenziale" 
          value={formatMoney(stats.potentialValue)}
          icon={<DollarSign size={24} className="text-amber-400" />}
        />
        
        <StatCard 
          title="Valore Realizzato" 
          value={formatMoney(stats.realizedValue)}
          icon={<Award size={24} className="text-green-500" />}
          trend={5.8}
        />
      </div>
    </div>
  );
}