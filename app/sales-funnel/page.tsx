// app/sales-funnel/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, PieChart, BarChart } from "lucide-react";
import ModernFunnelBoard from "@/components/sales-funnel/ModernFunnelBoard";
import ModernFunnelStats from "@/components/sales-funnel/ModernFunnelStats";
import { FunnelData, FunnelStats as FunnelStatsType } from "@/types";
import { fetchFunnelData } from "@/lib/api/funnel";
import "@/app/modern-funnel-styles.css";

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
  const [activeView, setActiveView] = useState<'board' | 'stats'>('board');
  
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
    return (
      <div className="loading-container">
        <motion.div
          animate={{
            rotate: 360,
            transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
          }}
        >
          <RefreshCw size={32} className="text-orange-500" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-zinc-400 mt-4"
        >
          Caricamento dati...
        </motion.p>
      </div>
    );
  }
  
  return (
    <div className="sales-funnel-page">
      <div className="page-header">
        <motion.h1 
          className="page-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Sales Funnel
        </motion.h1>
        
        <div className="actions-container">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${activeView === 'board' ? 'active' : ''}`}
              onClick={() => setActiveView('board')}
            >
              <BarChart size={16} />
              <span>Board</span>
            </button>
            <button 
              className={`toggle-btn ${activeView === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveView('stats')}
            >
              <PieChart size={16} />
              <span>Statistiche</span>
            </button>
          </div>
          
          <motion.button 
            onClick={loadFunnelData}
            className="refresh-btn"
            disabled={isLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </motion.button>
        </div>
      </div>
      
      <div className="funnel-content">
        <motion.div 
          className="stats-wrapper"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ModernFunnelStats stats={funnelStats} />
        </motion.div>
        
        <motion.div 
          className="board-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ display: activeView === 'board' ? 'block' : 'none' }}
        >
          <ModernFunnelBoard 
            funnelData={funnelData} 
            setFunnelData={setFunnelData} 
            onLeadMove={loadFunnelData}
          />
        </motion.div>
      </div>
    </div>
  );
}