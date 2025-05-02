// components/tracciamento/CampaignList.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Campaign, AdSet, Ad } from '@/lib/api/marketing';
import { ChevronDown, ChevronRight, DollarSign, BarChart2, Users, Activity } from 'lucide-react';

interface CampaignListProps {
  campaigns: Campaign[];
  isLoading: boolean;
}

export default function CampaignList({ campaigns, isLoading }: CampaignListProps) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [expandedAdSets, setExpandedAdSets] = useState<Record<string, boolean>>({});
  
  // Toggle espansione campagna
  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };
  
  // Toggle espansione adset
  const toggleAdSet = (adSetId: string) => {
    setExpandedAdSets(prev => ({
      ...prev,
      [adSetId]: !prev[adSetId]
    }));
  };
  
  // Formatta valuta
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Ottieni la classe di stato
  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'PAUSED':
        return 'bg-amber-500/20 text-amber-400';
      case 'DISABLED':
      case 'ARCHIVED':
        return 'bg-zinc-500/20 text-zinc-400';
      default:
        return 'bg-zinc-500/20 text-zinc-400';
    }
  };
  
  // Animazioni per framer-motion
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };
  
  const contentVariants = {
    hidden: { opacity: 0, height: 0 },
    show: { 
      opacity: 1, 
      height: 'auto',
      transition: { duration: 0.3 }
    }
  };
  
  // Rendering dei dati metrici per ciascun livello
  const renderMetrics = (item: Campaign | AdSet | Ad) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-3">
      <div className="rounded bg-zinc-700/50 p-2">
        <div className="flex items-center text-xs text-zinc-400 mb-1">
          <Users size={12} className="mr-1" />
          <span>Lead</span>
        </div>
        <div className="text-sm font-medium flex items-center justify-between">
          <span>{item.leads}</span>
          <span className="text-xs text-zinc-400">{formatCurrency(item.costPerLead)}/lead</span>
        </div>
      </div>
      
      <div className="rounded bg-zinc-700/50 p-2">
        <div className="flex items-center text-xs text-zinc-400 mb-1">
          <Activity size={12} className="mr-1" />
          <span>Conversioni</span>
        </div>
        <div className="text-sm font-medium flex items-center justify-between">
          <span>{item.conversions}</span>
          <span className="text-xs text-zinc-400">{formatCurrency(item.costPerConversion)}/conv</span>
        </div>
      </div>
      
      <div className="rounded bg-zinc-700/50 p-2">
        <div className="flex items-center text-xs text-zinc-400 mb-1">
          <DollarSign size={12} className="mr-1" />
          <span>Spesa</span>
        </div>
        <div className="text-sm font-medium">
          {formatCurrency(item.spend)}
        </div>
      </div>
      
      <div className="rounded bg-zinc-700/50 p-2">
        <div className="flex items-center text-xs text-zinc-400 mb-1">
          <BarChart2 size={12} className="mr-1" />
          <span>ROAS</span>
        </div>
        <div className="text-sm font-medium">
          {item.roas.toFixed(2)}x
        </div>
      </div>
    </div>
  );
  
  // Renderizza una singola Ad
  const renderAd = (ad: Ad) => (
    <motion.div 
      variants={itemVariants}
      className="bg-zinc-800 rounded-md p-3 mb-2 border border-zinc-700"
      key={ad.id}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h5 className="text-sm font-medium truncate">{ad.name}</h5>
          <div className="mt-1 flex items-center">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusClass(ad.status)}`}>
              {ad.status}
            </span>
            <span className="text-xs text-zinc-400 ml-2">
              Budget: {formatCurrency(ad.dailyBudget)}/giorno
            </span>
          </div>
        </div>
      </div>
      {renderMetrics(ad)}
    </motion.div>
  );
  
  // Renderizza un singolo AdSet con i suoi Ad
  const renderAdSet = (adSet: AdSet, isExpanded: boolean) => (
    <motion.div 
      variants={itemVariants}
      className="bg-zinc-800/80 rounded-md p-4 mb-3"
      key={adSet.id}
    >
      <div 
        className="flex justify-between items-start cursor-pointer"
        onClick={() => toggleAdSet(adSet.id)}
      >
        <div className="flex-1">
          <div className="flex items-center">
            <motion.span
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={16} className="mr-1 text-primary" />
            </motion.span>
            <h4 className="text-sm font-medium">{adSet.name}</h4>
          </div>
          <div className="mt-1 flex items-center">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusClass(adSet.status)}`}>
              {adSet.status}
            </span>
            <span className="text-xs text-zinc-400 ml-2">
              Budget: {formatCurrency(adSet.dailyBudget)}/giorno
            </span>
          </div>
        </div>
        
        <div className="text-xs text-zinc-400">
          {adSet.ads.length} Annunci
        </div>
      </div>
      
      {renderMetrics(adSet)}
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            variants={contentVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="mt-4 pl-4 border-l border-zinc-700"
          >
            <motion.div variants={listVariants} initial="hidden" animate="show">
              {adSet.ads.map(ad => renderAd(ad))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
  
  // Renderizza una singola Campagna con i suoi AdSet
  const renderCampaign = (campaign: Campaign) => {
    const isExpanded = !!expandedCampaigns[campaign.id];
    
    return (
      <motion.div 
        variants={itemVariants}
        className="bg-zinc-900 rounded-lg p-4 mb-4 border border-zinc-800"
        key={campaign.id}
      >
        <div 
          className="flex justify-between items-start cursor-pointer"
          onClick={() => toggleCampaign(campaign.id)}
        >
          <div className="flex-1">
            <div className="flex items-center">
              <motion.span
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={20} className="mr-2 text-primary" />
              </motion.span>
              <h3 className="text-base font-medium">{campaign.name}</h3>
            </div>
            <div className="mt-1 flex items-center">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusClass(campaign.status)}`}>
                {campaign.status}
              </span>
              <span className="text-xs text-zinc-400 ml-2">
                Budget: {formatCurrency(campaign.dailyBudget)}/giorno
              </span>
            </div>
          </div>
          
          <div className="text-xs text-zinc-400">
            {campaign.adSets.length} AdSet
          </div>
        </div>
        
        {renderMetrics(campaign)}
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              variants={contentVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="mt-4 pl-4 border-l border-zinc-700"
            >
              <motion.div variants={listVariants} initial="hidden" animate="show">
                {campaign.adSets.map(adSet => renderAdSet(adSet, !!expandedAdSets[adSet.id]))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Campagne Facebook</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-700/50 rounded-lg p-4 animate-pulse h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-zinc-800 rounded-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Campagne Facebook</h3>
        <span className="text-sm text-zinc-400">{campaigns.length} campagne attive</span>
      </div>
      
      <motion.div 
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {campaigns.map(campaign => renderCampaign(campaign))}
      </motion.div>
    </motion.div>
  );
}