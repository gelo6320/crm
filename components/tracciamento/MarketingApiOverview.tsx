// components/tracciamento/MarketingApiOverview.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchMarketingOverview, fetchCampaigns, MarketingOverview, Campaign } from '@/lib/api/marketing';
import MarketingChart from './MarketingChart';
import CampaignList from './CampaignList';
import { RefreshCw, Filter } from 'lucide-react';

export default function MarketingApiOverview() {
  const [overviewData, setOverviewData] = useState<MarketingOverview | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Carica i dati all'avvio e quando cambia l'intervallo di tempo
  useEffect(() => {
    loadMarketingData();
  }, [timeRange]);
  
  // Funzione per caricare i dati di marketing
  const loadMarketingData = async () => {
    try {
      setIsLoadingOverview(true);
      setIsLoadingCampaigns(true);
      
      // Carica i dati in parallelo
      const [overviewResponse, campaignsResponse] = await Promise.all([
        fetchMarketingOverview(timeRange),
        fetchCampaigns(timeRange)
      ]);
      
      setOverviewData(overviewResponse);
      setCampaigns(campaignsResponse);
    } catch (error) {
      console.error('Errore durante il caricamento dei dati di marketing:', error);
    } finally {
      setIsLoadingOverview(false);
      setIsLoadingCampaigns(false);
    }
  };
  
  return (
    <motion.div 
      className="space-y-6 mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Facebook Marketing API</h2>
        
        <div className="flex space-x-2">
          {/* Filtro intervallo di tempo */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm appearance-none pr-8 focus:ring-primary focus:border-primary"
            >
              <option value="7d">Ultimi 7 giorni</option>
              <option value="30d">Ultimi 30 giorni</option>
              <option value="90d">Ultimi 90 giorni</option>
            </select>
            <Filter size={14} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
          
          {/* Pulsante di aggiornamento */}
          <button 
            onClick={loadMarketingData}
            className="btn btn-outline p-1.5"
            disabled={isLoadingOverview || isLoadingCampaigns}
          >
            <RefreshCw size={16} className={isLoadingOverview || isLoadingCampaigns ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      
      {/* Grafico delle metriche principali */}
      {overviewData && (
        <MarketingChart data={overviewData} isLoading={isLoadingOverview} />
      )}
      
      {/* Elenco delle campagne con struttura espandibile */}
      <CampaignList campaigns={campaigns} isLoading={isLoadingCampaigns} />
    </motion.div>
  );
}