// app/sales-funnel/page.tsx
"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import CustomFunnelBoard from "@/components/sales-funnel/FunnelBoard";
import FunnelStats from "@/components/sales-funnel/FunnelStats";
import { FunnelData, FunnelStats as FunnelStatsType } from "@/types";
import { fetchFunnelData } from "@/lib/api/funnel";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DeviceDetectionInitializer from "@/app/_device";
import "../funnel-styles.css";
import "../react-dnd-styles.css";

export default function SalesFunnelPage() {
  const [funnelData, setFunnelData] = useState<FunnelData>({
    new: [],
    contacted: [],
    qualified: [],
    opportunity: [],
    proposal: [],
    customer: [],
    lost: [],
  });
  
  const [funnelStats, setFunnelStats] = useState<FunnelStatsType>({
    totalLeads: 0,
    conversionRate: 0,
    potentialValue: 0,
    realizedValue: 0,
    lostValue: 0,
    serviceDistribution: {},
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadFunnelData();
  }, []);
  
  const loadFunnelData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchFunnelData();
      setFunnelData(data.funnelData);
      setFunnelStats(data.funnelStats);
    } catch (error) {
      console.error("Error loading funnel data:", error);
    } finally {
      setIsLoading(false);
    }
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
        
        <div className="flex flex-col gap-4">
          <div className="flex-1 overflow-hidden">
            <CustomFunnelBoard 
              funnelData={funnelData} 
              setFunnelData={setFunnelData} 
              onLeadMove={loadFunnelData}
            />
          </div>
          
          <div className="w-full shrink-0">
            <FunnelStats stats={funnelStats} />
          </div>
        </div>
      </div>
    </>
  );
}