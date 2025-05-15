// components/sales-funnel/FunnelStats.tsx
"use client";

import React, { ReactElement } from "react";
import { TrendingUp, Users, DollarSign, Award } from "lucide-react";
import { FunnelStats as FunnelStatsType } from "@/types";

interface FunnelStatsProps {
  stats: FunnelStatsType;
}

interface StatItemProps {
  title: string;
  value: string | number;
  icon: ReactElement;
  trend?: number;
  isLast?: boolean;
}

// Componente stat item modernizzato e più compatto
const StatItem: React.FC<StatItemProps> = ({ title, value, icon, trend, isLast = false }) => (
  <div className={`flex-1 flex items-center py-2 px-3 ${!isLast ? "border-r border-zinc-700/50 pr-4 md:pr-6" : ""}`}>
    <div className="bg-black/20 p-1.5 rounded-lg mr-3">
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-zinc-400 mb-0.5">{title}</p>
      <div className="flex items-center">
        <p className="text-sm md:text-base font-bold mr-2">{value}</p>
        {trend !== undefined && (
          <span className={`text-xs ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  </div>
);

// Funzione per formattare la valuta
const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
};

export default function FunnelStats({ stats }: FunnelStatsProps) {
  return (
    <div className="bg-zinc-800/80 backdrop-blur-sm rounded-lg shadow-md mb-5 transition-all duration-300 overflow-hidden">
      {/* Desktop View (orizzontale) */}
      <div className="hidden md:flex">
      <StatItem 
        title="Tasso Conversione" 
        value={`${stats.conversionRate}%`}
        icon={<TrendingUp size={18} strokeWidth={2} className="text-primary" />}
        trend={stats.conversionRateTrend}
      />
        
        <StatItem 
          title="Lead Totali" 
          value={stats.totalLeads}
          icon={<Users size={18} strokeWidth={2} className="text-blue-400" />}
        />
        
        <StatItem 
          title="Valore Potenziale" 
          value={formatMoney(stats.potentialValue)}
          icon={<DollarSign size={18} strokeWidth={2} className="text-amber-400" />}
        />
        
        <StatItem 
          title="Valore Realizzato" 
          value={formatMoney(stats.realizedValue)}
          icon={<Award size={18} strokeWidth={2} className="text-green-500" />}
          trend={stats.realizedValueTrend}
          isLast={true}
        />
      </div>
      
      {/* Mobile View (2x2 grid) */}
      <div className="md:hidden">
        <div className="flex">
          <StatItem 
            title="Tasso Conversione" 
            value={`${stats.conversionRate}%`}
            icon={<TrendingUp size={18} strokeWidth={2} className="text-primary" />}
            trend={2.5}
          />
          
          <StatItem 
            title="Lead Totali" 
            value={stats.totalLeads}
            icon={<Users size={18} strokeWidth={2} className="text-blue-400" />}
            isLast={true}
          />
        </div>
        
        <div className="flex border-t border-zinc-700/50">
          <StatItem 
            title="Val. Potenziale" 
            value={formatMoney(stats.potentialValue)}
            icon={<DollarSign size={18} strokeWidth={2} className="text-amber-400" />}
          />
          
          <StatItem 
            title="Val. Realizzato" 
            value={formatMoney(stats.realizedValue)}
            icon={<Award size={18} strokeWidth={2} className="text-green-500" />}
            trend={5.8}
            isLast={true}
          />
        </div>
      </div>
    </div>
  );
}