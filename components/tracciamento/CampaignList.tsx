// components/tracciamento/CampaignList.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Campaign, AdSet, Ad } from '@/lib/api/marketing';
import { ChevronDown, ChevronRight, ChevronUp, DollarSign, BarChart2, Users, Activity, ArrowLeft, ArrowRight } from 'lucide-react';

interface CampaignListProps {
  campaigns: Campaign[];
  isLoading: boolean;
}

export default function CampaignList({ campaigns, isLoading }: CampaignListProps) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [expandedAdSets, setExpandedAdSets] = useState<Record<string, boolean>>({});
  const tableRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Controlla se è necessario mostrare i pulsanti di scorrimento
  useEffect(() => {
    const checkScrollButtons = () => {
      if (tableRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = tableRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
      }
    };
    
    // Verifica iniziale
    checkScrollButtons();
    
    // Aggiungi event listener per resize e scroll
    window.addEventListener('resize', checkScrollButtons);
    if (tableRef.current) {
      tableRef.current.addEventListener('scroll', checkScrollButtons);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScrollButtons);
      if (tableRef.current) {
        tableRef.current.removeEventListener('scroll', checkScrollButtons);
      }
    };
  }, [campaigns, isLoading]);

  // Funzioni di scorrimento
  const scrollLeft = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
  
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
        return 'text-emerald-400';
      case 'PAUSED':
        return 'text-amber-400';
      case 'DISABLED':
      case 'ARCHIVED':
        return 'text-zinc-400';
      default:
        return 'text-zinc-400';
    }
  };

  // Troncamento di testo con fade
  const getTruncatedText = (text: string, maxLength: number = 28) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return (
      <div className="relative">
        <span className="truncate block w-full">{text}</span>
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-zinc-900/30"></div>
      </div>
    );
  };

  // Animazioni per framer-motion
  const tableRowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };
  
  const expandedContentVariants = {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' },
    show: { 
      opacity: 1, 
      height: 'auto',
      transition: { duration: 0.2 }
    }
  };

  // Ottieni class CSS per valori positivi/negativi
  const getValueColorClass = (value: number) => {
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-red-400';
    return 'text-zinc-400';
  };
  
  if (isLoading) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Campagne Facebook</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="h-12 bg-zinc-700/50 rounded animate-pulse mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-zinc-700/30 rounded animate-pulse mb-2"></div>
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

      <div className="relative">
        {/* Pulsanti di scorrimento */}
        {showScrollButtons && (
          <>
            <button 
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-zinc-900/80 p-2 rounded-full shadow-lg ${!canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-700'}`}
            >
              <ArrowLeft size={18} className="text-zinc-200" />
            </button>
            
            <button 
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-zinc-900/80 p-2 rounded-full shadow-lg ${!canScrollRight ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-700'}`}
            >
              <ArrowRight size={18} className="text-zinc-200" />
            </button>
          </>
        )}
      
        {/* Ombre di sfumatura per indicare lo scorrimento */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-800 to-transparent z-10"></div>
        )}
        
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-800 to-transparent z-10"></div>
        )}
      
        {/* Tabella con scorrimento orizzontale */}
        <div 
          ref={tableRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800 pb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="min-w-[800px] md:min-w-full">
            {/* Header row */}
            <div className="bg-zinc-900 rounded sticky top-0 z-10 text-xs text-zinc-400 font-medium grid grid-cols-8 gap-2 mb-2 p-3">
              <div className="col-span-2">CAMPAGNA</div>
              <div className="text-right">SPESA</div>
              <div className="text-right">LEAD</div>
              <div className="text-right">COSTO/LEAD</div>
              <div className="text-right">CONVERSIONI</div>
              <div className="text-right">COSTO/CONV</div>
              <div className="text-right">ROAS</div>
            </div>
            
            {/* Campaigns rows */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                show: {
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              {campaigns.map(campaign => {
                const isExpanded = !!expandedCampaigns[campaign.id];
                
                return (
                  <React.Fragment key={campaign.id}>
                    <motion.div
                      variants={tableRowVariants}
                      className={`grid grid-cols-8 gap-2 p-3 rounded items-center cursor-pointer hover:bg-zinc-700/30 transition-colors ${isExpanded ? 'bg-zinc-700/20' : 'bg-zinc-900/30'}`}
                      onClick={() => toggleCampaign(campaign.id)}
                    >
                      <div className="col-span-2 flex items-center">
                        <motion.span
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="mr-2 text-primary flex-shrink-0"
                        >
                          <ChevronRight size={18} />
                        </motion.span>
                        <div className="flex flex-col max-w-[260px] overflow-hidden">
                          <div className="font-medium">
                            {getTruncatedText(campaign.name, 30)}
                          </div>
                          <span className={`text-xs ${getStatusClass(campaign.status)}`}>
                            {campaign.status} · Budget: {formatCurrency(campaign.dailyBudget)}/giorno
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-medium">
                        {formatCurrency(campaign.spend)}
                      </div>
                      <div className="text-right font-medium">
                        {campaign.leads.toLocaleString()}
                      </div>
                      <div className="text-right font-medium">
                        {formatCurrency(campaign.costPerLead)}
                      </div>
                      <div className="text-right font-medium">
                        {campaign.conversions.toLocaleString()}
                      </div>
                      <div className="text-right font-medium">
                        {formatCurrency(campaign.costPerConversion)}
                      </div>
                      <div className={`text-right font-medium ${getValueColorClass(campaign.roas)}`}>
                        {campaign.roas.toFixed(2)}x
                      </div>
                    </motion.div>
                    
                    {/* AdSets expandable content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial="hidden"
                          animate="show"
                          exit="hidden"
                          variants={expandedContentVariants}
                        >
                          <div className="pl-8 pr-4 py-3 space-y-2">
                            {/* AdSet header */}
                            <div className="bg-zinc-800/80 rounded sticky top-0 z-10 text-xs text-zinc-400 font-medium grid grid-cols-8 gap-2 mb-2 p-2">
                              <div className="col-span-2">AD SET</div>
                              <div className="text-right">SPESA</div>
                              <div className="text-right">LEAD</div>
                              <div className="text-right">COSTO/LEAD</div>
                              <div className="text-right">CONVERSIONI</div>
                              <div className="text-right">COSTO/CONV</div>
                              <div className="text-right">ROAS</div>
                            </div>
                            
                            {/* AdSet rows */}
                            {campaign.adSets.map(adSet => {
                              const isAdSetExpanded = !!expandedAdSets[adSet.id];
                              
                              return (
                                <React.Fragment key={adSet.id}>
                                  <div
                                    className={`grid grid-cols-8 gap-2 p-2 rounded items-center cursor-pointer hover:bg-zinc-700/30 transition-colors ${isAdSetExpanded ? 'bg-zinc-700/20' : 'bg-zinc-800/50'}`}
                                    onClick={() => toggleAdSet(adSet.id)}
                                  >
                                    <div className="col-span-2 flex items-center">
                                      <motion.span
                                        animate={{ rotate: isAdSetExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mr-2 text-primary flex-shrink-0"
                                      >
                                        <ChevronRight size={16} />
                                      </motion.span>
                                      <div className="flex flex-col max-w-[240px] overflow-hidden">
                                        <div className="truncate relative text-sm">
                                          {getTruncatedText(adSet.name, 28)}
                                        </div>
                                        <span className={`text-xs ${getStatusClass(adSet.status)}`}>
                                          {adSet.status}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right text-sm">
                                      {formatCurrency(adSet.spend)}
                                    </div>
                                    <div className="text-right text-sm">
                                      {adSet.leads.toLocaleString()}
                                    </div>
                                    <div className="text-right text-sm">
                                      {formatCurrency(adSet.costPerLead)}
                                    </div>
                                    <div className="text-right text-sm">
                                      {adSet.conversions.toLocaleString()}
                                    </div>
                                    <div className="text-right text-sm">
                                      {formatCurrency(adSet.costPerConversion)}
                                    </div>
                                    <div className={`text-right text-sm ${getValueColorClass(adSet.roas)}`}>
                                      {adSet.roas.toFixed(2)}x
                                    </div>
                                  </div>
                                  
                                  {/* Ads expandable content */}
                                  <AnimatePresence>
                                    {isAdSetExpanded && (
                                      <motion.div
                                        initial="hidden"
                                        animate="show"
                                        exit="hidden"
                                        variants={expandedContentVariants}
                                      >
                                        <div className="pl-6 pr-2 py-2 space-y-1">
                                          {/* Ad header */}
                                          <div className="bg-zinc-700/30 rounded sticky top-0 z-10 text-xs text-zinc-500 font-medium grid grid-cols-8 gap-2 mb-1 p-2">
                                            <div className="col-span-2">ANNUNCIO</div>
                                            <div className="text-right">SPESA</div>
                                            <div className="text-right">LEAD</div>
                                            <div className="text-right">COSTO/LEAD</div>
                                            <div className="text-right">CONVERSIONI</div>
                                            <div className="text-right">COSTO/CONV</div>
                                            <div className="text-right">ROAS</div>
                                          </div>
                                          
                                          {/* Ad rows */}
                                          {adSet.ads.map(ad => (
                                            <div
                                              key={ad.id}
                                              className="grid grid-cols-8 gap-2 p-2 rounded items-center bg-zinc-700/10 hover:bg-zinc-700/20 transition-colors"
                                            >
                                              <div className="col-span-2 flex flex-col max-w-[220px] overflow-hidden">
                                                <div className="truncate relative text-xs">
                                                  {getTruncatedText(ad.name, 26)}
                                                </div>
                                                <span className={`text-xs ${getStatusClass(ad.status)}`}>
                                                  {ad.status}
                                                </span>
                                              </div>
                                              <div className="text-right text-xs">
                                                {formatCurrency(ad.spend)}
                                              </div>
                                              <div className="text-right text-xs">
                                                {ad.leads.toLocaleString()}
                                              </div>
                                              <div className="text-right text-xs">
                                                {formatCurrency(ad.costPerLead)}
                                              </div>
                                              <div className="text-right text-xs">
                                                {ad.conversions.toLocaleString()}
                                              </div>
                                              <div className="text-right text-xs">
                                                {formatCurrency(ad.costPerConversion)}
                                              </div>
                                              <div className={`text-right text-xs ${getValueColorClass(ad.roas)}`}>
                                                {ad.roas.toFixed(2)}x
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Indicatore mobile di scorrimento orizzontale */}
      {showScrollButtons && (
        <div className="flex justify-center mt-4 md:hidden">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-zinc-400">Scorri per vedere tutti i dati</span>
            <ArrowRight size={14} className="text-zinc-400" />
          </div>
        </div>
      )}
    </motion.div>
  );
}