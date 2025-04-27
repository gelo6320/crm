// app/sales-funnel/page.tsx
"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import CustomFunnelBoard from "@/components/sales-funnel/FunnelBoard";
import FunnelStats from "@/components/sales-funnel/FunnelStats";
import { FunnelData, FunnelStats as FunnelStatsType } from "@/types";
import { fetchFunnelData } from "@/lib/api/funnel";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Script from "next/script";
import "../funnel-styles.css";

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
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium">Sales Funnel</h1>
        <button 
          onClick={loadFunnelData}
          className="btn btn-outline p-1.5"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>
      
      {/* Stats Section - Now at the top */}
      <div className="w-full mb-6">
        <FunnelStats stats={funnelStats} />
      </div>
      
      {/* Funnel Board - Takes full width */}
      <div className="flex-1 overflow-hidden">
        <CustomFunnelBoard 
          funnelData={funnelData} 
          setFunnelData={setFunnelData} 
          onLeadMove={loadFunnelData}
        />
      </div>
      
      {/* GSAP and Draggable Scripts */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/gsap.min.js" 
        strategy="beforeInteractive"
      />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/Draggable.min.js" 
        strategy="beforeInteractive"
      />
    </div>
  );
}