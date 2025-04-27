// app/sales-funnel/page.tsx
"use client";

import React, { useState, useEffect, ReactElement } from "react";
import { RefreshCw, TrendingUp, Users, DollarSign, Award } from "lucide-react";
import CustomFunnelBoard from "@/components/sales-funnel/FunnelBoard";
import { FunnelData, FunnelStats, FunnelItem } from "@/types";
import { fetchFunnelData } from "@/lib/api/funnel";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DeviceDetectionInitializer from "@/app/_device";

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

export default function SalesFunnelPage(): ReactElement {
  const [funnelData, setFunnelData] = useState<FunnelData>({
    new: [] as FunnelItem[],
    contacted: [] as FunnelItem[],
    qualified: [] as FunnelItem[],
    opportunity: [] as FunnelItem[],
    proposal: [] as FunnelItem[],
    customer: [] as FunnelItem[],
    lost: [] as FunnelItem[],
  });
  
  const [funnelStats, setFunnelStats] = useState<FunnelStats>({
    totalLeads: 0,
    conversionRate: 0,
    potentialValue: 0,
    realizedValue: 0,
    lostValue: 0,
    serviceDistribution: {},
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  useEffect(() => {
    loadFunnelData();
  }, []);

  const loadFunnelData = async (): Promise<void> => {
    try {
      setRefreshing(true);
      const data = await fetchFunnelData();
      setFunnelData(data.funnelData);
      setFunnelStats(data.funnelStats);
    } catch (error) {
      console.error("Error loading funnel data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Formato della valuta
  const formatMoney = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <>
      {/* Device detection per migliorare l'esperienza mobile */}
      <DeviceDetectionInitializer />
      
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium">Sales Funnel</h1>
          <button 
            onClick={loadFunnelData}
            className="btn btn-outline p-1.5"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
        
        {/* Dashboard Stats */}
        <div className="bg-zinc-900/50 rounded-xl p-4 shadow-md mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard 
              title="Tasso Conversione" 
              value={`${funnelStats.conversionRate}%`}
              icon={<TrendingUp size={24} className="text-primary" />}
              trend={2.5}
            />
            
            <StatCard 
              title="Lead Totali" 
              value={funnelStats.totalLeads}
              icon={<Users size={24} className="text-blue-400" />}
            />
            
            <StatCard 
              title="Valore Potenziale" 
              value={formatMoney(funnelStats.potentialValue)}
              icon={<DollarSign size={24} className="text-amber-400" />}
            />
            
            <StatCard 
              title="Valore Realizzato" 
              value={formatMoney(funnelStats.realizedValue)}
              icon={<Award size={24} className="text-green-500" />}
              trend={5.8}
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex-1 overflow-hidden">
            <CustomFunnelBoard 
              funnelData={funnelData} 
              setFunnelData={setFunnelData} 
              onLeadMove={loadFunnelData}
            />
          </div>
        </div>
      </div>
    </>
  );
}