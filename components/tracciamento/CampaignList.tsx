// components/tracciamento/CampaignList.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Campaign, AdSet, Ad } from '@/lib/api/marketing';
import { ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';

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
    
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    if (tableRef.current) {
      tableRef.current.addEventListener('scroll', checkScrollButtons);
    }
    
    return () => {
      window.removeEventListener('resize', checkScrollButtons);
      if (tableRef.current) {
        tableRef.current.removeEventListener('scroll', checkScrollButtons);
      }
    };
  }, [campaigns, isLoading]);

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
  
  const toggleCampaign = (campaignId: string) => {
    const wasExpanded = expandedCampaigns[campaignId];
    
    setExpandedCampaigns(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
    
    // Se la campagna si sta espandendo, espandi automaticamente tutti i suoi ad set
    if (!wasExpanded) {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        setExpandedAdSets(prev => {
          const newState = { ...prev };
          campaign.adSets.forEach(adSet => {
            newState[adSet.id] = true;
          });
          return newState;
        });
      }
    }
  };
  
  const toggleAdSet = (adSetId: string) => {
    setExpandedAdSets(prev => ({
      ...prev,
      [adSetId]: !prev[adSetId]
    }));
  };
  
  const formatCurrency = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "€0,00";
    }
    
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
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

  const getSmartTruncatedName = (text: string, maxLength: number = 28) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    const abbreviations: Record<string, string> = {
      'Campagna': 'Camp.',
      'Lead': 'Ld',
      'Generation': 'Gen',
      'Generazione': 'Gen',
      'Conversione': 'Conv',
      'Conversioni': 'Conv',
      'Remarketing': 'Rmkt',
      'Clienti': 'Cl.',
      'Cliente': 'Cl.',
      'Esistenti': 'Esist.',
      'Esistente': 'Esist.',
      'Brand': 'Br.',
      'Awareness': 'Awar.',
      'Facebook': 'FB',
      'Instagram': 'IG',
      'Marketing': 'Mkt',
      'Promozione': 'Promo',
      'Vendita': 'Vnd',
      'Vendite': 'Vnd'
    };
    
    let words = text.split(' ');
    words = words.map(word => abbreviations[word] || word);
    
    let result = words.join(' ');
    
    if (result.length > maxLength) {
      const halfLength = Math.floor(maxLength / 2) - 1;
      return result.substring(0, halfLength) + '...' + result.substring(result.length - halfLength);
    }
    
    return result;
  };

  const getValueColorClass = (value: number) => {
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-red-400';
    return 'text-zinc-400';
  };

  const tableRowVariants = {
    hidden: { opacity: 0, y: 8 },
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
  
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;

  console.log("Campagne ricevute:", campaigns);
  if (campaigns.length > 0) {
    console.log("Prima campagna spesa:", campaigns[0].spend);
  }
  
  if (isLoading) {
    return (
      <div className="rounded-xl p-3 md:p-4" style={{ borderRadius: '12px' }}>
        <div className="flex justify-between items-center mb-3">
          <div className="h-5 w-20 bg-zinc-700/50 rounded-lg animate-pulse"></div>
          <div className="h-5 w-32 bg-zinc-700/50 rounded-lg animate-pulse"></div>
        </div>
        <div className="overflow-x-auto">
          <div className="h-10 bg-zinc-700/50 rounded-lg animate-pulse mb-3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-zinc-700/30 rounded-lg animate-pulse mb-2" style={{ borderRadius: '8px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="rounded-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ borderRadius: '12px' }}
    >
      <div className="relative mb-1">
        {/* Pulsanti di scorrimento - nascosti su mobile */}
        {showScrollButtons && (
          <>
            <button 
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-zinc-900/80 p-1.5 rounded-full shadow-lg transition-all hidden md:block ${!canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-700'}`}
              style={{ borderRadius: '8px' }}
            >
              <ArrowLeft size={16} className="text-zinc-200" />
            </button>
            
            <button 
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-zinc-900/80 p-1.5 rounded-full shadow-lg transition-all hidden md:block ${!canScrollRight ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-700'}`}
              style={{ borderRadius: '8px' }}
            >
              <ArrowRight size={16} className="text-zinc-200" />
            </button>
          </>
        )}
      
        {/* Ombre di sfumatura */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-zinc-800 to-transparent z-10"></div>
        )}
        
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-zinc-800 to-transparent z-10"></div>
        )}
      
        {/* Tabella con scorrimento orizzontale */}
        <div 
          ref={tableRef}
          className="overflow-x-auto scrollbar-none pb-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="min-w-[950px] md:w-full">
            {/* Header row */}
            <div className="bg-zinc-700/30 text-xs text-zinc-400 font-medium grid grid-cols-9 gap-1 md:gap-2 p-2.5 rounded-xl" style={{ borderRadius: '10px' }}>
              <div className="col-span-2">CAMPAGNA</div>
              <div className="text-right">SPESA</div>
              <div className="text-right">LEAD (FB)</div>
              <div className="text-right">LEAD (REALI)</div>
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
                    staggerChildren: 0.03
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
                      className={`grid grid-cols-9 gap-1 md:gap-2 p-2.5 items-center cursor-pointer hover:bg-zinc-600/30 rounded-lg transition-all ${isExpanded ? 'bg-zinc-700/20' : ''}`}
                      onClick={() => toggleCampaign(campaign.id)}
                      style={{ borderRadius: '8px' }}
                    >
                      <div className="col-span-2 flex items-center">
                        <motion.span
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="mr-2 text-primary flex-shrink-0"
                        >
                          <ChevronRight size={16} />
                        </motion.span>
                        <div className="flex flex-col overflow-hidden">
                          <div className="font-medium text-sm">
                            {getSmartTruncatedName(campaign.name, isMobileView ? 20 : 30)}
                          </div>
                          <span className={`text-xs ${getStatusClass(campaign.status)}`}>
                            {campaign.status} · Budget: {formatCurrency(campaign.dailyBudget)}/g
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-medium text-sm">
                        {formatCurrency(campaign.spend)}
                      </div>
                      <div className="text-right font-medium text-sm">
                        {campaign.leads.toLocaleString()}
                      </div>
                      <div className="text-right font-medium text-sm relative pointer-events-none">
                        {campaign.realLeads.toLocaleString()}
                      </div>
                      <div className="text-right font-medium text-sm">
                        {formatCurrency(campaign.costPerLead)}
                      </div>
                      <div className="text-right font-medium text-sm relative pointer-events-none">
                        {campaign.conversions.toLocaleString()}
                      </div>
                      <div className="text-right font-medium text-sm">
                        {formatCurrency(campaign.costPerConversion)}
                      </div>
                      <div className={`text-right font-medium text-sm relative pointer-events-none ${getValueColorClass(campaign.roas)}`}>
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
                          <div className="pl-6 pr-2 py-1 space-y-1">
                            {/* AdSet header */}
                            <div className="bg-zinc-700/40 text-xs text-zinc-400 font-medium grid grid-cols-9 gap-1 md:gap-2 p-2 my-1 rounded-lg" style={{ borderRadius: '8px' }}>
                              <div className="col-span-2">AD SET</div>
                              <div className="text-right">SPESA</div>
                              <div className="text-right">LEAD (FB)</div>
                              <div className="text-right">LEAD (REALI)</div>
                              <div className="text-right">COSTO/L</div>
                              <div className="text-right">CONV</div>
                              <div className="text-right">COSTO/C</div>
                              <div className="text-right">ROAS</div>
                            </div>
                            
                            {/* AdSet rows */}
                            {campaign.adSets.map(adSet => {
                              const isAdSetExpanded = !!expandedAdSets[adSet.id];
                              
                              return (
                                <React.Fragment key={adSet.id}>
                                  <div
                                    className={`grid grid-cols-9 gap-1 md:gap-2 p-2 rounded-lg items-center cursor-pointer hover:bg-zinc-600/20 transition-all ${isAdSetExpanded ? 'bg-zinc-700/15' : ''}`}
                                    onClick={() => toggleAdSet(adSet.id)}
                                    style={{ borderRadius: '6px' }}
                                  >
                                    <div className="col-span-2 flex items-center">
                                      <motion.span
                                        animate={{ rotate: isAdSetExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mr-1.5 text-primary flex-shrink-0"
                                      >
                                        <ChevronRight size={14} />
                                      </motion.span>
                                      <div className="flex flex-col overflow-hidden">
                                        <div className="text-xs">
                                          {getSmartTruncatedName(adSet.name, isMobileView ? 18 : 26)}
                                        </div>
                                        <span className={`text-xs ${getStatusClass(adSet.status)}`}>
                                          {adSet.status}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right text-xs">
                                      {formatCurrency(adSet.spend)}
                                    </div>
                                    <div className="text-right text-xs">
                                      {adSet.leads.toLocaleString()}
                                    </div>
                                    <div className="text-right text-xs relative pointer-events-none">
                                      {adSet.realLeads.toLocaleString()}
                                    </div>
                                    <div className="text-right text-xs">
                                      {formatCurrency(adSet.costPerLead)}
                                    </div>
                                    <div className="text-right text-xs relative pointer-events-none">
                                      {adSet.conversions.toLocaleString()}
                                    </div>
                                    <div className="text-right text-xs">
                                      {formatCurrency(adSet.costPerConversion)}
                                    </div>
                                    <div className={`text-right text-xs relative pointer-events-none ${getValueColorClass(adSet.roas)}`}>
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
                                        <div className="pl-5 pr-1 py-1">
                                          {/* Ad header */}
                                          <div className="bg-zinc-600/20 text-xs text-zinc-500 font-medium grid grid-cols-9 gap-1 md:gap-2 p-1.5 my-1 rounded-lg" style={{ borderRadius: '6px' }}>
                                            <div className="col-span-2">ANNUNCIO</div>
                                            <div className="text-right">SPESA</div>
                                            <div className="text-right">LEAD (FB)</div>
                                            <div className="text-right">LEAD (REALI)</div>
                                            <div className="text-right">C/L</div>
                                            <div className="text-right">CONV</div>
                                            <div className="text-right">C/C</div>
                                            <div className="text-right">ROAS</div>
                                          </div>
                                          
                                          {/* Ad rows */}
                                          {adSet.ads.map(ad => (
                                            <div
                                              key={ad.id}
                                              className="grid grid-cols-9 gap-1 md:gap-2 p-1.5 rounded-lg items-center hover:bg-zinc-600/15 transition-all"
                                              style={{ borderRadius: '4px' }}
                                            >
                                              <div className="col-span-2 flex flex-col overflow-hidden">
                                                <div className="text-xs opacity-90">
                                                  {getSmartTruncatedName(ad.name, isMobileView ? 16 : 24)}
                                                </div>
                                                <span className={`text-[10px] leading-tight ${getStatusClass(ad.status)}`}>
                                                  {ad.status}
                                                </span>
                                              </div>
                                              <div className="text-right text-[10px]">
                                                {formatCurrency(ad.spend)}
                                              </div>
                                              <div className="text-right text-[10px]">
                                                {ad.leads.toLocaleString()}
                                              </div>
                                              <div className="text-right text-[10px] relative pointer-events-none">
                                                {ad.realLeads.toLocaleString()}
                                              </div>
                                              <div className="text-right text-[10px]">
                                                {formatCurrency(ad.costPerLead)}
                                              </div>
                                              <div className="text-right text-[10px] relative pointer-events-none">
                                                {ad.conversions.toLocaleString()}
                                              </div>
                                              <div className="text-right text-[10px]">
                                                {formatCurrency(ad.costPerConversion)}
                                              </div>
                                              <div className={`text-right text-[10px] relative pointer-events-none ${getValueColorClass(ad.roas)}`}>
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
    </motion.div>
  );
}