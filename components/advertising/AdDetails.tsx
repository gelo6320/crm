import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, MousePointer, Globe, Eye, BarChart, FileBarChart, ExternalLink, Play } from 'lucide-react';
import { Ad, AdCreative, fetchAdCreative } from '@/lib/api/advertising';

interface AdDetailsProps {
  ad: Ad;
  layout?: 'full' | 'mobile' | 'stats-only' | 'preview-only';
}

export default function AdDetails({ ad, layout = 'full' }: AdDetailsProps) {
  const [creative, setCreative] = useState<AdCreative | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carica il creative solo se necessario in base al layout
    if (layout === 'full' || layout === 'mobile' || layout === 'preview-only') {
      const loadCreative = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const creativeData = await fetchAdCreative(ad.id);
          setCreative(creativeData);
        } catch (error) {
          console.error('Errore nel caricamento del creative:', error);
          setError('Impossibile caricare il creative. Verifica la configurazione di Facebook.');
        } finally {
          setIsLoading(false);
        }
      };
      loadCreative();
    }
  }, [ad.id, layout]);

  // Formatta valuta
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Formatta numeri con separatore delle migliaia
  const formatNumber = (value: number) => {
    return value.toLocaleString('it-IT');
  };

  // Funzione per aprire il video di Facebook
  const openFacebookVideo = (videoId: string, linkUrl?: string) => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    } else if (videoId) {
      const facebookVideoUrl = `https://www.facebook.com/watch/?v=${videoId}`;
      window.open(facebookVideoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Metriche da visualizzare
  const metrics = [
    { icon: DollarSign, label: 'Spesa', value: formatCurrency(ad.spend) },
    { icon: Users, label: 'Lead', value: formatNumber(ad.leads) },
    { icon: DollarSign, label: 'Costo per Lead', value: formatCurrency(ad.costPerLead) },
    { icon: MousePointer, label: 'Click', value: formatNumber(ad.clicks) },
    { icon: DollarSign, label: 'Costo per Click', value: formatCurrency(ad.costPerClick) },
    { icon: Globe, label: 'Copertura', value: formatNumber(ad.reach) },
    { icon: Eye, label: 'Impressioni', value: formatNumber(ad.impressions) },
    { icon: BarChart, label: 'CPM', value: formatCurrency(ad.cpm) }
  ];

  // Renderizza solo le statistiche
  const renderStats = () => {
    return (
      <motion.div 
        className={`bg-zinc-800 rounded-lg p-3 sm:p-4 ${layout === 'mobile' ? 'mt-4' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-base font-semibold mb-3 flex items-center">
          <BarChart size={18} className="mr-2 text-primary" />
          Statistiche
        </h2>
        
        <div className={`grid ${
          layout === 'mobile' 
            ? 'grid-cols-2 gap-2' 
            : 'grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3'
        }`}>
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const isMobile = layout === 'mobile';
            
            return (
              <motion.div 
                key={metric.label}
                className={`bg-zinc-800/70 ${isMobile ? 'p-2' : 'p-3'} rounded-lg border border-zinc-700/50`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              >
                <div className="flex items-center mb-1">
                  <div className={`rounded-full ${isMobile ? 'p-1.5' : 'p-2'} bg-zinc-700/70 mr-2`}>
                    <Icon size={isMobile ? 12 : 16} className="text-primary" />
                  </div>
                  <div className={`text-xs text-zinc-400 ${isMobile ? 'text-xs' : ''}`}>{metric.label}</div>
                </div>
                <div className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold`}>{metric.value}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // Renderizza il creative dell'inserzione (senza container)
  const renderCreative = () => {
    return (
      <motion.div 
        className={`${layout === 'mobile' ? 'p-3' : 'p-4'} w-full`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-red-400">
              <FileBarChart size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : creative ? (
          <div className="space-y-4 w-full">
            {/* Immagine o Video */}
            {creative.image_url && (
              <div className={`w-full ${
                layout === 'mobile' 
                  ? 'space-y-4' 
                  : 'flex gap-4 items-start'
              }`}>
                {/* Container Immagine/Video */}
                <div className={`relative rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 ${
                  layout === 'mobile' 
                    ? 'w-full' 
                    : 'w-full max-w-md'
                }`}>
                  <img 
                    src={creative.image_url} 
                    alt={creative.title || 'Creative dell\'inserzione'}
                    className={`w-full h-auto object-contain ${
                      layout === 'mobile' 
                        ? '' 
                        : 'max-h-80'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {creative.video_id && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer hover:bg-opacity-40 transition-all duration-200"
                      onClick={() => openFacebookVideo(creative.video_id!, creative.link_url)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          openFacebookVideo(creative.video_id!, creative.link_url);
                        }
                      }}
                    >
                      <div className="bg-white bg-opacity-20 rounded-full p-4 hover:bg-opacity-30 transition-all duration-200">
                        <Play size={32} className="text-white ml-1" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Contenuto testuale - A destra su desktop, sotto su mobile */}
                <div className={`${layout === 'mobile' ? 'space-y-3' : 'flex-1 space-y-3 min-w-0'}`}>
                  {creative.title && (
                    <div>
                      <h3 className={`font-semibold text-white mb-1 ${
                        layout === 'mobile' ? 'text-lg' : 'text-xl'
                      }`}>
                        {creative.title}
                      </h3>
                    </div>
                  )}
                  
                  {creative.body && (
                    <div>
                      <p className={`text-zinc-300 leading-relaxed ${
                        layout === 'mobile' ? 'text-sm' : 'text-sm'
                      }`}>
                        {creative.body}
                      </p>
                    </div>
                  )}
                  
                  {creative.link_description && (
                    <div>
                      <p className={`text-zinc-400 ${
                        layout === 'mobile' ? 'text-xs' : 'text-xs'
                      }`}>
                        {creative.link_description}
                      </p>
                    </div>
                  )}
                  
                  {/* Call to Action e Link */}
                  {(creative.call_to_action || creative.link_url) && (
                    <div className="pt-2 border-t border-zinc-700/50">
                      {creative.call_to_action && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-400">
                            Call to Action: {creative.call_to_action.type}
                          </span>
                        </div>
                      )}
                      
                      {creative.link_url && (
                        <div className="mt-2">
                          <a 
                            href={creative.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink size={12} className="mr-1" />
                            Visualizza link
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Se c'è solo video_id senza image_url, mostra un placeholder cliccabile */}
            {!creative.image_url && creative.video_id && (
              <div className={`w-full ${
                layout === 'mobile' 
                  ? 'space-y-4' 
                  : 'flex gap-4 items-start'
              }`}>
                <div 
                  className={`relative rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-zinc-800 transition-all duration-200 ${
                    layout === 'mobile' 
                      ? 'h-60 w-full' 
                      : 'h-64 w-full max-w-md'
                  }`}
                  onClick={() => openFacebookVideo(creative.video_id!, creative.link_url)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openFacebookVideo(creative.video_id!, creative.link_url);
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="bg-zinc-800 rounded-full p-6 mx-auto mb-3 w-20 h-20 flex items-center justify-center hover:bg-zinc-700 transition-all duration-200">
                      <Play size={32} className="text-primary ml-1" />
                    </div>
                    <p className="text-sm text-zinc-400">Clicca per visualizzare il video</p>
                    <p className="text-xs text-zinc-500 mt-1">Video ID: {creative.video_id}</p>
                  </div>
                </div>
                
                {/* Contenuto testuale per video */}
                <div className={`${layout === 'mobile' ? 'space-y-3' : 'flex-1 space-y-3 min-w-0'}`}>
                  {creative.title && (
                    <div>
                      <h3 className={`font-semibold text-white mb-1 ${
                        layout === 'mobile' ? 'text-lg' : 'text-xl'
                      }`}>
                        {creative.title}
                      </h3>
                    </div>
                  )}
                  
                  {creative.body && (
                    <div>
                      <p className={`text-zinc-300 leading-relaxed ${
                        layout === 'mobile' ? 'text-sm' : 'text-sm'
                      }`}>
                        {creative.body}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Se c'è solo thumbnail_url, usalo come fallback cliccabile */}
            {!creative.image_url && !creative.video_id && creative.thumbnail_url && (
              <div className={`w-full ${
                layout === 'mobile' 
                  ? 'space-y-4' 
                  : 'flex gap-4 items-start'
              }`}>
                <div className={`relative rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 ${
                  layout === 'mobile' 
                    ? 'w-full' 
                    : 'w-full max-w-md'
                }`}>
                  <img 
                    src={creative.thumbnail_url} 
                    alt={creative.title || 'Thumbnail dell\'inserzione'}
                    className={`w-full h-auto object-contain ${
                      layout === 'mobile' 
                        ? '' 
                        : 'max-h-80'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Se abbiamo un link, rendiamo cliccabile anche il thumbnail */}
                  {creative.link_url && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 cursor-pointer transition-all duration-200"
                      onClick={() => window.open(creative.link_url, '_blank', 'noopener,noreferrer')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          window.open(creative.link_url!, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      <div className="bg-white bg-opacity-20 rounded-full p-3 opacity-0 hover:opacity-100 transition-all duration-200">
                        <ExternalLink size={24} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Contenuto testuale per thumbnail */}
                <div className={`${layout === 'mobile' ? 'space-y-3' : 'flex-1 space-y-3 min-w-0'}`}>
                  {creative.title && (
                    <div>
                      <h3 className={`font-semibold text-white mb-1 ${
                        layout === 'mobile' ? 'text-lg' : 'text-xl'
                      }`}>
                        {creative.title}
                      </h3>
                    </div>
                  )}
                  
                  {creative.body && (
                    <div>
                      <p className={`text-zinc-300 leading-relaxed ${
                        layout === 'mobile' ? 'text-sm' : 'text-sm'
                      }`}>
                        {creative.body}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Solo contenuto testuale se non ci sono media */}
            {!creative.image_url && !creative.video_id && !creative.thumbnail_url && (
              <div className="space-y-3 w-full">
                {creative.title && (
                  <div>
                    <h3 className={`font-semibold text-white mb-1 ${
                      layout === 'mobile' ? 'text-lg' : 'text-xl'
                    }`}>
                      {creative.title}
                    </h3>
                  </div>
                )}
                
                {creative.body && (
                  <div>
                    <p className={`text-zinc-300 leading-relaxed ${
                      layout === 'mobile' ? 'text-sm' : 'text-sm'
                    }`}>
                      {creative.body}
                    </p>
                  </div>
                )}
                
                {creative.link_description && (
                  <div>
                    <p className={`text-zinc-400 ${
                      layout === 'mobile' ? 'text-xs' : 'text-xs'
                    }`}>
                      {creative.link_description}
                    </p>
                  </div>
                )}
                
                {/* Call to Action e Link */}
                {(creative.call_to_action || creative.link_url) && (
                  <div className="pt-2 border-t border-zinc-700/50">
                    {creative.call_to_action && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">
                          Call to Action: {creative.call_to_action.type}
                        </span>
                      </div>
                    )}
                    
                    {creative.link_url && (
                      <div className="mt-2">
                        <a 
                          href={creative.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <ExternalLink size={12} className="mr-1" />
                          Visualizza link
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Informazioni del Creative */}
            <div className="mt-4 pt-3 border-t border-zinc-700/50">
              <div className="text-xs text-zinc-500 space-y-1">
                <div>Creative ID: {creative.id}</div>
                {creative.object_type && (
                  <div>Tipo: {creative.object_type}</div>
                )}
                {creative.video_id && (
                  <div>Video ID: {creative.video_id}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-zinc-400">
              <FileBarChart size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nessun creative disponibile per questa inserzione</p>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Layout mobile: prima creative, poi statistiche
  if (layout === 'mobile') {
    return (
      <div className="space-y-3">
        {/* Header con nome inserzione */}
        <motion.div 
          className="bg-zinc-800 rounded-lg p-3"
          initial={{ y: -10 }}
          animate={{ y: 0 }}
        >
          <h2 className="text-base font-semibold">{ad.name}</h2>
          <div className="text-xs text-zinc-400">ID: {ad.id}</div>
        </motion.div>
        
        {renderCreative()}
        {renderStats()}
      </div>
    );
  }
  
  // Solo statistiche (per layout desktop)
  if (layout === 'stats-only') {
    return (
      <div className="space-y-3">
        {/* Header con nome inserzione */}
        <motion.div 
          className="bg-zinc-800 rounded-lg p-3"
          initial={{ y: -10 }}
          animate={{ y: 0 }}
        >
          <h2 className="text-base font-semibold">{ad.name}</h2>
          <div className="text-xs text-zinc-400">ID: {ad.id}</div>
        </motion.div>
        
        {renderStats()}
      </div>
    );
  }
  
  // Solo creative (per layout desktop) - senza container
  if (layout === 'preview-only') {
    return (
      <div className="max-w">
        {renderCreative()}
      </div>
    );
  }
  
  // Layout completo predefinito
  return (
    <div className="space-y-4">
      {/* Header con nome inserzione */}
      <motion.div 
        className="bg-zinc-800 rounded-lg p-4"
        initial={{ y: -10 }}
        animate={{ y: 0 }}
      >
        <h2 className="text-lg font-semibold">{ad.name}</h2>
        <div className="text-sm text-zinc-400">ID: {ad.id}</div>
      </motion.div>
      
      {/* Layout responsive: su desktop side-by-side con full width, su mobile stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Griglia delle metriche */}
        <div className="order-2 lg:order-1">
          {renderStats()}
        </div>
        
        {/* Creative inserzione - full width disponibile */}
        <div className="order-1 lg:order-2 w-full">
          {renderCreative()}
        </div>
      </div>
    </div>
  );
}