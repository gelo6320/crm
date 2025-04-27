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
    <div className="sales-funnel-container">
      {/* Header fisso */}
      <div className="fixed-header">
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
        
        {/* Stats Section - Now fixed at the top */}
        <div className="w-full mb-6">
          <FunnelStats stats={funnelStats} />
        </div>
      </div>
      
      {/* Funnel Board - Content scrollable */}
      <div className="scrollable-content">
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
      
      {/* CSS inline per il layout fisso */}
      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100%;
          margin: 0;
          padding: 0;
        }
        
        .sales-funnel-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        
        .fixed-header {
          padding: 1rem;
          background-color: rgb(24, 24, 27);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 50;
        }
        
        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}